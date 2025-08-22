-- Seed data for IT equipment categories
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Clean up existing category data (cascades to subcategories)
TRUNCATE TABLE categories CASCADE;

-- Insert IT-focused categories
INSERT INTO categories (name, description, status, display_order, organization_clerk_id, created_by_clerk_user_id) VALUES
('Computing', 'Computers, servers, and computing devices', 'active', 1, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Networking', 'Network infrastructure and equipment', 'active', 2, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Storage & Memory', 'Storage devices and memory components', 'active', 3, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Peripherals', 'Monitors, keyboards, and other peripherals', 'active', 4, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Cables & Accessories', 'Network cables, adapters, and accessories', 'active', 5, 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq');