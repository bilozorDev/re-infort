-- Seed data for warehouses
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Clean up existing warehouse data
TRUNCATE TABLE warehouses CASCADE;

-- Insert sample warehouses (type must be 'office', 'vehicle', or 'other')
INSERT INTO warehouses (name, address, city, state_province, country, postal_code, type, status, is_default, organization_clerk_id, created_by_clerk_user_id, notes) VALUES
('Main Warehouse', '123 Industrial Blvd', 'San Francisco', 'CA', 'USA', '94105', 'office', 'active', true, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Primary distribution center'),
('Downtown Store', '456 Market Street', 'San Francisco', 'CA', 'USA', '94103', 'office', 'active', false, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Retail location with storage'),
('Delivery Van', '789 Logistics Way', 'Oakland', 'CA', 'USA', '94612', 'vehicle', 'active', false, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq', 'Mobile delivery vehicle');