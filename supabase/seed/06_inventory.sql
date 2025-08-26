-- Seed data for IT inventory
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Temporarily drop the trigger that causes issues during seed
DROP TRIGGER IF EXISTS update_product_status_trigger ON inventory;

-- Clean up existing inventory data
TRUNCATE TABLE inventory CASCADE;

-- Insert inventory for each product in each warehouse
WITH warehouse_ids AS (
  SELECT id, name FROM warehouses WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
),
product_ids AS (
  SELECT id, sku FROM products WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi'
)
INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity, organization_clerk_id, created_by_clerk_user_id)
SELECT 
  p.id as product_id,
  w.id as warehouse_id,
  CASE 
    -- Main Warehouse gets more stock
    WHEN w.name = 'Main Warehouse' THEN 
      CASE 
        -- Computers
        WHEN p.sku LIKE 'DELL-OPT%' OR p.sku LIKE 'HP-ELITE%' OR p.sku LIKE 'LENOVO-M%' THEN 15
        WHEN p.sku LIKE 'DELL-LAT%' OR p.sku LIKE 'HP-ELITEBOOK%' OR p.sku LIKE 'LENOVO-T%' THEN 20
        WHEN p.sku LIKE 'APPLE-MBP%' THEN 10
        -- Servers
        WHEN p.sku LIKE 'DELL-R%' OR p.sku LIKE 'HP-DL%' OR p.sku LIKE 'LENOVO-SR%' THEN 5
        -- Networking
        WHEN p.sku LIKE 'CISCO%' THEN 8
        WHEN p.sku LIKE 'UBNT%' THEN 12
        WHEN p.sku LIKE 'NETGEAR%' THEN 20
        WHEN p.sku LIKE 'FORTINET%' OR p.sku LIKE 'PALO%' OR p.sku LIKE 'SONICWALL%' THEN 6
        -- Storage
        WHEN p.sku LIKE 'SAMSUNG%' OR p.sku LIKE 'WD%' OR p.sku LIKE 'CRUCIAL%' OR p.sku LIKE 'KINGSTON%' THEN 50
        WHEN p.sku LIKE 'CORSAIR%' OR p.sku LIKE 'GSKILL%' THEN 40
        WHEN p.sku LIKE 'SEAGATE%' THEN 25
        -- Monitors
        WHEN p.sku LIKE 'DELL-P%' OR p.sku LIKE 'HP-E%' OR p.sku LIKE 'LG%' OR p.sku LIKE 'ASUS%' THEN 15
        -- Peripherals
        WHEN p.sku LIKE 'LOGITECH%' OR p.sku LIKE 'DELL-KB%' OR p.sku LIKE 'MICROSOFT%' THEN 30
        WHEN p.sku LIKE 'TP-LINK%' OR p.sku LIKE 'NETGEAR-A%' OR p.sku LIKE 'ASUS-AX%' OR p.sku LIKE 'ANKER%' THEN 25
        -- Cables
        WHEN p.sku LIKE 'CAT6%' THEN 200
        WHEN p.sku LIKE 'C13%' OR p.sku LIKE 'C19%' OR p.sku LIKE 'PDU%' THEN 50
        WHEN p.sku LIKE 'USB%' THEN 100
        ELSE 10
      END
    -- Downtown Store gets less stock
    WHEN w.name = 'Downtown Store' THEN
      CASE 
        -- Computers - limited display models
        WHEN p.sku LIKE 'DELL-OPT%' OR p.sku LIKE 'HP-ELITE-800%' THEN 2
        WHEN p.sku LIKE 'DELL-LAT%' OR p.sku LIKE 'LENOVO-T%' THEN 3
        WHEN p.sku LIKE 'APPLE-MBP%' THEN 2
        -- No servers in store
        WHEN p.sku LIKE 'DELL-R%' OR p.sku LIKE 'HP-DL%' OR p.sku LIKE 'LENOVO-SR%' THEN 0
        -- Basic networking only
        WHEN p.sku LIKE 'NETGEAR-GS108' THEN 10
        WHEN p.sku LIKE 'CISCO%' OR p.sku LIKE 'FORTINET%' OR p.sku LIKE 'PALO%' THEN 0
        WHEN p.sku LIKE 'UBNT-UDM%' THEN 2
        -- Storage - popular items only
        WHEN p.sku LIKE 'SAMSUNG-980-1TB' OR p.sku LIKE 'CRUCIAL-MX500%' THEN 15
        WHEN p.sku LIKE 'CORSAIR%' OR p.sku LIKE 'GSKILL-16GB%' THEN 10
        -- Monitors - display models
        WHEN p.sku LIKE 'DELL-P%' OR p.sku LIKE 'HP-E%' THEN 3
        WHEN p.sku LIKE 'LG%' OR p.sku LIKE 'ASUS%' THEN 2
        -- Peripherals - high turnover items
        WHEN p.sku LIKE 'LOGITECH-MX%' OR p.sku LIKE 'DELL-KB%' THEN 10
        WHEN p.sku LIKE 'TP-LINK%' OR p.sku LIKE 'ANKER%' THEN 8
        -- Cables - essential stock
        WHEN p.sku LIKE 'CAT6-3FT' OR p.sku LIKE 'CAT6-6FT' OR p.sku LIKE 'CAT6-10FT' THEN 50
        WHEN p.sku LIKE 'USB-C-3FT' OR p.sku LIKE 'USB-C-6FT' THEN 25
        ELSE 0
      END
    -- Delivery Van - portable items only
    ELSE
      CASE 
        -- Only laptops, no desktops
        WHEN p.sku LIKE 'DELL-LAT%' OR p.sku LIKE 'LENOVO-T%' THEN 1
        -- No servers or large equipment
        WHEN p.sku LIKE 'DELL-R%' OR p.sku LIKE 'HP-DL%' OR p.sku LIKE '%SERVER%' THEN 0
        -- Small networking items
        WHEN p.sku LIKE 'NETGEAR-GS108' THEN 3
        -- Storage - SSDs and RAM only
        WHEN p.sku LIKE 'SAMSUNG-980-1TB' OR p.sku LIKE 'CRUCIAL-MX500%' THEN 5
        WHEN p.sku LIKE 'KINGSTON-8GB%' THEN 5
        -- No monitors in van
        WHEN p.sku LIKE 'DELL-P%' OR p.sku LIKE 'HP-E%' OR p.sku LIKE 'LG%' OR p.sku LIKE 'ASUS-PG%' THEN 0
        -- Small peripherals
        WHEN p.sku LIKE 'LOGITECH-MX-MASTER%' OR p.sku LIKE 'DELL-KB%' THEN 2
        WHEN p.sku LIKE 'TP-LINK%' OR p.sku LIKE 'ANKER%' THEN 3
        -- Essential cables
        WHEN p.sku LIKE 'CAT6-3FT' OR p.sku LIKE 'CAT6-6FT' THEN 10
        WHEN p.sku LIKE 'USB-C-3FT' THEN 5
        ELSE 0
      END
  END as quantity,
  -- Reserved quantity (some items reserved)
  CASE 
    WHEN w.name = 'Main Warehouse' AND p.sku LIKE 'DELL-LAT%' THEN 2
    WHEN w.name = 'Main Warehouse' AND p.sku LIKE 'CISCO%' THEN 1
    WHEN w.name = 'Main Warehouse' AND p.sku LIKE 'DELL-R%' THEN 1
    WHEN w.name = 'Downtown Store' AND p.sku LIKE 'APPLE-MBP%' THEN 1
    ELSE 0
  END as reserved_quantity,
  'org_31Vn5FBdgy2geINV5ggcrmM7Oqi',
  'user_31VkPrT5Eh3UtaCmdlfDGLxCsaq'
FROM product_ids p
CROSS JOIN warehouse_ids w
-- Skip items that shouldn't be stocked at certain locations
WHERE NOT (w.name = 'Downtown Store' AND p.sku IN (
  'DELL-R650', 'HP-DL380-G11', 'LENOVO-SR650',  -- No servers in store
  'CISCO-2960X-24', 'CISCO-ISR-4331', 'FORTINET-100F', 'PALO-PA-440', 'SONICWALL-TZ670',  -- No enterprise networking
  'WD-RED-4TB', 'SEAGATE-IRONWOLF-8TB', 'WD-PURPLE-6TB',  -- No HDDs in store
  'CAT6-25FT', 'CAT6-50FT', 'CAT6-100FT', 'CAT6A-25FT',  -- No long cables in store
  'C13-6FT', 'C19-6FT', 'PDU-BASIC-8'  -- No power infrastructure in store
))
AND NOT (w.name = 'Delivery Van' AND p.sku IN (
  'DELL-OPT-7010', 'HP-ELITE-800', 'LENOVO-M75Q',  -- No desktops in van
  'DELL-R650', 'HP-DL380-G11', 'LENOVO-SR650',  -- No servers in van
  'CISCO-2960X-24', 'HP-1950-48G', 'UBNT-USW-48',  -- No large switches in van
  'CISCO-ISR-4331', 'FORTINET-60F', 'UBNT-UDM-PRO',  -- No routers in van
  'FORTINET-100F', 'PALO-PA-440', 'SONICWALL-TZ670',  -- No firewalls in van
  'WD-RED-4TB', 'SEAGATE-IRONWOLF-8TB', 'WD-PURPLE-6TB',  -- No HDDs in van
  'DELL-P2423DE', 'HP-E27-G5', 'LG-27UN850', 'ASUS-PG279QM',  -- No monitors in van
  'MICROSOFT-ERGO', 'LOGITECH-MX-KEYS',  -- No keyboards in van
  'CAT6-25FT', 'CAT6-50FT', 'CAT6-100FT', 'CAT6A-25FT',  -- No long cables in van
  'C13-6FT', 'C19-6FT', 'PDU-BASIC-8', 'USB3-EXTENSION-10FT'  -- No power/extension cables in van
));

-- Recreate the trigger after seed
CREATE TRIGGER update_product_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_product_status_from_inventory();