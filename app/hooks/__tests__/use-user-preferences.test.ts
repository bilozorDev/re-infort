import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock React Query
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
}

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => mockQueryClient,
}))

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Import after mocking

describe('useUserPreferences hooks', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('useUserPreferences', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useUserPreferences } = await import('../use-user-preferences')
      
      useUserPreferences()

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["user-preferences"],
        queryFn: expect.any(Function),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      })
    })

    it('should make correct API call in query function', async () => {
      const { useUserPreferences } = await import('../use-user-preferences')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: 'light', language: 'en' }),
      })

      useUserPreferences()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/user/preferences')
    })

    it('should handle fetch errors in query function', async () => {
      const { useUserPreferences } = await import('../use-user-preferences')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      useUserPreferences()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch preferences')
    })
  })

  // Note: useTablePreferences uses React hooks internally and can't be tested directly
  // It returns merged preferences based on useUserPreferences data

  // Note: useUpdateUserPreferences doesn't exist in the actual implementation
  // The hook has different mutations for saving table state

  // Note: useUpdateTablePreferences doesn't exist in the actual implementation

  // Note: useSaveTableState doesn't exist in the actual implementation
  // The actual implementation uses different patterns for table preferences
})