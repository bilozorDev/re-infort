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

describe('useWarehouses hooks', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  describe('useWarehouses', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useWarehouses } = await import('../use-warehouses')
      
      useWarehouses()

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["warehouses"],
        queryFn: expect.any(Function),
      })
    })

    it('should make correct API call in query function', async () => {
      const { useWarehouses } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      useWarehouses()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/warehouses')
    })

    it('should handle fetch errors in query function', async () => {
      const { useWarehouses } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      useWarehouses()
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch warehouses')
    })
  })

  describe('useWarehouse', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useWarehouse } = await import('../use-warehouses')
      
      useWarehouse('wh-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["warehouses", 'wh-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should be enabled only when id is truthy', async () => {
      const { useWarehouse } = await import('../use-warehouses')
      
      useWarehouse(undefined)

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ["warehouses", undefined],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should make correct API call for specific warehouse', async () => {
      const { useWarehouse } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'wh-1', name: 'Test Warehouse' }),
      })

      useWarehouse('wh-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      await queryFn()

      expect(mockFetch).toHaveBeenCalledWith('/api/warehouses/wh-1')
    })

    it('should handle fetch errors', async () => {
      const { useWarehouse } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      useWarehouse('non-existent')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Failed to fetch warehouse')
    })

    it('should throw error when id is provided but empty', async () => {
      const { useWarehouse } = await import('../use-warehouses')
      
      useWarehouse('')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('No warehouse ID provided')
    })
  })

  describe('useCreateWarehouse', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useCreateWarehouse } = await import('../use-warehouses')
      
      useCreateWarehouse()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useCreateWarehouse } = await import('../use-warehouses')
      
      const mockWarehouse = {
        id: 'wh-new',
        name: 'New Warehouse',
        type: 'storage' as const,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWarehouse,
      })

      useCreateWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const data = {
        name: 'New Warehouse',
        type: 'storage' as const,
        address: '123 Test St',
        city: 'Test City',
        state_province: 'CA',
        postal_code: '12345',
        country: 'US',
      }
      await mutationFn(data)

      expect(mockFetch).toHaveBeenCalledWith('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
    })

    it('should handle success callback with warehouse name', async () => {
      const { useCreateWarehouse } = await import('../use-warehouses')
      
      useCreateWarehouse()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const data = { id: 'wh-1', name: 'Test Warehouse' }
      onSuccess(data)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["warehouses"] })
      expect(toast.success).toHaveBeenCalledWith('Warehouse "Test Warehouse" created successfully')
    })

    it('should handle error callback', async () => {
      const { useCreateWarehouse } = await import('../use-warehouses')
      
      useCreateWarehouse()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Warehouse name already exists')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Warehouse name already exists')
    })

    it('should handle API errors with specific messages', async () => {
      const { useCreateWarehouse } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Warehouse name already exists' }),
      })

      useCreateWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const data = { name: 'Duplicate', type: 'storage' as const }
      await expect(mutationFn(data)).rejects.toThrow('Warehouse name already exists')
    })

    it('should handle API errors without specific messages', async () => {
      const { useCreateWarehouse } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({}),
      })

      useCreateWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const data = { name: 'Invalid' }
      await expect(mutationFn(data)).rejects.toThrow('Failed to create warehouse')
    })
  })

  describe('useUpdateWarehouse', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useUpdateWarehouse } = await import('../use-warehouses')
      
      useUpdateWarehouse()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useUpdateWarehouse } = await import('../use-warehouses')
      
      const updatedWarehouse = {
        id: 'wh-1',
        name: 'Updated Warehouse',
        type: 'storage' as const,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedWarehouse,
      })

      useUpdateWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const updateData = { name: 'Updated Warehouse', notes: 'Updated notes' }
      await mutationFn({ id: 'wh-1', data: updateData })

      expect(mockFetch).toHaveBeenCalledWith('/api/warehouses/wh-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
    })

    it('should invalidate correct queries on success', async () => {
      const { useUpdateWarehouse } = await import('../use-warehouses')
      
      useUpdateWarehouse()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const data = { id: 'wh-1', name: 'Updated Warehouse' }
      onSuccess(data)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["warehouses"] })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["warehouses", 'wh-1'] })
      expect(toast.success).toHaveBeenCalledWith('Warehouse "Updated Warehouse" updated successfully')
    })

    it('should handle error callback', async () => {
      const { useUpdateWarehouse } = await import('../use-warehouses')
      
      useUpdateWarehouse()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Update failed')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Update failed')
    })
  })

  describe('useDeleteWarehouse', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useDeleteWarehouse } = await import('../use-warehouses')
      
      useDeleteWarehouse()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    })

    it('should make correct API call in mutation function', async () => {
      const { useDeleteWarehouse } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      useDeleteWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await mutationFn('wh-1')

      expect(mockFetch).toHaveBeenCalledWith('/api/warehouses/wh-1', {
        method: 'DELETE',
      })
    })

    it('should handle success callback and remove queries', async () => {
      const { useDeleteWarehouse } = await import('../use-warehouses')
      
      useDeleteWarehouse()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const id = 'wh-1'
      onSuccess(id)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ["warehouses"] })
      expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({ queryKey: ["warehouses", 'wh-1'] })
      expect(toast.success).toHaveBeenCalledWith('Warehouse deleted successfully')
    })

    it('should handle error callback', async () => {
      const { useDeleteWarehouse } = await import('../use-warehouses')
      
      useDeleteWarehouse()
      const onError = mockUseMutation.mock.calls[0][0].onError

      const error = new Error('Cannot delete warehouse with inventory')
      onError(error)

      expect(toast.error).toHaveBeenCalledWith('Cannot delete warehouse with inventory')
    })

    it('should handle API errors with specific messages', async () => {
      const { useDeleteWarehouse } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'Warehouse has inventory records' }),
      })

      useDeleteWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('wh-1')).rejects.toThrow('Warehouse has inventory records')
    })

    it('should handle API errors without specific messages', async () => {
      const { useDeleteWarehouse } = await import('../use-warehouses')
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })

      useDeleteWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn('wh-1')).rejects.toThrow('Failed to delete warehouse')
    })
  })

  describe('Type safety and validation', () => {
    it('should properly handle warehouse types', async () => {
      const { useCreateWarehouse } = await import('../use-warehouses')
      
      const warehouseData = {
        name: 'Test Warehouse',
        type: 'distribution' as const,
        address: '123 Test St',
        city: 'Test City',
        state_province: 'CA',
        postal_code: '12345',
        country: 'US',
        status: 'active' as const,
        is_default: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'wh-1', ...warehouseData }),
      })

      useCreateWarehouse()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await mutationFn(warehouseData)

      expect(mockFetch).toHaveBeenCalledWith('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(warehouseData),
      })
    })
  })
})