-- Add low_stock_threshold to products table
ALTER TABLE products 
ADD COLUMN low_stock_threshold INTEGER DEFAULT 0 CHECK (low_stock_threshold >= 0);

-- Drop the existing view first since it depends on the columns we're dropping
DROP VIEW IF EXISTS inventory_details;

-- Drop reorder columns from inventory table
ALTER TABLE inventory 
DROP COLUMN IF EXISTS reorder_point,
DROP COLUMN IF EXISTS reorder_quantity;

-- Recreate inventory_details view without reorder columns

CREATE VIEW inventory_details AS
SELECT 
    i.*,
    p.name as product_name,
    p.sku as product_sku,
    p.cost as product_cost,
    p.price as product_price,
    p.category_id,
    p.subcategory_id,
    w.name as warehouse_name,
    w.type as warehouse_type,
    w.status as warehouse_status,
    (i.quantity - i.reserved_quantity) as available_quantity
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN warehouses w ON i.warehouse_id = w.id;

-- Grant permissions
GRANT SELECT ON inventory_details TO authenticated;
GRANT SELECT ON inventory_details TO anon;

-- Add comment for clarity
COMMENT ON COLUMN products.low_stock_threshold IS 'Minimum total quantity across all warehouses before product is considered low stock';