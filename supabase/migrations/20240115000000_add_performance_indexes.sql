-- Add composite indexes for improved query performance

-- Index for inventory lookups by product and warehouse
CREATE INDEX IF NOT EXISTS idx_inventory_product_warehouse 
ON inventory(product_id, warehouse_id);

-- Index for inventory queries that filter by organization
CREATE INDEX IF NOT EXISTS idx_inventory_org_product 
ON inventory(organization_clerk_id, product_id);

-- Index for stock movements by product and date
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date 
ON stock_movements(product_id, created_at DESC);

-- Index for stock movements by warehouse (both from and to)
CREATE INDEX IF NOT EXISTS idx_stock_movements_from_warehouse 
ON stock_movements(from_warehouse_id) 
WHERE from_warehouse_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_movements_to_warehouse 
ON stock_movements(to_warehouse_id) 
WHERE to_warehouse_id IS NOT NULL;

-- Index for stock movements by type and date
CREATE INDEX IF NOT EXISTS idx_stock_movements_type_date 
ON stock_movements(movement_type, created_at DESC);

-- Index for products by organization and status
CREATE INDEX IF NOT EXISTS idx_products_org_status 
ON products(organization_clerk_id, status);

-- Index for products by SKU (for quick lookups)
CREATE INDEX IF NOT EXISTS idx_products_sku 
ON products(sku, organization_clerk_id);

-- Index for products by category
CREATE INDEX IF NOT EXISTS idx_products_category 
ON products(category_id, organization_clerk_id) 
WHERE category_id IS NOT NULL;

-- Index for warehouses by organization and status
CREATE INDEX IF NOT EXISTS idx_warehouses_org_status 
ON warehouses(organization_clerk_id, status);

-- Index for inventory queries with reorder point checks
CREATE INDEX IF NOT EXISTS idx_inventory_reorder 
ON inventory(organization_clerk_id, product_id) 
WHERE quantity <= reorder_point;

-- Analyze tables to update statistics after adding indexes
ANALYZE inventory;
ANALYZE stock_movements;
ANALYZE products;
ANALYZE warehouses;