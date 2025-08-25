BEGIN;
SELECT plan(8);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Enable RLS for testing
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;

-- Test that warehouses table exists
SELECT has_table('public', 'warehouses', 'Warehouses table exists');

-- Test that warehouses table has expected RLS policies
SELECT policies_are(
  'public',
  'warehouses',
  ARRAY[
    'Users can view own org warehouses',
    'Users can create warehouses for own org',
    'Users can update own org warehouses',
    'Users can delete own org warehouses'
  ],
  'Warehouses table has correct RLS policies'
);

-- Clean up any existing test data first
-- First delete dependent data
DELETE FROM stock_movements WHERE from_warehouse_id IN (SELECT id FROM warehouses WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM stock_movements WHERE to_warehouse_id IN (SELECT id FROM warehouses WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM inventory WHERE warehouse_id IN (SELECT id FROM warehouses WHERE organization_clerk_id IN ('org_test123', 'org_test456'));
DELETE FROM warehouses WHERE organization_clerk_id IN ('org_test123', 'org_test456');

-- Set up test data
INSERT INTO warehouses (id, name, type, organization_clerk_id, created_by_clerk_user_id, address, city, state_province, postal_code, country, status)
VALUES 
  ('d0e1f2a3-b4c5-6789-defa-012345678901'::uuid, 'Test Warehouse 1', 'office', 'org_test123', 'user_admin', '123 Test St', 'Test City', 'Test State', '12345', 'US', 'active'),
  ('e1f2a3b4-c5d6-7890-efab-123456789012'::uuid, 'Test Warehouse 2', 'vehicle', 'org_test456', 'user_other', '456 Other Ave', 'Other City', 'Other State', '67890', 'US', 'active'),
  ('f2a3b4c5-d6e7-8901-fabc-234567890123'::uuid, 'Test Warehouse 3', 'other', 'org_test123', 'user_admin', '789 Test Blvd', 'Test City', 'Test State', '12345', 'US', 'inactive');

-- Test SELECT policy for user in org_test123
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"org_id": "org_test123", "user_id": "user_regular"}';

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM warehouses',
  'SELECT 2::INTEGER',
  'Users can view warehouses from their organization'
);

-- Warehouses from other organizations should not be visible
SELECT is_empty(
  'SELECT * FROM warehouses WHERE organization_clerk_id = ''org_test456''',
  'Users cannot view warehouses from other organizations'
);

-- Test INSERT policy - should succeed for users in their own org
INSERT INTO warehouses (id, name, type, organization_clerk_id, created_by_clerk_user_id, address, city, state_province, postal_code, country)
VALUES ('a3b4c5d6-e7f8-9012-abcd-345678901234'::uuid, 'User Warehouse', 'office', 'org_test123', 'user_regular', '999 User St', 'User City', 'User State', '99999', 'US');

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM warehouses WHERE name = ''User Warehouse''',
  'SELECT 1::INTEGER',
  'Users can insert warehouses in their organization'
);

-- Test UPDATE policy - should succeed for users in their own org
UPDATE warehouses SET name = 'Updated Warehouse' 
WHERE id = 'd0e1f2a3-b4c5-6789-defa-012345678901'::uuid;

SELECT results_eq(
  'SELECT name FROM warehouses WHERE id = ''d0e1f2a3-b4c5-6789-defa-012345678901''::uuid',
  'SELECT ''Updated Warehouse''::TEXT',
  'Users can update warehouses in their organization'
);

-- Test DELETE policy - should succeed for users in their own org
DELETE FROM warehouses WHERE id = 'a3b4c5d6-e7f8-9012-abcd-345678901234'::uuid;

SELECT results_eq(
  'SELECT COUNT(*)::INTEGER FROM warehouses WHERE id = ''a3b4c5d6-e7f8-9012-abcd-345678901234''::uuid',
  'SELECT 0::INTEGER',
  'Users can delete warehouses in their organization'
);

-- Test INSERT policy - should fail for different org
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"org_id": "org_test456", "user_id": "user_other"}';

PREPARE insert_diff_org AS
  INSERT INTO warehouses (name, type, organization_clerk_id, created_by_clerk_user_id, address, city, state_province, postal_code, country)
  VALUES ('Other Org Warehouse', 'office', 'org_test123', 'user_other', '888 Other St', 'Other City', 'Other State', '88888', 'US');

SELECT throws_ok(
  'insert_diff_org',
  '42501',
  'new row violates row-level security policy for table "warehouses"',
  'Users cannot insert warehouses in other organizations'
);

SELECT * FROM finish();
ROLLBACK;