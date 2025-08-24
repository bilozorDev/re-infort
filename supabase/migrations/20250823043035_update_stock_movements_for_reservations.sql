-- Migration to update stock_movements table to support reservations
-- Reservations hold stock in place (from_warehouse_id only) without moving it

-- First, drop the existing constraints
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS transfer_warehouses_check;
ALTER TABLE stock_movements DROP CONSTRAINT IF EXISTS non_transfer_warehouse_check;

-- Add new constraint that handles all movement types including reservations
ALTER TABLE stock_movements ADD CONSTRAINT movement_warehouse_requirements CHECK (
    -- When status is 'reserved', only need from_warehouse_id (where stock is held)
    -- This applies to any movement type when reserved
    (status = 'reserved' AND from_warehouse_id IS NOT NULL) OR
    
    -- When status is 'completed', follow normal movement type rules
    (status = 'completed' AND (
        -- Transfers need both warehouses
        (movement_type = 'transfer' AND from_warehouse_id IS NOT NULL AND to_warehouse_id IS NOT NULL) OR
        
        -- Receipts and returns add stock to a warehouse
        (movement_type IN ('receipt', 'return') AND to_warehouse_id IS NOT NULL AND from_warehouse_id IS NULL) OR
        
        -- Sales, damage, and production remove stock from a warehouse
        (movement_type IN ('sale', 'damage', 'production') AND from_warehouse_id IS NOT NULL AND to_warehouse_id IS NULL) OR
        
        -- Adjustments can either add or remove stock
        (movement_type = 'adjustment' AND 
            ((from_warehouse_id IS NOT NULL AND to_warehouse_id IS NULL) OR 
             (from_warehouse_id IS NULL AND to_warehouse_id IS NOT NULL)))
    ))
);

-- Update the reserve_inventory function to create proper reservation records
CREATE OR REPLACE FUNCTION reserve_inventory(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER,
    p_reference_number TEXT DEFAULT NULL,
    p_movement_type TEXT DEFAULT 'sale', -- Default to sale reservation
    p_reason TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_available_quantity INTEGER;
    v_inventory_id UUID;
    v_organization_id TEXT;
    v_user_id TEXT;
    v_movement_id UUID;
BEGIN
    -- Validate movement type
    IF p_movement_type NOT IN ('sale', 'transfer', 'production') THEN
        RAISE EXCEPTION 'Invalid movement type for reservation. Must be sale, transfer, or production';
    END IF;
    
    -- Get organization and user from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- Get available quantity (quantity - reserved_quantity)
    SELECT id, (quantity - reserved_quantity) INTO v_inventory_id, v_available_quantity
    FROM inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_warehouse_id
    FOR UPDATE;
    
    -- Check if inventory exists
    IF v_inventory_id IS NULL THEN
        RAISE EXCEPTION 'Product not found in warehouse';
    END IF;
    
    -- Check if sufficient quantity is available
    IF v_available_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient available stock. Available: %, Requested: %', 
            v_available_quantity, p_quantity;
    END IF;
    
    -- Update reserved quantity
    UPDATE inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_inventory_id;
    
    -- Create a stock movement record for the reservation
    INSERT INTO stock_movements (
        organization_clerk_id,
        movement_type,
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        reference_number,
        reason,
        status,
        created_by_clerk_user_id,
        created_by_name
    ) VALUES (
        v_organization_id,
        p_movement_type, -- Use the specified movement type
        p_product_id,
        p_warehouse_id, -- from_warehouse_id (where stock is reserved)
        NULL, -- to_warehouse_id is NULL for reservations
        p_quantity,
        p_reference_number,
        COALESCE(p_reason, 'Stock reserved for ' || p_movement_type),
        'reserved', -- Mark as reserved status
        v_user_id,
        p_user_name
    )
    RETURNING id INTO v_movement_id;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'inventory_id', v_inventory_id,
        'movement_id', v_movement_id,
        'reserved_quantity', p_quantity,
        'reference_number', p_reference_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the release_reservation function
CREATE OR REPLACE FUNCTION release_reservation(
    p_movement_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_warehouse_id UUID;
    v_quantity INTEGER;
    v_inventory_id UUID;
    v_organization_id TEXT;
    v_user_id TEXT;
BEGIN
    -- Get organization and user from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- Get the reserved movement details
    SELECT product_id, from_warehouse_id, quantity
    INTO v_product_id, v_warehouse_id, v_quantity
    FROM stock_movements
    WHERE id = p_movement_id 
    AND status = 'reserved'
    AND organization_clerk_id = v_organization_id
    FOR UPDATE;
    
    -- Check if movement exists and is reserved
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Reserved movement not found or already completed/released';
    END IF;
    
    -- Get inventory
    SELECT id INTO v_inventory_id
    FROM inventory
    WHERE product_id = v_product_id 
    AND warehouse_id = v_warehouse_id
    FOR UPDATE;
    
    -- Update reserved quantity
    UPDATE inventory
    SET reserved_quantity = reserved_quantity - v_quantity,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_inventory_id;
    
    -- Delete the reservation movement (or optionally update with a cancellation note)
    DELETE FROM stock_movements WHERE id = p_movement_id;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'inventory_id', v_inventory_id,
        'released_quantity', v_quantity,
        'product_id', v_product_id,
        'warehouse_id', v_warehouse_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a reservation (convert to actual movement)
CREATE OR REPLACE FUNCTION complete_reservation(
    p_movement_id UUID,
    p_to_warehouse_id UUID DEFAULT NULL, -- Required for transfers
    p_notes TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_product_id UUID;
    v_from_warehouse_id UUID;
    v_quantity INTEGER;
    v_movement_type TEXT;
    v_inventory_id UUID;
    v_reserved_quantity INTEGER;
    v_organization_id TEXT;
    v_user_id TEXT;
BEGIN
    -- Get organization and user from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- Get the reserved movement details
    SELECT product_id, from_warehouse_id, quantity, movement_type
    INTO v_product_id, v_from_warehouse_id, v_quantity, v_movement_type
    FROM stock_movements
    WHERE id = p_movement_id 
    AND status = 'reserved'
    AND organization_clerk_id = v_organization_id
    FOR UPDATE;
    
    -- Check if movement exists and is reserved
    IF v_product_id IS NULL THEN
        RAISE EXCEPTION 'Reserved movement not found or already completed';
    END IF;
    
    -- If transfer, validate to_warehouse_id
    IF v_movement_type = 'transfer' AND p_to_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Destination warehouse required for transfer completion';
    END IF;
    
    -- Get inventory and verify reserved quantity
    SELECT id, reserved_quantity INTO v_inventory_id, v_reserved_quantity
    FROM inventory
    WHERE product_id = v_product_id 
    AND warehouse_id = v_from_warehouse_id
    FOR UPDATE;
    
    IF v_reserved_quantity < v_quantity THEN
        RAISE EXCEPTION 'Insufficient reserved quantity. Reserved: %, Required: %', 
            v_reserved_quantity, v_quantity;
    END IF;
    
    -- Update the stock movement to completed
    UPDATE stock_movements
    SET status = 'completed',
        to_warehouse_id = p_to_warehouse_id,
        notes = COALESCE(p_notes, notes),
        created_by_name = COALESCE(p_user_name, created_by_name)
    WHERE id = p_movement_id;
    
    -- Reduce reserved quantity
    UPDATE inventory
    SET reserved_quantity = reserved_quantity - v_quantity,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_inventory_id;
    
    -- For sales and production, reduce the actual quantity
    IF v_movement_type IN ('sale', 'production', 'damage') THEN
        UPDATE inventory
        SET quantity = quantity - v_quantity,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_inventory_id;
    END IF;
    
    -- For transfers, move the quantity to destination warehouse
    IF v_movement_type = 'transfer' THEN
        -- Reduce quantity from source warehouse
        UPDATE inventory
        SET quantity = quantity - v_quantity,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_inventory_id;
        
        -- Add to destination warehouse (create if doesn't exist)
        INSERT INTO inventory (
            organization_clerk_id,
            product_id,
            warehouse_id,
            quantity,
            reserved_quantity,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            v_organization_id,
            v_product_id,
            p_to_warehouse_id,
            v_quantity,
            0,
            v_user_id,
            p_user_name
        )
        ON CONFLICT (product_id, warehouse_id)
        DO UPDATE SET 
            quantity = inventory.quantity + v_quantity,
            updated_at = TIMEZONE('utc', NOW());
    END IF;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'movement_id', p_movement_id,
        'movement_type', v_movement_type,
        'quantity', v_quantity,
        'from_warehouse_id', v_from_warehouse_id,
        'to_warehouse_id', p_to_warehouse_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update view to show reservation status clearly
DROP VIEW IF EXISTS stock_movements_details;
CREATE VIEW stock_movements_details AS
SELECT 
    sm.*,
    p.name as product_name,
    p.sku as product_sku,
    fw.name as from_warehouse_name,
    tw.name as to_warehouse_name,
    CASE 
        WHEN sm.status = 'reserved' THEN 
            'Reserved in ' || fw.name || ' for ' || sm.movement_type
        WHEN sm.movement_type = 'transfer' THEN 
            fw.name || ' -> ' || tw.name
        WHEN sm.from_warehouse_id IS NOT NULL THEN 
            'From ' || fw.name
        WHEN sm.to_warehouse_id IS NOT NULL THEN 
            'To ' || tw.name
        ELSE 'N/A'
    END as movement_description
FROM stock_movements sm
JOIN products p ON sm.product_id = p.id
LEFT JOIN warehouses fw ON sm.from_warehouse_id = fw.id
LEFT JOIN warehouses tw ON sm.to_warehouse_id = tw.id;

-- Add helpful indexes for reservation queries
CREATE INDEX IF NOT EXISTS idx_stock_movements_status_reserved 
    ON stock_movements(status, organization_clerk_id) 
    WHERE status = 'reserved';

CREATE INDEX IF NOT EXISTS idx_inventory_reserved_quantity 
    ON inventory(product_id, warehouse_id, reserved_quantity) 
    WHERE reserved_quantity > 0;

-- Add comments with proper function signatures
COMMENT ON FUNCTION reserve_inventory(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) IS 'Reserves inventory in a warehouse for future sale/transfer/production';
COMMENT ON FUNCTION release_reservation(UUID, TEXT, TEXT) IS 'Releases a reserved stock movement, making the inventory available again';
COMMENT ON FUNCTION complete_reservation(UUID, UUID, TEXT, TEXT) IS 'Completes a reserved stock movement, executing the actual sale/transfer/production';
COMMENT ON COLUMN stock_movements.status IS 'Status of the movement: reserved (holding stock in place) or completed (movement executed)';