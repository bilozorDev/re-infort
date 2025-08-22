-- Seed data for IT equipment feature definitions
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Clean up existing feature definitions
TRUNCATE TABLE feature_definitions CASCADE;

-- Insert feature definitions for Desktop Computers
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Desktop Computers'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('CPU Model', 'text', NULL, NULL, true, 1),
    ('CPU Cores', 'number', NULL, 'cores', true, 2),
    ('RAM', 'number', NULL, 'GB', true, 3),
    ('Storage Type', 'select', '["SSD", "HDD", "NVMe", "Hybrid"]'::jsonb, NULL, true, 4),
    ('Storage Capacity', 'number', NULL, 'GB', true, 5),
    ('Graphics Card', 'text', NULL, NULL, false, 6),
    ('Operating System', 'select', '["Windows 11 Pro", "Windows 10 Pro", "Ubuntu", "No OS"]'::jsonb, NULL, true, 7),
    ('Form Factor', 'select', '["Tower", "Small Form Factor", "Mini", "All-in-One"]'::jsonb, NULL, false, 8)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Laptop Computers
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Laptop Computers'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('CPU Model', 'text', NULL, NULL, true, 1),
    ('RAM', 'number', NULL, 'GB', true, 2),
    ('Storage Capacity', 'number', NULL, 'GB', true, 3),
    ('Screen Size', 'number', NULL, 'inches', true, 4),
    ('Battery Life', 'number', NULL, 'hours', false, 5),
    ('Weight', 'number', NULL, 'kg', false, 6),
    ('Operating System', 'select', '["Windows 11 Pro", "Windows 10 Pro", "macOS", "Ubuntu", "Chrome OS"]'::jsonb, NULL, true, 7)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Servers
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Servers'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('CPU Model', 'text', NULL, NULL, true, 1),
    ('CPU Count', 'number', NULL, NULL, true, 2),
    ('RAM', 'number', NULL, 'GB', true, 3),
    ('Storage Capacity', 'number', NULL, 'TB', true, 4),
    ('RAID Configuration', 'select', '["RAID 0", "RAID 1", "RAID 5", "RAID 6", "RAID 10", "No RAID"]'::jsonb, NULL, false, 5),
    ('Rack Units', 'number', NULL, 'U', true, 6),
    ('Power Supplies', 'number', NULL, NULL, false, 7),
    ('Operating System', 'select', '["Windows Server 2022", "Windows Server 2019", "Ubuntu Server", "Red Hat Enterprise", "VMware ESXi", "No OS"]'::jsonb, NULL, true, 8)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Switches
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Switches'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Port Count', 'number', NULL, 'ports', true, 1),
    ('Port Speed', 'select', '["10/100 Mbps", "Gigabit", "10 Gigabit", "25 Gigabit"]'::jsonb, NULL, true, 2),
    ('Managed', 'boolean', NULL, NULL, true, 3),
    ('PoE Support', 'boolean', NULL, NULL, false, 4),
    ('PoE Budget', 'number', NULL, 'W', false, 5),
    ('Layer', 'select', '["Layer 2", "Layer 3", "Layer 2/3"]'::jsonb, NULL, true, 6),
    ('Stackable', 'boolean', NULL, NULL, false, 7)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Routers
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Routers'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('WAN Ports', 'number', NULL, 'ports', true, 1),
    ('LAN Ports', 'number', NULL, 'ports', true, 2),
    ('Max Throughput', 'number', NULL, 'Mbps', true, 3),
    ('VPN Support', 'boolean', NULL, NULL, false, 4),
    ('WiFi Standard', 'select', '["Wi-Fi 6E", "Wi-Fi 6", "Wi-Fi 5", "No WiFi"]'::jsonb, NULL, false, 5),
    ('Routing Protocols', 'text', NULL, NULL, false, 6)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Firewalls
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Firewalls'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Throughput', 'number', NULL, 'Gbps', true, 1),
    ('Concurrent Sessions', 'number', NULL, NULL, true, 2),
    ('VPN Tunnels', 'number', NULL, NULL, false, 3),
    ('IPS', 'boolean', NULL, NULL, false, 4),
    ('Interfaces', 'number', NULL, 'ports', true, 5),
    ('Form Factor', 'select', '["Desktop", "1U Rack", "2U Rack"]'::jsonb, NULL, true, 6)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for SSDs
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'SSDs'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Capacity', 'select', '["128GB", "256GB", "512GB", "1TB", "2TB", "4TB"]'::jsonb, NULL, true, 1),
    ('Form Factor', 'select', '["2.5 inch", "M.2 2280", "M.2 2242", "mSATA", "U.2"]'::jsonb, NULL, true, 2),
    ('Interface', 'select', '["SATA III", "NVMe PCIe 3.0", "NVMe PCIe 4.0", "NVMe PCIe 5.0"]'::jsonb, NULL, true, 3),
    ('Read Speed', 'number', NULL, 'MB/s', false, 4),
    ('Write Speed', 'number', NULL, 'MB/s', false, 5),
    ('TBW', 'number', NULL, 'TB', false, 6)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for RAM
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'RAM'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Capacity', 'select', '["4GB", "8GB", "16GB", "32GB", "64GB"]'::jsonb, NULL, true, 1),
    ('Type', 'select', '["DDR3", "DDR4", "DDR5", "SO-DIMM DDR4", "SO-DIMM DDR5", "ECC DDR4"]'::jsonb, NULL, true, 2),
    ('Speed', 'select', '["2133MHz", "2400MHz", "2666MHz", "3200MHz", "3600MHz", "4800MHz", "5600MHz"]'::jsonb, NULL, true, 3),
    ('Modules', 'number', NULL, 'sticks', true, 4),
    ('CAS Latency', 'text', NULL, NULL, false, 5)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Monitors
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Monitors'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Screen Size', 'select', '["21.5\"", "24\"", "27\"", "32\"", "34\"", "43\""]'::jsonb, NULL, true, 1),
    ('Resolution', 'select', '["1920x1080", "2560x1440", "3840x2160", "5120x1440"]'::jsonb, NULL, true, 2),
    ('Panel Type', 'select', '["IPS", "VA", "TN", "OLED"]'::jsonb, NULL, true, 3),
    ('Refresh Rate', 'select', '["60Hz", "75Hz", "144Hz", "165Hz", "240Hz"]'::jsonb, NULL, true, 4),
    ('Response Time', 'number', NULL, 'ms', false, 5),
    ('Connectivity', 'text', NULL, NULL, false, 6)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Keyboards & Mice
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Keyboards & Mice'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Type', 'select', '["Keyboard", "Mouse", "Combo"]'::jsonb, NULL, true, 1),
    ('Connection', 'select', '["USB", "Wireless 2.4GHz", "Bluetooth", "PS/2"]'::jsonb, NULL, true, 2),
    ('Mechanical', 'boolean', NULL, NULL, false, 3),
    ('Backlit', 'boolean', NULL, NULL, false, 4),
    ('DPI', 'number', NULL, 'DPI', false, 5)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for USB Adapters
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'USB Adapters'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Adapter Type', 'select', '["WiFi", "Ethernet", "Bluetooth", "Hub", "Display"]'::jsonb, NULL, true, 1),
    ('USB Version', 'select', '["USB 2.0", "USB 3.0", "USB 3.1", "USB-C"]'::jsonb, NULL, true, 2),
    ('WiFi Standard', 'select', '["802.11n", "802.11ac", "Wi-Fi 6", "Wi-Fi 6E", "N/A"]'::jsonb, NULL, false, 3),
    ('Speed', 'text', NULL, NULL, false, 4)
) AS f(name, input_type, options, unit, is_required, display_order);

-- Insert feature definitions for Network Cables
WITH subcat_ids AS (
  SELECT s.id, s.name
  FROM subcategories s 
  JOIN categories c ON s.category_id = c.id 
  WHERE s.organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO feature_definitions (organization_clerk_id, subcategory_id, name, input_type, options, unit, is_required, display_order, created_by_clerk_user_id)
SELECT 
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  (SELECT id FROM subcat_ids WHERE name = 'Network Cables'),
  f.name,
  f.input_type,
  f.options,
  f.unit,
  f.is_required,
  f.display_order,
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM (
  VALUES 
    ('Cable Type', 'select', '["Cat5e", "Cat6", "Cat6a", "Cat7", "Cat8", "Fiber"]'::jsonb, NULL, true, 1),
    ('Length', 'select', '["0.5m", "1m", "2m", "3m", "5m", "10m", "15m", "20m", "30m", "50m"]'::jsonb, NULL, true, 2),
    ('Connector Type', 'select', '["RJ45", "LC", "SC", "SFP"]'::jsonb, NULL, true, 3),
    ('Shielded', 'boolean', NULL, NULL, false, 4),
    ('Color', 'select', '["Blue", "Gray", "Black", "White", "Yellow", "Red"]'::jsonb, NULL, false, 5)
) AS f(name, input_type, options, unit, is_required, display_order);