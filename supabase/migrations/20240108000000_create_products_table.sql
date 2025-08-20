-- Create products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_clerk_id TEXT NOT NULL,
    
    -- Basic product information
    name TEXT NOT NULL,
    sku TEXT NOT NULL,
    description TEXT,
    
    -- Category relationship
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
    
    -- Pricing
    cost DECIMAL(10, 2) DEFAULT 0 CHECK (cost >= 0),
    price DECIMAL(10, 2) DEFAULT 0 CHECK (price >= 0),
    
    -- Additional fields
    photo_url TEXT,
    link TEXT,
    serial_number TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    created_by_clerk_user_id TEXT NOT NULL,
    
    -- Ensure unique SKU per organization
    UNIQUE(organization_clerk_id, sku)
);

-- Create indexes for better query performance
CREATE INDEX idx_products_organization_clerk_id ON products(organization_clerk_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_subcategory_id ON products(subcategory_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_name ON products(name);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_products_updated_at BEFORE UPDATE
    ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products table
-- Policy: Users can view products from their organization
CREATE POLICY "Users can view own org products" ON products
    FOR SELECT
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can create products for their organization
CREATE POLICY "Users can create products for own org" ON products
    FOR INSERT
    WITH CHECK (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Policy: Users can update products from their organization
CREATE POLICY "Users can update own org products" ON products
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

-- Policy: Users can delete products from their organization
CREATE POLICY "Users can delete own org products" ON products
    FOR DELETE
    USING (
        organization_clerk_id = COALESCE(
            current_setting('request.jwt.claims', true)::json->>'org_id',
            current_setting('request.jwt.claims', true)::json->'o'->>'id'
        )
    );

-- Add comment to table
COMMENT ON TABLE products IS 'Product catalog with SKU, pricing, and category information';