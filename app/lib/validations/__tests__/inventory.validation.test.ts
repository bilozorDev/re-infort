import { describe, expect, it } from 'vitest'

import {
  inventoryAdjustmentSchema,
  inventoryTransferSchema,
  releaseReservationSchema,
  reserveInventorySchema,
  stockMovementFilterSchema,
} from '../inventory'

describe('Inventory Validation Schemas', () => {
  describe('inventoryAdjustmentSchema', () => {
    it('should validate a valid inventory adjustment', () => {
      const validAdjustment = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity_change: 10,
        movement_type: 'adjustment' as const,
        reason: 'Stock count correction',
        reference_number: 'ADJ-001',
        reference_type: 'manual',
      }

      const result = inventoryAdjustmentSchema.safeParse(validAdjustment)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const minimalAdjustment = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity_change: -5,
        movement_type: 'damage' as const,
      }

      const result = inventoryAdjustmentSchema.safeParse(minimalAdjustment)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      const invalidAdjustment = {
        product_id: 'invalid-uuid',
        warehouse_id: 'invalid-uuid',
        quantity_change: 10,
        movement_type: 'adjustment' as const,
      }

      const result = inventoryAdjustmentSchema.safeParse(invalidAdjustment)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['product_id'],
              message: 'Valid product ID is required',
            }),
            expect.objectContaining({ 
              path: ['warehouse_id'],
              message: 'Valid warehouse ID is required',
            }),
          ])
        )
      }
    })

    it('should reject non-integer quantity', () => {
      const invalidAdjustment = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity_change: 10.5,
        movement_type: 'adjustment' as const,
      }

      const result = inventoryAdjustmentSchema.safeParse(invalidAdjustment)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['quantity_change'],
              message: 'Quantity must be a whole number',
            }),
          ])
        )
      }
    })

    it('should reject invalid movement type', () => {
      const invalidAdjustment = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity_change: 10,
        movement_type: 'invalid-type',
      }

      const result = inventoryAdjustmentSchema.safeParse(invalidAdjustment)
      expect(result.success).toBe(false)
    })
  })

  describe('inventoryTransferSchema', () => {
    it('should validate a valid inventory transfer', () => {
      const validTransfer = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        quantity: 5,
        reason: 'Stock balancing',
        notes: 'Transfer to high-demand location',
      }

      const result = inventoryTransferSchema.safeParse(validTransfer)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const minimalTransfer = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        quantity: 1,
      }

      const result = inventoryTransferSchema.safeParse(minimalTransfer)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      const invalidTransfer = {
        product_id: 'invalid-uuid',
        from_warehouse_id: 'invalid-uuid',
        to_warehouse_id: 'invalid-uuid',
        quantity: 5,
      }

      const result = inventoryTransferSchema.safeParse(invalidTransfer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['product_id'],
              message: 'Valid product ID is required',
            }),
            expect.objectContaining({ 
              path: ['from_warehouse_id'],
              message: 'Valid source warehouse ID is required',
            }),
            expect.objectContaining({ 
              path: ['to_warehouse_id'],
              message: 'Valid destination warehouse ID is required',
            }),
          ])
        )
      }
    })

    it('should reject zero or negative quantity', () => {
      const invalidTransfer = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        quantity: 0,
      }

      const result = inventoryTransferSchema.safeParse(invalidTransfer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['quantity'],
              message: 'Quantity must be a positive whole number',
            }),
          ])
        )
      }
    })

    it('should reject non-integer quantity', () => {
      const invalidTransfer = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        from_warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        to_warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
        quantity: 5.5,
      }

      const result = inventoryTransferSchema.safeParse(invalidTransfer)
      expect(result.success).toBe(false)
    })
  })

  describe('reserveInventorySchema', () => {
    it('should validate a valid reservation', () => {
      const validReservation = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 3,
        reference_number: 'SO-001',
      }

      const result = reserveInventorySchema.safeParse(validReservation)
      expect(result.success).toBe(true)
    })

    it('should validate without reference number', () => {
      const validReservation = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 3,
      }

      const result = reserveInventorySchema.safeParse(validReservation)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      const invalidReservation = {
        product_id: 'invalid-uuid',
        warehouse_id: 'invalid-uuid',
        quantity: 3,
      }

      const result = reserveInventorySchema.safeParse(invalidReservation)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['product_id'],
              message: 'Valid product ID is required',
            }),
            expect.objectContaining({ 
              path: ['warehouse_id'],
              message: 'Valid warehouse ID is required',
            }),
          ])
        )
      }
    })

    it('should reject zero or negative quantity', () => {
      const invalidReservation = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity: -1,
      }

      const result = reserveInventorySchema.safeParse(invalidReservation)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['quantity'],
              message: 'Quantity must be a positive whole number',
            }),
          ])
        )
      }
    })
  })

  describe('releaseReservationSchema', () => {
    it('should validate a valid reservation release', () => {
      const validRelease = {
        product_id: '123e4567-e89b-12d3-a456-426614174000',
        warehouse_id: '123e4567-e89b-12d3-a456-426614174001',
        quantity: 2,
      }

      const result = releaseReservationSchema.safeParse(validRelease)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      const invalidRelease = {
        product_id: 'invalid-uuid',
        warehouse_id: 'invalid-uuid',
        quantity: 2,
      }

      const result = releaseReservationSchema.safeParse(invalidRelease)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['product_id'],
              message: 'Valid product ID is required',
            }),
            expect.objectContaining({ 
              path: ['warehouse_id'],
              message: 'Valid warehouse ID is required',
            }),
          ])
        )
      }
    })
  })

  describe('stockMovementFilterSchema', () => {
    it('should validate valid filters', () => {
      const validFilters = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        warehouseId: '123e4567-e89b-12d3-a456-426614174001',
        movementType: 'sale' as const,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      }

      const result = stockMovementFilterSchema.safeParse(validFilters)
      expect(result.success).toBe(true)
    })

    it('should validate with no filters', () => {
      const result = stockMovementFilterSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate with partial filters', () => {
      const partialFilters = {
        movementType: 'transfer' as const,
        startDate: '2024-01-01T00:00:00Z',
      }

      const result = stockMovementFilterSchema.safeParse(partialFilters)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUIDs', () => {
      const invalidFilters = {
        productId: 'invalid-uuid',
        warehouseId: 'invalid-uuid',
      }

      const result = stockMovementFilterSchema.safeParse(invalidFilters)
      expect(result.success).toBe(false)
    })

    it('should reject invalid movement type', () => {
      const invalidFilters = {
        movementType: 'invalid-type',
      }

      const result = stockMovementFilterSchema.safeParse(invalidFilters)
      expect(result.success).toBe(false)
    })

    it('should reject invalid datetime format', () => {
      const invalidFilters = {
        startDate: 'invalid-date',
        endDate: '2024-01-31',
      }

      const result = stockMovementFilterSchema.safeParse(invalidFilters)
      expect(result.success).toBe(false)
    })
  })
})