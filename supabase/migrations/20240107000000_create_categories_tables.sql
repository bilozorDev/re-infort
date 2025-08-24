-- Create categories table
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    
    -- Ensure unique category names per organization
    UNIQUE(organization_clerk_id, name)
);

-- Create subcategories table
CREATE TABLE subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    
    -- Ensure unique subcategory names per category
    UNIQUE(category_id, name)
);

-- Create indexes for better query performance
CREATE INDEX idx_categories_organization_clerk_id ON categories(organization_clerk_id);
CREATE INDEX idx_categories_status ON categories(status);
CREATE INDEX idx_subcategories_organization_clerk_id ON subcategories(organization_clerk_id);
CREATE INDEX idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX idx_subcategories_status ON subcategories(status);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE
    ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE
    ON subcategories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if the user has admin role in their JWT claims
    -- Clerk stores role in the metadata
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->'metadata'->>'role' = 'admin',
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for categories table
-- Policy: All authenticated users can view categories from their organization
CREATE POLICY "Users can view own org categories" ON categories
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Only admins can create categories for their organization
CREATE POLICY "Admins can create categories for own org" ON categories
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- Policy: Only admins can update categories from their organization
CREATE POLICY "Admins can update own org categories" ON categories
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    )
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- Policy: Only admins can delete categories from their organization
CREATE POLICY "Admins can delete own org categories" ON categories
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- RLS Policies for subcategories table
-- Policy: All authenticated users can view subcategories from their organization
CREATE POLICY "Users can view own org subcategories" ON subcategories
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Only admins can create subcategories for their organization
CREATE POLICY "Admins can create subcategories for own org" ON subcategories
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- Policy: Only admins can update subcategories from their organization
CREATE POLICY "Admins can update own org subcategories" ON subcategories
    FOR UPDATE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    )
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- Policy: Only admins can delete subcategories from their organization
CREATE POLICY "Admins can delete own org subcategories" ON subcategories
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
        AND is_admin_user()
    );

-- Add comments to tables
COMMENT ON TABLE categories IS 'Product categories - can only be managed by admin users';
COMMENT ON TABLE subcategories IS 'Product subcategories - can only be managed by admin users';