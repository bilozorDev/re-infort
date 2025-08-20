BEGIN;
SELECT plan(12);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Test that warehouses table has RLS enabled
SELECT has_table('public', 'warehouses', 'Warehouses table exists');
SELECT row_security_is_enabled('public', 'warehouses', 'RLS is enabled on warehouses table');

-- Test that warehouses table has expected RLS policies
SELECT policies_are(
  'public',
  'warehouses',
  ARRAY[
    'Users can view warehouses from their organization',
    'Only admins can insert warehouses',
    'Only admins can update warehouses',
    'Only admins can delete warehouses'
  ],
  'Warehouses table has correct RLS policies'
);

-- Set up test data
INSERT INTO warehouses (id, name, organization_clerk_id, created_by, location, status)
VALUES 
  ('w1111111-1111-1111-1111-111111111111', 'Main Warehouse', 'org_test123', 'user_admin', 'New York', 'active'),
  ('w2222222-2222-2222-2222-222222222222', 'Secondary Warehouse', 'org_test123', 'user_admin', 'Los Angeles', 'active'),
  ('w3333333-3333-3333-3333-333333333333', 'Other Org Warehouse', 'org_test456', 'user_other', 'Chicago', 'active');

-- Test SELECT policy for non-admin user in org_test123
SET LOCAL jwt.claims.organization_clerk_id TO 'org_test123';
SET LOCAL jwt.claims.is_admin TO 'false';
SET LOCAL jwt.claims.user_id TO 'user_regular';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM warehouses WHERE organization_clerk_id = ''org_test123''',
  'SELECT 2::INTEGER',
  'Non-admin users can view warehouses from their organization'
);

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM warehouses WHERE organization_clerk_id = ''org_test456''',
  'SELECT 0::INTEGER',
  'Non-admin users cannot view warehouses from other organizations'
);

-- Test INSERT policy - should fail for non-admin
PREPARE insert_warehouse_as_non_admin AS
  INSERT INTO warehouses (name, organization_clerk_id, created_by, location)
  VALUES ('Non-Admin Warehouse', 'org_test123', 'user_regular', 'Boston');

SELECT throws_ok(
  'insert_warehouse_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "warehouses"',
  'Non-admin users cannot insert warehouses'
);

-- Test UPDATE policy - should fail for non-admin
PREPARE update_warehouse_as_non_admin AS
  UPDATE warehouses SET name = 'Updated Warehouse' 
  WHERE id = 'w1111111-1111-1111-1111-111111111111';

SELECT throws_ok(
  'update_warehouse_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "warehouses"',
  'Non-admin users cannot update warehouses'
);

-- Test DELETE policy - should fail for non-admin
PREPARE delete_warehouse_as_non_admin AS
  DELETE FROM warehouses WHERE id = 'w1111111-1111-1111-1111-111111111111';

SELECT throws_ok(
  'delete_warehouse_as_non_admin',
  '42501',
  'new row violates row-level security policy for table "warehouses"',
  'Non-admin users cannot delete warehouses'
);

-- Test INSERT policy - should succeed for admin
SET LOCAL jwt.claims.is_admin TO 'true';
SET LOCAL jwt.claims.user_id TO 'user_admin';

INSERT INTO warehouses (id, name, organization_clerk_id, created_by, location)
VALUES ('w4444444-4444-4444-4444-444444444444', 'Admin Warehouse', 'org_test123', 'user_admin', 'Miami');

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM warehouses WHERE name = ''Admin Warehouse''',
  'SELECT 1::INTEGER',
  'Admin users can insert warehouses'
);

-- Test UPDATE policy - should succeed for admin
UPDATE warehouses SET name = 'Updated Admin Warehouse' 
WHERE id = 'w4444444-4444-4444-4444-444444444444';

SELECT results_eq(
  'SELECT name FROM warehouses WHERE id = ''w4444444-4444-4444-4444-444444444444''',
  'SELECT ''Updated Admin Warehouse''::TEXT',
  'Admin users can update warehouses'
);

-- Test DELETE policy - should succeed for admin
DELETE FROM warehouses WHERE id = 'w4444444-4444-4444-4444-444444444444';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM warehouses WHERE id = ''w4444444-4444-4444-4444-444444444444''',
  'SELECT 0::INTEGER',
  'Admin users can delete warehouses'
);

SELECT * FROM finish();
ROLLBACK;