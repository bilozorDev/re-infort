-- Add created_by_name column to track user names permanently for audit trail

-- Add to stock_movements table
ALTER TABLE stock_movements 
ADD COLUMN created_by_name TEXT;

-- Add to warehouses table  
ALTER TABLE warehouses
ADD COLUMN created_by_name TEXT;

-- Add to categories table
ALTER TABLE categories
ADD COLUMN created_by_name TEXT;

-- Add to subcategories table
ALTER TABLE subcategories  
ADD COLUMN created_by_name TEXT;

-- Add to products table
ALTER TABLE products
ADD COLUMN created_by_name TEXT;

-- Add to inventory table
ALTER TABLE inventory
ADD COLUMN created_by_name TEXT;

-- Add to price_history table
ALTER TABLE price_history
ADD COLUMN created_by_name TEXT;

-- Add to feature_definitions table
ALTER TABLE feature_definitions
ADD COLUMN created_by_name TEXT;

-- Update the stock_movements_details view to include the new column
DROP VIEW IF EXISTS stock_movements_details;

CREATE VIEW stock_movements_details AS
SELECT 
    sm.*,
    p.name as product_name,
    p.sku as product_sku,
    fw.name as from_warehouse_name,
    tw.name as to_warehouse_name
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN warehouses fw ON sm.from_warehouse_id = fw.id
LEFT JOIN warehouses tw ON sm.to_warehouse_id = tw.id;

-- Add comments
COMMENT ON COLUMN stock_movements.created_by_name IS 'Full name of the user who created this movement';
COMMENT ON COLUMN warehouses.created_by_name IS 'Full name of the user who created this warehouse';
COMMENT ON COLUMN categories.created_by_name IS 'Full name of the user who created this category';
COMMENT ON COLUMN subcategories.created_by_name IS 'Full name of the user who created this subcategory';
COMMENT ON COLUMN products.created_by_name IS 'Full name of the user who created this product';
COMMENT ON COLUMN inventory.created_by_name IS 'Full name of the user who created this inventory record';
COMMENT ON COLUMN price_history.created_by_name IS 'Full name of the user who created this price change';
COMMENT ON COLUMN feature_definitions.created_by_name IS 'Full name of the user who created this feature definition';