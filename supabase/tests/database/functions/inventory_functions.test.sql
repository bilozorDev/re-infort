BEGIN;
SELECT plan(18);

-- Enable pgTAP extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Test function existence and signatures
SELECT has_function('public', 'adjust_inventory', 
    ARRAY['uuid', 'uuid', 'integer', 'text', 'text', 'text', 'text'],
    'adjust_inventory function exists with correct signature'
);

SELECT has_function('public', 'transfer_inventory',
    ARRAY['uuid', 'uuid', 'uuid', 'integer', 'text', 'text'],
    'transfer_inventory function exists with correct signature'
);

SELECT has_function('public', 'get_product_total_inventory',
    ARRAY['uuid'],
    'get_product_total_inventory function exists with correct signature'
);

SELECT has_function('public', 'reserve_inventory',
    ARRAY['uuid', 'uuid', 'integer', 'text'],
    'reserve_inventory function exists with correct signature'
);

SELECT has_function('public', 'release_reservation',
    ARRAY['uuid', 'uuid', 'integer'],
    'release_reservation function exists with correct signature'
);

-- Set up test data
SET LOCAL jwt.claims.org_id TO 'org_test123';
SET LOCAL jwt.claims.sub TO 'user_test';

-- Insert test categories, products, and warehouses
INSERT INTO categories (id, name, organization_clerk_id, created_by)
VALUES ('c1111111-1111-1111-1111-111111111111', 'Test Category', 'org_test123', 'user_test');

INSERT INTO products (id, name, sku, category_id, organization_clerk_id, created_by)
VALUES 
  ('p1111111-1111-1111-1111-111111111111', 'Test Product 1', 'SKU001', 'c1111111-1111-1111-1111-111111111111', 'org_test123', 'user_test'),
  ('p2222222-2222-2222-2222-222222222222', 'Test Product 2', 'SKU002', 'c1111111-1111-1111-1111-111111111111', 'org_test123', 'user_test');

INSERT INTO warehouses (id, name, organization_clerk_id, created_by)
VALUES 
  ('w1111111-1111-1111-1111-111111111111', 'Warehouse A', 'org_test123', 'user_test'),
  ('w2222222-2222-2222-2222-222222222222', 'Warehouse B', 'org_test123', 'user_test');

-- Test adjust_inventory function - add stock
SELECT lives_ok(
  $$SELECT adjust_inventory(
    'p1111111-1111-1111-1111-111111111111'::uuid, 
    'w1111111-1111-1111-1111-111111111111'::uuid, 
    100, 
    'purchase', 
    'Initial stock'
  )$$,
  'adjust_inventory can add stock to inventory'
);

-- Verify inventory was created with correct quantity
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''p1111111-1111-1111-1111-111111111111'' AND warehouse_id = ''w1111111-1111-1111-1111-111111111111''',
  'SELECT 100::INTEGER',
  'Inventory quantity is correct after adding stock'
);

-- Test adjust_inventory function - remove stock
SELECT lives_ok(
  $$SELECT adjust_inventory(
    'p1111111-1111-1111-1111-111111111111'::uuid, 
    'w1111111-1111-1111-1111-111111111111'::uuid, 
    -30, 
    'sale', 
    'Test sale'
  )$$,
  'adjust_inventory can remove stock from inventory'
);

-- Verify inventory quantity was updated
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''p1111111-1111-1111-1111-111111111111'' AND warehouse_id = ''w1111111-1111-1111-1111-111111111111''',
  'SELECT 70::INTEGER',
  'Inventory quantity is correct after removing stock'
);

-- Test adjust_inventory with insufficient stock (should fail)
SELECT throws_ok(
  $$SELECT adjust_inventory(
    'p1111111-1111-1111-1111-111111111111'::uuid, 
    'w1111111-1111-1111-1111-111111111111'::uuid, 
    -100, 
    'sale', 
    'Too much'
  )$$,
  'P0001',
  'Insufficient stock. Current: 70, Requested change: -100',
  'adjust_inventory throws error for insufficient stock'
);

-- Test transfer_inventory function
-- First add stock to source warehouse
SELECT adjust_inventory(
  'p2222222-2222-2222-2222-222222222222'::uuid, 
  'w1111111-1111-1111-1111-111111111111'::uuid, 
  50, 
  'purchase', 
  'Stock for transfer test'
);

SELECT lives_ok(
  $$SELECT transfer_inventory(
    'p2222222-2222-2222-2222-222222222222'::uuid,
    'w1111111-1111-1111-1111-111111111111'::uuid,
    'w2222222-2222-2222-2222-222222222222'::uuid,
    20,
    'Internal transfer'
  )$$,
  'transfer_inventory can transfer stock between warehouses'
);

-- Verify source warehouse quantity reduced
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''p2222222-2222-2222-2222-222222222222'' AND warehouse_id = ''w1111111-1111-1111-1111-111111111111''',
  'SELECT 30::INTEGER',
  'Source warehouse quantity reduced after transfer'
);

-- Verify destination warehouse quantity increased
SELECT results_eq(
  'SELECT quantity FROM inventory WHERE product_id = ''p2222222-2222-2222-2222-222222222222'' AND warehouse_id = ''w2222222-2222-2222-2222-222222222222''',
  'SELECT 20::INTEGER',
  'Destination warehouse quantity increased after transfer'
);

-- Test reserve_inventory function
SELECT lives_ok(
  $$SELECT reserve_inventory(
    'p1111111-1111-1111-1111-111111111111'::uuid,
    'w1111111-1111-1111-1111-111111111111'::uuid,
    25,
    'ORDER-123'
  )$$,
  'reserve_inventory can reserve available stock'
);

-- Verify reserved quantity
SELECT results_eq(
  'SELECT reserved_quantity FROM inventory WHERE product_id = ''p1111111-1111-1111-1111-111111111111'' AND warehouse_id = ''w1111111-1111-1111-1111-111111111111''',
  'SELECT 25::INTEGER',
  'Reserved quantity is correct after reservation'
);

-- Test reserve_inventory with insufficient available stock (should fail)
SELECT throws_ok(
  $$SELECT reserve_inventory(
    'p1111111-1111-1111-1111-111111111111'::uuid,
    'w1111111-1111-1111-1111-111111111111'::uuid,
    50,
    'ORDER-456'
  )$$,
  'P0001',
  'Insufficient available stock. Available: 45, Requested: 50',
  'reserve_inventory throws error for insufficient available stock'
);

-- Test release_reservation function
SELECT lives_ok(
  $$SELECT release_reservation(
    'p1111111-1111-1111-1111-111111111111'::uuid,
    'w1111111-1111-1111-1111-111111111111'::uuid,
    10
  )$$,
  'release_reservation can release reserved stock'
);

-- Verify reserved quantity reduced
SELECT results_eq(
  'SELECT reserved_quantity FROM inventory WHERE product_id = ''p1111111-1111-1111-1111-111111111111'' AND warehouse_id = ''w1111111-1111-1111-1111-111111111111''',
  'SELECT 15::INTEGER',
  'Reserved quantity is correct after release'
);

-- Test get_product_total_inventory function
SELECT results_eq(
  $$SELECT total_quantity, warehouse_count 
    FROM get_product_total_inventory('p2222222-2222-2222-2222-222222222222'::uuid)$$,
  $$SELECT 50::INTEGER, 2::INTEGER$$,
  'get_product_total_inventory returns correct totals'
);

SELECT * FROM finish();
ROLLBACK;