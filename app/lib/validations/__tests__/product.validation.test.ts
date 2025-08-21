import { describe, expect, it } from 'vitest'

import {
  createCategorySchema,
  createFeatureDefinitionSchema,
  createProductFeatureSchema,
  createProductSchema,
  createSubcategorySchema,
  updateProductSchema,
} from '../product'

describe('Product Validation Schemas', () => {
  describe('createProductSchema', () => {
    it('should validate a valid product', () => {
      const validProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        description: 'A test product',
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        subcategory_id: '123e4567-e89b-12d3-a456-426614174001',
        cost: 50.00,
        price: 100.00,
        photo_urls: ['https://example.com/photo1.jpg'],
        link: 'https://example.com/product',
        serial_number: 'SN123456',
        status: 'active' as const,
      }

      const result = createProductSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })

    it('should validate minimal required fields', () => {
      const minimalProduct = {
        name: 'Minimal Product',
        sku: 'MIN-001',
      }

      const result = createProductSchema.safeParse(minimalProduct)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active') // default value
      }
    })

    it('should reject missing required fields', () => {
      const invalidProduct = {
        description: 'Missing name and SKU',
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['name'] }),
            expect.objectContaining({ path: ['sku'] }),
          ])
        )
      }
    })

    it('should reject empty name and SKU', () => {
      const invalidProduct = {
        name: '',
        sku: '',
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['name'],
              message: 'Product name is required',
            }),
            expect.objectContaining({ 
              path: ['sku'],
              message: 'SKU is required',
            }),
          ])
        )
      }
    })

    it('should reject negative cost and price', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        cost: -10,
        price: -20,
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['cost'],
              message: 'Cost must be non-negative',
            }),
            expect.objectContaining({ 
              path: ['price'],
              message: 'Price must be non-negative',
            }),
          ])
        )
      }
    })

    it('should reject invalid UUID for category_id', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        category_id: 'invalid-uuid',
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['category_id'] }),
          ])
        )
      }
    })

    it('should reject invalid URL for link', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        link: 'not-a-url',
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['link'] }),
          ])
        )
      }
    })

    it('should reject too many photo URLs', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        photo_urls: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
          'https://example.com/4.jpg',
          'https://example.com/5.jpg',
          'https://example.com/6.jpg', // 6 photos, max is 5
        ],
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['photo_urls'],
              message: 'Maximum 5 photos allowed',
            }),
          ])
        )
      }
    })

    it('should reject invalid status', () => {
      const invalidProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        status: 'invalid-status',
      }

      const result = createProductSchema.safeParse(invalidProduct)
      expect(result.success).toBe(false)
    })
  })

  describe('updateProductSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
        price: 150.00,
      }

      const result = updateProductSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('should allow empty object', () => {
      const result = updateProductSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })

  describe('createCategorySchema', () => {
    it('should validate a valid category', () => {
      const validCategory = {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        status: 'active' as const,
        display_order: 1,
      }

      const result = createCategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('should use default values', () => {
      const minimalCategory = {
        name: 'Minimal Category',
      }

      const result = createCategorySchema.safeParse(minimalCategory)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
        expect(result.data.display_order).toBe(0)
      }
    })

    it('should reject empty name', () => {
      const invalidCategory = {
        name: '',
      }

      const result = createCategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['name'],
              message: 'Category name is required',
            }),
          ])
        )
      }
    })

    it('should reject negative display_order', () => {
      const invalidCategory = {
        name: 'Test Category',
        display_order: -1,
      }

      const result = createCategorySchema.safeParse(invalidCategory)
      expect(result.success).toBe(false)
    })
  })

  describe('createSubcategorySchema', () => {
    it('should validate a valid subcategory', () => {
      const validSubcategory = {
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Laptops',
        description: 'Portable computers',
        status: 'active' as const,
        display_order: 1,
      }

      const result = createSubcategorySchema.safeParse(validSubcategory)
      expect(result.success).toBe(true)
    })

    it('should require valid category_id', () => {
      const invalidSubcategory = {
        category_id: 'invalid-uuid',
        name: 'Laptops',
      }

      const result = createSubcategorySchema.safeParse(invalidSubcategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['category_id'],
              message: 'Valid category ID is required',
            }),
          ])
        )
      }
    })

    it('should require name', () => {
      const invalidSubcategory = {
        category_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      const result = createSubcategorySchema.safeParse(invalidSubcategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['name'] }),
          ])
        )
      }
    })
  })

  describe('createFeatureDefinitionSchema', () => {
    it('should validate a valid feature definition', () => {
      const validFeature = {
        category_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Screen Size',
        input_type: 'number' as const,
        unit: 'inches',
        is_required: true,
        display_order: 1,
      }

      const result = createFeatureDefinitionSchema.safeParse(validFeature)
      expect(result.success).toBe(true)
    })

    it('should validate select type with options', () => {
      const validFeature = {
        name: 'Color',
        input_type: 'select' as const,
        options: ['Red', 'Blue', 'Green'],
      }

      const result = createFeatureDefinitionSchema.safeParse(validFeature)
      expect(result.success).toBe(true)
    })

    it('should use default values', () => {
      const minimalFeature = {
        name: 'Test Feature',
        input_type: 'text' as const,
      }

      const result = createFeatureDefinitionSchema.safeParse(minimalFeature)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.is_required).toBe(false)
        expect(result.data.display_order).toBe(0)
      }
    })
  })

  describe('createProductFeatureSchema', () => {
    it('should validate a valid product feature', () => {
      const validFeature = {
        feature_definition_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Screen Size',
        value: '15.6',
        is_custom: false,
      }

      const result = createProductFeatureSchema.safeParse(validFeature)
      expect(result.success).toBe(true)
    })

    it('should require name and value', () => {
      const invalidFeature = {}

      const result = createProductFeatureSchema.safeParse(invalidFeature)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ['name'] }),
            expect.objectContaining({ path: ['value'] }),
          ])
        )
      }
    })

    it('should reject empty value', () => {
      const invalidFeature = {
        name: 'Test Feature',
        value: '',
      }

      const result = createProductFeatureSchema.safeParse(invalidFeature)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ 
              path: ['value'],
              message: 'Feature value is required',
            }),
          ])
        )
      }
    })
  })
})