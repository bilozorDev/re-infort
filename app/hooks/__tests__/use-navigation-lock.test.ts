import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock router
const mockPush = vi.fn().mockResolvedValue(true)
const mockBack = vi.fn()
const mockForward = vi.fn()
const mockReplace = vi.fn().mockResolvedValue(true)
const mockPrefetch = vi.fn()
const mockRefresh = vi.fn()

const mockRouter = {
  push: mockPush,
  back: mockBack,
  forward: mockForward,
  replace: mockReplace,
  prefetch: mockPrefetch,
  refresh: mockRefresh,
}

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-path',
}))

describe('useNavigationLock', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset router methods to original mocks
    mockRouter.push = mockPush
    mockRouter.replace = mockReplace
    mockRouter.back = mockBack
    mockRouter.forward = mockForward
    
    // Spy on event listeners
    addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    addEventListenerSpy.mockRestore()
    removeEventListenerSpy.mockRestore()
  })

  it('should not add beforeunload listener when not enabled', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    renderHook(() => 
      useNavigationLock({
        enabled: false,
      })
    )

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('should add beforeunload listener when enabled', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    renderHook(() => 
      useNavigationLock({
        enabled: true,
        message: 'Test message',
      })
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('should handle beforeunload event when enabled', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const customMessage = 'Custom warning message'
    renderHook(() => 
      useNavigationLock({
        enabled: true,
        message: customMessage,
      })
    )

    // Get the beforeunload handler
    const beforeUnloadCall = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'beforeunload'
    )
    const handler = beforeUnloadCall?.[1] as (e: BeforeUnloadEvent) => void

    // Create mock event
    const event = {
      preventDefault: vi.fn(),
      returnValue: '',
    } as unknown as BeforeUnloadEvent

    // Call the handler
    const result = handler(event)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(event.returnValue).toBe(customMessage)
    expect(result).toBe(customMessage)
  })

  it('should override router.push when enabled', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const onAttemptedNavigation = vi.fn()
    
    renderHook(() => 
      useNavigationLock({
        enabled: true,
        onAttemptedNavigation,
        message: 'Are you sure?',
      })
    )

    // Try to navigate - should show confirm dialog
    const result = await mockRouter.push('/new-path')

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure?')
    expect(onAttemptedNavigation).toHaveBeenCalled()
    expect(result).toBe(false)
    expect(mockPush).not.toHaveBeenCalled()

    mockConfirm.mockRestore()
  })

  it('should allow navigation when user confirms', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    
    renderHook(() => 
      useNavigationLock({
        enabled: true,
        message: 'Are you sure?',
      })
    )

    // Try to navigate - user confirms
    await mockRouter.push('/new-path')

    expect(mockConfirm).toHaveBeenCalledWith('Are you sure?')
    expect(mockPush).toHaveBeenCalledWith('/new-path')

    mockConfirm.mockRestore()
  })

  it('should override router.replace when enabled', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    renderHook(() => 
      useNavigationLock({
        enabled: true,
      })
    )

    // Try to replace - should show confirm dialog
    const result = await mockRouter.replace('/new-path')

    expect(mockConfirm).toHaveBeenCalled()
    expect(result).toBe(false)
    expect(mockReplace).not.toHaveBeenCalled()

    mockConfirm.mockRestore()
  })

  it('should override router.back when enabled', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    renderHook(() => 
      useNavigationLock({
        enabled: true,
      })
    )

    // Try to go back - should show confirm dialog
    mockRouter.back()

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockBack).not.toHaveBeenCalled()

    mockConfirm.mockRestore()
  })

  it('should override router.forward when enabled', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    renderHook(() => 
      useNavigationLock({
        enabled: true,
      })
    )

    // Try to go forward - should show confirm dialog
    mockRouter.forward()

    expect(mockConfirm).toHaveBeenCalled()
    expect(mockForward).not.toHaveBeenCalled()

    mockConfirm.mockRestore()
  })

  it('should cleanup event listener on unmount', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const { unmount } = renderHook(() => 
      useNavigationLock({
        enabled: true,
      })
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('should handle enabled state changes', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const { rerender } = renderHook(
      ({ enabled }) => 
        useNavigationLock({
          enabled,
        }),
      {
        initialProps: { enabled: false },
      }
    )

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))

    // Enable navigation lock
    rerender({ enabled: true })
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    // Disable navigation lock
    rerender({ enabled: false })
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('should use default message when not provided', async () => {
    const { useNavigationLock } = await import('../use-navigation-lock')
    
    const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    
    renderHook(() => 
      useNavigationLock({
        enabled: true,
      })
    )

    await mockRouter.push('/path')

    expect(mockConfirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?')
    
    mockConfirm.mockRestore()
  })
})