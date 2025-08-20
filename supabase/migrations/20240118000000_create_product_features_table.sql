-- Create product features table to store actual feature values for products
CREATE TABLE product_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    
    -- Product relationship
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    -- Optional link to feature definition (null for custom features)
    feature_definition_id UUID REFERENCES feature_definitions(id) ON DELETE SET NULL,
    
    -- Feature data
    name TEXT NOT NULL, -- Feature name (from definition or custom)
    value TEXT NOT NULL, -- The actual value (stored as text, parsed based on type)
    is_custom BOOLEAN DEFAULT false, -- True for custom features not from definitions
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Ensure unique feature names per product
    UNIQUE(product_id, name)
);

-- Create indexes for better query performance
CREATE INDEX idx_product_features_organization_clerk_id ON product_features(organization_clerk_id);
CREATE INDEX idx_product_features_product_id ON product_features(product_id);
CREATE INDEX idx_product_features_feature_definition_id ON product_features(feature_definition_id);
CREATE INDEX idx_product_features_is_custom ON product_features(is_custom);
CREATE INDEX idx_product_features_name ON product_features(name);
CREATE INDEX idx_product_features_value ON product_features(value);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_product_features_updated_at BEFORE UPDATE
    ON product_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_features table
-- Policy: Users can view product features from their organization
CREATE POLICY "Users can view own org product features" ON product_features
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create product features for their organization
CREATE POLICY "Users can create product features for own org" ON product_features
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can update product features from their organization
CREATE POLICY "Users can update own org product features" ON product_features
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

-- Policy: Users can delete product features from their organization
CREATE POLICY "Users can delete own org product features" ON product_features
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Add comment to table
COMMENT ON TABLE product_features IS 'Stores actual feature values for products, both from predefined definitions and custom features.';