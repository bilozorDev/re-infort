-- Fix organization isolation for database views
-- This migration addresses a critical security issue where views were exposing data across organizations

-- Drop existing insecure views
DROP VIEW IF EXISTS inventory_details CASCADE;
DROP VIEW IF EXISTS stock_movements_details CASCADE;
DROP VIEW IF EXISTS price_history_details CASCADE;

-- Create secure view for inventory_details with organization filtering
CREATE OR REPLACE VIEW inventory_details AS
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
JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.organization_clerk_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    current_setting('request.jwt.claims', true)::json->'o'->>'id'
);

-- Create secure view for stock_movements_details with organization filtering
CREATE OR REPLACE VIEW stock_movements_details AS
SELECT 
    sm.*,
    p.name as product_name,
    p.sku as product_sku,
    fw.name as from_warehouse_name,
    tw.name as to_warehouse_name,
    CASE 
        WHEN sm.status = 'reserved' THEN 'Pending'
        WHEN sm.status = 'completed' THEN 'Completed'
        ELSE sm.status
    END as display_status
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN warehouses fw ON sm.from_warehouse_id = fw.id
LEFT JOIN warehouses tw ON sm.to_warehouse_id = tw.id
WHERE sm.organization_clerk_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    current_setting('request.jwt.claims', true)::json->'o'->>'id'
);

-- Create secure view for price_history_details with organization filtering
CREATE OR REPLACE VIEW price_history_details AS
SELECT 
    ph.*,
    p.name as product_name,
    p.sku as product_sku,
    p.status as product_status
FROM price_history ph
JOIN products p ON ph.product_id = p.id
WHERE ph.organization_clerk_id = COALESCE(
    current_setting('request.jwt.claims', true)::json->>'org_id',
    current_setting('request.jwt.claims', true)::json->'o'->>'id'
);

-- Grant appropriate permissions
GRANT SELECT ON inventory_details TO authenticated;
GRANT SELECT ON stock_movements_details TO authenticated;
GRANT SELECT ON price_history_details TO authenticated;

-- Add comments explaining the security fix
COMMENT ON VIEW inventory_details IS 'Organization-filtered view of inventory with product and warehouse information';
COMMENT ON VIEW stock_movements_details IS 'Organization-filtered view of stock movements with product and warehouse information';
COMMENT ON VIEW price_history_details IS 'Organization-filtered view of price history with product information';

-- Verify RPC functions have proper organization filtering
-- The following functions already have organization filtering built in:
-- - get_product_total_inventory (filters at line 261-264)
-- - adjust_inventory (uses organization from JWT)
-- - transfer_inventory (uses organization from JWT)
-- - reserve_inventory (uses organization from JWT)
-- - release_reservation (uses organization from JWT)
-- - complete_reservation (uses organization from JWT)

-- Create a helper function to verify organization access for debugging
CREATE OR REPLACE FUNCTION verify_organization_access()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id',
        'NO_ORGANIZATION_FOUND'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_organization_access() TO authenticated;

COMMENT ON FUNCTION verify_organization_access() IS 'Helper function to verify organization access from JWT claims';