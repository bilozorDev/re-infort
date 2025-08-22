-- Seed data for IT equipment subcategories
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Use CTEs to capture IDs and insert related data
WITH inserted_categories AS (
  SELECT id, name FROM categories WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
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
INSERT INTO subcategories (category_id, name, description, status, display_order, organization_clerk_id, created_by_clerk_user_id)
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
  sub.display_order,
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    -- Computing subcategories
    ('Desktop Computers', 'Desktop PCs and workstations', 1),
    ('Laptop Computers', 'Portable computers and notebooks', 2),
    ('Servers', 'Rack and tower servers', 3),
    -- Networking subcategories
    ('Switches', 'Network switches and hubs', 1),
    ('Routers', 'Network routers and gateways', 2),
    ('Firewalls', 'Security appliances and firewalls', 3),
    -- Storage subcategories
    ('SSDs', 'Solid state drives', 1),
    ('RAM', 'Memory modules', 2),
    ('Hard Drives', 'Traditional hard disk drives', 3),
    -- Peripherals subcategories
    ('Monitors', 'Computer displays and screens', 1),
    ('Keyboards & Mice', 'Input devices', 2),
    ('USB Adapters', 'USB WiFi and other adapters', 3),
    -- Cables subcategories
    ('Network Cables', 'Ethernet and fiber cables', 1),
    ('Power Cables', 'Power cords and adapters', 2),
    ('USB Cables', 'USB data and charging cables', 3)
) AS sub(name, description, display_order);