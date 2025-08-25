-- Seed data for IT equipment subcategories
-- Organization ID: org_test123
-- User ID: user_test123

-- Use CTEs to capture IDs and insert related data
WITH inserted_categories AS (
  SELECT id, name FROM categories WHERE organization_clerk_id = 'org_test123'
),
computing_cat AS (
  SELECT id FROM inserted_categories WHERE name = 'Computing'
),
networking_cat AS (
  SELECT id FROM inserted_categories WHERE name = 'Networking'
),
storage_cat AS (
  SELECT id FROM inserted_categories WHERE name = 'Storage & Memory'
),
peripherals_cat AS (
  SELECT id FROM inserted_categories WHERE name = 'Peripherals'
),
cables_cat AS (
  SELECT id FROM inserted_categories WHERE name = 'Cables & Accessories'
)
-- Insert subcategories
INSERT INTO subcategories (category_id, name, description, status, organization_clerk_id, created_by_clerk_user_id)
SELECT 
  CASE 
    WHEN sub.name IN ('Desktop Computers', 'Laptop Computers', 'Servers') THEN (SELECT id FROM computing_cat)
    WHEN sub.name IN ('Switches', 'Routers', 'Firewalls') THEN (SELECT id FROM networking_cat)
    WHEN sub.name IN ('SSDs', 'RAM', 'Hard Drives') THEN (SELECT id FROM storage_cat)
    WHEN sub.name IN ('Monitors', 'Keyboards & Mice', 'USB Adapters') THEN (SELECT id FROM peripherals_cat)
    WHEN sub.name IN ('Network Cables', 'Power Cables', 'USB Cables') THEN (SELECT id FROM cables_cat)
  END as category_id,
  sub.name,
  sub.description,
  'active',
  'org_test123',
  'user_test123'
FROM (
  VALUES 
    -- Computing subcategories
    ('Desktop Computers', 'Desktop PCs and workstations'),
    ('Laptop Computers', 'Portable computers and notebooks'),
    ('Servers', 'Rack and tower servers'),
    -- Networking subcategories
    ('Switches', 'Network switches and hubs'),
    ('Routers', 'Network routers and gateways'),
    ('Firewalls', 'Security appliances and firewalls'),
    -- Storage subcategories
    ('SSDs', 'Solid state drives'),
    ('RAM', 'Memory modules'),
    ('Hard Drives', 'Traditional hard disk drives'),
    -- Peripherals subcategories
    ('Monitors', 'Computer displays and screens'),
    ('Keyboards & Mice', 'Input devices'),
    ('USB Adapters', 'USB WiFi and other adapters'),
    -- Cables subcategories
    ('Network Cables', 'Ethernet and fiber cables'),
    ('Power Cables', 'Power cords and adapters'),
    ('USB Cables', 'USB data and charging cables')
) AS sub(name, description);