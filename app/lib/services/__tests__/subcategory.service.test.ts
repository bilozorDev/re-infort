import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createMockSubcategory, mockSubcategories } from '@/test/fixtures/categories'
import { createClientMock, resetSupabaseMocks, setSupabaseMockData } from '@/test/mocks/supabase'

import {
  createSubcategory,
  getSubcategories,
  getSubcategoryById,
  updateSubcategory,
} from '../subcategory.service'

// Mock the Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

describe('Subcategory Service', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    vi.clearAllMocks()
  })

  describe('getSubcategories', () => {
    it('should fetch all subcategories for an organization', async () => {
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('subcategories', mockSubcategories)

      const result = await getSubcategories(orgId)

      expect(result).toEqual(mockSubcategories)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true })
    })

    it('should filter by category when categoryId provided', async () => {
      const orgId = 'org_test123'
      const categoryId = 'cat-1'
      const filteredSubcategories = mockSubcategories.filter(sub => sub.category_id === categoryId)
      const queryBuilder = setSupabaseMockData('subcategories', filteredSubcategories)

      const result = await getSubcategories(orgId, categoryId)

      expect(result).toEqual(filteredSubcategories)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('category_id', categoryId)
      expect(queryBuilder.order).toHaveBeenCalledWith('display_order', { ascending: true })
    })

    it('should return empty array when no subcategories exist', async () => {
      setSupabaseMockData('subcategories', [])

      const result = await getSubcategories('org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('subcategories', null, { message: 'Database error' })

      await expect(getSubcategories('org_test123'))
        .rejects.toThrow('Failed to fetch subcategories')
    })
  })

  describe('getSubcategoryById', () => {
    it('should fetch a subcategory by id', async () => {
      const subcategory = mockSubcategories[0]
      const queryBuilder = setSupabaseMockData('subcategories', subcategory)

      const result = await getSubcategoryById(subcategory.id, subcategory.organization_clerk_id)

      expect(result).toEqual(subcategory)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', subcategory.id)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', subcategory.organization_clerk_id)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should return null when subcategory not found (PGRST116)', async () => {
      setSupabaseMockData('subcategories', null, { code: 'PGRST116' })

      const result = await getSubcategoryById('non-existent', 'org_test123')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('subcategories', null, { message: 'Database error' })

      await expect(getSubcategoryById('subcategory-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch subcategory')
    })
  })

  describe('createSubcategory', () => {
    it('should create a new subcategory', async () => {
      const input = {
        name: 'New Subcategory',
        description: 'A test subcategory',
        category_id: 'cat-1',
        display_order: 1,
      }
      const orgId = 'org_test123'
      const userId = 'user_test'
      const createdSubcategory = createMockSubcategory({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })

      const queryBuilder = setSupabaseMockData('subcategories', createdSubcategory)

      const result = await createSubcategory(input, orgId, userId)

      expect(result).toEqual(createdSubcategory)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle duplicate subcategory names', async () => {
      const input = {
        name: 'Duplicate Subcategory',
        category_id: 'cat-1',
        display_order: 1,
      }

      setSupabaseMockData('subcategories', null, { code: '23505' })

      await expect(createSubcategory(input, 'org_test123', 'user_test'))
        .rejects.toThrow('A subcategory with this name already exists in this category')
    })

    it('should throw generic error for other database errors', async () => {
      const input = {
        name: 'New Subcategory',
        category_id: 'cat-1',
        display_order: 1,
      }

      setSupabaseMockData('subcategories', null, { message: 'Database error' })

      await expect(createSubcategory(input, 'org_test123', 'user_test'))
        .rejects.toThrow('Failed to create subcategory')
    })
  })

  describe('updateSubcategory', () => {
    it('should update an existing subcategory', async () => {
      const subcategoryId = 'subcategory-1'
      const updates = {
        name: 'Updated Subcategory',
        description: 'Updated description',
      }
      const orgId = 'org_test123'
      const updatedSubcategory = createMockSubcategory({ 
        id: subcategoryId, 
        ...updates,
        organization_clerk_id: orgId,
      })

      const queryBuilder = setSupabaseMockData('subcategories', updatedSubcategory)

      const result = await updateSubcategory(subcategoryId, updates, orgId)

      expect(result).toEqual(updatedSubcategory)
      expect(queryBuilder.update).toHaveBeenCalledWith(updates)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', subcategoryId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle duplicate names on update', async () => {
      const updates = {
        name: 'Duplicate Name',
      }

      setSupabaseMockData('subcategories', null, { code: '23505' })

      await expect(updateSubcategory('subcategory-1', updates, 'org_test123'))
        .rejects.toThrow('A subcategory with this name already exists in this category')
    })

    it('should throw generic error for other database errors', async () => {
      const updates = {
        name: 'Updated Name',
      }

      setSupabaseMockData('subcategories', null, { message: 'Database error' })

      await expect(updateSubcategory('subcategory-1', updates, 'org_test123'))
        .rejects.toThrow('Failed to update subcategory')
    })
  })

  // Note: deleteSubcategory tests are complex due to count query mocking
  // Skipping for now to focus on coverage of other functions
})