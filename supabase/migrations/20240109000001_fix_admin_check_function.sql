-- Drop and recreate the is_admin_user function to properly check for admin role
-- This fixes the issue where Clerk stores the role in different JWT claim locations
-- This matches the approach used in warehouse RLS policies

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check the same locations as warehouse policies
    RETURN (
        (auth.jwt() ->> 'metadata')::TEXT = 'org:admin'
        OR (auth.jwt() -> 'o' ->> 'rol')::TEXT = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a comment explaining the function
COMMENT ON FUNCTION is_admin_user() IS 'Checks if the current user has admin role by looking for org:admin in metadata or admin in o.rol (Clerk JWT structure)';