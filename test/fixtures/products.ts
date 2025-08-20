import type { Product, ProductWithCategory } from '@/app/types/product'
import { mockCategories, mockSubcategories } from './categories'

export const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'MacBook Pro 16"',
    sku: 'MBP16-2024',
    category_id: 'cat-1',
    subcategory_id: 'subcat-1',
    description: 'High-performance laptop for professionals',
    cost: null,
    price: null,
    link: null,
    photo_url: null,
    serial_number: null,
    status: 'active',
    organization_clerk_id: 'org_test123',
    created_by_clerk_user_id: 'user_admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Dell UltraSharp 27"',
    sku: 'DELL-U2723',
    category_id: 'cat-1',
    subcategory_id: 'subcat-2',
    description: '4K professional monitor',
    cost: null,
    price: null,
    link: null,
    photo_url: null,
    serial_number: null,
    status: 'active',
    organization_clerk_id: 'org_test123',
    created_by_clerk_user_id: 'user_admin',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Standing Desk',
    sku: 'DESK-STAND-01',
    category_id: 'cat-2',
    subcategory_id: 'subcat-3',
    description: 'Adjustable height standing desk',
    cost: null,
    price: null,
    link: null,
    photo_url: null,
    serial_number: null,
    status: 'active',
    organization_clerk_id: 'org_test123',
    created_by_clerk_user_id: 'user_admin',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Ergonomic Chair',
    sku: 'CHAIR-ERGO-01',
    category_id: 'cat-2',
    subcategory_id: 'subcat-4',
    description: 'Ergonomic office chair with lumbar support',
    cost: null,
    price: null,
    link: null,
    photo_url: null,
    serial_number: null,
    status: 'inactive',
    organization_clerk_id: 'org_test123',
    created_by_clerk_user_id: 'user_admin',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
  },
]

export const mockProductsWithCategory: ProductWithCategory[] = mockProducts.map(product => ({
  ...product,
  category: mockCategories.find(cat => cat.id === product.category_id),
  subcategory: mockSubcategories.find(sub => sub.id === product.subcategory_id),
}))

// Helper functions to create test data
export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: 'prod-test',
  name: 'Test Product',
  sku: 'TEST-SKU-001',
  category_id: 'cat-1',
  subcategory_id: 'subcat-1',
  description: 'Test product description',
  cost: null,
  price: null,
  link: null,
  photo_url: null,
  serial_number: null,
  status: 'active',
  organization_clerk_id: 'org_test123',
  created_by_clerk_user_id: 'user_test',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockProductWithCategory = (overrides?: Partial<ProductWithCategory>): ProductWithCategory => {
  const product = createMockProduct(overrides)
  return {
    ...product,
    category: mockCategories.find(cat => cat.id === product.category_id),
    subcategory: mockSubcategories.find(sub => sub.id === product.subcategory_id),
    ...overrides,
  }
}