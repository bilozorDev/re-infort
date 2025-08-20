-- Update products table to support multiple photos
-- Change from single photo_url to array of photo_urls

-- Add new column for photo URLs array
ALTER TABLE products ADD COLUMN photo_urls TEXT[] DEFAULT '{}';

-- Migrate existing photo_url data to photo_urls array
UPDATE products 
SET photo_urls = ARRAY[photo_url] 
WHERE photo_url IS NOT NULL AND photo_url != '';

-- Drop the old photo_url column
ALTER TABLE products DROP COLUMN photo_url;

-- Add constraint to limit number of photos to 5
ALTER TABLE products ADD CONSTRAINT max_5_photos 
CHECK (array_length(photo_urls, 1) IS NULL OR array_length(photo_urls, 1) <= 5);

-- Create index for better query performance
CREATE INDEX idx_products_photo_urls ON products USING GIN (photo_urls);