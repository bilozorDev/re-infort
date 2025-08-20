-- Create a debug function to see what's in the JWT claims
CREATE OR REPLACE FUNCTION debug_jwt_claims()
RETURNS jsonb AS $$
BEGIN
    RETURN auth.jwt();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_jwt_claims() TO authenticated;

-- Also create a function to test admin status with debugging
CREATE OR REPLACE FUNCTION test_admin_status()
RETURNS TABLE (
    is_admin boolean,
    jwt_metadata text,
    org_role text,
    full_jwt jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        is_admin_user() as is_admin,
        (auth.jwt() ->> 'metadata')::TEXT as jwt_metadata,
        (auth.jwt() -> 'o' ->> 'rol')::TEXT as org_role,
        auth.jwt() as full_jwt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION test_admin_status() TO authenticated;