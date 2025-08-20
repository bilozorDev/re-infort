-- Drop existing policies to recreate them with role-based access
DROP POLICY IF EXISTS "Users can view own organization warehouses" ON warehouses;
DROP POLICY IF EXISTS "Users can insert warehouses for own organization" ON warehouses;
DROP POLICY IF EXISTS "Users can update own organization warehouses" ON warehouses;
DROP POLICY IF EXISTS "Users can delete own organization warehouses" ON warehouses;

-- Create new role-based RLS policies

-- Policy: All authenticated users from the organization can view warehouses
CREATE POLICY "Organization members can view warehouses" ON warehouses
    FOR SELECT
    USING (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
    );

-- Policy: Only admins can create warehouses
CREATE POLICY "Only admins can create warehouses" ON warehouses
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    );

-- Policy: Only admins can update warehouses
CREATE POLICY "Only admins can update warehouses" ON warehouses
    FOR UPDATE
    USING (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    )
    WITH CHECK (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    );

-- Policy: Only admins can delete warehouses
CREATE POLICY "Only admins can delete warehouses" ON warehouses
    FOR DELETE
    USING (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    );

-- Add comment to document the role requirements
COMMENT ON TABLE warehouses IS 'Stores warehouse/location information for inventory tracking. Create/Update/Delete operations require admin role.';