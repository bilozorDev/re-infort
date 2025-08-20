-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON warehouses;
DROP POLICY IF EXISTS "Authenticated users can create warehouses" ON warehouses;
DROP POLICY IF EXISTS "Authenticated users can update warehouses" ON warehouses;
DROP POLICY IF EXISTS "Authenticated users can delete warehouses" ON warehouses;

-- Create new policies that filter by organization
-- These policies ensure users can only access warehouses from their own organization

-- Policy: Users can only view warehouses from their organization
CREATE POLICY "Users can view own org warehouses" ON warehouses
    FOR SELECT
    USING (
        -- Allow if the warehouse belongs to the user's organization
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can only create warehouses for their organization
CREATE POLICY "Users can create warehouses for own org" ON warehouses
    FOR INSERT
    WITH CHECK (
        -- Ensure the warehouse is being created for the user's organization
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can only update warehouses from their organization
CREATE POLICY "Users can update own org warehouses" ON warehouses
    FOR UPDATE
    USING (
        -- Can only see warehouses from their org
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    )
    WITH CHECK (
        -- Can only update to their org
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can only delete warehouses from their organization
CREATE POLICY "Users can delete own org warehouses" ON warehouses
    FOR DELETE
    USING (
        -- Can only delete warehouses from their org
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Add comment documenting the security model
COMMENT ON TABLE warehouses IS 'Warehouses are filtered by organization at both RLS and application level. Admin role checks happen in API layer.';