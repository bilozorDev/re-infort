-- Drop the unique constraint on organization_clerk_id and code
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_organization_clerk_id_code_key;

-- Drop the index on code
DROP INDEX IF EXISTS idx_warehouses_code;

-- Drop the code column
ALTER TABLE warehouses DROP COLUMN IF EXISTS code;

-- Add comment about the change
COMMENT ON TABLE warehouses IS 'Stores warehouse/location information for inventory tracking. Code field removed as it was redundant with name field.';