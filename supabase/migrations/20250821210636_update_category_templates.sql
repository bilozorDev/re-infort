-- Remove Retail Store and Manufacturing templates and enhance MSP Provider template

-- First, delete Retail Store and Manufacturing templates (cascade will handle related records)
DELETE FROM category_templates WHERE name IN ('Retail Store', 'Manufacturing');

-- Now enhance the MSP Provider template
DO $$
DECLARE
    msp_template_id UUID;
    -- Existing categories
    computers_cat_id UUID;
    networking_cat_id UUID;
    software_cat_id UUID;
    -- New categories
    peripherals_cat_id UUID;
    mobile_cat_id UUID;
    cloud_cat_id UUID;
    security_hw_cat_id UUID;
    datacenter_cat_id UUID;
    comm_cat_id UUID;
    -- New subcategories
    monitors_sub_id UUID;
    keyboards_sub_id UUID;
    printers_sub_id UUID;
    external_storage_sub_id UUID;
    docking_sub_id UUID;
    webcams_sub_id UUID;
    smartphones_sub_id UUID;
    hotspots_sub_id UUID;
    gps_sub_id UUID;
    mdm_sub_id UUID;
    vms_sub_id UUID;
    cloud_storage_sub_id UUID;
    db_services_sub_id UUID;
    container_sub_id UUID;
    cdn_sub_id UUID;
    cameras_sub_id UUID;
    access_control_sub_id UUID;
    biometric_sub_id UUID;
    hsm_sub_id UUID;
    tokens_sub_id UUID;
    rack_equipment_sub_id UUID;
    ups_sub_id UUID;
    cooling_sub_id UUID;
    kvm_sub_id UUID;
    patch_panels_sub_id UUID;
    voip_phones_sub_id UUID;
    pbx_sub_id UUID;
    video_conf_sub_id UUID;
    headsets_sub_id UUID;
    conf_room_sub_id UUID;
    -- Additional subcategories for existing categories
    nas_sub_id UUID;
    workstations_sub_id UUID;
    thin_clients_sub_id UUID;
    modems_sub_id UUID;
    load_balancers_sub_id UUID;
    productivity_sub_id UUID;
    database_sub_id UUID;
    dev_tools_sub_id UUID;
BEGIN
    -- Get the MSP Provider template ID
    SELECT id INTO msp_template_id FROM category_templates WHERE name = 'MSP Provider';
    
    -- Get existing category IDs
    SELECT id INTO computers_cat_id FROM template_categories 
    WHERE template_id = msp_template_id AND name = 'Computers & Hardware';
    
    SELECT id INTO networking_cat_id FROM template_categories 
    WHERE template_id = msp_template_id AND name = 'Networking Equipment';
    
    SELECT id INTO software_cat_id FROM template_categories 
    WHERE template_id = msp_template_id AND name = 'Software & Licenses';

    -- Add new subcategories to existing Computers & Hardware
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (computers_cat_id, 'Network Attached Storage (NAS)', 'NAS devices and storage appliances', 5)
    RETURNING id INTO nas_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (computers_cat_id, 'Workstations', 'High-performance workstations for specialized tasks', 6)
    RETURNING id INTO workstations_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (computers_cat_id, 'Thin Clients', 'Zero and thin client devices', 7)
    RETURNING id INTO thin_clients_sub_id;

    -- NAS features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (nas_sub_id, 'Model', 'text', NULL, true, 1),
    (nas_sub_id, 'Bay Count', 'number', NULL, true, 2),
    (nas_sub_id, 'Total Capacity', 'number', 'TB', true, 3),
    (nas_sub_id, 'RAID Type', 'select', NULL, false, 4),
    (nas_sub_id, 'Network Speed', 'select', NULL, true, 5),
    (nas_sub_id, 'RAM', 'number', 'GB', false, 6),
    (nas_sub_id, 'Hot Swappable', 'boolean', NULL, false, 7),
    (nas_sub_id, 'Redundant Power', 'boolean', NULL, false, 8);

    UPDATE template_features SET options = '["RAID 0", "RAID 1", "RAID 5", "RAID 6", "RAID 10", "SHR", "SHR-2", "JBOD"]'::jsonb 
    WHERE template_subcategory_id = nas_sub_id AND name = 'RAID Type';

    UPDATE template_features SET options = '["1 Gigabit", "2.5 Gigabit", "10 Gigabit", "25 Gigabit"]'::jsonb 
    WHERE template_subcategory_id = nas_sub_id AND name = 'Network Speed';

    -- Workstation features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (workstations_sub_id, 'CPU Model', 'text', NULL, true, 1),
    (workstations_sub_id, 'CPU Cores', 'number', 'cores', true, 2),
    (workstations_sub_id, 'RAM', 'number', 'GB', true, 3),
    (workstations_sub_id, 'Graphics Card', 'text', NULL, true, 4),
    (workstations_sub_id, 'VRAM', 'number', 'GB', false, 5),
    (workstations_sub_id, 'Storage Type', 'select', NULL, true, 6),
    (workstations_sub_id, 'Storage Capacity', 'number', 'TB', true, 7),
    (workstations_sub_id, 'Operating System', 'select', NULL, true, 8),
    (workstations_sub_id, 'ECC Memory', 'boolean', NULL, false, 9),
    (workstations_sub_id, 'Certification', 'text', NULL, false, 10);

    UPDATE template_features SET options = '["NVMe SSD", "SSD", "HDD", "Hybrid"]'::jsonb 
    WHERE template_subcategory_id = workstations_sub_id AND name = 'Storage Type';

    UPDATE template_features SET options = '["Windows 11 Pro for Workstations", "Windows 10 Pro for Workstations", "Ubuntu Pro", "Red Hat Enterprise", "macOS"]'::jsonb 
    WHERE template_subcategory_id = workstations_sub_id AND name = 'Operating System';

    -- Add new subcategories to Networking Equipment
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (networking_cat_id, 'Modems', 'Cable, DSL, and fiber modems', 5)
    RETURNING id INTO modems_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (networking_cat_id, 'Load Balancers', 'Network load balancing appliances', 6)
    RETURNING id INTO load_balancers_sub_id;

    -- Modem features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (modems_sub_id, 'Model', 'text', NULL, true, 1),
    (modems_sub_id, 'Type', 'select', NULL, true, 2),
    (modems_sub_id, 'Max Download Speed', 'number', 'Mbps', true, 3),
    (modems_sub_id, 'Max Upload Speed', 'number', 'Mbps', true, 4),
    (modems_sub_id, 'DOCSIS Version', 'select', NULL, false, 5),
    (modems_sub_id, 'Channels', 'text', NULL, false, 6);

    UPDATE template_features SET options = '["Cable", "DSL", "Fiber", "Satellite", "5G"]'::jsonb 
    WHERE template_subcategory_id = modems_sub_id AND name = 'Type';

    UPDATE template_features SET options = '["DOCSIS 3.0", "DOCSIS 3.1", "DOCSIS 4.0", "N/A"]'::jsonb 
    WHERE template_subcategory_id = modems_sub_id AND name = 'DOCSIS Version';

    -- Add new subcategories to Software & Licenses
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (software_cat_id, 'Productivity Software', 'Office suites and productivity tools', 5)
    RETURNING id INTO productivity_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (software_cat_id, 'Database Software', 'Database management systems', 6)
    RETURNING id INTO database_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (software_cat_id, 'Development Tools', 'IDEs and development software', 7)
    RETURNING id INTO dev_tools_sub_id;

    -- CREATE NEW CATEGORIES

    -- 1. Peripherals & Accessories Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Peripherals & Accessories', 'Monitors, input devices, and accessories', 4)
    RETURNING id INTO peripherals_cat_id;

    -- Peripherals subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (peripherals_cat_id, 'Monitors & Displays', 'Computer monitors and display devices', 1)
    RETURNING id INTO monitors_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (peripherals_cat_id, 'Keyboards & Mice', 'Input devices', 2)
    RETURNING id INTO keyboards_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (peripherals_cat_id, 'Printers & Scanners', 'Printing and scanning devices', 3)
    RETURNING id INTO printers_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (peripherals_cat_id, 'External Storage', 'External drives and storage devices', 4)
    RETURNING id INTO external_storage_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (peripherals_cat_id, 'Docking Stations', 'Laptop docking stations and hubs', 5)
    RETURNING id INTO docking_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (peripherals_cat_id, 'Webcams & Conference Equipment', 'Video conferencing hardware', 6)
    RETURNING id INTO webcams_sub_id;

    -- Monitor features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (monitors_sub_id, 'Brand', 'text', NULL, true, 1),
    (monitors_sub_id, 'Model', 'text', NULL, true, 2),
    (monitors_sub_id, 'Screen Size', 'number', 'inches', true, 3),
    (monitors_sub_id, 'Resolution', 'select', NULL, true, 4),
    (monitors_sub_id, 'Panel Type', 'select', NULL, false, 5),
    (monitors_sub_id, 'Refresh Rate', 'number', 'Hz', false, 6),
    (monitors_sub_id, 'Response Time', 'number', 'ms', false, 7),
    (monitors_sub_id, 'Connectivity', 'text', NULL, false, 8),
    (monitors_sub_id, 'Adjustable Stand', 'boolean', NULL, false, 9),
    (monitors_sub_id, 'VESA Mount', 'boolean', NULL, false, 10);

    UPDATE template_features SET options = '["1920x1080", "2560x1440", "3840x2160", "5120x1440", "3440x1440", "2560x1080"]'::jsonb 
    WHERE template_subcategory_id = monitors_sub_id AND name = 'Resolution';

    UPDATE template_features SET options = '["IPS", "VA", "TN", "OLED", "Mini-LED"]'::jsonb 
    WHERE template_subcategory_id = monitors_sub_id AND name = 'Panel Type';

    -- Printer features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (printers_sub_id, 'Brand', 'text', NULL, true, 1),
    (printers_sub_id, 'Model', 'text', NULL, true, 2),
    (printers_sub_id, 'Type', 'select', NULL, true, 3),
    (printers_sub_id, 'Technology', 'select', NULL, true, 4),
    (printers_sub_id, 'Color', 'boolean', NULL, true, 5),
    (printers_sub_id, 'Print Speed', 'number', 'ppm', false, 6),
    (printers_sub_id, 'Max Resolution', 'text', 'dpi', false, 7),
    (printers_sub_id, 'Paper Sizes', 'text', NULL, false, 8),
    (printers_sub_id, 'Network Connected', 'boolean', NULL, false, 9),
    (printers_sub_id, 'Duplex', 'boolean', NULL, false, 10);

    UPDATE template_features SET options = '["Printer", "Scanner", "Multifunction", "Plotter", "Label Printer", "3D Printer"]'::jsonb 
    WHERE template_subcategory_id = printers_sub_id AND name = 'Type';

    UPDATE template_features SET options = '["Laser", "Inkjet", "Thermal", "Dot Matrix", "Solid Ink", "LED"]'::jsonb 
    WHERE template_subcategory_id = printers_sub_id AND name = 'Technology';

    -- 2. Mobile Devices Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Mobile Devices', 'Smartphones, tablets, and mobile connectivity', 5)
    RETURNING id INTO mobile_cat_id;

    -- Mobile subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (mobile_cat_id, 'Smartphones', 'Company smartphones and mobile devices', 1)
    RETURNING id INTO smartphones_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (mobile_cat_id, 'Mobile Hotspots', 'Portable internet connectivity devices', 2)
    RETURNING id INTO hotspots_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (mobile_cat_id, 'GPS Devices', 'GPS trackers and navigation devices', 3)
    RETURNING id INTO gps_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (mobile_cat_id, 'MDM Solutions', 'Mobile device management tools', 4)
    RETURNING id INTO mdm_sub_id;

    -- Smartphone features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (smartphones_sub_id, 'Brand', 'text', NULL, true, 1),
    (smartphones_sub_id, 'Model', 'text', NULL, true, 2),
    (smartphones_sub_id, 'Operating System', 'select', NULL, true, 3),
    (smartphones_sub_id, 'Storage', 'number', 'GB', true, 4),
    (smartphones_sub_id, 'Screen Size', 'number', 'inches', false, 5),
    (smartphones_sub_id, 'Carrier', 'text', NULL, false, 6),
    (smartphones_sub_id, '5G Capable', 'boolean', NULL, false, 7),
    (smartphones_sub_id, 'IMEI', 'text', NULL, false, 8),
    (smartphones_sub_id, 'Phone Number', 'text', NULL, false, 9),
    (smartphones_sub_id, 'MDM Enrolled', 'boolean', NULL, false, 10);

    UPDATE template_features SET options = '["iOS", "Android", "Windows Mobile", "Other"]'::jsonb 
    WHERE template_subcategory_id = smartphones_sub_id AND name = 'Operating System';

    -- 3. Cloud Infrastructure Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Cloud Infrastructure', 'Cloud services and virtual resources', 6)
    RETURNING id INTO cloud_cat_id;

    -- Cloud subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (cloud_cat_id, 'Virtual Machines', 'Cloud VMs and compute instances', 1)
    RETURNING id INTO vms_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (cloud_cat_id, 'Storage Services', 'Cloud storage solutions', 2)
    RETURNING id INTO cloud_storage_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (cloud_cat_id, 'Database Services', 'Managed database services', 3)
    RETURNING id INTO db_services_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (cloud_cat_id, 'Container Services', 'Container and Kubernetes services', 4)
    RETURNING id INTO container_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (cloud_cat_id, 'CDN & Edge Services', 'Content delivery and edge computing', 5)
    RETURNING id INTO cdn_sub_id;

    -- VM features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (vms_sub_id, 'Provider', 'select', NULL, true, 1),
    (vms_sub_id, 'Instance Name', 'text', NULL, true, 2),
    (vms_sub_id, 'Instance Type', 'text', NULL, true, 3),
    (vms_sub_id, 'vCPUs', 'number', NULL, true, 4),
    (vms_sub_id, 'Memory', 'number', 'GB', true, 5),
    (vms_sub_id, 'Storage', 'number', 'GB', true, 6),
    (vms_sub_id, 'Operating System', 'text', NULL, true, 7),
    (vms_sub_id, 'Region', 'text', NULL, true, 8),
    (vms_sub_id, 'Availability Zone', 'text', NULL, false, 9),
    (vms_sub_id, 'Auto-scaling', 'boolean', NULL, false, 10),
    (vms_sub_id, 'Backup Enabled', 'boolean', NULL, false, 11),
    (vms_sub_id, 'Monthly Cost', 'number', '$', false, 12);

    UPDATE template_features SET options = '["AWS", "Azure", "Google Cloud", "Oracle Cloud", "IBM Cloud", "DigitalOcean", "Linode", "Vultr", "Other"]'::jsonb 
    WHERE template_subcategory_id = vms_sub_id AND name = 'Provider';

    -- 4. Security Hardware Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Security Hardware', 'Physical security and access control devices', 7)
    RETURNING id INTO security_hw_cat_id;

    -- Security hardware subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (security_hw_cat_id, 'Security Cameras', 'IP cameras and surveillance systems', 1)
    RETURNING id INTO cameras_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (security_hw_cat_id, 'Access Control', 'Door controllers and access systems', 2)
    RETURNING id INTO access_control_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (security_hw_cat_id, 'Biometric Devices', 'Fingerprint and facial recognition devices', 3)
    RETURNING id INTO biometric_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (security_hw_cat_id, 'Hardware Security Modules', 'HSM and encryption devices', 4)
    RETURNING id INTO hsm_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (security_hw_cat_id, 'Security Tokens', 'Hardware authentication tokens', 5)
    RETURNING id INTO tokens_sub_id;

    -- Security camera features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (cameras_sub_id, 'Brand', 'text', NULL, true, 1),
    (cameras_sub_id, 'Model', 'text', NULL, true, 2),
    (cameras_sub_id, 'Resolution', 'select', NULL, true, 3),
    (cameras_sub_id, 'Camera Type', 'select', NULL, true, 4),
    (cameras_sub_id, 'Night Vision', 'boolean', NULL, false, 5),
    (cameras_sub_id, 'PTZ Capable', 'boolean', NULL, false, 6),
    (cameras_sub_id, 'Storage Type', 'select', NULL, false, 7),
    (cameras_sub_id, 'Power Type', 'select', NULL, false, 8),
    (cameras_sub_id, 'Indoor/Outdoor', 'select', NULL, false, 9),
    (cameras_sub_id, 'Audio Recording', 'boolean', NULL, false, 10);

    UPDATE template_features SET options = '["720p", "1080p", "2K", "4K", "5MP", "8MP", "12MP"]'::jsonb 
    WHERE template_subcategory_id = cameras_sub_id AND name = 'Resolution';

    UPDATE template_features SET options = '["Dome", "Bullet", "PTZ", "Turret", "Fisheye", "Box"]'::jsonb 
    WHERE template_subcategory_id = cameras_sub_id AND name = 'Camera Type';

    UPDATE template_features SET options = '["Local", "Cloud", "NVR", "Hybrid"]'::jsonb 
    WHERE template_subcategory_id = cameras_sub_id AND name = 'Storage Type';

    UPDATE template_features SET options = '["PoE", "12V DC", "24V AC", "Battery", "Solar"]'::jsonb 
    WHERE template_subcategory_id = cameras_sub_id AND name = 'Power Type';

    UPDATE template_features SET options = '["Indoor", "Outdoor", "Both"]'::jsonb 
    WHERE template_subcategory_id = cameras_sub_id AND name = 'Indoor/Outdoor';

    -- 5. Data Center Equipment Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Data Center Equipment', 'Rack infrastructure and power management', 8)
    RETURNING id INTO datacenter_cat_id;

    -- Data center subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (datacenter_cat_id, 'Rack Equipment', 'Server racks and enclosures', 1)
    RETURNING id INTO rack_equipment_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (datacenter_cat_id, 'UPS Systems', 'Uninterruptible power supplies', 2)
    RETURNING id INTO ups_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (datacenter_cat_id, 'Cooling Systems', 'HVAC and cooling equipment', 3)
    RETURNING id INTO cooling_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (datacenter_cat_id, 'KVM Switches', 'Keyboard, video, mouse switches', 4)
    RETURNING id INTO kvm_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (datacenter_cat_id, 'Patch Panels', 'Network patch panels and cable management', 5)
    RETURNING id INTO patch_panels_sub_id;

    -- UPS features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (ups_sub_id, 'Brand', 'text', NULL, true, 1),
    (ups_sub_id, 'Model', 'text', NULL, true, 2),
    (ups_sub_id, 'Capacity', 'number', 'VA', true, 3),
    (ups_sub_id, 'Power Output', 'number', 'W', true, 4),
    (ups_sub_id, 'Form Factor', 'select', NULL, true, 5),
    (ups_sub_id, 'Runtime at Full Load', 'number', 'minutes', false, 6),
    (ups_sub_id, 'Runtime at Half Load', 'number', 'minutes', false, 7),
    (ups_sub_id, 'Input Voltage', 'text', 'V', false, 8),
    (ups_sub_id, 'Output Voltage', 'text', 'V', false, 9),
    (ups_sub_id, 'Battery Type', 'text', NULL, false, 10),
    (ups_sub_id, 'Network Card', 'boolean', NULL, false, 11),
    (ups_sub_id, 'Rack Units', 'number', 'U', false, 12);

    UPDATE template_features SET options = '["Tower", "Rack Mount", "Rack/Tower", "Desktop"]'::jsonb 
    WHERE template_subcategory_id = ups_sub_id AND name = 'Form Factor';

    -- 6. Communication Systems Category
    INSERT INTO template_categories (template_id, name, description, display_order)
    VALUES (msp_template_id, 'Communication Systems', 'VoIP and conferencing equipment', 9)
    RETURNING id INTO comm_cat_id;

    -- Communication subcategories
    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (comm_cat_id, 'VoIP Phones', 'IP phones and softphones', 1)
    RETURNING id INTO voip_phones_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (comm_cat_id, 'PBX Systems', 'Phone system servers', 2)
    RETURNING id INTO pbx_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (comm_cat_id, 'Video Conferencing', 'Video conferencing systems', 3)
    RETURNING id INTO video_conf_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (comm_cat_id, 'Headsets', 'Wired and wireless headsets', 4)
    RETURNING id INTO headsets_sub_id;

    INSERT INTO template_subcategories (template_category_id, name, description, display_order)
    VALUES (comm_cat_id, 'Conference Room Equipment', 'Meeting room AV equipment', 5)
    RETURNING id INTO conf_room_sub_id;

    -- VoIP phone features
    INSERT INTO template_features (template_subcategory_id, name, input_type, unit, is_required, display_order)
    VALUES 
    (voip_phones_sub_id, 'Brand', 'text', NULL, true, 1),
    (voip_phones_sub_id, 'Model', 'text', NULL, true, 2),
    (voip_phones_sub_id, 'Line Count', 'number', NULL, true, 3),
    (voip_phones_sub_id, 'Display Type', 'select', NULL, false, 4),
    (voip_phones_sub_id, 'PoE Capable', 'boolean', NULL, false, 5),
    (voip_phones_sub_id, 'Gigabit Ethernet', 'boolean', NULL, false, 6),
    (voip_phones_sub_id, 'Bluetooth', 'boolean', NULL, false, 7),
    (voip_phones_sub_id, 'WiFi', 'boolean', NULL, false, 8),
    (voip_phones_sub_id, 'Video Calling', 'boolean', NULL, false, 9),
    (voip_phones_sub_id, 'Extension Number', 'text', NULL, false, 10);

    UPDATE template_features SET options = '["None", "Monochrome", "Color", "Touchscreen Color"]'::jsonb 
    WHERE template_subcategory_id = voip_phones_sub_id AND name = 'Display Type';

    -- Update the template description to reflect enhancements
    UPDATE category_templates 
    SET description = 'Comprehensive IT inventory structure for MSPs including hardware, software, cloud services, security, and communication systems',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = msp_template_id;

END $$;