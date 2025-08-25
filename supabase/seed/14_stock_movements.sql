-- Seed data for IT stock movements
-- Organization ID: org_test123
-- User ID: user_test123

-- Clean up existing stock movements
TRUNCATE TABLE stock_movements CASCADE;

-- Insert sample IT product stock movements
WITH warehouse_ids AS (
  SELECT id, name FROM warehouses WHERE organization_clerk_id = 'org_test123'
),
product_ids AS (
  SELECT id, sku, name FROM products WHERE organization_clerk_id = 'org_test123'
),
main_wh AS (
  SELECT id FROM warehouse_ids WHERE name = 'Main Warehouse'
),
store_wh AS (
  SELECT id FROM warehouse_ids WHERE name = 'Downtown Store'
),
dist_wh AS (
  SELECT id FROM warehouse_ids WHERE name = 'Delivery Van'
)
-- Insert recent movements
INSERT INTO stock_movements (product_id, movement_type, quantity, from_warehouse_id, to_warehouse_id, reason, reference_number, status, organization_clerk_id, created_by_clerk_user_id, created_at)
SELECT 
  p.id,
  m.movement_type,
  m.quantity,
  CASE 
    WHEN m.from_warehouse = 'main' THEN (SELECT id FROM main_wh)
    WHEN m.from_warehouse = 'store' THEN (SELECT id FROM store_wh)
    WHEN m.from_warehouse = 'dist' THEN (SELECT id FROM dist_wh)
    ELSE NULL
  END as from_warehouse_id,
  CASE 
    WHEN m.to_warehouse = 'main' THEN (SELECT id FROM main_wh)
    WHEN m.to_warehouse = 'store' THEN (SELECT id FROM store_wh)
    WHEN m.to_warehouse = 'dist' THEN (SELECT id FROM dist_wh)
    ELSE NULL
  END as to_warehouse_id,
  m.reason,
  m.reference_number,
  m.status,
  'org_test123',
  'user_test123',
  NOW() - (m.days_ago || ' days')::interval
FROM product_ids p
JOIN (
  VALUES
    -- Recent receipts - IT equipment (all completed)
    ('DELL-LAT-5540', 'receipt', 25, NULL, 'main', 'New laptop shipment received', 'PO-2024-IT-001', 'completed', 15),
    ('HP-ELITE-800', 'receipt', 20, NULL, 'main', 'Desktop order arrived', 'PO-2024-IT-002', 'completed', 14),
    ('CISCO-2960X-24', 'receipt', 10, NULL, 'main', 'Network equipment delivery', 'PO-2024-NET-001', 'completed', 13),
    ('SAMSUNG-980-1TB', 'receipt', 100, NULL, 'main', 'SSD bulk purchase', 'PO-2024-STO-001', 'completed', 12),
    ('CAT6-10FT', 'receipt', 500, NULL, 'main', 'Cable inventory replenishment', 'PO-2024-CAB-001', 'completed', 11),
    ('LOGITECH-MX-KEYS', 'receipt', 50, NULL, 'main', 'Peripheral stock', 'PO-2024-PER-001', 'completed', 10),
    
    -- Transfers to store (mix of completed and reserved)
    ('DELL-LAT-5540', 'transfer', 3, 'main', 'store', 'Display models for store', 'TR-2024-001', 'completed', 9),
    ('APPLE-MBP-14', 'transfer', 2, 'main', 'store', 'Store stock replenishment', 'TR-2024-002', 'completed', 8),
    ('SAMSUNG-980-1TB', 'transfer', 15, 'main', 'store', 'Popular item restocking', 'TR-2024-003', 'completed', 7),
    ('CAT6-3FT', 'transfer', 100, 'main', 'store', 'Cable inventory for store', 'TR-2024-004', 'completed', 6),
    ('TP-LINK-AC600', 'transfer', 10, 'main', 'store', 'WiFi adapter stock', 'TR-2024-005', 'completed', 5),
    
    -- Reserved transfers (pending pickup - no destination yet)
    ('HP-ELITEBOOK-850', 'transfer', 5, 'main', NULL, 'Reserved for store pickup tomorrow', 'TR-2024-010', 'reserved', 0),
    ('DELL-P2423DE', 'transfer', 3, 'main', NULL, 'Reserved monitors for display', 'TR-2024-011', 'reserved', 0),
    ('LOGITECH-MX-MASTER3', 'transfer', 10, 'main', NULL, 'Reserved for upcoming promotion', 'TR-2024-012', 'reserved', 0),
    
    -- Transfers to delivery van (completed)
    ('DELL-LAT-5540', 'transfer', 1, 'main', 'dist', 'Mobile tech support', 'TR-2024-006', 'completed', 4),
    ('CAT6-6FT', 'transfer', 20, 'main', 'dist', 'Field service cables', 'TR-2024-007', 'completed', 4),
    ('KINGSTON-8GB-DDR4', 'transfer', 5, 'main', 'dist', 'RAM for on-site upgrades', 'TR-2024-008', 'completed', 3),
    
    -- Reserved for delivery van (no destination yet)
    ('SAMSUNG-980-1TB', 'transfer', 3, 'main', NULL, 'Reserved for tomorrow field service', 'TR-2024-013', 'reserved', 0),
    ('TP-LINK-AC600', 'transfer', 2, 'main', NULL, 'Reserved for client installation', 'TR-2024-014', 'reserved', 0),
    
    -- Sales from store (all completed)
    ('DELL-LAT-5540', 'sale', 2, 'store', NULL, 'Corporate purchase - 2 laptops', 'INV-2024-001', 'completed', 3),
    ('SAMSUNG-980-1TB', 'sale', 5, 'store', NULL, 'Customer upgrade orders', 'INV-2024-002', 'completed', 2),
    ('LOGITECH-MX-MASTER3', 'sale', 3, 'store', NULL, 'Office equipment sale', 'INV-2024-003', 'completed', 2),
    ('CAT6-10FT', 'sale', 25, 'store', NULL, 'Network cable bulk order', 'INV-2024-004', 'completed', 1),
    ('DELL-P2423DE', 'sale', 1, 'store', NULL, 'Monitor purchase', 'INV-2024-005', 'completed', 1),
    
    -- Reserved sales (customer orders awaiting pickup - holding stock in warehouse)
    ('APPLE-MBP-14', 'sale', 1, 'store', NULL, 'Reserved for customer pickup', 'INV-2024-010', 'reserved', 0),
    ('DELL-LAT-5540', 'sale', 3, 'main', NULL, 'Reserved for corporate order', 'INV-2024-011', 'reserved', 0),
    ('CISCO-2960X-24', 'sale', 1, 'main', NULL, 'Reserved for scheduled installation', 'INV-2024-012', 'reserved', 0),
    
    -- Sales from main warehouse (direct shipping - completed)
    ('DELL-R650', 'sale', 1, 'main', NULL, 'Server deployment project', 'INV-2024-006', 'completed', 5),
    ('CISCO-2960X-24', 'sale', 2, 'main', NULL, 'Network infrastructure upgrade', 'INV-2024-007', 'completed', 4),
    ('HP-DL380-G11', 'sale', 1, 'main', NULL, 'Data center expansion', 'INV-2024-008', 'completed', 3),
    
    -- Adjustments (all completed)
    ('WD-BLACK-2TB', 'adjustment', -2, 'main', NULL, 'DOA units returned to vendor', 'ADJ-2024-001', 'completed', 6),
    ('CAT6-100FT', 'adjustment', 10, 'main', NULL, 'Stock count correction - added', 'ADJ-2024-002', 'completed', 2),
    ('NETGEAR-GS108', 'adjustment', -1, 'store', NULL, 'Damaged in shipping', 'ADJ-2024-003', 'completed', 1),
    
    -- Returns (negative sales - all completed)
    ('TP-LINK-AC600', 'return', 1, NULL, 'store', 'Customer return - incompatible', 'RET-2024-001', 'completed', 2),
    ('USB-C-3FT', 'return', 2, NULL, 'main', 'Defective cable return', 'RET-2024-002', 'completed', 1)
) AS m(product_sku, movement_type, quantity, from_warehouse, to_warehouse, reason, reference_number, status, days_ago)
ON p.sku = m.product_sku;