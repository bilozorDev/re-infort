-- Create inventory table
CREATE TABLE inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    
    -- Product and warehouse relationship
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    
    -- Quantity tracking
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    
    -- When this product was first added to this warehouse
    since_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Location within warehouse (optional)
    location_details TEXT,
    
    -- Minimum stock level for reordering
    reorder_point INTEGER DEFAULT 0 CHECK (reorder_point >= 0),
    reorder_quantity INTEGER DEFAULT 0 CHECK (reorder_quantity >= 0),
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    
    -- Ensure unique product per warehouse
    UNIQUE(product_id, warehouse_id),
    
    -- Ensure reserved quantity doesn't exceed available quantity
    CONSTRAINT reserved_not_exceeding_quantity CHECK (reserved_quantity <= quantity)
);

-- Create indexes for better query performance
CREATE INDEX idx_inventory_organization_clerk_id ON inventory(organization_clerk_id);
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX idx_inventory_quantity ON inventory(quantity);
CREATE INDEX idx_inventory_since_date ON inventory(since_date);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE
    ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory table
-- Policy: Users can view inventory from their organization
CREATE POLICY "Users can view own org inventory" ON inventory
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create inventory records for their organization
CREATE POLICY "Users can create inventory for own org" ON inventory
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can update inventory from their organization
CREATE POLICY "Users can update own org inventory" ON inventory
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    )
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can delete inventory from their organization
CREATE POLICY "Users can delete own org inventory" ON inventory
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Create a view for easier inventory queries with product and warehouse details
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

-- Add comment to table
COMMENT ON TABLE inventory IS 'Tracks product quantities per warehouse with reservation support';
COMMENT ON VIEW inventory_details IS 'Detailed view of inventory with product and warehouse information';