-- Create stock movements table
CREATE TABLE stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    
    -- Movement type
    movement_type TEXT NOT NULL CHECK (movement_type IN (
        'receipt',      -- Receiving new stock
        'sale',         -- Stock sold/shipped
        'transfer',     -- Transfer between warehouses
        'adjustment',   -- Manual adjustment
        'return',       -- Customer return
        'damage',       -- Damaged/lost stock
        'production'    -- Used in production/assembly
    )),
    
    -- Product and warehouse information
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    from_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    to_warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    -- Quantity moved (positive for additions, negative for removals)
    quantity INTEGER NOT NULL,
    
    -- Reference information
    reference_number TEXT, -- Order number, invoice number, etc.
    reference_type TEXT,   -- 'order', 'invoice', 'adjustment', etc.
    
    -- Movement details
    reason TEXT,
    notes TEXT,
    
    -- Cost tracking
    unit_cost DECIMAL(10, 2),
    total_cost DECIMAL(10, 2),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('reserved', 'completed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    
    -- Ensure transfers have both warehouses
    CONSTRAINT transfer_warehouses_check CHECK (
        (movement_type = 'transfer' AND from_warehouse_id IS NOT NULL AND to_warehouse_id IS NOT NULL) OR
        (movement_type != 'transfer')
    ),
    
    -- Ensure non-transfers have appropriate warehouse
    CONSTRAINT non_transfer_warehouse_check CHECK (
        (movement_type IN ('receipt', 'return') AND to_warehouse_id IS NOT NULL) OR
        (movement_type IN ('sale', 'damage', 'production', 'adjustment') AND from_warehouse_id IS NOT NULL) OR
        (movement_type = 'transfer')
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_stock_movements_organization_clerk_id ON stock_movements(organization_clerk_id);
CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_from_warehouse_id ON stock_movements(from_warehouse_id);
CREATE INDEX idx_stock_movements_to_warehouse_id ON stock_movements(to_warehouse_id);
CREATE INDEX idx_stock_movements_movement_type ON stock_movements(movement_type);
CREATE INDEX idx_stock_movements_status ON stock_movements(status);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_reference_number ON stock_movements(reference_number);

-- Enable Row Level Security (RLS)
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_movements table
-- Policy: Users can view stock movements from their organization
CREATE POLICY "Users can view own org stock movements" ON stock_movements
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create stock movements for their organization
CREATE POLICY "Users can create stock movements for own org" ON stock_movements
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can update their own reserved stock movements
CREATE POLICY "Users can update own reserved stock movements" ON stock_movements
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND status = 'reserved'
    )
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- No delete policy - stock movements should not be deleted

-- Create a view for easier stock movement queries with related details
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

-- Add comment to table
COMMENT ON TABLE stock_movements IS 'Tracks all inventory movements including receipts, sales, transfers, and adjustments';
COMMENT ON VIEW stock_movements_details IS 'Detailed view of stock movements with product and warehouse information';