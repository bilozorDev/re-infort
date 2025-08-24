-- Seed data for IT equipment categories
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Clean up existing category data (cascades to subcategories)
TRUNCATE TABLE categories CASCADE;

-- Insert IT-focused categories
INSERT INTO categories (name, description, status, organization_clerk_id, created_by_clerk_user_id) VALUES
('Computing', 'Computers, servers, and computing devices', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Networking', 'Network infrastructure and equipment', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Storage & Memory', 'Storage devices and memory components', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Peripherals', 'Monitors, keyboards, and other peripherals', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'),
('Cables & Accessories', 'Network cables, adapters, and accessories', 'active', 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi', 'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq');