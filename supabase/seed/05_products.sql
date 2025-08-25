-- Seed data for IT products
-- Using test organization and user IDs

-- Clean up existing products
TRUNCATE TABLE products CASCADE;

-- Insert IT products
WITH inserted_categories AS (
  SELECT id, name FROM categories WHERE organization_clerk_id = 'org_test123'
),
inserted_subcategories AS (
  SELECT s.id, s.name, c.name as category_name 
  FROM subcategories s
  JOIN categories c ON s.category_id = c.id
  WHERE s.organization_clerk_id = 'org_test123'
)
INSERT INTO products (sku, name, description, category_id, subcategory_id, cost, price, status, organization_clerk_id, created_by_clerk_user_id, created_by_name)
SELECT 
  p.sku,
  p.name,
  p.description,
  c.id as category_id,
  s.id as subcategory_id,
  p.cost,
  p.price,
  'active',
  'org_test123',
  'user_test123',
  'John Admin'
FROM (
  VALUES 
    -- Desktop Computers
    ('DELL-OPT-7010', 'Dell OptiPlex 7010', 'Business desktop computer with Intel Core i7', 'Computing', 'Desktop Computers', 899.00, 1299.00),
    ('HP-ELITE-800', 'HP EliteDesk 800 G9', 'High-performance business desktop', 'Computing', 'Desktop Computers', 1099.00, 1599.00),
    ('LENOVO-M75Q', 'Lenovo ThinkCentre M75q', 'Compact desktop with AMD Ryzen', 'Computing', 'Desktop Computers', 799.00, 1149.00),
    
    -- Laptop Computers
    ('DELL-LAT-5540', 'Dell Latitude 5540', '15.6" business laptop with Intel Core i5', 'Computing', 'Laptop Computers', 1299.00, 1799.00),
    ('HP-ELITEBOOK-850', 'HP EliteBook 850 G10', '15.6" enterprise laptop', 'Computing', 'Laptop Computers', 1599.00, 2199.00),
    ('LENOVO-T14-G4', 'Lenovo ThinkPad T14 Gen 4', '14" business laptop', 'Computing', 'Laptop Computers', 1399.00, 1899.00),
    ('APPLE-MBP-14', 'MacBook Pro 14"', 'Apple MacBook Pro with M3 chip', 'Computing', 'Laptop Computers', 1999.00, 2499.00),
    
    -- Servers
    ('DELL-R650', 'Dell PowerEdge R650', '1U rack server with dual Xeon processors', 'Computing', 'Servers', 4999.00, 6999.00),
    ('HP-DL380-G11', 'HP ProLiant DL380 Gen11', '2U rack server for enterprise', 'Computing', 'Servers', 5499.00, 7499.00),
    ('LENOVO-SR650', 'Lenovo ThinkSystem SR650', '2U rack server', 'Computing', 'Servers', 4799.00, 6599.00),
    
    -- Switches
    ('CISCO-2960X-24', 'Cisco Catalyst 2960-X 24-Port', '24-port Gigabit managed switch', 'Networking', 'Switches', 1299.00, 1799.00),
    ('HP-1950-48G', 'HP 1950-48G-2SFP+', '48-port Gigabit smart managed switch', 'Networking', 'Switches', 899.00, 1299.00),
    ('UBNT-USW-48', 'Ubiquiti UniFi Switch 48', '48-port managed PoE+ switch', 'Networking', 'Switches', 699.00, 999.00),
    ('NETGEAR-GS108', 'Netgear GS108', '8-port Gigabit unmanaged switch', 'Networking', 'Switches', 39.99, 79.99),
    
    -- Routers
    ('CISCO-ISR-4331', 'Cisco ISR 4331', 'Integrated Services Router', 'Networking', 'Routers', 1999.00, 2799.00),
    ('FORTINET-60F', 'FortiGate 60F', 'Security router with firewall', 'Networking', 'Routers', 599.00, 899.00),
    ('UBNT-UDM-PRO', 'Ubiquiti Dream Machine Pro', 'All-in-one network appliance', 'Networking', 'Routers', 379.00, 549.00),
    
    -- Firewalls
    ('PALO-PA-440', 'Palo Alto PA-440', 'Next-gen firewall appliance', 'Networking', 'Firewalls', 2999.00, 3999.00),
    ('FORTINET-100F', 'FortiGate 100F', 'Enterprise firewall', 'Networking', 'Firewalls', 1999.00, 2799.00),
    ('SONICWALL-TZ670', 'SonicWall TZ670', 'Mid-range firewall', 'Networking', 'Firewalls', 999.00, 1499.00),
    
    -- SSDs
    ('SAMSUNG-980-1TB', 'Samsung 980 PRO 1TB', 'NVMe M.2 SSD 1TB', 'Storage & Memory', 'SSDs', 89.99, 149.99),
    ('WD-BLACK-2TB', 'WD Black SN850X 2TB', 'NVMe M.2 SSD 2TB', 'Storage & Memory', 'SSDs', 149.99, 249.99),
    ('CRUCIAL-MX500-500GB', 'Crucial MX500 500GB', 'SATA 2.5" SSD 500GB', 'Storage & Memory', 'SSDs', 49.99, 89.99),
    ('KINGSTON-NV2-1TB', 'Kingston NV2 1TB', 'NVMe M.2 SSD 1TB', 'Storage & Memory', 'SSDs', 59.99, 99.99),
    
    -- RAM
    ('CORSAIR-32GB-DDR5', 'Corsair Vengeance 32GB DDR5', '32GB (2x16GB) DDR5-5600', 'Storage & Memory', 'RAM', 139.99, 219.99),
    ('GSKILL-16GB-DDR4', 'G.Skill Ripjaws V 16GB DDR4', '16GB (2x8GB) DDR4-3200', 'Storage & Memory', 'RAM', 49.99, 89.99),
    ('CRUCIAL-64GB-DDR5', 'Crucial 64GB DDR5', '64GB (2x32GB) DDR5-4800', 'Storage & Memory', 'RAM', 249.99, 399.99),
    ('KINGSTON-8GB-DDR4', 'Kingston ValueRAM 8GB DDR4', '8GB DDR4-2666 SODIMM', 'Storage & Memory', 'RAM', 24.99, 44.99),
    
    -- Hard Drives
    ('WD-RED-4TB', 'WD Red Plus 4TB', '4TB NAS HDD 3.5"', 'Storage & Memory', 'Hard Drives', 89.99, 149.99),
    ('SEAGATE-IRONWOLF-8TB', 'Seagate IronWolf 8TB', '8TB NAS HDD 3.5"', 'Storage & Memory', 'Hard Drives', 179.99, 279.99),
    ('WD-PURPLE-6TB', 'WD Purple 6TB', '6TB Surveillance HDD 3.5"', 'Storage & Memory', 'Hard Drives', 129.99, 199.99),
    
    -- Monitors
    ('DELL-P2423DE', 'Dell P2423DE', '24" QHD USB-C Hub Monitor', 'Peripherals', 'Monitors', 399.99, 599.99),
    ('HP-E27-G5', 'HP E27 G5', '27" FHD IPS Monitor', 'Peripherals', 'Monitors', 249.99, 379.99),
    ('LG-27UN850', 'LG 27UN850-W', '27" 4K USB-C Monitor', 'Peripherals', 'Monitors', 449.99, 649.99),
    ('ASUS-PG279QM', 'ASUS ROG Swift PG279QM', '27" WQHD 240Hz Gaming Monitor', 'Peripherals', 'Monitors', 599.99, 899.99),
    
    -- Keyboards & Mice
    ('LOGITECH-MX-KEYS', 'Logitech MX Keys', 'Advanced wireless keyboard', 'Peripherals', 'Keyboards & Mice', 79.99, 119.99),
    ('DELL-KB216', 'Dell KB216', 'Wired multimedia keyboard', 'Peripherals', 'Keyboards & Mice', 14.99, 29.99),
    ('LOGITECH-MX-MASTER3', 'Logitech MX Master 3S', 'Advanced wireless mouse', 'Peripherals', 'Keyboards & Mice', 69.99, 99.99),
    ('MICROSOFT-ERGO', 'Microsoft Ergonomic Keyboard', 'Split ergonomic keyboard', 'Peripherals', 'Keyboards & Mice', 49.99, 89.99),
    
    -- USB Adapters
    ('TP-LINK-AC600', 'TP-Link AC600', 'USB WiFi adapter dual band', 'Peripherals', 'USB Adapters', 19.99, 34.99),
    ('NETGEAR-A6210', 'Netgear A6210', 'AC1200 USB 3.0 WiFi adapter', 'Peripherals', 'USB Adapters', 39.99, 69.99),
    ('ASUS-AX1800', 'ASUS USB-AX56', 'WiFi 6 AX1800 USB adapter', 'Peripherals', 'USB Adapters', 49.99, 89.99),
    ('ANKER-USB-HUB', 'Anker 7-in-1 USB-C Hub', 'USB-C hub with HDMI and card reader', 'Peripherals', 'USB Adapters', 29.99, 49.99),
    
    -- Network Cables
    ('CAT6-1FT', 'Cat6 Ethernet Cable 1ft', 'Cat6 patch cable 1 foot', 'Cables & Accessories', 'Network Cables', 2.99, 5.99),
    ('CAT6-3FT', 'Cat6 Ethernet Cable 3ft', 'Cat6 patch cable 3 feet', 'Cables & Accessories', 'Network Cables', 3.99, 7.99),
    ('CAT6-6FT', 'Cat6 Ethernet Cable 6ft', 'Cat6 patch cable 6 feet', 'Cables & Accessories', 'Network Cables', 4.99, 9.99),
    ('CAT6-10FT', 'Cat6 Ethernet Cable 10ft', 'Cat6 patch cable 10 feet', 'Cables & Accessories', 'Network Cables', 6.99, 12.99),
    ('CAT6-25FT', 'Cat6 Ethernet Cable 25ft', 'Cat6 patch cable 25 feet', 'Cables & Accessories', 'Network Cables', 9.99, 17.99),
    ('CAT6-50FT', 'Cat6 Ethernet Cable 50ft', 'Cat6 patch cable 50 feet', 'Cables & Accessories', 'Network Cables', 14.99, 27.99),
    ('CAT6-100FT', 'Cat6 Ethernet Cable 100ft', 'Cat6 patch cable 100 feet', 'Cables & Accessories', 'Network Cables', 24.99, 44.99),
    ('CAT6A-25FT', 'Cat6a Ethernet Cable 25ft', 'Cat6a shielded cable 25 feet', 'Cables & Accessories', 'Network Cables', 14.99, 27.99),
    
    -- Power Cables
    ('C13-6FT', 'C13 Power Cable 6ft', 'IEC C13 to NEMA 5-15P', 'Cables & Accessories', 'Power Cables', 7.99, 14.99),
    ('C19-6FT', 'C19 Power Cable 6ft', 'IEC C19 to NEMA 5-15P', 'Cables & Accessories', 'Power Cables', 12.99, 22.99),
    ('PDU-BASIC-8', 'Basic PDU 8-Outlet', '19" rackmount PDU 8 outlets', 'Cables & Accessories', 'Power Cables', 49.99, 89.99),
    
    -- USB Cables
    ('USB-C-3FT', 'USB-C Cable 3ft', 'USB-C to USB-C 3.1 Gen2', 'Cables & Accessories', 'USB Cables', 9.99, 17.99),
    ('USB-C-6FT', 'USB-C Cable 6ft', 'USB-C to USB-C 3.1 Gen2', 'Cables & Accessories', 'USB Cables', 12.99, 22.99),
    ('USB-A-TO-C-3FT', 'USB-A to USB-C 3ft', 'USB 3.0 Type-A to Type-C', 'Cables & Accessories', 'USB Cables', 7.99, 14.99),
    ('USB3-EXTENSION-10FT', 'USB 3.0 Extension 10ft', 'USB 3.0 active extension cable', 'Cables & Accessories', 'USB Cables', 14.99, 27.99)
) AS p(sku, name, description, category_name, subcategory_name, cost, price)
JOIN inserted_categories c ON c.name = p.category_name
JOIN inserted_subcategories s ON s.name = p.subcategory_name AND s.category_name = p.category_name;