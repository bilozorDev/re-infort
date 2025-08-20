import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockFeatureDefinition, mockFeatureDefinitions } from '@/test/fixtures/features'
import { createClientMock, resetSupabaseMocks, setSupabaseMockData } from '@/test/mocks/supabase'

import {
  createFeatureDefinition,
  deleteFeatureDefinition,
  getFeatureDefinitionById,
  getFeatureDefinitions,
  reorderFeatureDefinitions,
  updateFeatureDefinition,
} from '../feature-definition.service'

// Mock the Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

describe('Feature Definition Service', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    vi.clearAllMocks()
  })

  describe('getFeatureDefinitions', () => {
    it('should fetch all feature definitions for an organization', async () => {
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('feature_definitions', mockFeatureDefinitions)

      const result = await getFeatureDefinitions(orgId)

      expect(result).toEqual(mockFeatureDefinitions)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true })
    })

    it('should filter by category when categoryId provided', async () => {
      const orgId = 'org_test123'
      const categoryId = 'cat-1'
      const filteredFeatures = mockFeatureDefinitions.filter(
        f => f.category_id === categoryId && f.subcategory_id === null
      )
      const queryBuilder = setSupabaseMockData('feature_definitions', filteredFeatures)

      const result = await getFeatureDefinitions(orgId, categoryId)

      expect(result).toEqual(filteredFeatures)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('category_id', categoryId)
      expect(queryBuilder.is).toHaveBeenCalledWith('subcategory_id', null)
      expect(queryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true })
    })

    it('should filter by subcategory when subcategoryId provided', async () => {
      const orgId = 'org_test123'
      const categoryId = 'cat-1'
      const subcategoryId = 'subcat-1'
      const filteredFeatures = mockFeatureDefinitions.filter(
        f => f.subcategory_id === subcategoryId
      )
      const queryBuilder = setSupabaseMockData('feature_definitions', filteredFeatures)

      const result = await getFeatureDefinitions(orgId, categoryId, subcategoryId)

      expect(result).toEqual(filteredFeatures)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('subcategory_id', subcategoryId)
      expect(queryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true })
    })

    it('should return empty array when no features exist', async () => {
      setSupabaseMockData('feature_definitions', [])

      const result = await getFeatureDefinitions('org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('feature_definitions', null, { message: 'Database error' })

      await expect(getFeatureDefinitions('org_test123'))
        .rejects.toThrow('Failed to fetch feature definitions')
    })
  })

  describe('getFeatureDefinitionById', () => {
    it('should fetch a feature definition by id', async () => {
      const feature = mockFeatureDefinitions[0]
      const queryBuilder = setSupabaseMockData('feature_definitions', feature)

      const result = await getFeatureDefinitionById(feature.id, feature.organization_clerk_id)

      expect(result).toEqual(feature)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', feature.id)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', feature.organization_clerk_id)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should return null when feature definition not found (PGRST116)', async () => {
      setSupabaseMockData('feature_definitions', null, { code: 'PGRST116' })

      const result = await getFeatureDefinitionById('non-existent', 'org_test123')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('feature_definitions', null, { message: 'Database error' })

      await expect(getFeatureDefinitionById('feature-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch feature definition')
    })
  })

  describe('createFeatureDefinition', () => {
    it('should create a new feature definition with category', async () => {
      const input = {
        category_id: 'cat-1',
        name: 'New Feature',
        input_type: 'text' as const,
        is_required: true,
        display_order: 1,
      }
      const orgId = 'org_test123'
      const userId = 'user_test'
      const createdFeature = createMockFeatureDefinition({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })

      const queryBuilder = setSupabaseMockData('feature_definitions', createdFeature)

      const result = await createFeatureDefinition(input, orgId, userId)

      expect(result).toEqual(createdFeature)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
        display_order: 1,
        is_required: true,
      })
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should create a new feature definition with subcategory', async () => {
      const input = {
        subcategory_id: 'subcat-1',
        name: 'New Feature',
        input_type: 'select' as const,
        options: ['Option 1', 'Option 2'],
      }
      const orgId = 'org_test123'
      const userId = 'user_test'
      const createdFeature = createMockFeatureDefinition({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
        display_order: 0,
        is_required: false,
      })

      const queryBuilder = setSupabaseMockData('feature_definitions', createdFeature)

      const result = await createFeatureDefinition(input, orgId, userId)

      expect(result).toEqual(createdFeature)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
        display_order: 0,
        is_required: false,
      })
    })

    it('should throw error when neither category_id nor subcategory_id provided', async () => {
      const input = {
        name: 'Invalid Feature',
        input_type: 'text' as const,
      }

      await expect(createFeatureDefinition(input, 'org_test123', 'user_test'))
        .rejects.toThrow('Either category_id or subcategory_id must be provided')
    })

    it('should handle duplicate feature names', async () => {
      const input = {
        category_id: 'cat-1',
        name: 'Duplicate Feature',
        input_type: 'text' as const,
      }

      setSupabaseMockData('feature_definitions', null, { code: '23505' })

      await expect(createFeatureDefinition(input, 'org_test123', 'user_test'))
        .rejects.toThrow('A feature with this name already exists for this category/subcategory')
    })

    it('should throw generic error for other database errors', async () => {
      const input = {
        category_id: 'cat-1',
        name: 'New Feature',
        input_type: 'text' as const,
      }

      setSupabaseMockData('feature_definitions', null, { message: 'Database error' })

      await expect(createFeatureDefinition(input, 'org_test123', 'user_test'))
        .rejects.toThrow('Failed to create feature definition')
    })
  })

  describe('updateFeatureDefinition', () => {
    it('should update an existing feature definition', async () => {
      const featureId = 'feature-1'
      const updates = {
        name: 'Updated Feature',
        input_type: 'number' as const,
        unit: 'units',
        is_required: false,
      }
      const orgId = 'org_test123'
      const updatedFeature = createMockFeatureDefinition({ 
        id: featureId, 
        ...updates,
        organization_clerk_id: orgId,
      })

      const queryBuilder = setSupabaseMockData('feature_definitions', updatedFeature)

      const result = await updateFeatureDefinition(featureId, updates, orgId)

      expect(result).toEqual(updatedFeature)
      expect(queryBuilder.update).toHaveBeenCalledWith(updates)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', featureId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle duplicate names on update', async () => {
      const updates = {
        name: 'Duplicate Name',
      }

      setSupabaseMockData('feature_definitions', null, { code: '23505' })

      await expect(updateFeatureDefinition('feature-1', updates, 'org_test123'))
        .rejects.toThrow('A feature with this name already exists for this category/subcategory')
    })

    it('should throw generic error for other database errors', async () => {
      const updates = {
        name: 'Updated Name',
      }

      setSupabaseMockData('feature_definitions', null, { message: 'Database error' })

      await expect(updateFeatureDefinition('feature-1', updates, 'org_test123'))
        .rejects.toThrow('Failed to update feature definition')
    })
  })

  describe('deleteFeatureDefinition', () => {
    it('should delete a feature definition', async () => {
      const featureId = 'feature-1'
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('feature_definitions', null)

      await deleteFeatureDefinition(featureId, orgId)

      expect(queryBuilder.delete).toHaveBeenCalled()
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', featureId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
    })

    it('should throw error when deletion fails', async () => {
      setSupabaseMockData('feature_definitions', null, { message: 'Database error' })

      await expect(deleteFeatureDefinition('feature-1', 'org_test123'))
        .rejects.toThrow('Failed to delete feature definition')
    })
  })

  describe('reorderFeatureDefinitions', () => {
    it('should reorder feature definitions by updating display_order', async () => {
      const featureIds = ['feature-1', 'feature-2', 'feature-3']
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('feature_definitions', null)

      await reorderFeatureDefinitions(featureIds, orgId)

      // Should update each feature's display_order
      expect(queryBuilder.update).toHaveBeenCalledTimes(3)
      expect(queryBuilder.update).toHaveBeenCalledWith({ display_order: 0 })
      expect(queryBuilder.update).toHaveBeenCalledWith({ display_order: 1 })
      expect(queryBuilder.update).toHaveBeenCalledWith({ display_order: 2 })
      
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'feature-1')
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'feature-2')
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'feature-3')
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
    })

    it('should handle empty feature ids array', async () => {
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('feature_definitions', null)

      await reorderFeatureDefinitions([], orgId)

      expect(queryBuilder.update).not.toHaveBeenCalled()
    })

    it('should throw error when reordering fails', async () => {
      const featureIds = ['feature-1']
      setSupabaseMockData('feature_definitions', null, { message: 'Database error' })

      await expect(reorderFeatureDefinitions(featureIds, 'org_test123'))
        .rejects.toThrow('Failed to reorder feature definitions')
    })
  })
})