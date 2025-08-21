import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock React Query
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockQueryClient = {
  invalidateQueries: vi.fn(),
}

vi.mock('@tanstack/react-query', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useQueryClient: () => mockQueryClient,
}))

// Mock Supabase
const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
}

vi.mock('../use-supabase', () => ({
  useSupabase: () => mockSupabase,
}))

describe('useInventory hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useProductInventory', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useProductInventory } = await import('../use-inventory')
      
      useProductInventory('prod-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['product-inventory', 'prod-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should be disabled when productId is empty', async () => {
      const { useProductInventory } = await import('../use-inventory')
      
      useProductInventory('')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['product-inventory', ''],
        queryFn: expect.any(Function),
        enabled: false,
      })
    })

    it('should call correct RPC function', async () => {
      const { useProductInventory } = await import('../use-inventory')
      
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { total_quantity: 100, available_quantity: 80 },
        error: null,
      })

      useProductInventory('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_product_total_inventory', {
        p_product_id: 'prod-1',
      })
      expect(result).toEqual({ total_quantity: 100, available_quantity: 80 })
    })

    it('should handle RPC errors', async () => {
      const { useProductInventory } = await import('../use-inventory')
      
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error('RPC failed'),
      })

      useProductInventory('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('RPC failed')
    })
  })

  describe('useProductWarehouseInventory', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useProductWarehouseInventory } = await import('../use-inventory')
      
      useProductWarehouseInventory('prod-1')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['product-warehouse-inventory', 'prod-1'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should query inventory_details view', async () => {
      const { useProductWarehouseInventory } = await import('../use-inventory')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          { id: 'inv-1', warehouse_name: 'Main', quantity: 50 },
          { id: 'inv-2', warehouse_name: 'Secondary', quantity: 30 },
        ],
        error: null,
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      })

      useProductWarehouseInventory('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(mockSupabase.from).toHaveBeenCalledWith('inventory_details')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('product_id', 'prod-1')
      expect(mockOrder).toHaveBeenCalledWith('warehouse_name')
      expect(result).toHaveLength(2)
    })

    it('should handle query errors', async () => {
      const { useProductWarehouseInventory } = await import('../use-inventory')
      
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Query failed'),
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      })

      useProductWarehouseInventory('prod-1')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn

      await expect(queryFn()).rejects.toThrow('Query failed')
    })
  })

  describe('useAdjustStock', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useAdjustStock } = await import('../use-inventory')
      
      useAdjustStock()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      })
    })

    it('should call adjust_inventory RPC with positive quantity', async () => {
      const { useAdjustStock } = await import('../use-inventory')
      
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })

      useAdjustStock()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const params = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 50,
        movementType: 'receipt',
        reason: 'New stock',
        referenceNumber: 'PO-123',
      }

      await mutationFn(params)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('adjust_inventory', {
        p_product_id: 'prod-1',
        p_warehouse_id: 'wh-1',
        p_quantity_change: 50,
        p_movement_type: 'receipt',
        p_reason: 'New stock',
        p_reference_number: 'PO-123',
      })
    })

    it('should handle negative quantity for stock removal', async () => {
      const { useAdjustStock } = await import('../use-inventory')
      
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })

      useAdjustStock()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const params = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: -20,
        movementType: 'adjustment',
        reason: 'Damaged items',
      }

      await mutationFn(params)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('adjust_inventory', {
        p_product_id: 'prod-1',
        p_warehouse_id: 'wh-1',
        p_quantity_change: -20,
        p_movement_type: 'adjustment',
        p_reason: 'Damaged items',
        p_reference_number: undefined,
      })
    })

    it('should invalidate related queries on success', async () => {
      const { useAdjustStock } = await import('../use-inventory')
      
      useAdjustStock()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = { productId: 'prod-1', warehouseId: 'wh-1', quantity: 10 }
      onSuccess(null, variables)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['product-inventory', 'prod-1'] 
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['product-warehouse-inventory', 'prod-1'] 
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['stock-movements', 'prod-1'] 
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['inventory-analytics', 'prod-1'] 
      })
    })

    it('should handle insufficient inventory error', async () => {
      const { useAdjustStock } = await import('../use-inventory')
      
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Insufficient inventory'),
      })

      useAdjustStock()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: -100,
        movementType: 'adjustment',
      })).rejects.toThrow('Insufficient inventory')
    })
  })

  describe('useTransferStock', () => {
    it('should configure mutation with correct parameters', async () => {
      const { useTransferStock } = await import('../use-inventory')
      
      useTransferStock()

      expect(mockUseMutation).toHaveBeenCalledWith({
        mutationFn: expect.any(Function),
        onSuccess: expect.any(Function),
      })
    })

    it('should call transfer_inventory RPC', async () => {
      const { useTransferStock } = await import('../use-inventory')
      
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })

      useTransferStock()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      const params = {
        productId: 'prod-1',
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-2',
        quantity: 25,
        reason: 'Rebalancing stock',
        notes: 'Moving to fulfill orders',
      }

      await mutationFn(params)

      expect(mockSupabase.rpc).toHaveBeenCalledWith('transfer_inventory', {
        p_product_id: 'prod-1',
        p_from_warehouse_id: 'wh-1',
        p_to_warehouse_id: 'wh-2',
        p_quantity: 25,
        p_reason: 'Rebalancing stock',
        p_notes: 'Moving to fulfill orders',
      })
    })

    it('should validate transfer between same warehouse', async () => {
      const { useTransferStock } = await import('../use-inventory')
      
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: new Error('Cannot transfer to same warehouse'),
      })

      useTransferStock()
      const mutationFn = mockUseMutation.mock.calls[0][0].mutationFn

      await expect(mutationFn({
        productId: 'prod-1',
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-1',
        quantity: 10,
      })).rejects.toThrow('Cannot transfer to same warehouse')
    })

    it('should invalidate queries on successful transfer', async () => {
      const { useTransferStock } = await import('../use-inventory')
      
      useTransferStock()
      const onSuccess = mockUseMutation.mock.calls[0][0].onSuccess

      const variables = {
        productId: 'prod-1',
        fromWarehouseId: 'wh-1',
        toWarehouseId: 'wh-2',
        quantity: 15,
      }
      onSuccess(null, variables)

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['product-inventory', 'prod-1'] 
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['product-warehouse-inventory', 'prod-1'] 
      })
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({ 
        queryKey: ['stock-movements', 'prod-1'] 
      })
    })
  })

  describe('useInventoryAnalytics', () => {
    it('should configure useQuery with correct parameters', async () => {
      const { useInventoryAnalytics } = await import('../use-inventory')
      
      useInventoryAnalytics('prod-1', '30d')

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['inventory-analytics', 'prod-1', '30d'],
        queryFn: expect.any(Function),
        enabled: true,
      })
    })

    it('should calculate analytics correctly', async () => {
      const { useInventoryAnalytics } = await import('../use-inventory')
      
      // Mock movements data
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockGte = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            product_id: 'prod-1',
            quantity: 10,
            movement_type: 'receipt',
            from_warehouse_id: null,
            to_warehouse_id: 'wh-1',
            from_warehouse_name: null,
            to_warehouse_name: 'Main',
            created_at: '2024-01-15',
          },
          {
            product_id: 'prod-1',
            quantity: -5,
            movement_type: 'sale',
            from_warehouse_id: 'wh-1',
            to_warehouse_id: null,
            from_warehouse_name: 'Main',
            to_warehouse_name: null,
            created_at: '2024-01-16',
          },
        ],
        error: null,
      })

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'stock_movements_details') {
          return {
            select: mockSelect,
            eq: mockEq,
            gte: mockGte,
            order: mockOrder,
          }
        }
        if (table === 'inventory') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ quantity: 50 }, { quantity: 30 }],
              error: null,
            }),
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { price: 100, cost: 60 },
              error: null,
            }),
          }
        }
      })

      useInventoryAnalytics('prod-1', '30d')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(result).toMatchObject({
        totalMovement: 5,
        avgDailyMovement: expect.any(Number),
        stockValue: 4800, // 80 * 60
        turnoverRate: expect.any(Number),
        movementBreakdown: {
          receipt: { count: 1, quantity: 10 },
          sale: { count: 1, quantity: -5 },
        },
        topWarehouses: expect.any(Array),
        period: '30d',
      })
    })

    it('should handle empty movement data', async () => {
      const { useInventoryAnalytics } = await import('../use-inventory')
      
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: { price: 100, cost: 60 },
          error: null,
        }),
      }))

      useInventoryAnalytics('prod-1', '7d')
      const queryFn = mockUseQuery.mock.calls[0][0].queryFn
      const result = await queryFn()

      expect(result).toMatchObject({
        totalMovement: 0,
        avgDailyMovement: 0,
        stockValue: 0,
        turnoverRate: 0,
        movementBreakdown: {},
        topWarehouses: [],
        period: '7d',
      })
    })
  })
})