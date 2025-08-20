import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createMockInventory,
  createMockStockMovement,
  mockInventory,
  mockStockMovements,
} from '@/test/fixtures/inventory'
import { createClientMock, resetSupabaseMocks, setSupabaseMockData, setSupabaseRpcMockData } from '@/test/mocks/supabase'

import {
  adjustInventory,
  cancelMovement,
  createManualMovement,
  getInventoryByProduct,
  getInventoryByWarehouse,
  getLowStockItems,
  getProductTotalInventory,
  getRecentMovements,
  getStockMovements,
  releaseReservation,
  reserveInventory,
  transferInventory,
} from '../inventory.service'

// Mock the Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

describe('Inventory Service', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    vi.clearAllMocks()
  })

  describe('getInventoryByWarehouse', () => {
    it('should fetch inventory for a warehouse', async () => {
      const warehouseId = 'warehouse-1'
      const orgId = 'org_test123'
      const warehouseInventory = mockInventory.filter(i => i.warehouse_id === warehouseId)
      const queryBuilder = setSupabaseMockData('inventory_details', warehouseInventory)

      const result = await getInventoryByWarehouse(warehouseId, orgId)

      expect(result).toEqual(warehouseInventory)
      expect(queryBuilder.eq).toHaveBeenCalledWith('warehouse_id', warehouseId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('product_name', { ascending: true })
    })

    it('should return empty array when no inventory exists', async () => {
      setSupabaseMockData('inventory_details', [])

      const result = await getInventoryByWarehouse('warehouse-1', 'org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('inventory_details', null, { message: 'Database error' })

      await expect(getInventoryByWarehouse('warehouse-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch inventory: Database error')
    })
  })

  describe('getInventoryByProduct', () => {
    it('should fetch inventory for a product', async () => {
      const productId = 'prod-1'
      const orgId = 'org_test123'
      const productInventory = mockInventory.filter(i => i.product_id === productId)
      const queryBuilder = setSupabaseMockData('inventory_details', productInventory)

      const result = await getInventoryByProduct(productId, orgId)

      expect(result).toEqual(productInventory)
      expect(queryBuilder.eq).toHaveBeenCalledWith('product_id', productId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('warehouse_name', { ascending: true })
    })

    it('should return empty array when no inventory exists', async () => {
      setSupabaseMockData('inventory_details', [])

      const result = await getInventoryByProduct('prod-1', 'org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('inventory_details', null, { message: 'Database error' })

      await expect(getInventoryByProduct('prod-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch product inventory: Database error')
    })
  })

  describe('getProductTotalInventory', () => {
    it('should fetch product total inventory summary', async () => {
      const productId = 'prod-1'
      const mockSummary = {
        total_quantity: 100,
        total_reserved: 5,
        total_available: 95,
        warehouse_count: 2,
        warehouses: [
          { warehouse_id: 'warehouse-1', quantity: 60, reserved: 3 },
          { warehouse_id: 'warehouse-2', quantity: 40, reserved: 2 },
        ],
      }
      
      setSupabaseRpcMockData([mockSummary])

      const result = await getProductTotalInventory(productId)

      expect(result).toEqual(mockSummary)
    })

    it('should return default values when no data exists', async () => {
      setSupabaseRpcMockData([])

      const result = await getProductTotalInventory('prod-1')

      expect(result).toEqual({
        total_quantity: 0,
        total_reserved: 0,
        total_available: 0,
        warehouse_count: 0,
        warehouses: [],
      })
    })

    it('should throw error when RPC fails', async () => {
      setSupabaseRpcMockData(null, { message: 'RPC error' })

      await expect(getProductTotalInventory('prod-1'))
        .rejects.toThrow('Failed to fetch product total inventory: RPC error')
    })
  })

  describe('adjustInventory', () => {
    it('should adjust inventory quantity', async () => {
      const adjustment = {
        product_id: 'prod-1',
        warehouse_id: 'warehouse-1',
        quantity_change: 10,
        movement_type: 'adjustment' as const,
        reason: 'Stock count correction',
        reference_number: 'ADJ-001',
        reference_type: 'manual',
      }

      const mockResult = {
        success: true,
        inventory_id: 'inv-1',
        movement_id: 'move-1',
        previous_quantity: 25,
        new_quantity: 35,
        quantity_change: 10,
      }

      setSupabaseRpcMockData(mockResult)

      const result = await adjustInventory(adjustment)

      expect(result).toEqual(mockResult)
    })

    it('should throw error when adjustment fails', async () => {
      const adjustment = {
        product_id: 'prod-1',
        warehouse_id: 'warehouse-1',
        quantity_change: 10,
        movement_type: 'adjustment' as const,
        reason: 'Test',
      }

      setSupabaseRpcMockData(null, { message: 'Insufficient inventory' })

      await expect(adjustInventory(adjustment))
        .rejects.toThrow('Failed to adjust inventory: Insufficient inventory')
    })
  })

  describe('transferInventory', () => {
    it('should transfer inventory between warehouses', async () => {
      const transfer = {
        product_id: 'prod-1',
        from_warehouse_id: 'warehouse-1',
        to_warehouse_id: 'warehouse-2',
        quantity: 5,
        reason: 'Stock balancing',
        notes: 'Transfer for high demand area',
      }

      const mockResult = {
        success: true,
        movement_id: 'move-1',
        from_warehouse_id: 'warehouse-1',
        to_warehouse_id: 'warehouse-2',
        quantity_transferred: 5,
        from_new_quantity: 20,
        to_new_quantity: 20,
      }

      setSupabaseRpcMockData(mockResult)

      const result = await transferInventory(transfer)

      expect(result).toEqual(mockResult)
    })

    it('should throw error when transfer fails', async () => {
      const transfer = {
        product_id: 'prod-1',
        from_warehouse_id: 'warehouse-1',
        to_warehouse_id: 'warehouse-2',
        quantity: 100,
        reason: 'Test',
      }

      setSupabaseRpcMockData(null, { message: 'Insufficient inventory' })

      await expect(transferInventory(transfer))
        .rejects.toThrow('Failed to transfer inventory: Insufficient inventory')
    })
  })

  describe('reserveInventory', () => {
    it('should reserve inventory', async () => {
      const mockResult = {
        success: true,
        inventory_id: 'inv-1',
        reserved_quantity: 5,
        reference_number: 'SO-001',
      }

      setSupabaseRpcMockData(mockResult)

      const result = await reserveInventory('prod-1', 'warehouse-1', 5, 'SO-001')

      expect(result).toEqual(mockResult)
    })

    it('should reserve inventory without reference number', async () => {
      const mockResult = {
        success: true,
        inventory_id: 'inv-1',
        reserved_quantity: 5,
        reference_number: null,
      }

      setSupabaseRpcMockData(mockResult)

      const result = await reserveInventory('prod-1', 'warehouse-1', 5)

      expect(result).toEqual(mockResult)
    })

    it('should throw error when reservation fails', async () => {
      setSupabaseRpcMockData(null, { message: 'Insufficient available inventory' })

      await expect(reserveInventory('prod-1', 'warehouse-1', 100))
        .rejects.toThrow('Failed to reserve inventory: Insufficient available inventory')
    })
  })

  describe('releaseReservation', () => {
    it('should release inventory reservation', async () => {
      const mockResult = {
        success: true,
        inventory_id: 'inv-1',
        released_quantity: 5,
        new_reserved_quantity: 0,
      }

      setSupabaseRpcMockData(mockResult)

      const result = await releaseReservation('prod-1', 'warehouse-1', 5)

      expect(result).toEqual(mockResult)
    })

    it('should throw error when release fails', async () => {
      setSupabaseRpcMockData(null, { message: 'No reservation found' })

      await expect(releaseReservation('prod-1', 'warehouse-1', 5))
        .rejects.toThrow('Failed to release reservation: No reservation found')
    })
  })

  describe('getStockMovements', () => {
    it('should fetch stock movements with no filters', async () => {
      const queryBuilder = setSupabaseMockData('stock_movements_details', mockStockMovements)

      const result = await getStockMovements({}, 'org_test123')

      expect(result).toEqual(mockStockMovements)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', 'org_test123')
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should fetch stock movements with product filter', async () => {
      const filteredMovements = mockStockMovements.filter(m => m.product_id === 'prod-1')
      const queryBuilder = setSupabaseMockData('stock_movements_details', filteredMovements)

      const result = await getStockMovements({ productId: 'prod-1' }, 'org_test123')

      expect(result).toEqual(filteredMovements)
      expect(queryBuilder.eq).toHaveBeenCalledWith('product_id', 'prod-1')
    })

    it('should fetch stock movements with warehouse filter', async () => {
      const queryBuilder = setSupabaseMockData('stock_movements_details', mockStockMovements)

      await getStockMovements({ warehouseId: 'warehouse-1' }, 'org_test123')

      expect(queryBuilder.or).toHaveBeenCalledWith(
        'from_warehouse_id.eq.warehouse-1,to_warehouse_id.eq.warehouse-1'
      )
    })

    it('should fetch stock movements with movement type filter', async () => {
      const queryBuilder = setSupabaseMockData('stock_movements_details', mockStockMovements)

      await getStockMovements({ movementType: 'purchase' }, 'org_test123')

      expect(queryBuilder.eq).toHaveBeenCalledWith('movement_type', 'purchase')
    })

    it('should fetch stock movements with date filters', async () => {
      const queryBuilder = setSupabaseMockData('stock_movements_details', mockStockMovements)

      await getStockMovements({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      }, 'org_test123')

      expect(queryBuilder.gte).toHaveBeenCalledWith('created_at', '2024-01-01')
      expect(queryBuilder.lte).toHaveBeenCalledWith('created_at', '2024-01-31')
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('stock_movements_details', null, { message: 'Database error' })

      await expect(getStockMovements({}, 'org_test123'))
        .rejects.toThrow('Failed to fetch stock movements: Database error')
    })
  })

  describe('getRecentMovements', () => {
    it('should fetch recent movements with default limit', async () => {
      const queryBuilder = setSupabaseMockData('stock_movements_details', mockStockMovements)

      const result = await getRecentMovements(undefined, 'org_test123')

      expect(result).toEqual(mockStockMovements)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', 'org_test123')
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(queryBuilder.limit).toHaveBeenCalledWith(10)
    })

    it('should fetch recent movements with custom limit', async () => {
      const queryBuilder = setSupabaseMockData('stock_movements_details', mockStockMovements)

      await getRecentMovements(5, 'org_test123')

      expect(queryBuilder.limit).toHaveBeenCalledWith(5)
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('stock_movements_details', null, { message: 'Database error' })

      await expect(getRecentMovements(10, 'org_test123'))
        .rejects.toThrow('Failed to fetch recent movements: Database error')
    })
  })

  describe('getLowStockItems', () => {
    it('should fetch low stock items', async () => {
      const lowStockItems = mockInventory.filter(i => 
        i.reorder_point !== null && i.quantity <= (i.reorder_point || 0)
      )
      const queryBuilder = setSupabaseMockData('inventory_details', lowStockItems)

      const result = await getLowStockItems('org_test123')

      expect(result).toEqual(lowStockItems)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', 'org_test123')
      expect(queryBuilder.filter).toHaveBeenCalledWith('reorder_point', 'not.is', null)
      expect(queryBuilder.filter).toHaveBeenCalledWith('quantity', 'lte', 'reorder_point')
      expect(queryBuilder.order).toHaveBeenCalledWith('quantity', { ascending: true })
    })

    it('should return empty array when no low stock items', async () => {
      setSupabaseMockData('inventory_details', [])

      const result = await getLowStockItems('org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('inventory_details', null, { message: 'Database error' })

      await expect(getLowStockItems('org_test123'))
        .rejects.toThrow('Failed to fetch low stock items: Database error')
    })
  })

  describe('createManualMovement', () => {
    it('should create a manual stock movement', async () => {
      const input = {
        movement_type: 'manual' as const,
        product_id: 'prod-1',
        from_warehouse_id: null,
        to_warehouse_id: 'warehouse-1',
        quantity: 10,
        reason: 'Manual adjustment',
        reference_number: 'MAN-001',
        reference_type: 'manual',
        notes: 'Manual stock adjustment',
        status: 'completed' as const,
      }

      const createdMovement = createMockStockMovement({
        ...input,
        organization_clerk_id: 'org_test123',
        created_by_clerk_user_id: 'user_test',
      })

      const queryBuilder = setSupabaseMockData('stock_movements', createdMovement)

      const result = await createManualMovement(input, 'org_test123', 'user_test')

      expect(result).toEqual(createdMovement)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        organization_clerk_id: 'org_test123',
        created_by_clerk_user_id: 'user_test',
      })
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should throw error when creation fails', async () => {
      const input = {
        movement_type: 'manual' as const,
        product_id: 'prod-1',
        quantity: 10,
        reason: 'Test',
      }

      setSupabaseMockData('stock_movements', null, { message: 'Invalid product' })

      await expect(createManualMovement(input, 'org_test123', 'user_test'))
        .rejects.toThrow('Failed to create stock movement: Invalid product')
    })
  })

  describe('cancelMovement', () => {
    it('should cancel a pending movement', async () => {
      const queryBuilder = setSupabaseMockData('stock_movements', null)

      await cancelMovement('move-1', 'org_test123', 'user_test')

      expect(queryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          cancelled_by_clerk_user_id: 'user_test',
        })
      )
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'move-1')
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', 'org_test123')
      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should throw error when cancellation fails', async () => {
      setSupabaseMockData('stock_movements', null, { message: 'Movement not found' })

      await expect(cancelMovement('move-1', 'org_test123', 'user_test'))
        .rejects.toThrow('Failed to cancel movement: Movement not found')
    })
  })
})