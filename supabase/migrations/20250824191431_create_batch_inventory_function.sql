-- Create batch function to get inventory for multiple products at once
-- This fixes the N+1 query pattern in the client code

CREATE OR REPLACE FUNCTION get_products_total_inventory(
    p_product_ids UUID[]
)
RETURNS TABLE (
    product_id UUID,
    total_quantity BIGINT,
    total_reserved BIGINT,
    total_available BIGINT,
    warehouse_count INTEGER,
    warehouses JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_organization_id TEXT;
BEGIN
    -- Get organization ID from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    
    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION 'Organization ID not found in JWT claims';
    END IF;
    
    RETURN QUERY
    WITH inventory_summary AS (
        SELECT 
            i.product_id,
            COALESCE(SUM(i.quantity), 0) AS total_quantity,
            COALESCE(SUM(i.reserved_quantity), 0) AS total_reserved,
            COALESCE(SUM(i.available_quantity), 0) AS total_available,
            COUNT(DISTINCT i.warehouse_id) AS warehouse_count,
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'warehouse_id', w.id,
                    'warehouse_name', w.name,
                    'quantity', i.quantity,
                    'reserved_quantity', i.reserved_quantity,
                    'available_quantity', i.available_quantity
                ) ORDER BY w.name
            ) AS warehouses
        FROM public.inventory i
        JOIN public.warehouses w ON w.id = i.warehouse_id
        WHERE i.product_id = ANY(p_product_ids)
        AND i.organization_clerk_id = v_organization_id
        AND w.organization_clerk_id = v_organization_id
        GROUP BY i.product_id
    )
    SELECT 
        p.id AS product_id,
        COALESCE(s.total_quantity, 0) AS total_quantity,
        COALESCE(s.total_reserved, 0) AS total_reserved,
        COALESCE(s.total_available, 0) AS total_available,
        COALESCE(s.warehouse_count, 0) AS warehouse_count,
        COALESCE(s.warehouses, '[]'::jsonb) AS warehouses
    FROM (SELECT UNNEST(p_product_ids) AS id) p
    LEFT JOIN inventory_summary s ON s.product_id = p.id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_products_total_inventory(UUID[]) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_products_total_inventory(UUID[]) IS 
'Batch function to get inventory summary for multiple products at once. 
Returns inventory totals and warehouse breakdown for each product ID provided.
This function improves performance by avoiding N+1 query patterns.';