import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock React Query
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockQueryClient = {
  invalidateQueries: vi.fn(),
  removeQueries: vi.fn(),
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
import { toast } from 'sonner'

describe('useCategories hooks', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('useCategories', () => {
    it('should configure useQuery with correct parameters for all categories', async () => {
      // Import the hook to trigger the query setup
      const { useCategories } = await import('../use-categories')
      
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      // Call the hook
      useCategories(false)

      // Verify useQuery was called with correct parameters
      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["categories", { active: false }],
        queryFn: expect.any(Function),
      })

      // Test the query function
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/categories')
    })

    it('should configure useQuery for active categories only', async () => {
      const { useCategories } = await import('../use-categories')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      useCategories(true)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["categories", { active: true }],
        queryFn: expect.any(Function),
      })

      // Test the query function calls correct endpoint
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/categories?active=true')
    })

    it('should handle fetch errors in query function', async () => {
      const { useCategories } = await import('../use-categories')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      useCategories()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch categories')
    })
  })

  describe('useCategory', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useCategory } = await import('../use-categories')
      
      useCategory('cat-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["category", 'cat-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should be disabled when id is undefined', async () => {
      const { useCategory } = await import('../use-categories')
      
      useCategory(undefined)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["category", undefined],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should return null when id is not provided', async () => {
      const { useCategory } = await import('../use-categories')
      
      useCategory(undefined)
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      const result = await queryFn()
      expect(result).toBeNull()
    })
  })

  describe('useSubcategories', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useSubcategories } = await import('../use-categories')
      
      useSubcategories('cat-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["subcategories", 'cat-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should return empty array when categoryId is null', async () => {
      const { useSubcategories } = await import('../use-categories')
      
      useSubcategories(null)
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      const result = await queryFn()
      expect(result).toEqual([])
    })
  })

  describe('useCreateCategory', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useCreateCategory } = await import('../use-categories')
      
      useCreateCategory()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useCreateCategory } = await import('../use-categories')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'cat-new', name: 'New Category' }),
      })

      useCreateCategory()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const data = { name: 'New Category', description: 'Test category' }
      await mutationFn(data)

      expect(mockFetch).toHaveBeenCalledWith('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    })

    it('should handle success callback', async () => {
      const { useCreateCategory } = await import('../use-categories')
      
      useCreateCategory()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      onSuccess()

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] })
      expect(toast.success).toHaveBeenCalledWith('Category created successfully')
    })

    it('should handle error callback', async () => {
      const { useCreateCategory } = await import('../use-categories')
      
      useCreateCategory()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Test error')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Test error')
    })
  })

  describe('useDeleteCategory', () => {
    it('should handle dependency errors specially', async () => {
      const { useDeleteCategory } = await import('../use-categories')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'Category has dependencies',
          subcategory_count: 3,
          product_count: 10,
        }),
      })

      useDeleteCategory()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('cat-1')).rejects.toMatchObject({
        message: 'Category has dependencies',
        subcategory_count: 3,
        product_count: 10,
        hasDependencies: true,
      })
    })

    it('should handle dependency errors in onError callback', async () => {
      const { useDeleteCategory } = await import('../use-categories')
      
      useDeleteCategory()
      const onError = mockUseMutation.mock.calls[0][0].onError

      // Dependency error should not show toast
      const dependencyError = { hasDependencies: true, message: 'Has dependencies' }
      onError(dependencyError)

      expect(toast.error).not.toHaveBeenCalled()

      // Regular error should show toast
      const regularError = { message: 'Regular error' }
      onError(regularError)

      expect(toast.error).toHaveBeenCalledWith('Regular error')
    })
  })

  describe('useDeleteSubcategory', () => {
    it('should handle dependency errors specially', async () => {
      const { useDeleteSubcategory } = await import('../use-categories')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          message: 'Subcategory has dependencies',
          product_count: 5,
        }),
      })

      useDeleteSubcategory()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('subcat-1')).rejects.toMatchObject({
        message: 'Subcategory has dependencies',
        product_count: 5,
        hasDependencies: true,
      })
    })
  })

  describe('useUpdateCategory', () => {
    it('should invalidate correct queries on success', async () => {
      const { useUpdateCategory } = await import('../use-categories')
      
      useUpdateCategory()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = { id: 'cat-1', data: { name: 'Updated' } }
      onSuccess(null, variables)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["categories"] })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["category", 'cat-1'] })
      expect(toast.success).toHaveBeenCalledWith('Category updated successfully')
    })
  })

  describe('useCreateSubcategory', () => {
    it('should invalidate correct queries on success', async () => {
      const { useCreateSubcategory } = await import('../use-categories')
      
      useCreateSubcategory()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = { category_id: 'cat-1', name: 'New Subcategory' }
      onSuccess(null, variables)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["subcategories"] })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["subcategories", 'cat-1'] })
      expect(toast.success).toHaveBeenCalledWith('Subcategory created successfully')
    })
  })
})