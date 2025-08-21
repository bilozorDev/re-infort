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

describe('useFeatures hooks', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('useFeatureDefinitions', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useFeatureDefinitions } = await import('../use-features')
      
      useFeatureDefinitions('cat-1', 'subcat-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["feature-definitions", 'cat-1', 'subcat-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should make correct API call in query function', async () => {
      const { useFeatureDefinitions } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', name: 'Color' }],
      })

      useFeatureDefinitions('cat-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/feature-definitions?categoryId=cat-1')
    })

    it('should handle fetch errors in query function', async () => {
      const { useFeatureDefinitions } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      useFeatureDefinitions('cat-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Server error')
    })
  })

  // Note: useFeatureDefinition doesn't exist in the actual implementation
  // Skipping these tests

  describe('useProductFeatures', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useProductFeatures } = await import('../use-features')
      
      useProductFeatures('prod-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["product-features", 'prod-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should make correct API call for product features', async () => {
      const { useProductFeatures } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ feature_id: '1', value: 'Red' }],
      })

      useProductFeatures('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/products/prod-1/features')
    })

    it('should handle fetch errors', async () => {
      const { useProductFeatures } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })

      useProductFeatures('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Server error')
    })
  })

  describe('useCreateFeatureDefinition', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useCreateFeatureDefinition } = await import('../use-features')
      
      useCreateFeatureDefinition()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useCreateFeatureDefinition } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'new-feature', name: 'Material' }),
      })

      useCreateFeatureDefinition()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const data = { name: 'Material', type: 'text', required: false }
      await mutationFn(data)

      expect(mockFetch).toHaveBeenCalledWith('/api/feature-definitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    })

    it('should handle success callback', async () => {
      const { useCreateFeatureDefinition } = await import('../use-features')
      
      useCreateFeatureDefinition()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      onSuccess()

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["feature-definitions"] })
      expect(toast.success).toHaveBeenCalledWith('Feature definition created successfully')
    })

    it('should handle error callback', async () => {
      const { useCreateFeatureDefinition } = await import('../use-features')
      
      useCreateFeatureDefinition()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Name already exists')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Name already exists')
    })

    it('should handle API errors', async () => {
      const { useCreateFeatureDefinition } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Feature name already exists' }),
      })

      useCreateFeatureDefinition()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({ name: 'Duplicate' })).rejects.toThrow('Feature name already exists')
    })
  })

  describe('useUpdateFeatureDefinition', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useUpdateFeatureDefinition } = await import('../use-features')
      
      useUpdateFeatureDefinition()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useUpdateFeatureDefinition } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'feat-1', name: 'Updated Feature' }),
      })

      useUpdateFeatureDefinition()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const updateData = { name: 'Updated Feature', required: true }
      await mutationFn({ id: 'feat-1', data: updateData })

      expect(mockFetch).toHaveBeenCalledWith('/api/feature-definitions/feat-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    })

    it('should invalidate correct queries on success', async () => {
      const { useUpdateFeatureDefinition } = await import('../use-features')
      
      useUpdateFeatureDefinition()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = { id: 'feat-1', data: { name: 'Updated' } }
      onSuccess(null, variables)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["feature-definitions"] })
      expect(toast.success).toHaveBeenCalledWith('Feature definition updated successfully')
    })

    it('should handle error callback', async () => {
      const { useUpdateFeatureDefinition } = await import('../use-features')
      
      useUpdateFeatureDefinition()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Update failed')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('useDeleteFeatureDefinition', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useDeleteFeatureDefinition } = await import('../use-features')
      
      useDeleteFeatureDefinition()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useDeleteFeatureDefinition } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      useDeleteFeatureDefinition()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await mutationFn('feat-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/feature-definitions/feat-1', {
        method: 'DELETE',
      })
    })

    it('should handle success callback', async () => {
      const { useDeleteFeatureDefinition } = await import('../use-features')
      
      useDeleteFeatureDefinition()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      onSuccess()

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["feature-definitions"] })
      expect(toast.success).toHaveBeenCalledWith('Feature definition deleted successfully')
    })

    it('should handle error callback', async () => {
      const { useDeleteFeatureDefinition } = await import('../use-features')
      
      useDeleteFeatureDefinition()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Cannot delete feature in use')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Cannot delete feature in use')
    })

    it('should handle API errors', async () => {
      const { useDeleteFeatureDefinition } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Feature has product associations' }),
      })

      useDeleteFeatureDefinition()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('feat-1')).rejects.toThrow('Feature has product associations')
    })
  })

  describe('useUpdateProductFeatures', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useUpdateProductFeatures } = await import('../use-features')
      
      useUpdateProductFeatures()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call for updating product features', async () => {
      const { useUpdateProductFeatures } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      useUpdateProductFeatures()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const features = [
        { feature_id: '1', value: 'Red' },
        { feature_id: '2', value: 'Large' }
      ]
      await mutationFn({ productId: 'prod-1', features })

      expect(mockFetch).toHaveBeenCalledWith('/api/products/prod-1/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ features }),
      })
    })

    it('should invalidate correct queries on success', async () => {
      const { useUpdateProductFeatures } = await import('../use-features')
      
      useUpdateProductFeatures()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = { productId: 'prod-1', features: [] }
      onSuccess(null, variables)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ["product-features", 'prod-1'] 
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ["products"] 
      })
      expect(toast.success).toHaveBeenCalledWith('Product features updated successfully')
    })

    it('should handle error callback', async () => {
      const { useUpdateProductFeatures } = await import('../use-features')
      
      useUpdateProductFeatures()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Invalid feature values')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Invalid feature values')
    })

    it('should handle API errors without specific messages', async () => {
      const { useUpdateProductFeatures } = await import('../use-features')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      useUpdateProductFeatures()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({ productId: 'prod-1', features: [] })).rejects.toThrow('Failed to update product features')
    })
  })
})