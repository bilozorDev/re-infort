-- Create category_templates table for storing template metadata
CREATE TABLE category_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    business_type TEXT NOT NULL,
    icon TEXT, -- Icon name or URL for the template
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create template_categories table for categories within templates
CREATE TABLE template_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID NOT NULL REFERENCES category_templates(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Ensure unique category names within a template
    UNIQUE(template_id, name)
);

-- Create template_subcategories table
CREATE TABLE template_subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_category_id UUID NOT NULL REFERENCES template_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Ensure unique subcategory names within a category
    UNIQUE(template_category_id, name)
);

-- Create template_features table for feature definitions
CREATE TABLE template_features (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_category_id UUID REFERENCES template_categories(id) ON DELETE CASCADE,
    template_subcategory_id UUID REFERENCES template_subcategories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('text', 'number', 'select', 'boolean', 'date')),
    options JSONB, -- For select type inputs
    unit TEXT, -- For measurements (e.g., GB, MHz, inches)
    is_required BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Ensure either category or subcategory is set, not both
    CHECK (
        (template_category_id IS NOT NULL AND template_subcategory_id IS NULL) OR
        (template_category_id IS NULL AND template_subcategory_id IS NOT NULL)
    )
);

-- Create indexes for better query performance
CREATE INDEX idx_template_categories_template_id ON template_categories(template_id);
CREATE INDEX idx_template_subcategories_category_id ON template_subcategories(template_category_id);
CREATE INDEX idx_template_features_category_id ON template_features(template_category_id);
CREATE INDEX idx_template_features_subcategory_id ON template_features(template_subcategory_id);
CREATE INDEX idx_category_templates_business_type ON category_templates(business_type);
CREATE INDEX idx_category_templates_is_active ON category_templates(is_active);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_category_templates_updated_at BEFORE UPDATE
    ON category_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_features ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Templates are read-only for all authenticated users
-- Only system admins can modify templates (handled at API level)

-- Policy: All authenticated users can view active templates
CREATE POLICY "Users can view active templates" ON category_templates
    FOR SELECT
    USING (is_active = true);

-- Policy: All authenticated users can view template categories
CREATE POLICY "Users can view template categories" ON template_categories
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM category_templates 
        WHERE category_templates.id = template_categories.template_id 
        AND category_templates.is_active = true
    ));

-- Policy: All authenticated users can view template subcategories
CREATE POLICY "Users can view template subcategories" ON template_subcategories
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM template_categories
        JOIN category_templates ON category_templates.id = template_categories.template_id
        WHERE template_categories.id = template_subcategories.template_category_id
        AND category_templates.is_active = true
    ));

-- Policy: All authenticated users can view template features
CREATE POLICY "Users can view template features" ON template_features
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM template_categories
            JOIN category_templates ON category_templates.id = template_categories.template_id
            WHERE template_categories.id = template_features.template_category_id
            AND category_templates.is_active = true
        )
        OR
        EXISTS (
            SELECT 1 FROM template_subcategories
            JOIN template_categories ON template_categories.id = template_subcategories.template_category_id
            JOIN category_templates ON category_templates.id = template_categories.template_id
            WHERE template_subcategories.id = template_features.template_subcategory_id
            AND category_templates.is_active = true
        )
    );

-- Add comments to tables
COMMENT ON TABLE category_templates IS 'Predefined category structure templates for different business types';
COMMENT ON TABLE template_categories IS 'Categories defined within each template';
COMMENT ON TABLE template_subcategories IS 'Subcategories for template categories';
COMMENT ON TABLE template_features IS 'Feature definitions for template categories and subcategories';