import { describe, expect, it } from 'vitest'

import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseStatusEnum,
  warehouseTypeEnum,
} from '../warehouse'

describe('Warehouse Validation Schemas', () => {
  describe('warehouseTypeEnum', () => {
    it('should accept valid warehouse types', () => {
      expect(warehouseTypeEnum.safeParse('office').success).toBe(true)
      expect(warehouseTypeEnum.safeParse('vehicle').success).toBe(true)
      expect(warehouseTypeEnum.safeParse('other').success).toBe(true)
    })

    it('should reject invalid warehouse types', () => {
      expect(warehouseTypeEnum.safeParse('invalid').success).toBe(false)
      expect(warehouseTypeEnum.safeParse('warehouse').success).toBe(false)
    })
  })

  describe('warehouseStatusEnum', () => {
    it('should accept valid warehouse statuses', () => {
      expect(warehouseStatusEnum.safeParse('active').success).toBe(true)
      expect(warehouseStatusEnum.safeParse('inactive').success).toBe(true)
    })

    it('should reject invalid warehouse statuses', () => {
      expect(warehouseStatusEnum.safeParse('archived').success).toBe(false)
      expect(warehouseStatusEnum.safeParse('pending').success).toBe(false)
    })
  })

  describe('createWarehouseSchema', () => {
    it('should validate a valid warehouse', () => {
      const validWarehouse = {
        name: 'Main Warehouse',
        type: 'office' as const,
        status: 'active' as const,
        address: '123 Main Street',
        city: 'New York',
        state_province: 'NY',
        postal_code: '10001',
        country: 'USA',
        notes: 'Primary warehouse location',
        is_default: true,
      }

      const result = createWarehouseSchema.safeParse(validWarehouse)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const minimalWarehouse = {
        name: 'Basic Warehouse',
        type: 'other' as const,
        address: '456 Oak Street',
        city: 'Boston',
        state_province: 'MA',
        postal_code: '02101',
        country: 'USA',
      }

      const result = createWarehouseSchema.safeParse(minimalWarehouse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active') // default value
        expect(result.data.is_default).toBe(false) // default value
      }
    })

    it('should reject missing required fields', () => {
      const invalidWarehouse = {
        name: 'Incomplete Warehouse',
        type: 'office' as const,
        // Missing address, city, state_province, postal_code, country
      }

      const result = createWarehouseSchema.safeParse(invalidWarehouse)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['address'] }),
            expect.objectContaining({ path: ['city'] }),
            expect.objectContaining({ path: ['state_province'] }),
            expect.objectContaining({ path: ['postal_code'] }),
            expect.objectContaining({ path: ['country'] }),
          ])
        )
      }
    })

    it('should reject empty required fields', () => {
      const invalidWarehouse = {
        name: '',
        type: 'office' as const,
        address: '',
        city: '',
        state_province: '',
        postal_code: '',
        country: '',
      }

      const result = createWarehouseSchema.safeParse(invalidWarehouse)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['name'],
              message: 'Warehouse name is required',
            }),
            expect.objectContaining({ 
              path: ['address'],
              message: 'Address is required',
            }),
            expect.objectContaining({ 
              path: ['city'],
              message: 'City is required',
            }),
            expect.objectContaining({ 
              path: ['state_province'],
              message: 'State/Province is required',
            }),
            expect.objectContaining({ 
              path: ['postal_code'],
              message: 'Postal code is required',
            }),
            expect.objectContaining({ 
              path: ['country'],
              message: 'Country is required',
            }),
          ])
        )
      }
    })

    it('should reject fields that are too long', () => {
      const invalidWarehouse = {
        name: 'A'.repeat(101), // 101 characters, max is 100
        type: 'office' as const,
        address: 'B'.repeat(201), // 201 characters, max is 200
        city: 'C'.repeat(101), // 101 characters, max is 100
        state_province: 'D'.repeat(101), // 101 characters, max is 100
        postal_code: 'E'.repeat(21), // 21 characters, max is 20
        country: 'F'.repeat(101), // 101 characters, max is 100
        notes: 'G'.repeat(501), // 501 characters, max is 500
      }

      const result = createWarehouseSchema.safeParse(invalidWarehouse)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
        // Check that all the overly long fields are flagged
        const paths = result.error.issues.map(issue => issue.path[0])
        expect(paths).toEqual(
          expect.arrayContaining([
            'name', 'address', 'city', 'state_province', 'postal_code', 'country', 'notes'
          ])
        )
      }
    })

    it('should reject invalid warehouse type', () => {
      const invalidWarehouse = {
        name: 'Test Warehouse',
        type: 'invalid-type',
        address: '123 Test Street',
        city: 'Test City',
        state_province: 'TS',
        postal_code: '12345',
        country: 'USA',
      }

      const result = createWarehouseSchema.safeParse(invalidWarehouse)
      expect(result.success).toBe(false)
    })

    it('should reject invalid warehouse status', () => {
      const invalidWarehouse = {
        name: 'Test Warehouse',
        type: 'office' as const,
        status: 'invalid-status',
        address: '123 Test Street',
        city: 'Test City',
        state_province: 'TS',
        postal_code: '12345',
        country: 'USA',
      }

      const result = createWarehouseSchema.safeParse(invalidWarehouse)
      expect(result.success).toBe(false)
    })

    it('should allow null notes', () => {
      const warehouseWithNullNotes = {
        name: 'Test Warehouse',
        type: 'office' as const,
        address: '123 Test Street',
        city: 'Test City',
        state_province: 'TS',
        postal_code: '12345',
        country: 'USA',
        notes: null,
      }

      const result = createWarehouseSchema.safeParse(warehouseWithNullNotes)
      expect(result.success).toBe(true)
    })
  })

  describe('updateWarehouseSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Warehouse Name',
        status: 'inactive' as const,
        notes: 'Updated notes',
      }

      const result = updateWarehouseSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateWarehouseSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should validate partial fields with same constraints', () => {
      const invalidPartialUpdate = {
        name: '', // Empty name should still be invalid
        notes: 'X'.repeat(501), // Still too long
      }

      const result = updateWarehouseSchema.safeParse(invalidPartialUpdate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['name'] }),
            expect.objectContaining({ path: ['notes'] }),
          ])
        )
      }
    })

    it('should allow updating just the default flag', () => {
      const defaultUpdate = {
        is_default: true,
      }

      const result = updateWarehouseSchema.safeParse(defaultUpdate)
      expect(result.success).toBe(true)
    })

    it('should allow updating address fields individually', () => {
      const addressUpdate = {
        address: '456 New Street',
        city: 'Different City',
      }

      const result = updateWarehouseSchema.safeParse(addressUpdate)
      expect(result.success).toBe(true)
    })
  })
})