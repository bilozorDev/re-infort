-- Seed data for warehouses
-- Organization ID: org_test123
-- User ID: user_test123

-- Clean up existing warehouse data
TRUNCATE TABLE warehouses CASCADE;

-- Insert sample warehouses (type must be 'office', 'vehicle', or 'other')
INSERT INTO warehouses (name, address, city, state_province, country, postal_code, type, status, is_default, organization_clerk_id, created_by_clerk_user_id, notes) VALUES
('Main Warehouse', '123 Industrial Blvd', 'San Francisco', 'CA', 'USA', '94105', 'office', 'active', true, 'org_test123', 'user_test123', 'Primary distribution center'),
('Downtown Store', '456 Market Street', 'San Francisco', 'CA', 'USA', '94103', 'office', 'active', false, 'org_test123', 'user_test123', 'Retail location with storage'),
('Delivery Van', '789 Logistics Way', 'Oakland', 'CA', 'USA', '94612', 'vehicle', 'active', false, 'org_test123', 'user_test123', 'Mobile delivery vehicle');