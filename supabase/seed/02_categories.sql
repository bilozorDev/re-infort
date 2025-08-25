-- Seed data for IT equipment categories
-- Organization ID: org_test123
-- User ID: user_test123

-- Clean up existing category data (cascades to subcategories)
TRUNCATE TABLE categories CASCADE;

-- Insert IT-focused categories
INSERT INTO categories (name, description, status, organization_clerk_id, created_by_clerk_user_id) VALUES
('Computing', 'Computers, servers, and computing devices', 'active', 'org_test123', 'user_test123'),
('Networking', 'Network infrastructure and equipment', 'active', 'org_test123', 'user_test123'),
('Storage & Memory', 'Storage devices and memory components', 'active', 'org_test123', 'user_test123'),
('Peripherals', 'Monitors, keyboards, and other peripherals', 'active', 'org_test123', 'user_test123'),
('Cables & Accessories', 'Network cables, adapters, and accessories', 'active', 'org_test123', 'user_test123');