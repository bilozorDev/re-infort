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

describe('useProducts hooks', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('useProducts', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useProducts } = await import('../use-products')
      
      useProducts()

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["products"],
        queryFn: expect.any(Function),
      })
    })

    it('should make correct API call in query function', async () => {
      const { useProducts } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      useProducts()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/products')
    })

    it('should handle fetch errors in query function', async () => {
      const { useProducts } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      useProducts()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch products')
    })
  })

  describe('useProduct', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useProduct } = await import('../use-products')
      
      useProduct('prod-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["products", 'prod-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should be enabled only when id is truthy', async () => {
      const { useProduct } = await import('../use-products')
      
      useProduct('')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["products", ''],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should make correct API call for specific product', async () => {
      const { useProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'prod-1', name: 'Test Product' }),
      })

      useProduct('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/products/prod-1')
    })

    it('should handle fetch errors', async () => {
      const { useProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      useProduct('non-existent')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch product')
    })
  })

  describe('useCreateProduct', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useCreateProduct } = await import('../use-products')
      
      useCreateProduct()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useCreateProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'prod-new', name: 'New Product' }),
      })

      useCreateProduct()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const data = { name: 'New Product', sku: 'NP-001' }
      await mutationFn(data)

      expect(mockFetch).toHaveBeenCalledWith('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    })

    it('should handle success callback', async () => {
      const { useCreateProduct } = await import('../use-products')
      
      useCreateProduct()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      onSuccess()

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["products"] })
      expect(toast.success).toHaveBeenCalledWith('Product created successfully')
    })

    it('should handle error callback', async () => {
      const { useCreateProduct } = await import('../use-products')
      
      useCreateProduct()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('SKU already exists')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('SKU already exists')
    })

    it('should handle API errors with specific messages', async () => {
      const { useCreateProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Product SKU already exists' }),
      })

      useCreateProduct()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({ name: 'Test', sku: 'DUP' })).rejects.toThrow('Product SKU already exists')
    })

    it('should handle API errors without specific messages', async () => {
      const { useCreateProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      })

      useCreateProduct()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({ name: 'Test' })).rejects.toThrow('Failed to create product')
    })
  })

  describe('useUpdateProduct', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useUpdateProduct } = await import('../use-products')
      
      useUpdateProduct()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useUpdateProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'prod-1', name: 'Updated Product' }),
      })

      useUpdateProduct()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const updateData = { name: 'Updated Product', price: 150 }
      await mutationFn({ id: 'prod-1', data: updateData })

      expect(mockFetch).toHaveBeenCalledWith('/api/products/prod-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    })

    it('should invalidate correct queries on success', async () => {
      const { useUpdateProduct } = await import('../use-products')
      
      useUpdateProduct()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = { id: 'prod-1', data: { name: 'Updated' } }
      onSuccess(null, variables)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["products"] })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["products", 'prod-1'] })
      expect(toast.success).toHaveBeenCalledWith('Product updated successfully')
    })

    it('should handle error callback', async () => {
      const { useUpdateProduct } = await import('../use-products')
      
      useUpdateProduct()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Update failed')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('useDeleteProduct', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useDeleteProduct } = await import('../use-products')
      
      useDeleteProduct()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useDeleteProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      useDeleteProduct()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await mutationFn('prod-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/products/prod-1', {
        method: 'DELETE',
      })
    })

    it('should handle success callback', async () => {
      const { useDeleteProduct } = await import('../use-products')
      
      useDeleteProduct()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      onSuccess()

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["products"] })
      expect(toast.success).toHaveBeenCalledWith('Product deleted successfully')
    })

    it('should handle error callback', async () => {
      const { useDeleteProduct } = await import('../use-products')
      
      useDeleteProduct()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Cannot delete product with inventory')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Cannot delete product with inventory')
    })

    it('should handle API errors with specific messages', async () => {
      const { useDeleteProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Product has inventory records' }),
      })

      useDeleteProduct()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('prod-1')).rejects.toThrow('Product has inventory records')
    })

    it('should handle API errors without specific messages', async () => {
      const { useDeleteProduct } = await import('../use-products')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      useDeleteProduct()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('prod-1')).rejects.toThrow('Failed to delete product')
    })
  })
})