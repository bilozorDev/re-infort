-- Create services table
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_clerk_id TEXT NOT NULL,
    
    -- Service details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    
    -- Pricing
    rate_type TEXT CHECK (rate_type IN ('hourly', 'fixed', 'custom')) DEFAULT 'fixed',
    rate DECIMAL(10, 2),
    unit TEXT, -- e.g., 'hour', 'day', 'project'
    
    -- Status
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    
    -- Tracking
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_by_clerk_user_id TEXT NOT NULL,
    created_by_name TEXT,
    
    -- Constraints
    CONSTRAINT unique_service_name_per_org UNIQUE(organization_clerk_id, name)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_services_org ON services(organization_clerk_id);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- Create trigger for updating updated_at timestamp
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE
    ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own org services" ON services;
DROP POLICY IF EXISTS "Users can create services for own org" ON services;
DROP POLICY IF EXISTS "Users can update own org services" ON services;
DROP POLICY IF EXISTS "Users can delete own org services" ON services;

-- RLS Policies for services

-- Policy: Users can view services for their organization
CREATE POLICY "Users can view own org services" ON services
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create services for their organization (admin check at API level)
CREATE POLICY "Users can create services for own org" ON services
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can update services for their organization (admin check at API level)  
CREATE POLICY "Users can update own org services" ON services
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

-- Policy: Users can delete services for their organization (admin check at API level)
CREATE POLICY "Users can delete own org services" ON services
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Add comment to table
COMMENT ON TABLE services IS 'Service catalog for quotes and pricing';