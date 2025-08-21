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
    info: vi.fn(),
  },
}))

// Import after mocking
import { toast } from 'sonner'

describe('useCategoryTemplates hooks', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('useCategoryTemplates', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useCategoryTemplates } = await import('../use-category-templates')
      
      useCategoryTemplates()

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["category-templates"],
        queryFn: expect.any(Function),
      })
    })

    it('should make correct API call in query function', async () => {
      const { useCategoryTemplates } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', name: 'Electronics Template' }],
      })

      useCategoryTemplates()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/category-templates')
    })

    it('should handle fetch errors in query function', async () => {
      const { useCategoryTemplates } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      useCategoryTemplates()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch templates')
    })
  })

  describe('useCategoryTemplate', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useCategoryTemplate } = await import('../use-category-templates')
      
      useCategoryTemplate('template-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["category-templates", 'template-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should be disabled when id is not provided', async () => {
      const { useCategoryTemplate } = await import('../use-category-templates')
      
      useCategoryTemplate(null)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["category-templates", ""],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should make correct API call for specific template', async () => {
      const { useCategoryTemplate } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          id: 'template-1', 
          name: 'Clothing Template',
          categories: [{ name: 'Shirts' }]
        }),
      })

      useCategoryTemplate('template-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/category-templates/template-1')
    })

    it('should handle fetch errors', async () => {
      const { useCategoryTemplate } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      useCategoryTemplate('non-existent')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch template details')
    })
  })

  describe('useImportTemplate', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useImportTemplate } = await import('../use-category-templates')
      
      useImportTemplate()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call for importing template', async () => {
      const { useImportTemplate } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'job-123' }),
      })

      useImportTemplate()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await mutationFn({ templateId: 'template-1', request: {} })

      expect(mockFetch).toHaveBeenCalledWith('/api/category-templates/template-1/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
    })

    it('should handle success callback', async () => {
      const { useImportTemplate } = await import('../use-category-templates')
      
      useImportTemplate()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const data = { jobId: 'job-456' }
      onSuccess(data)

      expect(toast.success).toHaveBeenCalledWith('Template import started successfully')
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["subcategories"] })
    })

    it('should handle error callback', async () => {
      const { useImportTemplate } = await import('../use-category-templates')
      
      useImportTemplate()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Import failed')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Import failed')
    })

    it('should handle API errors', async () => {
      const { useImportTemplate } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Template already imported' }),
      })

      useImportTemplate()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({ templateId: 'template-1', request: {} })).rejects.toThrow('Template already imported')
    })

    it('should handle API errors without specific messages', async () => {
      const { useImportTemplate } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      useImportTemplate()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({ templateId: 'template-1', request: {} })).rejects.toThrow('Failed to import template')
    })
  })

  describe('useImportProgress', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useImportProgress } = await import('../use-category-templates')
      
      useImportProgress('job-123')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["import-progress", 'job-123'],
        queryFn: expect.any(Function),
        enabled: true,
        refetchInterval: expect.any(Function),
      })
    })

    it('should be disabled when jobId is not provided', async () => {
      const { useImportProgress } = await import('../use-category-templates')
      
      useImportProgress(null)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["import-progress", ""],
        queryFn: expect.any(Function),
        enabled: false,
        refetchInterval: expect.any(Function),
      })
    })

    it('should make correct API call for import progress', async () => {
      const { useImportProgress } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'processing', progress: 50 }),
      })

      useImportProgress('job-123')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/category-templates/import-progress/job-123')
    })

    it('should configure refetch interval based on status', async () => {
      const { useImportProgress } = await import('../use-category-templates')
      
      useImportProgress('job-123')
      const refetchInterval = mockUseQuery.mock.calls[0][0].refetchInterval

      // Should refetch when importing
      expect(refetchInterval({ state: { data: { status: 'importing' } } })).toBe(500)

      // Should refetch when preparing
      expect(refetchInterval({ state: { data: { status: 'preparing' } } })).toBe(500)

      // Should not refetch when completed
      expect(refetchInterval({ state: { data: { status: 'completed' } } })).toBe(false)

      // Should not refetch when failed
      expect(refetchInterval({ state: { data: { status: 'failed' } } })).toBe(false)
    })

    it('should handle fetch errors', async () => {
      const { useImportProgress } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      useImportProgress('non-existent-job')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch import progress')
    })
  })

  describe('useCancelImport', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useCancelImport } = await import('../use-category-templates')
      
      useCancelImport()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call for cancelling import', async () => {
      const { useCancelImport } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      useCancelImport()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await mutationFn('job-123')

      expect(mockFetch).toHaveBeenCalledWith('/api/category-templates/import-progress/job-123', {
        method: 'DELETE',
      })
    })

    it('should handle success callback', async () => {
      const { useCancelImport } = await import('../use-category-templates')
      
      useCancelImport()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = 'job-123'
      onSuccess(null, variables)

      expect(toast.info).toHaveBeenCalledWith('Import cancelled')
    })

    it('should handle error callback', async () => {
      const { useCancelImport } = await import('../use-category-templates')
      
      useCancelImport()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Cannot cancel completed job')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Cannot cancel completed job')
    })

    it('should handle API errors', async () => {
      const { useCancelImport } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Job already completed' }),
      })

      useCancelImport()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('job-123')).rejects.toThrow('Job already completed')
    })

    it('should handle API errors without specific messages', async () => {
      const { useCancelImport } = await import('../use-category-templates')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      useCancelImport()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('job-123')).rejects.toThrow('Failed to cancel import')
    })
  })
})