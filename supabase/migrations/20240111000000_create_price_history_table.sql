-- Create price history table
CREATE TABLE price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    
    -- Product reference
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Price changes
    old_cost DECIMAL(10, 2),
    new_cost DECIMAL(10, 2),
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    
    -- Change type
    change_type TEXT NOT NULL CHECK (change_type IN ('cost', 'price', 'both')),
    
    -- Reason for change
    reason TEXT,
    notes TEXT,
    
    -- Effective date (when this price change takes effect)
    effective_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_price_history_organization_clerk_id ON price_history(organization_clerk_id);
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_effective_date ON price_history(effective_date DESC);
CREATE INDEX idx_price_history_created_at ON price_history(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_history table
-- Policy: Users can view price history from their organization
CREATE POLICY "Users can view own org price history" ON price_history
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create price history for their organization
CREATE POLICY "Users can create price history for own org" ON price_history
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- No update or delete policies - price history should be immutable

-- Create a trigger to automatically record price changes when products are updated
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if cost or price has changed
    IF (OLD.cost IS DISTINCT FROM NEW.cost) OR (OLD.price IS DISTINCT FROM NEW.price) THEN
        -- Determine change type
        DECLARE
            v_change_type TEXT;
        BEGIN
            IF (OLD.cost IS DISTINCT FROM NEW.cost) AND (OLD.price IS DISTINCT FROM NEW.price) THEN
                v_change_type := 'both';
            ELSIF OLD.cost IS DISTINCT FROM NEW.cost THEN
                v_change_type := 'cost';
            ELSE
                v_change_type := 'price';
            END IF;
            
            -- Insert price history record
            INSERT INTO price_history (
                organization_clerk_id,
                product_id,
                old_cost,
                new_cost,
                old_price,
                new_price,
                change_type,
                reason,
                created_by_clerk_user_id
            ) VALUES (
                NEW.organization_clerk_id,
                NEW.id,
                OLD.cost,
                NEW.cost,
                OLD.price,
                NEW.price,
                v_change_type,
                'Automatic recording on product update',
                COALESCE(
                    current_setting('request.jwt.claims', true)::json->>'sub',
                    'system'
                )
            );
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on products table
CREATE TRIGGER record_product_price_change
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION record_price_change();

-- Create a view for easier price history queries with product details
CREATE VIEW price_history_details AS
SELECT 
    ph.*,
    p.name as product_name,
    p.sku as product_sku,
    p.status as product_status
FROM price_history ph
JOIN products p ON ph.product_id = p.id;

-- Add comment to table
COMMENT ON TABLE price_history IS 'Tracks all price and cost changes for products over time';
COMMENT ON VIEW price_history_details IS 'Detailed view of price history with product information';