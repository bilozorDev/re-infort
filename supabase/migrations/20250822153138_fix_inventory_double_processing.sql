-- Fix double processing of inventory updates in transfer_inventory function
-- The issue: transfer_inventory updates inventory directly AND process_stock_movement trigger also tries to update it
-- Solution: Disable the trigger for movements created by transfer_inventory function

-- First, drop the existing trigger
DROP TRIGGER IF EXISTS process_stock_movement_trigger ON stock_movements;

-- Recreate the process_stock_movement function to skip processing for transfer movements
-- (since transfer_inventory already handles the inventory updates)
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
    
    -- IMPORTANT: Skip processing for transfer movements
    -- The transfer_inventory function already handles inventory updates
    IF NEW.movement_type = 'transfer' THEN
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

-- Recreate the trigger
CREATE TRIGGER process_stock_movement_trigger
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION process_stock_movement();

COMMENT ON FUNCTION process_stock_movement IS 'Processes stock movements and updates inventory. Skips transfer movements as they are handled by transfer_inventory function.';