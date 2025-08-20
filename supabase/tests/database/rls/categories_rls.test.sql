BEGIN;
SELECT plan(12);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Test that categories table has RLS enabled
SELECT has_table('public', 'categories', 'Categories table exists');
SELECT row_security_is_enabled('public', 'categories', 'RLS is enabled on categories table');

-- Test that categories table has expected RLS policies
SELECT policies_are(
  'public',
  'categories',
  ARRAY[
    'Users can view categories from their organization',
    'Only admins can insert categories',
    'Only admins can update categories',
    'Only admins can delete categories'
  ],
  'Categories table has correct RLS policies'
);

-- Set up test data
INSERT INTO categories (id, name, organization_clerk_id, created_by, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Category 1', 'org_test123', 'user_admin', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Test Category 2', 'org_test456', 'user_other', 'active'),
  ('33333333-3333-3333-3333-333333333333', 'Test Category 3', 'org_test123', 'user_admin', 'inactive');

-- Test SELECT policy for non-admin user in org_test123
SET LOCAL jwt.claims.organization_clerk_id TO 'org_test123';
SET LOCAL jwt.claims.is_admin TO 'false';
SET LOCAL jwt.claims.user_id TO 'user_regular';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM categories WHERE organization_clerk_id = ''org_test123''',
  'SELECT 2::INTEGER',
  'Non-admin users can view categories from their organization'
);

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM categories WHERE organization_clerk_id = ''org_test456''',
  'SELECT 0::INTEGER',
  'Non-admin users cannot view categories from other organizations'
);

-- Test INSERT policy - should fail for non-admin
PREPARE insert_as_non_admin AS
  INSERT INTO categories (name, organization_clerk_id, created_by)
  VALUES ('Non-Admin Category', 'org_test123', 'user_regular');

SELECT throws_ok(
  'insert_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "categories"',
  'Non-admin users cannot insert categories'
);

-- Test UPDATE policy - should fail for non-admin
PREPARE update_as_non_admin AS
  UPDATE categories SET name = 'Updated Name' 
  WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
  'update_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "categories"',
  'Non-admin users cannot update categories'
);

-- Test DELETE policy - should fail for non-admin
PREPARE delete_as_non_admin AS
  DELETE FROM categories WHERE id = '11111111-1111-1111-1111-111111111111';

SELECT throws_ok(
  'delete_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "categories"',
  'Non-admin users cannot delete categories'
);

-- Test INSERT policy - should succeed for admin
SET LOCAL jwt.claims.is_admin TO 'true';
SET LOCAL jwt.claims.user_id TO 'user_admin';

INSERT INTO categories (id, name, organization_clerk_id, created_by)
VALUES ('44444444-4444-4444-4444-444444444444', 'Admin Category', 'org_test123', 'user_admin');

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM categories WHERE name = ''Admin Category''',
  'SELECT 1::INTEGER',
  'Admin users can insert categories'
);

-- Test UPDATE policy - should succeed for admin
UPDATE categories SET name = 'Updated Admin Category' 
WHERE id = '44444444-4444-4444-4444-444444444444';

SELECT results_eq(
  'SELECT name FROM categories WHERE id = ''44444444-4444-4444-4444-444444444444''',
  'SELECT ''Updated Admin Category''::TEXT',
  'Admin users can update categories'
);

-- Test DELETE policy - should succeed for admin
DELETE FROM categories WHERE id = '44444444-4444-4444-4444-444444444444';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM categories WHERE id = ''44444444-4444-4444-4444-444444444444''',
  'SELECT 0::INTEGER',
  'Admin users can delete categories'
);

SELECT * FROM finish();
ROLLBACK;