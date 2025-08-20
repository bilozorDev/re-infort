import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAdmin } from '@/app/utils/roles'
import { createMockWarehouse, mockWarehouses } from '@/test/fixtures/inventory'
import { createClientMock, resetSupabaseMocks, setSupabaseMockData } from '@/test/mocks/supabase'

import {
  createWarehouse,
  deleteWarehouse,
  getActiveWarehouses,
  getAllWarehouses,
  getDefaultWarehouse,
  getWarehouseById,
  updateWarehouse,
} from '../warehouse.service'

// Mock the Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

// Mock the roles utility
vi.mock('@/app/utils/roles', () => ({
  isAdmin: vi.fn().mockResolvedValue(false),
}))

describe('Warehouse Service', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    vi.clearAllMocks()
  })

  describe('getAllWarehouses', () => {
    it('should fetch all warehouses for an organization', async () => {
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('warehouses', mockWarehouses)

      const result = await getAllWarehouses(orgId)

      expect(result).toEqual(mockWarehouses)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should return empty array when no warehouses exist', async () => {
      setSupabaseMockData('warehouses', [])

      const result = await getAllWarehouses('org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('warehouses', null, { message: 'Database error' })

      await expect(getAllWarehouses('org_test123'))
        .rejects.toThrow('Failed to fetch warehouses: Database error')
    })
  })

  describe('getWarehouseById', () => {
    it('should fetch a warehouse by id', async () => {
      const warehouse = mockWarehouses[0]
      const queryBuilder = setSupabaseMockData('warehouses', warehouse)

      const result = await getWarehouseById(warehouse.id, warehouse.organization_clerk_id)

      expect(result).toEqual(warehouse)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', warehouse.id)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', warehouse.organization_clerk_id)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should return null when warehouse not found (PGRST116)', async () => {
      setSupabaseMockData('warehouses', null, { code: 'PGRST116' })

      const result = await getWarehouseById('non-existent', 'org_test123')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('warehouses', null, { message: 'Database error' })

      await expect(getWarehouseById('warehouse-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch warehouse: Database error')
    })
  })

  describe('createWarehouse', () => {
    it('should create a new warehouse when user is admin', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      const input = {
        name: 'New Warehouse',
        address: '123 Test St',
        city: 'Test City',
        state_province: 'TS',
        postal_code: '12345',
        country: 'USA',
        type: 'distribution' as const,
        is_default: false,
      }
      const orgId = 'org_test123'
      const userId = 'user_test'
      const createdWarehouse = createMockWarehouse({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })

      const queryBuilder = setSupabaseMockData('warehouses', createdWarehouse)

      const result = await createWarehouse(input, orgId, userId)

      expect(result).toEqual(createdWarehouse)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle setting default warehouse', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      const input = {
        name: 'Default Warehouse',
        address: '123 Test St',
        city: 'Test City',
        state_province: 'TS',
        postal_code: '12345',
        country: 'USA',
        type: 'distribution' as const,
        is_default: true,
      }
      const orgId = 'org_test123'
      const userId = 'user_test'
      const createdWarehouse = createMockWarehouse({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })

      // Setup mock for both the unset operation and the create operation
      const queryBuilder = setSupabaseMockData('warehouses', createdWarehouse)

      const result = await createWarehouse(input, orgId, userId)

      expect(result).toEqual(createdWarehouse)
      // Should call update to unset other defaults first
      expect(queryBuilder.update).toHaveBeenCalledWith({ is_default: false })
    })

    it('should throw error when user is not admin', async () => {
      // Mock non-admin user
      vi.mocked(isAdmin).mockResolvedValue(false)

      const input = {
        name: 'New Warehouse',
        address: '123 Test St',
        city: 'Test City',
        state_province: 'TS',
        postal_code: '12345',
        country: 'USA',
        type: 'distribution' as const,
      }

      await expect(createWarehouse(input, 'org_test123', 'user_test'))
        .rejects.toThrow('Only administrators can create warehouses')
    })

    it('should throw error when creation fails', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      const input = {
        name: 'New Warehouse',
        address: '123 Test St',
        city: 'Test City',
        state_province: 'TS',
        postal_code: '12345',
        country: 'USA',
        type: 'distribution' as const,
      }

      setSupabaseMockData('warehouses', null, { message: 'Database error' })

      await expect(createWarehouse(input, 'org_test123', 'user_test'))
        .rejects.toThrow('Failed to create warehouse: Database error')
    })
  })

  describe('updateWarehouse', () => {
    it('should update an existing warehouse when user is admin', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      const warehouseId = 'warehouse-1'
      const updates = {
        name: 'Updated Warehouse',
        address: 'Updated Address',
      }
      const orgId = 'org_test123'
      const updatedWarehouse = createMockWarehouse({ id: warehouseId, ...updates })

      const queryBuilder = setSupabaseMockData('warehouses', updatedWarehouse)

      const result = await updateWarehouse(warehouseId, updates, orgId)

      expect(result).toEqual(updatedWarehouse)
      expect(queryBuilder.update).toHaveBeenCalledWith(updates)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', warehouseId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle setting as default warehouse', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      const warehouseId = 'warehouse-1'
      const updates = {
        name: 'Updated Default Warehouse',
        is_default: true,
      }
      const orgId = 'org_test123'
      const updatedWarehouse = createMockWarehouse({ id: warehouseId, ...updates })

      const queryBuilder = setSupabaseMockData('warehouses', updatedWarehouse)

      const result = await updateWarehouse(warehouseId, updates, orgId)

      expect(result).toEqual(updatedWarehouse)
      // Should call update to unset other defaults first, excluding this warehouse
      expect(queryBuilder.neq).toHaveBeenCalledWith('id', warehouseId)
    })

    it('should throw error when user is not admin', async () => {
      // Mock non-admin user
      vi.mocked(isAdmin).mockResolvedValue(false)

      await expect(updateWarehouse('warehouse-1', { name: 'Updated' }, 'org_test123'))
        .rejects.toThrow('Only administrators can update warehouses')
    })

    it('should throw error when warehouse not found', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      setSupabaseMockData('warehouses', null)

      await expect(updateWarehouse('warehouse-1', { name: 'Updated' }, 'org_test123'))
        .rejects.toThrow('Warehouse not found')
    })

    it('should throw error when update fails', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      setSupabaseMockData('warehouses', null, { message: 'Database error' })

      await expect(updateWarehouse('warehouse-1', { name: 'Updated' }, 'org_test123'))
        .rejects.toThrow('Failed to update warehouse: Database error')
    })
  })

  describe('deleteWarehouse', () => {
    it('should delete a warehouse when user is admin', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      const warehouseId = 'warehouse-1'
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('warehouses', null)

      await deleteWarehouse(warehouseId, orgId)

      expect(queryBuilder.delete).toHaveBeenCalled()
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', warehouseId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
    })

    it('should throw error when user is not admin', async () => {
      // Mock non-admin user
      vi.mocked(isAdmin).mockResolvedValue(false)

      await expect(deleteWarehouse('warehouse-1', 'org_test123'))
        .rejects.toThrow('Only administrators can delete warehouses')
    })

    it('should throw error when deletion fails', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)

      setSupabaseMockData('warehouses', null, { message: 'Database error' })

      await expect(deleteWarehouse('warehouse-1', 'org_test123'))
        .rejects.toThrow('Failed to delete warehouse: Database error')
    })
  })

  describe('getActiveWarehouses', () => {
    it('should fetch only active warehouses', async () => {
      const activeWarehouses = mockWarehouses.filter(w => w.status === 'active')
      const queryBuilder = setSupabaseMockData('warehouses', activeWarehouses)

      const result = await getActiveWarehouses('org_test123')

      expect(result).toEqual(activeWarehouses)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', 'org_test123')
      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'active')
      expect(queryBuilder.order).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should return empty array when no active warehouses exist', async () => {
      setSupabaseMockData('warehouses', [])

      const result = await getActiveWarehouses('org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('warehouses', null, { message: 'Database error' })

      await expect(getActiveWarehouses('org_test123'))
        .rejects.toThrow('Failed to fetch active warehouses: Database error')
    })
  })

  describe('getDefaultWarehouse', () => {
    it('should fetch the default warehouse', async () => {
      const defaultWarehouse = mockWarehouses.find(w => w.is_default)
      const queryBuilder = setSupabaseMockData('warehouses', defaultWarehouse)

      const result = await getDefaultWarehouse('org_test123')

      expect(result).toEqual(defaultWarehouse)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', 'org_test123')
      expect(queryBuilder.eq).toHaveBeenCalledWith('is_default', true)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should return null when no default warehouse exists (PGRST116)', async () => {
      setSupabaseMockData('warehouses', null, { code: 'PGRST116' })

      const result = await getDefaultWarehouse('org_test123')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('warehouses', null, { message: 'Database error' })

      await expect(getDefaultWarehouse('org_test123'))
        .rejects.toThrow('Failed to fetch default warehouse: Database error')
    })
  })
})