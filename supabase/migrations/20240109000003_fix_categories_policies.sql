-- Drop existing category policies
DROP POLICY IF EXISTS "Users can view own org categories" ON categories;
DROP POLICY IF EXISTS "Admins can create categories for own org" ON categories;
DROP POLICY IF EXISTS "Admins can update own org categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete own org categories" ON categories;

-- Drop existing subcategory policies
DROP POLICY IF EXISTS "Users can view own org subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can create subcategories for own org" ON subcategories;
DROP POLICY IF EXISTS "Admins can update own org subcategories" ON subcategories;
DROP POLICY IF EXISTS "Admins can delete own org subcategories" ON subcategories;

-- Recreate category policies using auth.jwt() like warehouses
-- Policy: All authenticated users can view categories from their organization
CREATE POLICY "Users can view own org categories" ON categories
    FOR SELECT
    USING (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
    );

-- Policy: Only admins can create categories
CREATE POLICY "Admins can create categories for own org" ON categories
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    );

-- Policy: Only admins can update categories
CREATE POLICY "Admins can update own org categories" ON categories
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

-- Policy: Only admins can delete categories
CREATE POLICY "Admins can delete own org categories" ON categories
    FOR DELETE
    USING (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    );

-- Recreate subcategory policies using auth.jwt() like warehouses
-- Policy: All authenticated users can view subcategories from their organization
CREATE POLICY "Users can view own org subcategories" ON subcategories
    FOR SELECT
    USING (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
    );

-- Policy: Only admins can create subcategories
CREATE POLICY "Admins can create subcategories for own org" ON subcategories
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    );

-- Policy: Only admins can update subcategories
CREATE POLICY "Admins can update own org subcategories" ON subcategories
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

-- Policy: Only admins can delete subcategories
CREATE POLICY "Admins can delete own org subcategories" ON subcategories
    FOR DELETE
    USING (
        organization_clerk_id = (auth.jwt() -> 'o' ->> 'id')::TEXT
        AND (
            (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
            OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
        )
    );

-- Add comments
COMMENT ON TABLE categories IS 'Product categories - can only be managed by admin users (metadata = org:admin or o.rol = admin)';
COMMENT ON TABLE subcategories IS 'Product subcategories - can only be managed by admin users (metadata = org:admin or o.rol = admin)';