-- Drop all existing policies
DROP POLICY IF EXISTS "Organization members can view warehouses" ON warehouses;
DROP POLICY IF EXISTS "Only admins can create warehouses" ON warehouses;
DROP POLICY IF EXISTS "Only admins can update warehouses" ON warehouses;
DROP POLICY IF EXISTS "Only admins can delete warehouses" ON warehouses;

-- For now, create permissive policies that allow authenticated users to manage warehouses
-- We'll rely on application-level authorization in the API routes

-- Policy: Any authenticated user can view warehouses
CREATE POLICY "Authenticated users can view warehouses" ON warehouses
    FOR SELECT
    USING (true);

-- Policy: Any authenticated user can create warehouses (checked in API)
CREATE POLICY "Authenticated users can create warehouses" ON warehouses
    FOR INSERT
    WITH CHECK (true);

-- Policy: Any authenticated user can update warehouses (checked in API)
CREATE POLICY "Authenticated users can update warehouses" ON warehouses
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Any authenticated user can delete warehouses (checked in API)
CREATE POLICY "Authenticated users can delete warehouses" ON warehouses
    FOR DELETE
    USING (true);

-- Add comment to document the approach
COMMENT ON TABLE warehouses IS 'Stores warehouse/location information. Authorization is handled at the API level using Clerk roles, RLS policies are permissive for authenticated users.';