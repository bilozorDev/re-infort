import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createMockProduct,
  createMockProductWithCategory,
  mockProducts,
  mockProductsWithCategory,
} from '@/test/fixtures/products'
import { createClientMock, resetSupabaseMocks, setSupabaseMockData } from '@/test/mocks/supabase'

import {
  createProduct,
  deleteProduct,
  getActiveProducts,
  getAllProducts,
  getProductById,
  getProductBySku,
  getProductsByCategory,
  searchProducts,
  updateProduct,
} from '../product.service'

// Mock the Supabase client
vi.mock('@/app/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

describe('Product Service', () => {
  beforeEach(() => {
    resetSupabaseMocks()
    vi.clearAllMocks()
    // Mock console.warn to avoid warnings in tests
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  describe('getAllProducts', () => {
    it('should fetch all products for an organization', async () => {
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('products', mockProductsWithCategory)

      const result = await getAllProducts(orgId)

      expect(result).toEqual(mockProductsWithCategory)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(queryBuilder.select).toHaveBeenCalledWith(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      features:product_features(*)
    `)
    })

    it('should return empty array when no products exist', async () => {
      setSupabaseMockData('products', [])

      const result = await getAllProducts('org_test123')

      expect(result).toEqual([])
    })

    it('should handle JWT timing issues gracefully', async () => {
      setSupabaseMockData('products', null, { message: 'JWT not yet valid' })

      const result = await getAllProducts('org_test123')

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        'JWT timing issue detected, returning empty array:',
        'JWT not yet valid'
      )
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(getAllProducts('org_test123'))
        .rejects.toThrow('Failed to fetch products: Database error')
    })
  })

  describe('getActiveProducts', () => {
    it('should fetch only active products', async () => {
      const activeProducts = mockProductsWithCategory.filter(p => p.status === 'active')
      const queryBuilder = setSupabaseMockData('products', activeProducts)

      const result = await getActiveProducts('org_test123')

      expect(result).toEqual(activeProducts)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', 'org_test123')
      expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'active')
      expect(queryBuilder.order).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should handle JWT timing issues gracefully', async () => {
      setSupabaseMockData('products', null, { message: 'JWT not yet valid' })

      const result = await getActiveProducts('org_test123')

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        'JWT timing issue detected, returning empty array:',
        'JWT not yet valid'
      )
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(getActiveProducts('org_test123'))
        .rejects.toThrow('Failed to fetch active products: Database error')
    })
  })

  describe('getProductById', () => {
    it('should fetch a product by id', async () => {
      const product = mockProductsWithCategory[0]
      const queryBuilder = setSupabaseMockData('products', product)

      const result = await getProductById(product.id, product.organization_clerk_id)

      expect(result).toEqual(product)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', product.id)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', product.organization_clerk_id)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should return null when product not found (PGRST116)', async () => {
      setSupabaseMockData('products', null, { code: 'PGRST116' })

      const result = await getProductById('non-existent', 'org_test123')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(getProductById('prod-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch product: Database error')
    })
  })

  describe('getProductBySku', () => {
    it('should fetch a product by SKU', async () => {
      const product = mockProducts[0]
      const queryBuilder = setSupabaseMockData('products', product)

      const result = await getProductBySku(product.sku, product.organization_clerk_id)

      expect(result).toEqual(product)
      expect(queryBuilder.eq).toHaveBeenCalledWith('sku', product.sku)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', product.organization_clerk_id)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should return null when product not found (PGRST116)', async () => {
      setSupabaseMockData('products', null, { code: 'PGRST116' })

      const result = await getProductBySku('NON-EXISTENT', 'org_test123')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(getProductBySku('TEST-SKU', 'org_test123'))
        .rejects.toThrow('Failed to fetch product by SKU: Database error')
    })
  })

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const input = {
        name: 'New Product',
        sku: 'NEW-PROD-001',
        description: 'A new product for testing',
        category_id: 'cat-1',
        subcategory_id: 'subcat-1',
        status: 'active' as const,
      }
      const orgId = 'org_test123'
      const userId = 'user_test'
      const createdProduct = createMockProduct({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })

      const queryBuilder = setSupabaseMockData('products', createdProduct)

      const result = await createProduct(input, orgId, userId)

      expect(result).toEqual(createdProduct)
      expect(queryBuilder.insert).toHaveBeenCalledWith({
        ...input,
        organization_clerk_id: orgId,
        created_by_clerk_user_id: userId,
      })
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle duplicate SKU error', async () => {
      const input = {
        name: 'Duplicate Product',
        sku: 'DUPLICATE-SKU',
        description: 'A product with duplicate SKU',
      }

      setSupabaseMockData('products', null, {
        code: '23505',
        message: 'duplicate key value violates unique constraint "products_sku_key"',
      })

      await expect(createProduct(input, 'org_test123', 'user_test'))
        .rejects.toThrow('A product with this SKU already exists')
    })

    it('should throw generic error for other database errors', async () => {
      const input = {
        name: 'Test Product',
        sku: 'TEST-SKU',
        description: 'Test description',
      }

      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(createProduct(input, 'org_test123', 'user_test'))
        .rejects.toThrow('Failed to create product: Database error')
    })
  })

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      const productId = 'prod-1'
      const updates = {
        name: 'Updated Product',
        description: 'Updated description',
        price: 99.99,
      }
      const orgId = 'org_test123'
      const updatedProduct = createMockProduct({ id: productId, ...updates })

      const queryBuilder = setSupabaseMockData('products', updatedProduct)

      const result = await updateProduct(productId, updates, orgId)

      expect(result).toEqual(updatedProduct)
      expect(queryBuilder.update).toHaveBeenCalledWith(updates)
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', productId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.single).toHaveBeenCalled()
    })

    it('should handle duplicate SKU error on update', async () => {
      setSupabaseMockData('products', null, {
        code: '23505',
        message: 'duplicate key value violates unique constraint "products_sku_key"',
      })

      await expect(updateProduct('prod-1', { sku: 'DUPLICATE' }, 'org_test123'))
        .rejects.toThrow('A product with this SKU already exists')
    })

    it('should throw error when product not found', async () => {
      setSupabaseMockData('products', null)

      await expect(updateProduct('prod-1', { name: 'Updated' }, 'org_test123'))
        .rejects.toThrow('Product not found')
    })

    it('should throw generic error for other database errors', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(updateProduct('prod-1', { name: 'Updated' }, 'org_test123'))
        .rejects.toThrow('Failed to update product: Database error')
    })
  })

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      const productId = 'prod-1'
      const orgId = 'org_test123'
      const queryBuilder = setSupabaseMockData('products', null)

      await deleteProduct(productId, orgId)

      expect(queryBuilder.delete).toHaveBeenCalled()
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', productId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
    })

    it('should handle inventory constraint error', async () => {
      setSupabaseMockData('products', null, {
        message: 'Product has existing inventory records',
      })

      await expect(deleteProduct('prod-1', 'org_test123'))
        .rejects.toThrow('Cannot delete product with existing inventory. Please adjust inventory to 0 first.')
    })

    it('should throw generic error for other database errors', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(deleteProduct('prod-1', 'org_test123'))
        .rejects.toThrow('Failed to delete product: Database error')
    })
  })

  describe('getProductsByCategory', () => {
    it('should fetch products by category', async () => {
      const categoryId = 'cat-1'
      const orgId = 'org_test123'
      const categoryProducts = mockProducts.filter(p => p.category_id === categoryId)
      const queryBuilder = setSupabaseMockData('products', categoryProducts)

      const result = await getProductsByCategory(categoryId, orgId)

      expect(result).toEqual(categoryProducts)
      expect(queryBuilder.eq).toHaveBeenCalledWith('category_id', categoryId)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.order).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should return empty array when no products in category', async () => {
      setSupabaseMockData('products', [])

      const result = await getProductsByCategory('cat-empty', 'org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(getProductsByCategory('cat-1', 'org_test123'))
        .rejects.toThrow('Failed to fetch products by category: Database error')
    })
  })

  describe('searchProducts', () => {
    it('should search products by name, SKU, and description', async () => {
      const searchTerm = 'MacBook'
      const orgId = 'org_test123'
      const searchResults = mockProductsWithCategory.filter(p => 
        p.name.includes(searchTerm) || p.sku.includes(searchTerm) || p.description?.includes(searchTerm)
      )
      const queryBuilder = setSupabaseMockData('products', searchResults)

      const result = await searchProducts(searchTerm, orgId)

      expect(result).toEqual(searchResults)
      expect(queryBuilder.eq).toHaveBeenCalledWith('organization_clerk_id', orgId)
      expect(queryBuilder.or).toHaveBeenCalledWith(
        `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      )
      expect(queryBuilder.order).toHaveBeenCalledWith('name', { ascending: true })
    })

    it('should return empty array when no matches found', async () => {
      setSupabaseMockData('products', [])

      const result = await searchProducts('nonexistent', 'org_test123')

      expect(result).toEqual([])
    })

    it('should throw error when search fails', async () => {
      setSupabaseMockData('products', null, { message: 'Database error' })

      await expect(searchProducts('test', 'org_test123'))
        .rejects.toThrow('Failed to search products: Database error')
    })
  })
})