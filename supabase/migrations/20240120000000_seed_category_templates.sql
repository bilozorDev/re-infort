-- Seed data for category templates

-- MSP Provider Template
DO $$
DECLARE
    msp_template_id UUID;
    computers_cat_id UUID;
    networking_cat_id UUID;
    software_cat_id UUID;
    security_cat_id UUID;
    desktops_sub_id UUID;
    laptops_sub_id UUID;
    tablets_sub_id UUID;
    servers_sub_id UUID;
    routers_sub_id UUID;
    switches_sub_id UUID;
    firewalls_sub_id UUID;
    access_points_sub_id UUID;
    licenses_sub_id UUID;
    subscriptions_sub_id UUID;
    antivirus_sub_id UUID;
    backup_sub_id UUID;
BEGIN
    -- Create MSP Provider template
    INSERT INTO category_templates (name, description, business_type, icon, is_active)
    VALUES (
        'MSP Provider',
        'Complete inventory structure for Managed Service Providers with IT equipment, networking, and software categories',
        'Technology Services',
        'server',
        true
    ) RETURNING id INTO msp_template_id;

    -- Computers & Hardware Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Computers & Hardware', 'Desktop computers, laptops, tablets, and servers', 1)
    RETURNING id INTO computers_cat_id;

    -- Computers subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (computers_cat_id, 'Desktop Computers', 'Desktop PCs and workstations', 1)
    RETURNING id INTO desktops_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (computers_cat_id, 'Laptops', 'Portable computers and notebooks', 2)
    RETURNING id INTO laptops_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (computers_cat_id, 'Tablets', 'iPads and Android tablets', 3)
    RETURNING id INTO tablets_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (computers_cat_id, 'Servers', 'Physical and virtual servers', 4)
    RETURNING id INTO servers_sub_id;

    -- Desktop features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (desktops_sub_id, 'CPU Model', 'text', NULL, true, 1),
    (desktops_sub_id, 'RAM', 'number', 'GB', true, 2),
    (desktops_sub_id, 'Storage Type', 'select', NULL, true, 3),
    (desktops_sub_id, 'Storage Capacity', 'number', 'GB', true, 4),
    (desktops_sub_id, 'Operating System', 'select', NULL, true, 5),
    (desktops_sub_id, 'Graphics Card', 'text', NULL, false, 6),
    (desktops_sub_id, 'Form Factor', 'select', NULL, false, 7);

    -- Set options for Desktop select fields
    UPDATE template_features SET options = '["SSD", "HDD", "NVMe", "Hybrid"]'::jsonb 
    WHERE template_subcategory_id = desktops_sub_id AND name = 'Storage Type';
    
    UPDATE template_features SET options = '["Windows 11 Pro", "Windows 11 Home", "Windows 10 Pro", "macOS", "Ubuntu", "Other Linux"]'::jsonb 
    WHERE template_subcategory_id = desktops_sub_id AND name = 'Operating System';
    
    UPDATE template_features SET options = '["Tower", "Mini Tower", "Small Form Factor", "All-in-One", "Mini PC"]'::jsonb 
    WHERE template_subcategory_id = desktops_sub_id AND name = 'Form Factor';

    -- Laptop features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (laptops_sub_id, 'CPU Model', 'text', NULL, true, 1),
    (laptops_sub_id, 'RAM', 'number', 'GB', true, 2),
    (laptops_sub_id, 'Storage Capacity', 'number', 'GB', true, 3),
    (laptops_sub_id, 'Screen Size', 'number', 'inches', true, 4),
    (laptops_sub_id, 'Operating System', 'select', NULL, true, 5),
    (laptops_sub_id, 'Battery Life', 'number', 'hours', false, 6),
    (laptops_sub_id, 'Weight', 'number', 'kg', false, 7),
    (laptops_sub_id, 'Touch Screen', 'boolean', NULL, false, 8);

    UPDATE template_features SET options = '["Windows 11 Pro", "Windows 11 Home", "Windows 10 Pro", "macOS", "Chrome OS", "Ubuntu"]'::jsonb 
    WHERE template_subcategory_id = laptops_sub_id AND name = 'Operating System';

    -- Tablet features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (tablets_sub_id, 'Model', 'text', NULL, true, 1),
    (tablets_sub_id, 'Storage', 'number', 'GB', true, 2),
    (tablets_sub_id, 'Screen Size', 'number', 'inches', true, 3),
    (tablets_sub_id, 'Operating System', 'select', NULL, true, 4),
    (tablets_sub_id, 'Cellular', 'boolean', NULL, false, 5),
    (tablets_sub_id, 'Color', 'select', NULL, false, 6);

    UPDATE template_features SET options = '["iPadOS", "Android", "Windows", "Fire OS"]'::jsonb 
    WHERE template_subcategory_id = tablets_sub_id AND name = 'Operating System';
    
    UPDATE template_features SET options = '["Space Gray", "Silver", "Gold", "Black", "White", "Blue", "Pink"]'::jsonb 
    WHERE template_subcategory_id = tablets_sub_id AND name = 'Color';

    -- Server features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (servers_sub_id, 'CPU Model', 'text', NULL, true, 1),
    (servers_sub_id, 'CPU Cores', 'number', 'cores', true, 2),
    (servers_sub_id, 'RAM', 'number', 'GB', true, 3),
    (servers_sub_id, 'Storage Capacity', 'number', 'TB', true, 4),
    (servers_sub_id, 'RAID Configuration', 'select', NULL, false, 5),
    (servers_sub_id, 'Operating System', 'select', NULL, true, 6),
    (servers_sub_id, 'Rack Units', 'number', 'U', false, 7),
    (servers_sub_id, 'Power Supplies', 'number', NULL, false, 8),
    (servers_sub_id, 'Virtual Machine', 'boolean', NULL, false, 9);

    UPDATE template_features SET options = '["RAID 0", "RAID 1", "RAID 5", "RAID 6", "RAID 10", "No RAID"]'::jsonb 
    WHERE template_subcategory_id = servers_sub_id AND name = 'RAID Configuration';
    
    UPDATE template_features SET options = '["Windows Server 2022", "Windows Server 2019", "Ubuntu Server", "Red Hat Enterprise", "VMware ESXi", "Proxmox", "Other"]'::jsonb 
    WHERE template_subcategory_id = servers_sub_id AND name = 'Operating System';

    -- Networking Equipment Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Networking Equipment', 'Routers, switches, firewalls, and wireless equipment', 2)
    RETURNING id INTO networking_cat_id;

    -- Networking subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (networking_cat_id, 'Routers', 'Network routers and gateways', 1)
    RETURNING id INTO routers_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (networking_cat_id, 'Switches', 'Managed and unmanaged switches', 2)
    RETURNING id INTO switches_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (networking_cat_id, 'Firewalls', 'Hardware firewalls and UTM devices', 3)
    RETURNING id INTO firewalls_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (networking_cat_id, 'Access Points', 'Wireless access points', 4)
    RETURNING id INTO access_points_sub_id;

    -- Router features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (routers_sub_id, 'Model', 'text', NULL, true, 1),
    (routers_sub_id, 'WAN Ports', 'number', NULL, true, 2),
    (routers_sub_id, 'LAN Ports', 'number', NULL, true, 3),
    (routers_sub_id, 'Max Throughput', 'number', 'Mbps', false, 4),
    (routers_sub_id, 'VPN Support', 'boolean', NULL, false, 5),
    (routers_sub_id, 'WiFi Standard', 'select', NULL, false, 6);

    UPDATE template_features SET options = '["Wi-Fi 6E", "Wi-Fi 6", "Wi-Fi 5", "Wi-Fi 4", "No WiFi"]'::jsonb 
    WHERE template_subcategory_id = routers_sub_id AND name = 'WiFi Standard';

    -- Switch features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (switches_sub_id, 'Model', 'text', NULL, true, 1),
    (switches_sub_id, 'Port Count', 'number', NULL, true, 2),
    (switches_sub_id, 'Port Speed', 'select', NULL, true, 3),
    (switches_sub_id, 'Managed', 'boolean', NULL, true, 4),
    (switches_sub_id, 'PoE Support', 'boolean', NULL, false, 5),
    (switches_sub_id, 'PoE Budget', 'number', 'W', false, 6),
    (switches_sub_id, 'Stackable', 'boolean', NULL, false, 7);

    UPDATE template_features SET options = '["10/100 Mbps", "Gigabit", "2.5 Gigabit", "10 Gigabit", "25 Gigabit", "40 Gigabit"]'::jsonb 
    WHERE template_subcategory_id = switches_sub_id AND name = 'Port Speed';

    -- Software & Licenses Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Software & Licenses', 'Software licenses and cloud subscriptions', 3)
    RETURNING id INTO software_cat_id;

    -- Software subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (software_cat_id, 'Operating System Licenses', 'Windows, macOS, and Linux licenses', 1)
    RETURNING id INTO licenses_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (software_cat_id, 'Cloud Subscriptions', 'SaaS and cloud service subscriptions', 2)
    RETURNING id INTO subscriptions_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (software_cat_id, 'Security Software', 'Antivirus and security tools', 3)
    RETURNING id INTO antivirus_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (software_cat_id, 'Backup Solutions', 'Backup software and services', 4)
    RETURNING id INTO backup_sub_id;

    -- License features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (licenses_sub_id, 'Product Name', 'text', NULL, true, 1),
    (licenses_sub_id, 'License Type', 'select', NULL, true, 2),
    (licenses_sub_id, 'License Key', 'text', NULL, false, 3),
    (licenses_sub_id, 'User Count', 'number', 'users', false, 4),
    (licenses_sub_id, 'Expiry Date', 'date', NULL, false, 5);

    UPDATE template_features SET options = '["Perpetual", "Subscription", "Volume", "OEM", "Retail", "Trial"]'::jsonb 
    WHERE template_subcategory_id = licenses_sub_id AND name = 'License Type';

    -- Cloud subscription features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (subscriptions_sub_id, 'Service Name', 'text', NULL, true, 1),
    (subscriptions_sub_id, 'Plan Type', 'select', NULL, true, 2),
    (subscriptions_sub_id, 'User Seats', 'number', 'users', false, 3),
    (subscriptions_sub_id, 'Storage Limit', 'number', 'GB', false, 4),
    (subscriptions_sub_id, 'Renewal Date', 'date', NULL, true, 5),
    (subscriptions_sub_id, 'Monthly Cost', 'number', '$', false, 6);

    UPDATE template_features SET options = '["Basic", "Standard", "Premium", "Enterprise", "Free Tier", "Custom"]'::jsonb 
    WHERE template_subcategory_id = subscriptions_sub_id AND name = 'Plan Type';

    -- Update usage count
    UPDATE category_templates SET usage_count = 0 WHERE id = msp_template_id;
END $$;

-- Retail Store Template
DO $$
DECLARE
    retail_template_id UUID;
    electronics_cat_id UUID;
    clothing_cat_id UUID;
    home_cat_id UUID;
    tvs_sub_id UUID;
    audio_sub_id UUID;
    gaming_sub_id UUID;
    mens_sub_id UUID;
    womens_sub_id UUID;
    kids_sub_id UUID;
    furniture_sub_id UUID;
    kitchen_sub_id UUID;
    decor_sub_id UUID;
BEGIN
    -- Create Retail Store template
    INSERT INTO category_templates (name, description, business_type, icon, is_active)
    VALUES (
        'Retail Store',
        'Product categories for retail stores including electronics, clothing, and home goods',
        'Retail',
        'shopping-cart',
        true
    ) RETURNING id INTO retail_template_id;

    -- Electronics Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (retail_template_id, 'Electronics', 'Consumer electronics and gadgets', 1)
    RETURNING id INTO electronics_cat_id;

    -- Electronics subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (electronics_cat_id, 'Televisions', 'Smart TVs and displays', 1)
    RETURNING id INTO tvs_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (electronics_cat_id, 'Audio Equipment', 'Speakers, headphones, and sound systems', 2)
    RETURNING id INTO audio_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (electronics_cat_id, 'Gaming', 'Gaming consoles and accessories', 3)
    RETURNING id INTO gaming_sub_id;

    -- TV features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (tvs_sub_id, 'Brand', 'text', NULL, true, 1),
    (tvs_sub_id, 'Screen Size', 'number', 'inches', true, 2),
    (tvs_sub_id, 'Resolution', 'select', NULL, true, 3),
    (tvs_sub_id, 'Display Type', 'select', NULL, true, 4),
    (tvs_sub_id, 'Smart TV', 'boolean', NULL, false, 5),
    (tvs_sub_id, 'Refresh Rate', 'number', 'Hz', false, 6),
    (tvs_sub_id, 'HDR Support', 'boolean', NULL, false, 7);

    UPDATE template_features SET options = '["HD", "Full HD", "4K UHD", "8K UHD"]'::jsonb 
    WHERE template_subcategory_id = tvs_sub_id AND name = 'Resolution';
    
    UPDATE template_features SET options = '["LED", "OLED", "QLED", "LCD", "Plasma"]'::jsonb 
    WHERE template_subcategory_id = tvs_sub_id AND name = 'Display Type';

    -- Clothing Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (retail_template_id, 'Clothing & Apparel', 'Clothing for all ages and styles', 2)
    RETURNING id INTO clothing_cat_id;

    -- Clothing subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (clothing_cat_id, 'Men''s Clothing', 'Men''s apparel and accessories', 1)
    RETURNING id INTO mens_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (clothing_cat_id, 'Women''s Clothing', 'Women''s apparel and accessories', 2)
    RETURNING id INTO womens_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (clothing_cat_id, 'Kids Clothing', 'Children''s apparel', 3)
    RETURNING id INTO kids_sub_id;

    -- Men's clothing features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (mens_sub_id, 'Brand', 'text', NULL, true, 1),
    (mens_sub_id, 'Size', 'select', NULL, true, 2),
    (mens_sub_id, 'Color', 'select', NULL, true, 3),
    (mens_sub_id, 'Material', 'text', NULL, false, 4),
    (mens_sub_id, 'Season', 'select', NULL, false, 5),
    (mens_sub_id, 'Care Instructions', 'text', NULL, false, 6);

    UPDATE template_features SET options = '["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"]'::jsonb 
    WHERE template_subcategory_id = mens_sub_id AND name = 'Size';
    
    UPDATE template_features SET options = '["Black", "White", "Navy", "Gray", "Blue", "Red", "Green", "Brown", "Khaki", "Multi"]'::jsonb 
    WHERE template_subcategory_id = mens_sub_id AND name = 'Color';
    
    UPDATE template_features SET options = '["Spring", "Summer", "Fall", "Winter", "All Season"]'::jsonb 
    WHERE template_subcategory_id = mens_sub_id AND name = 'Season';

    -- Home & Garden Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (retail_template_id, 'Home & Garden', 'Furniture, kitchen, and home decor', 3)
    RETURNING id INTO home_cat_id;

    -- Home subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (home_cat_id, 'Furniture', 'Indoor and outdoor furniture', 1)
    RETURNING id INTO furniture_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (home_cat_id, 'Kitchen', 'Kitchen appliances and cookware', 2)
    RETURNING id INTO kitchen_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (home_cat_id, 'Home Decor', 'Decorative items and accessories', 3)
    RETURNING id INTO decor_sub_id;

    -- Furniture features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (furniture_sub_id, 'Type', 'text', NULL, true, 1),
    (furniture_sub_id, 'Material', 'select', NULL, true, 2),
    (furniture_sub_id, 'Color/Finish', 'text', NULL, true, 3),
    (furniture_sub_id, 'Width', 'number', 'cm', false, 4),
    (furniture_sub_id, 'Height', 'number', 'cm', false, 5),
    (furniture_sub_id, 'Depth', 'number', 'cm', false, 6),
    (furniture_sub_id, 'Weight Capacity', 'number', 'kg', false, 7),
    (furniture_sub_id, 'Assembly Required', 'boolean', NULL, false, 8);

    UPDATE template_features SET options = '["Wood", "Metal", "Plastic", "Glass", "Fabric", "Leather", "Mixed Materials"]'::jsonb 
    WHERE template_subcategory_id = furniture_sub_id AND name = 'Material';

    -- Update usage count
    UPDATE category_templates SET usage_count = 0 WHERE id = retail_template_id;
END $$;

-- Manufacturing Template
DO $$
DECLARE
    manufacturing_template_id UUID;
    raw_materials_cat_id UUID;
    components_cat_id UUID;
    finished_goods_cat_id UUID;
    metals_sub_id UUID;
    plastics_sub_id UUID;
    chemicals_sub_id UUID;
    electronic_comp_sub_id UUID;
    mechanical_comp_sub_id UUID;
    assemblies_sub_id UUID;
    products_sub_id UUID;
BEGIN
    -- Create Manufacturing template
    INSERT INTO category_templates (name, description, business_type, icon, is_active)
    VALUES (
        'Manufacturing',
        'Inventory structure for manufacturing companies with raw materials, components, and finished goods',
        'Manufacturing',
        'factory',
        true
    ) RETURNING id INTO manufacturing_template_id;

    -- Raw Materials Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (manufacturing_template_id, 'Raw Materials', 'Basic materials used in production', 1)
    RETURNING id INTO raw_materials_cat_id;

    -- Raw materials subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (raw_materials_cat_id, 'Metals', 'Metal sheets, bars, and alloys', 1)
    RETURNING id INTO metals_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (raw_materials_cat_id, 'Plastics', 'Plastic resins and polymers', 2)
    RETURNING id INTO plastics_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (raw_materials_cat_id, 'Chemicals', 'Industrial chemicals and compounds', 3)
    RETURNING id INTO chemicals_sub_id;

    -- Metal features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (metals_sub_id, 'Material Type', 'select', NULL, true, 1),
    (metals_sub_id, 'Grade', 'text', NULL, true, 2),
    (metals_sub_id, 'Form', 'select', NULL, true, 3),
    (metals_sub_id, 'Thickness', 'number', 'mm', false, 4),
    (metals_sub_id, 'Width', 'number', 'mm', false, 5),
    (metals_sub_id, 'Length', 'number', 'mm', false, 6),
    (metals_sub_id, 'Weight', 'number', 'kg', false, 7),
    (metals_sub_id, 'Supplier', 'text', NULL, false, 8),
    (metals_sub_id, 'Certification', 'text', NULL, false, 9);

    UPDATE template_features SET options = '["Steel", "Aluminum", "Copper", "Brass", "Stainless Steel", "Titanium", "Iron", "Zinc"]'::jsonb 
    WHERE template_subcategory_id = metals_sub_id AND name = 'Material Type';
    
    UPDATE template_features SET options = '["Sheet", "Bar", "Tube", "Pipe", "Wire", "Plate", "Coil", "Ingot"]'::jsonb 
    WHERE template_subcategory_id = metals_sub_id AND name = 'Form';

    -- Components Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (manufacturing_template_id, 'Components & Parts', 'Individual components and sub-assemblies', 2)
    RETURNING id INTO components_cat_id;

    -- Components subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (components_cat_id, 'Electronic Components', 'Circuit boards, chips, and electronic parts', 1)
    RETURNING id INTO electronic_comp_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (components_cat_id, 'Mechanical Components', 'Gears, bearings, and mechanical parts', 2)
    RETURNING id INTO mechanical_comp_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (components_cat_id, 'Sub-Assemblies', 'Pre-assembled component groups', 3)
    RETURNING id INTO assemblies_sub_id;

    -- Electronic component features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (electronic_comp_sub_id, 'Part Number', 'text', NULL, true, 1),
    (electronic_comp_sub_id, 'Manufacturer', 'text', NULL, true, 2),
    (electronic_comp_sub_id, 'Component Type', 'select', NULL, true, 3),
    (electronic_comp_sub_id, 'Value', 'text', NULL, false, 4),
    (electronic_comp_sub_id, 'Tolerance', 'text', '%', false, 5),
    (electronic_comp_sub_id, 'Package Type', 'text', NULL, false, 6),
    (electronic_comp_sub_id, 'RoHS Compliant', 'boolean', NULL, false, 7),
    (electronic_comp_sub_id, 'Lead Time', 'number', 'days', false, 8);

    UPDATE template_features SET options = '["Resistor", "Capacitor", "IC", "Transistor", "Diode", "LED", "Connector", "PCB", "Sensor", "Other"]'::jsonb 
    WHERE template_subcategory_id = electronic_comp_sub_id AND name = 'Component Type';

    -- Finished Goods Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (manufacturing_template_id, 'Finished Goods', 'Completed products ready for sale', 3)
    RETURNING id INTO finished_goods_cat_id;

    -- Finished goods subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (finished_goods_cat_id, 'Products', 'Final manufactured products', 1)
    RETURNING id INTO products_sub_id;

    -- Product features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (products_sub_id, 'Product Code', 'text', NULL, true, 1),
    (products_sub_id, 'Revision', 'text', NULL, false, 2),
    (products_sub_id, 'Production Date', 'date', NULL, false, 3),
    (products_sub_id, 'Batch Number', 'text', NULL, false, 4),
    (products_sub_id, 'Quality Grade', 'select', NULL, false, 5),
    (products_sub_id, 'Warranty Period', 'number', 'months', false, 6),
    (products_sub_id, 'Packaging Type', 'select', NULL, false, 7),
    (products_sub_id, 'Units per Package', 'number', NULL, false, 8);

    UPDATE template_features SET options = '["A", "B", "C", "Premium", "Standard", "Economy"]'::jsonb 
    WHERE template_subcategory_id = products_sub_id AND name = 'Quality Grade';
    
    UPDATE template_features SET options = '["Box", "Pallet", "Crate", "Bag", "Drum", "Container", "Individual"]'::jsonb 
    WHERE template_subcategory_id = products_sub_id AND name = 'Packaging Type';

    -- Update usage count
    UPDATE category_templates SET usage_count = 0 WHERE id = manufacturing_template_id;
END $$;