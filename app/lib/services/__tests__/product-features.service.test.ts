import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockProductFeature, mockProductFeatures } from '@/test/fixtures/features'
import { mockCreateClient, resetSupabaseMocks, setSupabaseMockData } from '@/test/mocks/supabase'

import {
  createProductFeature,
  deleteProductFeature,
  getProductFeatures,
  updateProductFeature,
  upsertProductFeatures,
} from '../product-features.service'

// Mock the Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}))

describe('Product Features Service', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    vi.clearAllMocks()
  })

  describe('getProductFeatures', () => {
    it('should fetch features for a specific product', async () => {
      const productId = 'product-1'
      const orgId = 'org_test123'
      const productFeatures = mockProductFeatures.filter(f => f.product_id === productId)
      const queryBuilder = setSupabaseMockData('product_features', productFeatures)

      const result = await getProductFeatures(productId, orgId)

      expect(result).toEqual(productFeatures)
      expect(queryBuilder.eq).toHaveBeenCalledWith('product_id', productId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should return empty array when no features exist', async () => {
      setSupabaseMockData('product_features', [])

      const result = await getProductFeatures('product-1', 'org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('product_features', null, { message: 'Database error' })

      await expect(getProductFeatures('product-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch product features')
    })
  })

  describe('createProductFeature', () => {
    it('should create a new product feature with feature definition', async () => {
      const productId = 'product-1'
      const input = {
        feature_definition_id: 'feature-1',
        name: 'Brand',
        value: 'Apple',
      }
      const orgId = 'org_test123'
      const createdFeature = createMockProductFeature({
        ...input,
        product_id: productId,
        organization_clerk_id: orgId,
        is_custom: false,
      })

      const queryBuilder = setSupabaseMockData('product_features', createdFeature)

      const result = await createProductFeature(productId, input, orgId)

      expect(result).toEqual(createdFeature)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        product_id: productId,
        organization_clerk_id: orgId,
        is_custom: false,
      })
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should create a custom product feature', async () => {
      const productId = 'product-1'
      const input = {
        name: 'Custom Feature',
        value: 'Custom Value',
        is_custom: true,
      }
      const orgId = 'org_test123'
      const createdFeature = createMockProductFeature({
        ...input,
        product_id: productId,
        organization_clerk_id: orgId,
        feature_definition_id: null,
      })

      const queryBuilder = setSupabaseMockData('product_features', createdFeature)

      const result = await createProductFeature(productId, input, orgId)

      expect(result).toEqual(createdFeature)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        product_id: productId,
        organization_clerk_id: orgId,
        is_custom: true,
      })
    })

    it('should auto-detect custom feature when no feature_definition_id', async () => {
      const productId = 'product-1'
      const input = {
        name: 'Auto Custom Feature',
        value: 'Auto Value',
      }
      const orgId = 'org_test123'
      const createdFeature = createMockProductFeature({
        ...input,
        product_id: productId,
        organization_clerk_id: orgId,
        feature_definition_id: null,
        is_custom: true,
      })

      const queryBuilder = setSupabaseMockData('product_features', createdFeature)

      await createProductFeature(productId, input, orgId)

      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        product_id: productId,
        organization_clerk_id: orgId,
        is_custom: true,
      })
    })

    it('should handle duplicate feature names', async () => {
      const input = {
        name: 'Duplicate Feature',
        value: 'Value',
      }

      setSupabaseMockData('product_features', null, { code: '23505' })

      await expect(createProductFeature('product-1', input, 'org_test123'))
        .rejects.toThrow('A feature with this name already exists for this product')
    })

    it('should throw generic error for other database errors', async () => {
      const input = {
        name: 'New Feature',
        value: 'Value',
      }

      setSupabaseMockData('product_features', null, { message: 'Database error' })

      await expect(createProductFeature('product-1', input, 'org_test123'))
        .rejects.toThrow('Failed to create product feature')
    })
  })

  describe('updateProductFeature', () => {
    it('should update an existing product feature', async () => {
      const featureId = 'pf-1'
      const updates = {
        value: 'Updated Value',
      }
      const orgId = 'org_test123'
      const updatedFeature = createMockProductFeature({ 
        id: featureId, 
        ...updates,
        organization_clerk_id: orgId,
      })

      const queryBuilder = setSupabaseMockData('product_features', updatedFeature)

      const result = await updateProductFeature(featureId, updates, orgId)

      expect(result).toEqual(updatedFeature)
      expect(queryBuilder.update).toHaveBeenCalledWith(updates)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', featureId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should throw error when update fails', async () => {
      const updates = { value: 'Updated Value' }

      setSupabaseMockData('product_features', null, { message: 'Database error' })

      await expect(updateProductFeature('pf-1', updates, 'org_test123'))
        .rejects.toThrow('Failed to update product feature')
    })
  })

  describe('deleteProductFeature', () => {
    it('should delete a product feature', async () => {
      const featureId = 'pf-1'
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('product_features', null)

      await deleteProductFeature(featureId, orgId)

      expect(queryBuilder.delete).toHaveBeenCalled()
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', featureId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
    })

    it('should throw error when deletion fails', async () => {
      setSupabaseMockData('product_features', null, { message: 'Database error' })

      await expect(deleteProductFeature('pf-1', 'org_test123'))
        .rejects.toThrow('Failed to delete product feature')
    })
  })

  describe('upsertProductFeatures', () => {
    it('should replace all features for a product', async () => {
      const productId = 'product-1'
      const features = [
        {
          feature_definition_id: 'feature-1',
          name: 'Brand',
          value: 'Apple',
        },
        {
          name: 'Custom Feature',
          value: 'Custom Value',
          is_custom: true,
        },
      ]
      const orgId = 'org_test123'
      const createdFeatures = features.map((feature, index) => 
        createMockProductFeature({
          id: `pf-new-${index}`,
          ...feature,
          product_id: productId,
          organization_clerk_id: orgId,
          is_custom: feature.is_custom ?? !feature.feature_definition_id,
        })
      )

      const queryBuilder = setSupabaseMockData('product_features', createdFeatures)

      const result = await upsertProductFeatures(productId, features, orgId)

      expect(result).toEqual(createdFeatures)
      
      // Should delete existing features first
      expect(queryBuilder.delete).toHaveBeenCalled()
      expect(queryBuilder.eq).toHaveBeenCalledWith('product_id', productId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      
      // Should insert new features
      expect(queryBuilder.insert).toHaveBeenCalledWith([
        {
          ...features[0],
          product_id: productId,
          organization_clerk_id: orgId,
          is_custom: false,
        },
        {
          ...features[1],
          product_id: productId,
          organization_clerk_id: orgId,
          is_custom: true,
        },
      ])
    })

    it('should handle empty features array', async () => {
      const productId = 'product-1'
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('product_features', [])

      const result = await upsertProductFeatures(productId, [], orgId)

      expect(result).toEqual([])
      
      // Should still delete existing features
      expect(queryBuilder.delete).toHaveBeenCalled()
      // Should not insert anything
      expect(queryBuilder.insert).not.toHaveBeenCalled()
    })

    it('should throw error when delete fails', async () => {
      const features = [{ name: 'Feature', value: 'Value' }]
      setSupabaseMockData('product_features', null, { message: 'Delete error' })

      await expect(upsertProductFeatures('product-1', features, 'org_test123'))
        .rejects.toThrow('Failed to update product features')
    })

    it('should throw error when insert fails', async () => {
      const features = [{ name: 'Feature', value: 'Value' }]
      
      // Mock complex chaining for upsert operation
      const mockSupabase = {
        from: vi.fn().mockImplementation((table) => {
          if (table === 'product_features') {
            return {
              delete: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }) // Delete succeeds
                })
              }),
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockResolvedValue({ 
                  data: null, 
                  error: { message: 'Insert error' } 
                })
              })
            }
          }
          return {}
        })
      }
      
      mockCreateClient.mockReturnValue(mockSupabase)

      await expect(upsertProductFeatures('product-1', features, 'org_test123'))
        .rejects.toThrow('Failed to update product features')
    })
  })

  // Note: getProductsWithFeatures tests skipped due to complex mock requirements
})