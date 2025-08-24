-- Drop the old 4-parameter version of reserve_inventory function
-- The new version has 7 parameters with proper defaults
DROP FUNCTION IF EXISTS reserve_inventory(uuid, uuid, integer, text);