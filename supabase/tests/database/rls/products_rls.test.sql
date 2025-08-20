BEGIN;
SELECT plan(12);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Test that products table has RLS enabled
SELECT has_table('public', 'products', 'Products table exists');
SELECT row_security_is_enabled('public', 'products', 'RLS is enabled on products table');

-- Test that products table has expected RLS policies
SELECT policies_are(
  'public',
  'products',
  ARRAY[
    'Users can view products from their organization',
    'Only admins can insert products',
    'Only admins can update products',
    'Only admins can delete products'
  ],
  'Products table has correct RLS policies'
);

-- Set up test data
-- First, insert categories as they are referenced by products
INSERT INTO categories (id, name, organization_clerk_id, created_by)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', 'Electronics', 'org_test123', 'user_admin'),
  ('c2222222-2222-2222-2222-222222222222', 'Furniture', 'org_test456', 'user_other');

-- Insert products
INSERT INTO products (id, name, sku, category_id, organization_clerk_id, created_by, status)
VALUES 
  ('p1111111-1111-1111-1111-111111111111', 'Laptop', 'SKU001', 'c1111111-1111-1111-1111-111111111111', 'org_test123', 'user_admin', 'active'),
  ('p2222222-2222-2222-2222-222222222222', 'Monitor', 'SKU002', 'c1111111-1111-1111-1111-111111111111', 'org_test123', 'user_admin', 'active'),
  ('p3333333-3333-3333-3333-333333333333', 'Desk', 'SKU003', 'c2222222-2222-2222-2222-222222222222', 'org_test456', 'user_other', 'active');

-- Test SELECT policy for non-admin user in org_test123
SET LOCAL jwt.claims.organization_clerk_id TO 'org_test123';
SET LOCAL jwt.claims.is_admin TO 'false';
SET LOCAL jwt.claims.user_id TO 'user_regular';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM products WHERE organization_clerk_id = ''org_test123''',
  'SELECT 2::INTEGER',
  'Non-admin users can view products from their organization'
);

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM products WHERE organization_clerk_id = ''org_test456''',
  'SELECT 0::INTEGER',
  'Non-admin users cannot view products from other organizations'
);

-- Test INSERT policy - should fail for non-admin
PREPARE insert_product_as_non_admin AS
  INSERT INTO products (name, sku, category_id, organization_clerk_id, created_by)
  VALUES ('Non-Admin Product', 'SKU999', 'c1111111-1111-1111-1111-111111111111', 'org_test123', 'user_regular');

SELECT throws_ok(
  'insert_product_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "products"',
  'Non-admin users cannot insert products'
);

-- Test UPDATE policy - should fail for non-admin
PREPARE update_product_as_non_admin AS
  UPDATE products SET name = 'Updated Product' 
  WHERE id = 'p1111111-1111-1111-1111-111111111111';

SELECT throws_ok(
  'update_product_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "products"',
  'Non-admin users cannot update products'
);

-- Test DELETE policy - should fail for non-admin
PREPARE delete_product_as_non_admin AS
  DELETE FROM products WHERE id = 'p1111111-1111-1111-1111-111111111111';

SELECT throws_ok(
  'delete_product_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "products"',
  'Non-admin users cannot delete products'
);

-- Test INSERT policy - should succeed for admin
SET LOCAL jwt.claims.is_admin TO 'true';
SET LOCAL jwt.claims.user_id TO 'user_admin';

INSERT INTO products (id, name, sku, category_id, organization_clerk_id, created_by)
VALUES ('p4444444-4444-4444-4444-444444444444', 'Admin Product', 'SKU004', 'c1111111-1111-1111-1111-111111111111', 'org_test123', 'user_admin');

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM products WHERE name = ''Admin Product''',
  'SELECT 1::INTEGER',
  'Admin users can insert products'
);

-- Test UPDATE policy - should succeed for admin
UPDATE products SET name = 'Updated Admin Product' 
WHERE id = 'p4444444-4444-4444-4444-444444444444';

SELECT results_eq(
  'SELECT name FROM products WHERE id = ''p4444444-4444-4444-4444-444444444444''',
  'SELECT ''Updated Admin Product''::TEXT',
  'Admin users can update products'
);

-- Test DELETE policy - should succeed for admin
DELETE FROM products WHERE id = 'p4444444-4444-4444-4444-444444444444';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM products WHERE id = ''p4444444-4444-4444-4444-444444444444''',
  'SELECT 0::INTEGER',
  'Admin users can delete products'
);

SELECT * FROM finish();
ROLLBACK;