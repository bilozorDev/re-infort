import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isAdmin } from '@/app/utils/roles'
import {
  createMockCategory,
  createMockSubcategory,
  mockCategories,
  mockSubcategories,
} from '@/test/fixtures/categories'
import { createClientMock, resetSupabaseMocks, setSupabaseMockData } from '@/test/mocks/supabase'

import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  getActiveCategories,
  getAllCategories,
  getCategoryById,
  getSubcategoriesByCategory,
  updateCategory,
  updateSubcategory,
} from '../category.service'

// Mock the Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

// Mock the roles utility to avoid server-only module issues
vi.mock('@/app/utils/roles', () => ({
  isAdmin: vi.fn().mockResolvedValue(false),
  checkRole: vi.fn().mockResolvedValue(false),
  getCurrentUserRole: vi.fn().mockResolvedValue(undefined),
  getCurrentOrgId: vi.fn().mockResolvedValue('org_test123'),
  getCurrentUserId: vi.fn().mockResolvedValue('user_test'),
}))

describe('Category Service', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    vi.clearAllMocks()
  })

  describe('getAllCategories', () => {
    it('should fetch all categories for an organization', async () => {
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('categories', mockCategories)

      const result = await getAllCategories(orgId)

      expect(result).toEqual(mockCategories)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should return empty array when no categories exist', async () => {
      const orgId = 'org_test123'
      setSupabaseMockData('categories', [])

      const result = await getAllCategories(orgId)

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const orgId = 'org_test123'
      setSupabaseMockData('categories', null, { message: 'Database error' })

      await expect(getAllCategories(orgId)).rejects.toThrow('Failed to fetch categories')
    })
  })

  describe('getActiveCategories', () => {
    it('should fetch only active categories', async () => {
      const orgId = 'org_test123'
      const activeCategories = mockCategories.filter(c => c.status === 'active')
      const queryBuilder = setSupabaseMockData('categories', activeCategories)

      const result = await getActiveCategories(orgId)

      expect(result).toEqual(activeCategories)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  describe('getCategoryById', () => {
    it('should fetch a category by id', async () => {
      const category = mockCategories[0]
      const queryBuilder = setSupabaseMockData('categories', category)

      const result = await getCategoryById(category.id, category.organization_clerk_id)

      expect(result).toEqual(category)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', category.id)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', category.organization_clerk_id)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should return null when category not found', async () => {
      setSupabaseMockData('categories', null)

      const result = await getCategoryById('non-existent', 'org_test123')

      expect(result).toBeNull()
    })

    it('should throw error on database error', async () => {
      setSupabaseMockData('categories', null, { message: 'Database error' })

      await expect(getCategoryById('cat-1', 'org_test123')).rejects.toThrow('Failed to fetch category')
    })
  })

  describe('createCategory', () => {
    it('should create a new category', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)
      const newCategory = {
        name: 'New Category',
        description: 'Test description',
      }
      const orgId = 'org_test123'
      const userId = 'user_test'
      const createdCategory = createMockCategory({ ...newCategory, organization_clerk_id: orgId, created_by_clerk_user_id: userId })
      
      const queryBuilder = setSupabaseMockData('categories', createdCategory)

      const result = await createCategory(newCategory, orgId, userId)

      expect(result).toEqual(createdCategory)
      expect(queryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: newCategory.name,
          description: newCategory.description,
          organization_clerk_id: orgId,
          created_by_clerk_user_id: userId,
        })
      )
      expect(queryBuilder.select).toHaveBeenCalled()
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle duplicate category names', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)
      const newCategory = {
        name: 'Duplicate',
        description: 'Test',
      }
      setSupabaseMockData('categories', null, { 
        code: '23505', 
        message: 'duplicate key value violates unique constraint' 
      })

      await expect(createCategory(newCategory, 'org_test123', 'user_test'))
        .rejects.toThrow('A category with this name already exists')
    })

    it('should throw generic error for other database errors', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)
      const newCategory = { name: 'Test', description: 'Test' }
      setSupabaseMockData('categories', null, { message: 'Database error' })

      await expect(createCategory(newCategory, 'org_test123', 'user_test'))
        .rejects.toThrow('Failed to create category')
    })
  })

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)
      const categoryId = 'cat-1'
      const updates = {
        name: 'Updated Name',
        description: 'Updated description',
        status: 'inactive' as const,
      }
      const orgId = 'org_test123'
      const updatedCategory = createMockCategory({ id: categoryId, ...updates })
      
      const queryBuilder = setSupabaseMockData('categories', updatedCategory)

      const result = await updateCategory(categoryId, updates, orgId)

      expect(result).toEqual(updatedCategory)
      expect(queryBuilder.update).toHaveBeenCalledWith(updates)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', categoryId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
    })

    it('should handle duplicate names on update', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)
      setSupabaseMockData('categories', null, { 
        code: '23505', 
        message: 'duplicate key value violates unique constraint' 
      })

      await expect(updateCategory('cat-1', { name: 'Duplicate' }, 'org_test123'))
        .rejects.toThrow('A category with this name already exists')
    })
  })

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)
      const categoryId = 'cat-1'
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('categories', null)

      await deleteCategory(categoryId, orgId)

      expect(queryBuilder.delete).toHaveBeenCalled()
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', categoryId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
    })

    it('should handle foreign key constraint on delete', async () => {
      // Mock admin user
      vi.mocked(isAdmin).mockResolvedValue(true)
      setSupabaseMockData('categories', null, { 
        code: '23503', 
        message: 'update or delete on table "categories" violates foreign key constraint' 
      })

      await expect(deleteCategory('cat-1', 'org_test123'))
        .rejects.toThrow('Cannot delete category with existing dependencies')
    })
  })

  describe('Subcategory Operations', () => {
    describe('getSubcategoriesByCategory', () => {
      it('should fetch subcategories for a category', async () => {
        const categoryId = 'cat-1'
        const orgId = 'org_test123'
        const categorySubcategories = mockSubcategories.filter(s => s.category_id === categoryId)
        const queryBuilder = setSupabaseMockData('subcategories', categorySubcategories)

        const result = await getSubcategoriesByCategory(categoryId, orgId)

        expect(result).toEqual(categorySubcategories)
        expect(queryBuilder.eq).toHaveBeenCalledWith('category_id', categoryId)
        expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
        expect(queryBuilder.order).toHaveBeenCalledWith('name', { ascending: true })
      })
    })

    describe('createSubcategory', () => {
      it('should create a new subcategory', async () => {
        // Mock admin user
        vi.mocked(isAdmin).mockResolvedValue(true)
        const newSubcategory = {
          category_id: 'cat-1',
          name: 'New Subcategory',
          description: 'Test description',
        }
        const orgId = 'org_test123'
        const userId = 'user_test'
        const createdSubcategory = createMockSubcategory({ 
          ...newSubcategory, 
          organization_clerk_id: orgId, 
          created_by_clerk_user_id: userId 
        })
        
        const queryBuilder = setSupabaseMockData('subcategories', createdSubcategory)

        const result = await createSubcategory(newSubcategory, orgId, userId)

        expect(result).toEqual(createdSubcategory)
        expect(queryBuilder.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            ...newSubcategory,
            organization_clerk_id: orgId,
            created_by_clerk_user_id: userId,
          })
        )
      })

      it('should handle duplicate subcategory names within a category', async () => {
        // Mock admin user
        vi.mocked(isAdmin).mockResolvedValue(true)
        const newSubcategory = {
          category_id: 'cat-1',
          name: 'Duplicate',
          description: 'Test',
        }
        setSupabaseMockData('subcategories', null, { 
          code: '23505', 
          message: 'duplicate key value violates unique constraint' 
        })

        await expect(createSubcategory(newSubcategory, 'org_test123', 'user_test'))
          .rejects.toThrow('A subcategory with this name already exists in this category')
      })
    })

    describe('updateSubcategory', () => {
      it('should update an existing subcategory', async () => {
        // Mock admin user
        vi.mocked(isAdmin).mockResolvedValue(true)
        const subcategoryId = 'subcat-1'
        const updates = {
          name: 'Updated Subcategory',
          description: 'Updated description',
        }
        const orgId = 'org_test123'
        const updatedSubcategory = createMockSubcategory({ id: subcategoryId, ...updates })
        
        const queryBuilder = setSupabaseMockData('subcategories', updatedSubcategory)

        const result = await updateSubcategory(subcategoryId, updates, orgId)

        expect(result).toEqual(updatedSubcategory)
        expect(queryBuilder.update).toHaveBeenCalledWith(updates)
        expect(queryBuilder.eq).toHaveBeenCalledWith('id', subcategoryId)
        expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      })
    })

    describe('deleteSubcategory', () => {
      it('should delete a subcategory', async () => {
        // Mock admin user
        vi.mocked(isAdmin).mockResolvedValue(true)
        const subcategoryId = 'subcat-1'
        const orgId = 'org_test123'
        const queryBuilder = setSupabaseMockData('subcategories', null)

        await deleteSubcategory(subcategoryId, orgId)

        expect(queryBuilder.delete).toHaveBeenCalled()
        expect(queryBuilder.eq).toHaveBeenCalledWith('id', subcategoryId)
        expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      })

      it('should handle foreign key constraint on delete', async () => {
        // Mock admin user
        vi.mocked(isAdmin).mockResolvedValue(true)
        setSupabaseMockData('subcategories', null, { 
          code: '23503', 
          message: 'update or delete on table "subcategories" violates foreign key constraint' 
        })

        await expect(deleteSubcategory('subcat-1', 'org_test123'))
          .rejects.toThrow('Cannot delete subcategory with existing dependencies')
      })
    })
  })
})