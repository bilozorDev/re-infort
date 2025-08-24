BEGIN;
SELECT plan(19);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Enable RLS for testing
ALTER TABLE categories FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;
ALTER TABLE inventory FORCE ROW LEVEL SECURITY;
ALTER TABLE stock_movements FORCE ROW LEVEL SECURITY;

-- Test function existence and signatures
SELECT has_function('public', 'adjust_inventory', 
    ARRAY['uuid', 'uuid', 'integer', 'text', 'text', 'text', 'text', 'text'],
    'adjust_inventory function exists with correct signature'
);

SELECT has_function('public', 'transfer_inventory',
    ARRAY['uuid', 'uuid', 'uuid', 'integer', 'text', 'text', 'text'],
    'transfer_inventory function exists with correct signature'
);

SELECT has_function('public', 'get_product_total_inventory',
    ARRAY['uuid'],
    'get_product_total_inventory function exists with correct signature'
);

SELECT has_function('public', 'reserve_inventory',
    ARRAY['uuid', 'uuid', 'integer', 'text', 'text', 'text', 'text'],
    'reserve_inventory function exists with correct signature'
);

SELECT has_function('public', 'release_reservation',
    ARRAY['uuid', 'text', 'text'],
    'release_reservation function exists with correct signature'
);

-- Set up test data
SET LOCAL request.jwt.claims TO '{"org_id": "org_test123", "sub": "user_test"}';

-- Insert test categories, products, and warehouses
INSERT INTO categories (id, name, organization_clerk_id, created_by_clerk_user_id)
VALUES ('b4c5d6e7-f8a9-0123-bcde-456789012345'::uuid, 'Test Category', 'org_test123', 'user_test');

INSERT INTO products (id, name, sku, category_id, organization_clerk_id, created_by_clerk_user_id)
VALUES 
  ('c5d6e7f8-a9b0-1234-cdef-567890123456'::uuid, 'Test Product 1', 'SKU001', 'b4c5d6e7-f8a9-0123-bcde-456789012345'::uuid, 'org_test123', 'user_test'),
  ('d6e7f8a9-b0c1-2345-defa-678901234567'::uuid, 'Test Product 2', 'SKU002', 'b4c5d6e7-f8a9-0123-bcde-456789012345'::uuid, 'org_test123', 'user_test');

INSERT INTO warehouses (id, name, type, address, city, state_province, postal_code, country, organization_clerk_id, created_by_clerk_user_id)
VALUES 
  ('e7f8a9b0-c1d2-3456-efab-789012345678'::uuid, 'Warehouse A', 'office', '123 Test St', 'Test City', 'Test State', '12345', 'US', 'org_test123', 'user_test'),
  ('f8a9b0c1-d2e3-4567-fabc-890123456789'::uuid, 'Warehouse B', 'office', '456 Test Ave', 'Test City', 'Test State', '12345', 'US', 'org_test123', 'user_test');

-- Test adjust_inventory function - add stock
SELECT lives_ok(
  $$SELECT adjust_inventory(
    'c5d6e7f8-a9b0-1234-cdef-567890123456'::uuid, 
    'e7f8a9b0-c1d2-3456-efab-789012345678'::uuid, 
    100, 
    'receipt', 
    'Initial stock',
    NULL,
    NULL,
    'Test User'
  )$$,
  'adjust_inventory can add stock to inventory'
);

-- Verify inventory was created with correct quantity
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''c5d6e7f8-a9b0-1234-cdef-567890123456''::uuid AND warehouse_id = ''e7f8a9b0-c1d2-3456-efab-789012345678''::uuid',
  'SELECT 100::INTEGER',
  'Inventory quantity is correct after adding stock'
);

-- Test adjust_inventory function - remove stock
SELECT lives_ok(
  $$SELECT adjust_inventory(
    'c5d6e7f8-a9b0-1234-cdef-567890123456'::uuid, 
    'e7f8a9b0-c1d2-3456-efab-789012345678'::uuid, 
    -30, 
    'sale', 
    'Test sale',
    NULL,
    NULL,
    'Test User'
  )$$,
  'adjust_inventory can remove stock from inventory'
);

-- Verify inventory quantity was updated
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''c5d6e7f8-a9b0-1234-cdef-567890123456''::uuid AND warehouse_id = ''e7f8a9b0-c1d2-3456-efab-789012345678''::uuid',
  'SELECT 70::INTEGER',
  'Inventory quantity is correct after removing stock'
);

-- Test adjust_inventory with insufficient stock (should fail)
SELECT throws_ok(
  $$SELECT adjust_inventory(
    'c5d6e7f8-a9b0-1234-cdef-567890123456'::uuid, 
    'e7f8a9b0-c1d2-3456-efab-789012345678'::uuid, 
    -100, 
    'sale', 
    'Too much',
    NULL,
    NULL,
    'Test User'
  )$$,
  'P0001',
  'Insufficient stock. Current: 70, Requested change: -100',
  'adjust_inventory throws error for insufficient stock'
);

-- Test transfer_inventory function
-- First add stock to source warehouse
SELECT adjust_inventory(
  'd6e7f8a9-b0c1-2345-defa-678901234567'::uuid, 
  'e7f8a9b0-c1d2-3456-efab-789012345678'::uuid, 
  50, 
  'receipt', 
  'Stock for transfer test',
  NULL,
  NULL,
  'Test User'
);

SELECT lives_ok(
  $$SELECT transfer_inventory(
    'd6e7f8a9-b0c1-2345-defa-678901234567'::uuid,
    'e7f8a9b0-c1d2-3456-efab-789012345678'::uuid,
    'f8a9b0c1-d2e3-4567-fabc-890123456789'::uuid,
    20,
    'Internal transfer',
    NULL,
    'Test User'
  )$$,
  'transfer_inventory can transfer stock between warehouses'
);

-- Verify source warehouse quantity reduced
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''d6e7f8a9-b0c1-2345-defa-678901234567''::uuid AND warehouse_id = ''e7f8a9b0-c1d2-3456-efab-789012345678''::uuid',
  'SELECT 30::INTEGER',
  'Source warehouse quantity reduced after transfer'
);

-- Verify destination warehouse quantity increased
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''d6e7f8a9-b0c1-2345-defa-678901234567''::uuid AND warehouse_id = ''f8a9b0c1-d2e3-4567-fabc-890123456789''::uuid',
  'SELECT 20::INTEGER',
  'Destination warehouse quantity increased after transfer'
);

-- Test reserve_inventory function
-- Store the movement ID for later release
DO $$
DECLARE
    v_movement_result JSON;
    v_movement_id UUID;
BEGIN
    v_movement_result := reserve_inventory(
        'c5d6e7f8-a9b0-1234-cdef-567890123456'::uuid,
        'e7f8a9b0-c1d2-3456-efab-789012345678'::uuid,
        25,
        'sale',
        'ORDER-123',
        NULL,
        'Test User'
    );
    v_movement_id := (v_movement_result->>'movement_id')::UUID;
    -- Store movement ID in a temp table for later use
    CREATE TEMP TABLE IF NOT EXISTS test_movement_ids (id UUID);
    INSERT INTO test_movement_ids VALUES (v_movement_id);
END $$;

SELECT pass('reserve_inventory can reserve available stock');

-- Verify reserved quantity
SELECT results_eq(
  'SELECT reserved_quantity FROM inventory WHERE product_id = ''c5d6e7f8-a9b0-1234-cdef-567890123456''::uuid AND warehouse_id = ''e7f8a9b0-c1d2-3456-efab-789012345678''::uuid',
  'SELECT 25::INTEGER',
  'Reserved quantity is correct after reservation'
);

-- Test reserve_inventory with insufficient available stock (should fail)
SELECT throws_ok(
  $$SELECT reserve_inventory(
    'c5d6e7f8-a9b0-1234-cdef-567890123456'::uuid,
    'e7f8a9b0-c1d2-3456-efab-789012345678'::uuid,
    50,
    'sale',
    'ORDER-456',
    NULL,
    'Test User'
  )$$,
  'P0001',
  'Insufficient available stock. Available: 45, Requested: 50',
  'reserve_inventory throws error for insufficient available stock'
);

-- Test release_reservation function using the stored movement ID
DO $$
DECLARE
    v_movement_id UUID;
    v_release_result JSON;
BEGIN
    SELECT id INTO v_movement_id FROM test_movement_ids LIMIT 1;
    v_release_result := release_reservation(v_movement_id, 'Test cancellation', 'Test User');
END $$;

SELECT pass('release_reservation can release reserved stock');

-- Verify reserved quantity reduced (should be back to 0 after full release)
SELECT results_eq(
  'SELECT reserved_quantity FROM inventory WHERE product_id = ''c5d6e7f8-a9b0-1234-cdef-567890123456''::uuid AND warehouse_id = ''e7f8a9b0-c1d2-3456-efab-789012345678''::uuid',
  'SELECT 0::INTEGER',
  'Reserved quantity is correct after release'
);

-- Test get_product_total_inventory function
SELECT results_eq(
  $$SELECT total_quantity, warehouse_count 
    FROM get_product_total_inventory('d6e7f8a9-b0c1-2345-defa-678901234567'::uuid)$$,
  $$SELECT 50::INTEGER, 2::INTEGER$$,
  'get_product_total_inventory returns correct totals'
);

SELECT * FROM finish();
ROLLBACK;