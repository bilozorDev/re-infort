-- Main seed file that includes all seed data in the correct order
-- Organization ID: org_31Vn5FBdgy2geINV5ggcrmM7Oqi
-- User ID: user_31VkPrT5Eh3UtaCmdlfDGLxCsaq

-- Include all seed files in dependency order
\i seed/01_warehouses.sql
\i seed/02_categories.sql
\i seed/03_subcategories.sql
\i seed/04_feature_definitions.sql
\i seed/05_products.sql
\i seed/06_inventory.sql
\i seed/07_product_features.sql
\i seed/08_stock_movements.sql

-- Output confirmation
DO $$
DECLARE
  warehouse_count INTEGER;
  category_count INTEGER;
  subcategory_count INTEGER;
  product_count INTEGER;
  feature_def_count INTEGER;
  product_feature_count INTEGER;
  inventory_count INTEGER;
  movement_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO warehouse_count FROM warehouses WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  SELECT COUNT(*) INTO category_count FROM categories WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  SELECT COUNT(*) INTO subcategory_count FROM subcategories WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  SELECT COUNT(*) INTO product_count FROM products WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  SELECT COUNT(*) INTO feature_def_count FROM feature_definitions WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  SELECT COUNT(*) INTO product_feature_count FROM product_features WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  SELECT COUNT(*) INTO inventory_count FROM inventory WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  SELECT COUNT(*) INTO movement_count FROM stock_movements WHERE organization_clerk_id = 'org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  
  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Organization: org_31Vn5FBdgy2geINV5ggcrmM7Oqi';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '  - % Warehouses', warehouse_count;
  RAISE NOTICE '  - % Categories', category_count;
  RAISE NOTICE '  - % Subcategories', subcategory_count;
  RAISE NOTICE '  - % Products', product_count;
  RAISE NOTICE '  - % Feature Definitions', feature_def_count;
  RAISE NOTICE '  - % Product Features', product_feature_count;
  RAISE NOTICE '  - % Inventory Records', inventory_count;
  RAISE NOTICE '  - % Stock Movements', movement_count;
END $$;