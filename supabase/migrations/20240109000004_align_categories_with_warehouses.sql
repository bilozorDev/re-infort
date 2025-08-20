-- Align categories and subcategories RLS policies with warehouses approach
-- Organization filtering at database level, admin checks at API level

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

-- CATEGORIES - Organization filtering only (admin check in API)
-- Policy: Users can only view categories from their organization
CREATE POLICY "Users can view own org categories" ON categories
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can only create categories for their organization (admin check in API)
CREATE POLICY "Users can create categories for own org" ON categories
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can only update categories from their organization (admin check in API)
CREATE POLICY "Users can update own org categories" ON categories
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

-- Policy: Users can only delete categories from their organization (admin check in API)
CREATE POLICY "Users can delete own org categories" ON categories
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- SUBCATEGORIES - Organization filtering only (admin check in API)
-- Policy: Users can only view subcategories from their organization
CREATE POLICY "Users can view own org subcategories" ON subcategories
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can only create subcategories for their organization (admin check in API)
CREATE POLICY "Users can create subcategories for own org" ON subcategories
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can only update subcategories from their organization (admin check in API)
CREATE POLICY "Users can update own org subcategories" ON subcategories
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

-- Policy: Users can only delete subcategories from their organization (admin check in API)
CREATE POLICY "Users can delete own org subcategories" ON subcategories
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Update comments to reflect the security model
COMMENT ON TABLE categories IS 'Categories are filtered by organization at RLS level. Admin role checks happen in API layer (same as warehouses).';
COMMENT ON TABLE subcategories IS 'Subcategories are filtered by organization at RLS level. Admin role checks happen in API layer (same as warehouses).';