BEGIN;
SELECT plan(8);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Enable RLS for testing
ALTER TABLE categories FORCE ROW LEVEL SECURITY;

-- Test that categories table exists
SELECT has_table('public', 'categories', 'Categories table exists');

-- Test that categories table has expected RLS policies
SELECT policies_are(
  'public',
  'categories',
  ARRAY[
    'Users can view own org categories',
    'Users can create categories for own org',
    'Users can update own org categories',
    'Users can delete own org categories'
  ],
  'Categories table has correct RLS policies'
);

-- Clean up any existing test data first
-- First delete dependent data
DELETE FROM stock_movements WHERE product_id IN (SELECT id FROM products WHERE category_id IN (SELECT id FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456')));
DELETE FROM inventory WHERE product_id IN (SELECT id FROM products WHERE category_id IN (SELECT id FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456')));
DELETE FROM product_features WHERE product_id IN (SELECT id FROM products WHERE category_id IN (SELECT id FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456')));
DELETE FROM quote_items WHERE product_id IN (SELECT id FROM products WHERE category_id IN (SELECT id FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456')));
DELETE FROM products WHERE category_id IN (SELECT id FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM subcategories WHERE category_id IN (SELECT id FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM feature_definitions WHERE category_id IN (SELECT id FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM categories WHERE organization_clerk_id IN ('org_test123', 'org_test456');

-- Set up test data
INSERT INTO categories (id, name, organization_clerk_id, created_by_clerk_user_id, status)
VALUES 
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid, 'Test Category 1', 'org_test123', 'user_admin', 'active'),
  ('b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid, 'Test Category 2', 'org_test456', 'user_other', 'active'),
  ('c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid, 'Test Category 3', 'org_test123', 'user_admin', 'inactive');

-- Test SELECT policy for user in org_test123
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"org_id": "org_test123", "user_id": "user_regular"}';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM categories',
  'SELECT 2::INTEGER',
  'Users can view categories from their organization'
);

-- Categories from other organizations should not be visible
SELECT is_empty(
  'SELECT * FROM categories WHERE organization_clerk_id = ''org_test456''',
  'Users cannot view categories from other organizations'
);

-- Test INSERT policy - should succeed for users in their own org
INSERT INTO categories (id, name, organization_clerk_id, created_by_clerk_user_id)
VALUES ('d4e5f6a7-b8c9-0123-defa-456789012345'::uuid, 'User Category', 'org_test123', 'user_regular');

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM categories WHERE name = ''User Category''',
  'SELECT 1::INTEGER',
  'Users can insert categories in their organization'
);

-- Test UPDATE policy - should succeed for users in their own org
UPDATE categories SET name = 'Updated Category' 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid;

SELECT results_eq(
  'SELECT name FROM categories WHERE id = ''a1b2c3d4-e5f6-7890-abcd-ef1234567890''::uuid',
  'SELECT ''Updated Category''::TEXT',
  'Users can update categories in their organization'
);

-- Test DELETE policy - should succeed for users in their own org
DELETE FROM categories WHERE id = 'd4e5f6a7-b8c9-0123-defa-456789012345'::uuid;

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM categories WHERE id = ''d4e5f6a7-b8c9-0123-defa-456789012345''::uuid',
  'SELECT 0::INTEGER',
  'Users can delete categories in their organization'
);

-- Test INSERT policy - should fail for different org
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"org_id": "org_test456", "user_id": "user_other"}';

PREPARE insert_diff_org AS
  INSERT INTO categories (name, organization_clerk_id, created_by_clerk_user_id)
  VALUES ('Other Org Category', 'org_test123', 'user_other');

SELECT throws_ok(
  'insert_diff_org',
  '42501',
  'new row violates row-level security policy for table "categories"',
  'Users cannot insert categories in other organizations'
);

SELECT * FROM finish();
ROLLBACK;