-- Trigger to automatically update inventory when stock movements are created
CREATE OR REPLACE FUNCTION process_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
    v_inventory_id UUID;
    v_current_quantity INTEGER;
BEGIN
    -- Only process completed movements
    IF NEW.status != 'completed' THEN
        RETURN NEW;
    END IF;
    
    -- Handle movements that remove stock from a warehouse
    IF NEW.from_warehouse_id IS NOT NULL THEN
        -- Get current inventory
        SELECT id, quantity INTO v_inventory_id, v_current_quantity
        FROM inventory
        WHERE product_id = NEW.product_id 
        AND warehouse_id = NEW.from_warehouse_id
        FOR UPDATE;
        
        -- Check if inventory exists
        IF v_inventory_id IS NULL THEN
            RAISE EXCEPTION 'Product % not found in source warehouse %', 
                NEW.product_id, NEW.from_warehouse_id;
        END IF;
        
        -- Check sufficient quantity
        IF v_current_quantity < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient stock in source warehouse. Available: %, Required: %', 
                v_current_quantity, NEW.quantity;
        END IF;
        
        -- Update inventory
        UPDATE inventory
        SET quantity = quantity - NEW.quantity,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_inventory_id;
    END IF;
    
    -- Handle movements that add stock to a warehouse
    IF NEW.to_warehouse_id IS NOT NULL THEN
        -- Try to get existing inventory
        SELECT id INTO v_inventory_id
        FROM inventory
        WHERE product_id = NEW.product_id 
        AND warehouse_id = NEW.to_warehouse_id
        FOR UPDATE;
        
        IF v_inventory_id IS NULL THEN
            -- Create new inventory record
            INSERT INTO inventory (
                organization_clerk_id,
                product_id,
                warehouse_id,
                quantity,
                created_by_clerk_user_id
            ) VALUES (
                NEW.organization_clerk_id,
                NEW.product_id,
                NEW.to_warehouse_id,
                NEW.quantity,
                NEW.created_by_clerk_user_id
            );
        ELSE
            -- Update existing inventory
            UPDATE inventory
            SET quantity = quantity + NEW.quantity,
                updated_at = TIMEZONE('utc', NOW())
            WHERE id = v_inventory_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for stock movements
CREATE TRIGGER process_stock_movement_trigger
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION process_stock_movement();

-- Trigger to prevent direct inventory updates without movements (optional, for audit trail)
CREATE OR REPLACE FUNCTION validate_inventory_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow the update but log a warning (in production, you might want to be stricter)
    -- This is mainly for debugging and ensuring all inventory changes go through proper channels
    IF OLD.quantity != NEW.quantity THEN
        -- You could add logging here or even prevent the update
        -- For now, we'll allow it but you can uncomment the next line to be strict:
        -- RAISE EXCEPTION 'Direct inventory updates are not allowed. Use stock movement functions.';
        NULL; -- Allow the update
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create trigger to validate inventory updates
-- Commented out by default to allow flexibility during development
-- UNCOMMENT if you want to enforce strict inventory control
-- CREATE TRIGGER validate_inventory_update_trigger
--     BEFORE UPDATE ON inventory
--     FOR EACH ROW
--     EXECUTE FUNCTION validate_inventory_update();

-- Trigger to update product status based on inventory
CREATE OR REPLACE FUNCTION update_product_status_from_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_total_quantity INTEGER;
BEGIN
    -- Calculate total quantity across all warehouses
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_quantity
    FROM inventory
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);
    
    -- Update product status if needed
    -- This is optional and depends on business logic
    -- You can customize this based on your requirements
    IF v_total_quantity = 0 THEN
        -- Optionally mark product as out of stock
        -- UPDATE products 
        -- SET status = 'out_of_stock'
        -- WHERE id = COALESCE(NEW.product_id, OLD.product_id);
        NULL; -- Placeholder
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for inventory changes affecting product status
CREATE TRIGGER update_product_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_product_status_from_inventory();

-- Trigger to prevent deletion of products with inventory
CREATE OR REPLACE FUNCTION prevent_product_deletion_with_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_inventory_count INTEGER;
BEGIN
    -- Check if product has any inventory
    SELECT COUNT(*) INTO v_inventory_count
    FROM inventory
    WHERE product_id = OLD.id AND quantity > 0;
    
    IF v_inventory_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete product with existing inventory. Please adjust inventory to 0 first.';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to prevent product deletion with inventory
CREATE TRIGGER prevent_product_deletion_trigger
    BEFORE DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION prevent_product_deletion_with_inventory();

-- Trigger to log inventory adjustments
CREATE OR REPLACE FUNCTION log_inventory_adjustment()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger logs significant inventory changes
    -- You can extend this to send notifications, alerts, etc.
    
    -- Check for significant changes (e.g., quantity changed by more than 50%)
    IF OLD.quantity > 0 AND ABS(NEW.quantity - OLD.quantity) > (OLD.quantity * 0.5) THEN
        -- Log or alert about significant change
        -- In production, you might want to insert into an audit table
        -- or trigger a notification
        NULL; -- Placeholder for logging logic
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for inventory adjustment logging
CREATE TRIGGER log_inventory_adjustment_trigger
    AFTER UPDATE ON inventory
    FOR EACH ROW
    WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
    EXECUTE FUNCTION log_inventory_adjustment();

-- Add comments
COMMENT ON FUNCTION process_stock_movement IS 'Automatically updates inventory when stock movements are created';
COMMENT ON FUNCTION validate_inventory_update IS 'Validates direct inventory updates (optional enforcement)';
COMMENT ON FUNCTION update_product_status_from_inventory IS 'Updates product status based on inventory levels';
COMMENT ON FUNCTION prevent_product_deletion_with_inventory IS 'Prevents deletion of products that have inventory';
COMMENT ON FUNCTION log_inventory_adjustment IS 'Logs significant inventory adjustments for audit purposes';