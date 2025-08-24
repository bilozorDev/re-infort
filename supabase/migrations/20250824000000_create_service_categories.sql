-- Create service_categories table for managing service categories
CREATE TABLE service_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    created_by_name TEXT,
    
    -- Ensure unique category names per organization
    UNIQUE(organization_clerk_id, name)
);

-- Add service_category_id to services table (nullable for backward compatibility)
ALTER TABLE services 
ADD COLUMN service_category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_service_categories_org ON service_categories(organization_clerk_id);
CREATE INDEX idx_service_categories_status ON service_categories(status);
CREATE INDEX idx_services_service_category_id ON services(service_category_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE
    ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_categories

-- Policy: Users can view categories for their organization
CREATE POLICY "Users can view own org service categories" ON service_categories
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create categories for their organization (admin check at API level)
CREATE POLICY "Users can create service categories for own org" ON service_categories
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can update categories for their organization (admin check at API level)
CREATE POLICY "Users can update own org service categories" ON service_categories
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

-- Policy: Users can delete categories for their organization (admin check at API level)
CREATE POLICY "Users can delete own org service categories" ON service_categories
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Add comment to table
COMMENT ON TABLE service_categories IS 'Categories for organizing services';
COMMENT ON COLUMN services.service_category_id IS 'Reference to service category';

-- Migration function to create initial categories from existing services
DO $$
DECLARE
    r RECORD;
    new_category_id UUID;
BEGIN
    -- Loop through distinct categories per organization
    FOR r IN 
        SELECT DISTINCT organization_clerk_id, category, created_by_clerk_user_id, created_by_name
        FROM services 
        WHERE category IS NOT NULL AND category != ''
    LOOP
        -- Insert the category
        INSERT INTO service_categories (
            organization_clerk_id, 
            name, 
            created_by_clerk_user_id,
            created_by_name
        )
        VALUES (
            r.organization_clerk_id, 
            r.category, 
            r.created_by_clerk_user_id,
            r.created_by_name
        )
        ON CONFLICT (organization_clerk_id, name) DO NOTHING
        RETURNING id INTO new_category_id;
        
        -- Update services to reference the new category
        IF new_category_id IS NOT NULL THEN
            UPDATE services 
            SET service_category_id = new_category_id
            WHERE organization_clerk_id = r.organization_clerk_id 
              AND category = r.category;
        ELSE
            -- Category already exists, get its ID
            SELECT id INTO new_category_id
            FROM service_categories
            WHERE organization_clerk_id = r.organization_clerk_id 
              AND name = r.category;
            
            UPDATE services 
            SET service_category_id = new_category_id
            WHERE organization_clerk_id = r.organization_clerk_id 
              AND category = r.category;
        END IF;
    END LOOP;
END $$;