-- Remove the old category text field from services table
ALTER TABLE services DROP COLUMN IF EXISTS category;