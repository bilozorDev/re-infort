BEGIN;
SELECT plan(8);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Enable RLS for testing
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

-- Test that products table exists
SELECT has_table('public', 'products', 'Products table exists');

-- Test that products table has expected RLS policies
SELECT policies_are(
  'public',
  'products',
  ARRAY[
    'Users can view own org products',
    'Users can create products for own org',
    'Users can update own org products',
    'Users can delete own org products'
  ],
  'Products table has correct RLS policies'
);

-- Clean up any existing test data first
-- First delete dependent data
DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM inventory WHERE product_id IN (SELECT id FROM products WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM product_features WHERE product_id IN (SELECT id FROM products WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM quote_items WHERE product_id IN (SELECT id FROM products WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM products WHERE organization_clerk_id IN ('org_test123', 'org_test456');
DELETE FROM categories WHERE id = 'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid;

-- Set up test data
-- First create a category for the products
INSERT INTO categories (id, name, organization_clerk_id, created_by_clerk_user_id, status)
VALUES ('e5f6a7b8-c9d0-1234-efab-567890123456'::uuid, 'Test Category', 'org_test123', 'user_admin', 'active');

INSERT INTO products (id, name, sku, category_id, organization_clerk_id, created_by_clerk_user_id, status)
VALUES 
  ('f6a7b8c9-d0e1-2345-fabc-678901234567'::uuid, 'Test Product 1', 'SKU001', 'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid, 'org_test123', 'user_admin', 'active'),
  ('a7b8c9d0-e1f2-3456-abcd-789012345678'::uuid, 'Test Product 2', 'SKU002', 'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid, 'org_test456', 'user_other', 'active'),
  ('b8c9d0e1-f2a3-4567-bcde-890123456789'::uuid, 'Test Product 3', 'SKU003', 'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid, 'org_test123', 'user_admin', 'inactive');

-- Test SELECT policy for user in org_test123
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"org_id": "org_test123", "user_id": "user_regular"}';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM products',
  'SELECT 2::INTEGER',
  'Users can view products from their organization'
);

-- Products from other organizations should not be visible
SELECT is_empty(
  'SELECT * FROM products WHERE organization_clerk_id = ''org_test456''',
  'Users cannot view products from other organizations'
);

-- Test INSERT policy - should succeed for users in their own org
INSERT INTO products (id, name, sku, organization_clerk_id, created_by_clerk_user_id)
VALUES ('c9d0e1f2-a3b4-5678-cdef-901234567890'::uuid, 'User Product', 'SKU004', 'org_test123', 'user_regular');

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM products WHERE name = ''User Product''',
  'SELECT 1::INTEGER',
  'Users can insert products in their organization'
);

-- Test UPDATE policy - should succeed for users in their own org
UPDATE products SET name = 'Updated Product' 
WHERE id = 'f6a7b8c9-d0e1-2345-fabc-678901234567'::uuid;

SELECT results_eq(
  'SELECT name FROM products WHERE id = ''f6a7b8c9-d0e1-2345-fabc-678901234567''::uuid',
  'SELECT ''Updated Product''::TEXT',
  'Users can update products in their organization'
);

-- Test DELETE policy - should succeed for users in their own org
DELETE FROM products WHERE id = 'c9d0e1f2-a3b4-5678-cdef-901234567890'::uuid;

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM products WHERE id = ''c9d0e1f2-a3b4-5678-cdef-901234567890''::uuid',
  'SELECT 0::INTEGER',
  'Users can delete products in their organization'
);

-- Test INSERT policy - should fail for different org
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"org_id": "org_test456", "user_id": "user_other"}';

PREPARE insert_diff_org AS
  INSERT INTO products (name, sku, organization_clerk_id, created_by_clerk_user_id)
  VALUES ('Other Org Product', 'SKU999', 'org_test123', 'user_other');

SELECT throws_ok(
  'insert_diff_org',
  '42501',
  'new row violates row-level security policy for table "products"',
  'Users cannot insert products in other organizations'
);

SELECT * FROM finish();
ROLLBACK;