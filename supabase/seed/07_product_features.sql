-- Seed data for IT product features
-- Organization ID: org_test123
-- User ID: user_test123

-- Clean up existing product features
TRUNCATE TABLE product_features CASCADE;

-- Insert product features for IT products
WITH product_feature_data AS (
  SELECT * FROM (
    VALUES
      -- Desktop Computers
      ('DELL-OPT-7010', 'Desktop Computers', 'Processor', 'Intel Core i7-13700'),
      ('DELL-OPT-7010', 'Desktop Computers', 'RAM (GB)', '16'),
      ('DELL-OPT-7010', 'Desktop Computers', 'Storage Type', 'NVMe SSD'),
      ('DELL-OPT-7010', 'Desktop Computers', 'Storage Capacity (GB)', '512'),
      ('DELL-OPT-7010', 'Desktop Computers', 'Graphics Card', 'Intel UHD 770'),
      ('DELL-OPT-7010', 'Desktop Computers', 'Operating System', 'Windows 11 Pro'),
      ('DELL-OPT-7010', 'Desktop Computers', 'Form Factor', 'Small Form Factor'),
      
      ('HP-ELITE-800', 'Desktop Computers', 'Processor', 'Intel Core i7-13700'),
      ('HP-ELITE-800', 'Desktop Computers', 'RAM (GB)', '32'),
      ('HP-ELITE-800', 'Desktop Computers', 'Storage Type', 'NVMe SSD'),
      ('HP-ELITE-800', 'Desktop Computers', 'Storage Capacity (GB)', '1000'),
      ('HP-ELITE-800', 'Desktop Computers', 'Graphics Card', 'Intel UHD 770'),
      ('HP-ELITE-800', 'Desktop Computers', 'Operating System', 'Windows 11 Pro'),
      ('HP-ELITE-800', 'Desktop Computers', 'Form Factor', 'Mini Tower'),
      
      -- Laptop Computers
      ('DELL-LAT-5540', 'Laptop Computers', 'Processor', 'Intel Core i5-1345U'),
      ('DELL-LAT-5540', 'Laptop Computers', 'RAM (GB)', '16'),
      ('DELL-LAT-5540', 'Laptop Computers', 'Storage Type', 'NVMe SSD'),
      ('DELL-LAT-5540', 'Laptop Computers', 'Storage Capacity (GB)', '512'),
      ('DELL-LAT-5540', 'Laptop Computers', 'Screen Size (inches)', '15.6'),
      ('DELL-LAT-5540', 'Laptop Computers', 'Graphics Card', 'Intel Iris Xe'),
      ('DELL-LAT-5540', 'Laptop Computers', 'Operating System', 'Windows 11 Pro'),
      ('DELL-LAT-5540', 'Laptop Computers', 'Battery Life (hours)', '12'),
      ('DELL-LAT-5540', 'Laptop Computers', 'Weight (kg)', '1.8'),
      
      ('APPLE-MBP-14', 'Laptop Computers', 'Processor', 'Apple M3 Pro'),
      ('APPLE-MBP-14', 'Laptop Computers', 'RAM (GB)', '18'),
      ('APPLE-MBP-14', 'Laptop Computers', 'Storage Type', 'SSD'),
      ('APPLE-MBP-14', 'Laptop Computers', 'Storage Capacity (GB)', '512'),
      ('APPLE-MBP-14', 'Laptop Computers', 'Screen Size (inches)', '14.2'),
      ('APPLE-MBP-14', 'Laptop Computers', 'Graphics Card', 'Integrated M3 Pro GPU'),
      ('APPLE-MBP-14', 'Laptop Computers', 'Operating System', 'macOS'),
      ('APPLE-MBP-14', 'Laptop Computers', 'Battery Life (hours)', '18'),
      ('APPLE-MBP-14', 'Laptop Computers', 'Weight (kg)', '1.6'),
      
      -- Servers
      ('DELL-R650', 'Servers', 'Processor', 'Dual Intel Xeon Gold 6338'),
      ('DELL-R650', 'Servers', 'RAM (GB)', '128'),
      ('DELL-R650', 'Servers', 'Storage Type', 'SAS'),
      ('DELL-R650', 'Servers', 'Storage Capacity (TB)', '4'),
      ('DELL-R650', 'Servers', 'Form Factor', '1U'),
      ('DELL-R650', 'Servers', 'Power Supply', 'Dual 750W'),
      ('DELL-R650', 'Servers', 'RAID Support', 'true'),
      ('DELL-R650', 'Servers', 'Network Ports', '4'),
      ('DELL-R650', 'Servers', 'Management', 'iDRAC9'),
      
      -- Switches
      ('CISCO-2960X-24', 'Switches', 'Port Count', '24'),
      ('CISCO-2960X-24', 'Switches', 'Port Speed', '1 Gbps'),
      ('CISCO-2960X-24', 'Switches', 'PoE Support', 'true'),
      ('CISCO-2960X-24', 'Switches', 'Management Type', 'Managed'),
      ('CISCO-2960X-24', 'Switches', 'Switching Capacity (Gbps)', '216'),
      ('CISCO-2960X-24', 'Switches', 'VLAN Support', 'true'),
      ('CISCO-2960X-24', 'Switches', 'Stackable', 'true'),
      ('CISCO-2960X-24', 'Switches', 'Uplink Ports', '4x 1G SFP'),
      
      ('NETGEAR-GS108', 'Switches', 'Port Count', '8'),
      ('NETGEAR-GS108', 'Switches', 'Port Speed', '1 Gbps'),
      ('NETGEAR-GS108', 'Switches', 'PoE Support', 'false'),
      ('NETGEAR-GS108', 'Switches', 'Management Type', 'Unmanaged'),
      ('NETGEAR-GS108', 'Switches', 'Switching Capacity (Gbps)', '16'),
      ('NETGEAR-GS108', 'Switches', 'VLAN Support', 'false'),
      ('NETGEAR-GS108', 'Switches', 'Stackable', 'false'),
      
      -- Routers
      ('CISCO-ISR-4331', 'Routers', 'WAN Ports', '3'),
      ('CISCO-ISR-4331', 'Routers', 'LAN Ports', '2'),
      ('CISCO-ISR-4331', 'Routers', 'Throughput (Mbps)', '300'),
      ('CISCO-ISR-4331', 'Routers', 'VPN Support', 'true'),
      ('CISCO-ISR-4331', 'Routers', 'Firewall', 'true'),
      ('CISCO-ISR-4331', 'Routers', 'WiFi', 'false'),
      ('CISCO-ISR-4331', 'Routers', 'Redundancy', 'true'),
      
      ('UBNT-UDM-PRO', 'Routers', 'WAN Ports', '2'),
      ('UBNT-UDM-PRO', 'Routers', 'LAN Ports', '8'),
      ('UBNT-UDM-PRO', 'Routers', 'Throughput (Mbps)', '10000'),
      ('UBNT-UDM-PRO', 'Routers', 'VPN Support', 'true'),
      ('UBNT-UDM-PRO', 'Routers', 'Firewall', 'true'),
      ('UBNT-UDM-PRO', 'Routers', 'WiFi', 'false'),
      ('UBNT-UDM-PRO', 'Routers', 'Redundancy', 'false'),
      
      -- Firewalls
      ('PALO-PA-440', 'Firewalls', 'Throughput (Gbps)', '3'),
      ('PALO-PA-440', 'Firewalls', 'Threat Prevention (Gbps)', '1.5'),
      ('PALO-PA-440', 'Firewalls', 'IPSec VPN (Gbps)', '1'),
      ('PALO-PA-440', 'Firewalls', 'Sessions', '300000'),
      ('PALO-PA-440', 'Firewalls', 'Interfaces', '8x 1G'),
      ('PALO-PA-440', 'Firewalls', 'Form Factor', 'Desktop'),
      
      -- SSDs
      ('SAMSUNG-980-1TB', 'SSDs', 'Capacity (GB)', '1000'),
      ('SAMSUNG-980-1TB', 'SSDs', 'Interface', 'NVMe PCIe 4.0'),
      ('SAMSUNG-980-1TB', 'SSDs', 'Form Factor', 'M.2 2280'),
      ('SAMSUNG-980-1TB', 'SSDs', 'Read Speed (MB/s)', '7000'),
      ('SAMSUNG-980-1TB', 'SSDs', 'Write Speed (MB/s)', '5000'),
      ('SAMSUNG-980-1TB', 'SSDs', 'TBW', '600'),
      ('SAMSUNG-980-1TB', 'SSDs', 'Encryption', 'true'),
      
      ('CRUCIAL-MX500-500GB', 'SSDs', 'Capacity (GB)', '500'),
      ('CRUCIAL-MX500-500GB', 'SSDs', 'Interface', 'SATA III'),
      ('CRUCIAL-MX500-500GB', 'SSDs', 'Form Factor', '2.5"'),
      ('CRUCIAL-MX500-500GB', 'SSDs', 'Read Speed (MB/s)', '560'),
      ('CRUCIAL-MX500-500GB', 'SSDs', 'Write Speed (MB/s)', '510'),
      ('CRUCIAL-MX500-500GB', 'SSDs', 'TBW', '180'),
      ('CRUCIAL-MX500-500GB', 'SSDs', 'Encryption', 'true'),
      
      -- RAM
      ('CORSAIR-32GB-DDR5', 'RAM', 'Capacity (GB)', '32'),
      ('CORSAIR-32GB-DDR5', 'RAM', 'Type', 'DDR5'),
      ('CORSAIR-32GB-DDR5', 'RAM', 'Speed (MHz)', '5600'),
      ('CORSAIR-32GB-DDR5', 'RAM', 'Form Factor', 'DIMM'),
      ('CORSAIR-32GB-DDR5', 'RAM', 'Latency', 'CL36'),
      ('CORSAIR-32GB-DDR5', 'RAM', 'ECC', 'false'),
      ('CORSAIR-32GB-DDR5', 'RAM', 'Kit Configuration', '2x16GB'),
      
      ('KINGSTON-8GB-DDR4', 'RAM', 'Capacity (GB)', '8'),
      ('KINGSTON-8GB-DDR4', 'RAM', 'Type', 'DDR4'),
      ('KINGSTON-8GB-DDR4', 'RAM', 'Speed (MHz)', '2666'),
      ('KINGSTON-8GB-DDR4', 'RAM', 'Form Factor', 'SODIMM'),
      ('KINGSTON-8GB-DDR4', 'RAM', 'Latency', 'CL19'),
      ('KINGSTON-8GB-DDR4', 'RAM', 'ECC', 'false'),
      ('KINGSTON-8GB-DDR4', 'RAM', 'Kit Configuration', '1x8GB'),
      
      -- Hard Drives
      ('WD-RED-4TB', 'Hard Drives', 'Capacity (TB)', '4'),
      ('WD-RED-4TB', 'Hard Drives', 'Interface', 'SATA III'),
      ('WD-RED-4TB', 'Hard Drives', 'RPM', '5400'),
      ('WD-RED-4TB', 'Hard Drives', 'Cache (MB)', '256'),
      ('WD-RED-4TB', 'Hard Drives', 'Form Factor', '3.5"'),
      ('WD-RED-4TB', 'Hard Drives', 'Purpose', 'NAS'),
      
      -- Monitors
      ('DELL-P2423DE', 'Monitors', 'Screen Size (inches)', '24'),
      ('DELL-P2423DE', 'Monitors', 'Resolution', '2560x1440'),
      ('DELL-P2423DE', 'Monitors', 'Panel Type', 'IPS'),
      ('DELL-P2423DE', 'Monitors', 'Refresh Rate (Hz)', '60'),
      ('DELL-P2423DE', 'Monitors', 'Response Time (ms)', '5'),
      ('DELL-P2423DE', 'Monitors', 'Brightness (nits)', '300'),
      ('DELL-P2423DE', 'Monitors', 'Connectivity', 'HDMI, DisplayPort, USB-C'),
      ('DELL-P2423DE', 'Monitors', 'Adjustable Stand', 'true'),
      ('DELL-P2423DE', 'Monitors', 'VESA Mount', 'true'),
      
      ('LG-27UN850', 'Monitors', 'Screen Size (inches)', '27'),
      ('LG-27UN850', 'Monitors', 'Resolution', '3840x2160'),
      ('LG-27UN850', 'Monitors', 'Panel Type', 'IPS'),
      ('LG-27UN850', 'Monitors', 'Refresh Rate (Hz)', '60'),
      ('LG-27UN850', 'Monitors', 'Response Time (ms)', '5'),
      ('LG-27UN850', 'Monitors', 'Brightness (nits)', '400'),
      ('LG-27UN850', 'Monitors', 'Connectivity', 'HDMI, DisplayPort, USB-C'),
      ('LG-27UN850', 'Monitors', 'Adjustable Stand', 'true'),
      ('LG-27UN850', 'Monitors', 'VESA Mount', 'true'),
      
      -- Keyboards & Mice
      ('LOGITECH-MX-KEYS', 'Keyboards & Mice', 'Type', 'Keyboard'),
      ('LOGITECH-MX-KEYS', 'Keyboards & Mice', 'Connection', 'Wireless'),
      ('LOGITECH-MX-KEYS', 'Keyboards & Mice', 'Switch Type', 'Scissor'),
      ('LOGITECH-MX-KEYS', 'Keyboards & Mice', 'Layout', 'Full Size'),
      ('LOGITECH-MX-KEYS', 'Keyboards & Mice', 'Backlight', 'true'),
      ('LOGITECH-MX-KEYS', 'Keyboards & Mice', 'Battery Life', '10 days'),
      
      ('LOGITECH-MX-MASTER3', 'Keyboards & Mice', 'Type', 'Mouse'),
      ('LOGITECH-MX-MASTER3', 'Keyboards & Mice', 'Connection', 'Wireless'),
      ('LOGITECH-MX-MASTER3', 'Keyboards & Mice', 'DPI', '4000'),
      ('LOGITECH-MX-MASTER3', 'Keyboards & Mice', 'Buttons', '7'),
      ('LOGITECH-MX-MASTER3', 'Keyboards & Mice', 'Battery Life', '70 days'),
      
      -- USB Adapters
      ('TP-LINK-AC600', 'USB Adapters', 'WiFi Standard', '802.11ac'),
      ('TP-LINK-AC600', 'USB Adapters', 'Speed (Mbps)', '600'),
      ('TP-LINK-AC600', 'USB Adapters', 'Frequency', 'Dual Band'),
      ('TP-LINK-AC600', 'USB Adapters', 'USB Version', '2.0'),
      ('TP-LINK-AC600', 'USB Adapters', 'Antenna', 'External'),
      
      ('ANKER-USB-HUB', 'USB Adapters', 'Type', 'Hub'),
      ('ANKER-USB-HUB', 'USB Adapters', 'Ports', '7'),
      ('ANKER-USB-HUB', 'USB Adapters', 'USB Version', '3.0'),
      ('ANKER-USB-HUB', 'USB Adapters', 'Power Delivery', 'true'),
      ('ANKER-USB-HUB', 'USB Adapters', 'HDMI', 'true'),
      
      -- Network Cables
      ('CAT6-3FT', 'Network Cables', 'Category', 'Cat6'),
      ('CAT6-3FT', 'Network Cables', 'Length (ft)', '3'),
      ('CAT6-3FT', 'Network Cables', 'Speed (Gbps)', '10'),
      ('CAT6-3FT', 'Network Cables', 'Shielding', 'UTP'),
      ('CAT6-3FT', 'Network Cables', 'Color', 'Blue'),
      
      ('CAT6-25FT', 'Network Cables', 'Category', 'Cat6'),
      ('CAT6-25FT', 'Network Cables', 'Length (ft)', '25'),
      ('CAT6-25FT', 'Network Cables', 'Speed (Gbps)', '10'),
      ('CAT6-25FT', 'Network Cables', 'Shielding', 'UTP'),
      ('CAT6-25FT', 'Network Cables', 'Color', 'Blue'),
      
      ('CAT6A-25FT', 'Network Cables', 'Category', 'Cat6a'),
      ('CAT6A-25FT', 'Network Cables', 'Length (ft)', '25'),
      ('CAT6A-25FT', 'Network Cables', 'Speed (Gbps)', '10'),
      ('CAT6A-25FT', 'Network Cables', 'Shielding', 'STP'),
      ('CAT6A-25FT', 'Network Cables', 'Color', 'Gray'),
      
      -- Power Cables
      ('C13-6FT', 'Power Cables', 'Connector Type', 'IEC C13 to NEMA 5-15P'),
      ('C13-6FT', 'Power Cables', 'Length (ft)', '6'),
      ('C13-6FT', 'Power Cables', 'Gauge', '14 AWG'),
      ('C13-6FT', 'Power Cables', 'Rating', '15A 125V'),
      
      ('PDU-BASIC-8', 'Power Cables', 'Type', 'PDU'),
      ('PDU-BASIC-8', 'Power Cables', 'Outlets', '8'),
      ('PDU-BASIC-8', 'Power Cables', 'Form Factor', '1U Rackmount'),
      ('PDU-BASIC-8', 'Power Cables', 'Rating', '15A 125V'),
      
      -- USB Cables
      ('USB-C-3FT', 'USB Cables', 'Type', 'USB-C to USB-C'),
      ('USB-C-3FT', 'USB Cables', 'Length (ft)', '3'),
      ('USB-C-3FT', 'USB Cables', 'Version', '3.1 Gen2'),
      ('USB-C-3FT', 'USB Cables', 'Power Delivery', '100W'),
      ('USB-C-3FT', 'USB Cables', 'Data Speed', '10 Gbps')
  ) AS data(product_sku, subcategory_name, feature_name, feature_value)
)
INSERT INTO product_features (organization_clerk_id, product_id, feature_definition_id, name, value, is_custom)
SELECT 
  'org_test123',
  p.id,
  fd.id,
  fd.name,
  pfd.feature_value,
  false
FROM product_feature_data pfd
JOIN products p ON p.sku = pfd.product_sku
JOIN subcategories s ON s.name = pfd.subcategory_name
JOIN feature_definitions fd ON fd.subcategory_id = s.id AND fd.name = pfd.feature_name
WHERE p.organization_clerk_id = 'org_test123'
  AND s.organization_clerk_id = 'org_test123'
  AND fd.organization_clerk_id = 'org_test123';