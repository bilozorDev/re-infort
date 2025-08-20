-- Create warehouses table
CREATE TABLE warehouses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('office', 'vehicle', 'other')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    -- Location Information
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state_province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Ensure unique warehouse codes per organization
    UNIQUE(organization_clerk_id, code)
);

-- Create indexes for better query performance
CREATE INDEX idx_warehouses_organization_clerk_id ON warehouses(organization_clerk_id);
CREATE INDEX idx_warehouses_code ON warehouses(code);
CREATE INDEX idx_warehouses_status ON warehouses(status);
CREATE INDEX idx_warehouses_type ON warehouses(type);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE
    ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view warehouses from their organization
CREATE POLICY "Users can view own organization warehouses" ON warehouses
    FOR SELECT
    USING (
        organization_clerk_id = (auth.jwt() ->> 'org_id')::TEXT
    );

-- Policy: Users can insert warehouses for their organization
CREATE POLICY "Users can insert warehouses for own organization" ON warehouses
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = (auth.jwt() ->> 'org_id')::TEXT
    );

-- Policy: Users can update warehouses from their organization
CREATE POLICY "Users can update own organization warehouses" ON warehouses
    FOR UPDATE
    USING (
        organization_clerk_id = (auth.jwt() ->> 'org_id')::TEXT
    )
    WITH CHECK (
        organization_clerk_id = (auth.jwt() ->> 'org_id')::TEXT
    );

-- Policy: Users can delete warehouses from their organization
CREATE POLICY "Users can delete own organization warehouses" ON warehouses
    FOR DELETE
    USING (
        organization_clerk_id = (auth.jwt() ->> 'org_id')::TEXT
    );

-- Add comment to table
COMMENT ON TABLE warehouses IS 'Stores warehouse/location information for inventory tracking';