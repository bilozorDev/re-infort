-- Create feature definitions table to store category/subcategory specific feature templates
CREATE TABLE feature_definitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    
    -- Link to category or subcategory (at least one should be set)
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
    
    -- Feature details
    name TEXT NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('text', 'number', 'select', 'boolean', 'date')),
    options JSONB, -- For select type: ["8GB", "16GB", "32GB"]
    unit TEXT, -- e.g., "inches", "GB", "MHz"
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    
    -- Ensure unique feature names per category/subcategory
    UNIQUE(organization_clerk_id, category_id, name) WHERE subcategory_id IS NULL,
    UNIQUE(organization_clerk_id, subcategory_id, name) WHERE subcategory_id IS NOT NULL,
    
    -- Ensure at least category_id or subcategory_id is set
    CHECK (category_id IS NOT NULL OR subcategory_id IS NOT NULL)
);

-- Create indexes for better query performance
CREATE INDEX idx_feature_definitions_organization_clerk_id ON feature_definitions(organization_clerk_id);
CREATE INDEX idx_feature_definitions_category_id ON feature_definitions(category_id);
CREATE INDEX idx_feature_definitions_subcategory_id ON feature_definitions(subcategory_id);
CREATE INDEX idx_feature_definitions_display_order ON feature_definitions(display_order);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_feature_definitions_updated_at BEFORE UPDATE
    ON feature_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE feature_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feature_definitions table
-- Policy: Users can view feature definitions from their organization
CREATE POLICY "Users can view own org feature definitions" ON feature_definitions
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create feature definitions for their organization (admin check in API)
CREATE POLICY "Users can create feature definitions for own org" ON feature_definitions
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can update feature definitions from their organization (admin check in API)
CREATE POLICY "Users can update own org feature definitions" ON feature_definitions
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

-- Policy: Users can delete feature definitions from their organization (admin check in API)
CREATE POLICY "Users can delete own org feature definitions" ON feature_definitions
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Add comment to table
COMMENT ON TABLE feature_definitions IS 'Feature templates for categories and subcategories. Admin role checks happen in API layer.';