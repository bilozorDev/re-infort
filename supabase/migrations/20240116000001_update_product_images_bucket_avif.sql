-- Update product-images bucket to add AVIF support
-- This migration updates the existing bucket's allowed_mime_types array

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
WHERE id = 'product-images';

-- Verify the update by selecting the bucket configuration
DO $$
DECLARE
    mime_types text[];
BEGIN
    SELECT allowed_mime_types INTO mime_types
    FROM storage.buckets
    WHERE id = 'product-images';
    
    IF NOT ('image/avif' = ANY(mime_types)) THEN
        RAISE EXCEPTION 'Failed to add AVIF support to product-images bucket';
    END IF;
    
    RAISE NOTICE 'Successfully updated product-images bucket with AVIF support. Allowed types: %', mime_types;
END $$;