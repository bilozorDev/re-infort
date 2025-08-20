-- Drop existing policies
DROP POLICY IF EXISTS "Organization members can view warehouses" ON warehouses;
DROP POLICY IF EXISTS "Only admins can create warehouses" ON warehouses;
DROP POLICY IF EXISTS "Only admins can update warehouses" ON warehouses;
DROP POLICY IF EXISTS "Only admins can delete warehouses" ON warehouses;

-- Create new RLS policies that work with Clerk JWT structure
-- Note: These policies check the raw JWT claims from Clerk

-- Policy: All authenticated users from the organization can view warehouses
CREATE POLICY "Organization members can view warehouses" ON warehouses
    FOR SELECT
    USING (
        -- Check if the organization_clerk_id matches the org ID in the JWT
        organization_clerk_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::TEXT
        OR organization_clerk_id = (current_setting('request.jwt.claims', true)::json->'o'->>'id')::TEXT
    );

-- Policy: Only admins can create warehouses
CREATE POLICY "Only admins can create warehouses" ON warehouses
    FOR INSERT
    WITH CHECK (
        -- Check organization ID matches
        (
            organization_clerk_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::TEXT
            OR organization_clerk_id = (current_setting('request.jwt.claims', true)::json->'o'->>'id')::TEXT
        )
        -- Check if user is admin
        AND (
            (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->>'metadata')::TEXT = 'org:admin'
        )
    );

-- Policy: Only admins can update warehouses
CREATE POLICY "Only admins can update warehouses" ON warehouses
    FOR UPDATE
    USING (
        -- Check organization ID matches
        (
            organization_clerk_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::TEXT
            OR organization_clerk_id = (current_setting('request.jwt.claims', true)::json->'o'->>'id')::TEXT
        )
        -- Check if user is admin
        AND (
            (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->>'metadata')::TEXT = 'org:admin'
        )
    )
    WITH CHECK (
        -- Check organization ID matches
        (
            organization_clerk_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::TEXT
            OR organization_clerk_id = (current_setting('request.jwt.claims', true)::json->'o'->>'id')::TEXT
        )
        -- Check if user is admin
        AND (
            (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->>'metadata')::TEXT = 'org:admin'
        )
    );

-- Policy: Only admins can delete warehouses
CREATE POLICY "Only admins can delete warehouses" ON warehouses
    FOR DELETE
    USING (
        -- Check organization ID matches
        (
            organization_clerk_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::TEXT
            OR organization_clerk_id = (current_setting('request.jwt.claims', true)::json->'o'->>'id')::TEXT
        )
        -- Check if user is admin
        AND (
            (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->>'org_role')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'org:admin'
            OR (current_setting('request.jwt.claims', true)::json->'o'->>'rol')::TEXT = 'admin'
            OR (current_setting('request.jwt.claims', true)::json->>'metadata')::TEXT = 'org:admin'
        )
    );

-- Add comment to document the changes
COMMENT ON TABLE warehouses IS 'Stores warehouse/location information for inventory tracking. RLS policies use Clerk JWT claims directly via current_setting.';