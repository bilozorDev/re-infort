-- Create storage bucket for product images with RLS policies
-- Following the same pattern as categories: organization filtering at database level

-- Create the storage bucket for product images (private bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images', 
    false, -- Private bucket: requires authentication
    5242880, -- 5MB limit per file
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Helper function to extract organization ID from storage path
-- Path format: {organization_id}/{product_id}/{filename}
CREATE OR REPLACE FUNCTION get_org_id_from_path(object_name text)
RETURNS text AS $$
BEGIN
    RETURN split_part(object_name, '/', 1);
END;
$$ LANGUAGE plpgsql;

-- RLS Policies for product images storage
-- Following the pattern: organization filtering only (no admin checks needed)

-- Policy: Users can upload images for their organization's products
CREATE POLICY "Users can upload product images for own org" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
    bucket_id = 'product-images' AND
    get_org_id_from_path(name) = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
);

-- Policy: Users can view images from their organization's products
CREATE POLICY "Users can view product images from own org" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
    bucket_id = 'product-images' AND
    get_org_id_from_path(name) = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
);

-- Policy: Users can update images for their organization's products
CREATE POLICY "Users can update product images for own org" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
    bucket_id = 'product-images' AND
    get_org_id_from_path(name) = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
)
WITH CHECK (
    bucket_id = 'product-images' AND
    get_org_id_from_path(name) = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
);

-- Policy: Users can delete images from their organization's products
CREATE POLICY "Users can delete product images from own org" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
    bucket_id = 'product-images' AND
    get_org_id_from_path(name) = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
);