-- Update inventory functions to accept and store user name parameter

-- Update transfer_inventory function to accept user name
CREATE OR REPLACE FUNCTION transfer_inventory(
    p_product_id UUID,
    p_from_warehouse_id UUID,
    p_to_warehouse_id UUID,
    p_quantity INTEGER,
    p_reason TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_from_quantity INTEGER;
    v_from_reserved_quantity INTEGER;
    v_from_available_quantity INTEGER;
    v_to_quantity INTEGER;
    v_organization_id TEXT;
    v_user_id TEXT;
    v_movement_id UUID;
    v_from_inventory_id UUID;
    v_to_inventory_id UUID;
BEGIN
    -- Validate quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Transfer quantity must be positive';
    END IF;
    
    -- Get organization and user from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- Lock and get source inventory with available quantity calculation
    SELECT id, quantity, reserved_quantity, (quantity - reserved_quantity) 
    INTO v_from_inventory_id, v_from_quantity, v_from_reserved_quantity, v_from_available_quantity
    FROM inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_from_warehouse_id
    FOR UPDATE;
    
    -- Check source inventory exists and has sufficient available quantity
    IF v_from_inventory_id IS NULL THEN
        RAISE EXCEPTION 'Product not found in source warehouse';
    END IF;
    
    IF v_from_available_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock in source warehouse. Available: %, Requested: %', 
            v_from_available_quantity, p_quantity;
    END IF;
    
    -- Update source warehouse inventory
    UPDATE inventory
    SET quantity = quantity - p_quantity,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_from_inventory_id;
    
    -- Get or create destination inventory
    SELECT id, quantity INTO v_to_inventory_id, v_to_quantity
    FROM inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_to_warehouse_id
    FOR UPDATE;
    
    IF v_to_inventory_id IS NULL THEN
        -- Create new inventory record for destination
        INSERT INTO inventory (
            organization_clerk_id,
            product_id,
            warehouse_id,
            quantity,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            v_organization_id,
            p_product_id,
            p_to_warehouse_id,
            p_quantity,
            v_user_id,
            p_user_name
        )
        RETURNING id INTO v_to_inventory_id;
        
        v_to_quantity := 0;
    ELSE
        -- Update existing inventory
        UPDATE inventory
        SET quantity = quantity + p_quantity,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_to_inventory_id;
    END IF;
    
    -- Record the transfer movement with user name
    INSERT INTO stock_movements (
        organization_clerk_id,
        movement_type,
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        reason,
        notes,
        created_by_clerk_user_id,
        created_by_name
    ) VALUES (
        v_organization_id,
        'transfer',
        p_product_id,
        p_from_warehouse_id,
        p_to_warehouse_id,
        p_quantity,
        p_reason,
        p_notes,
        v_user_id,
        p_user_name
    )
    RETURNING id INTO v_movement_id;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'movement_id', v_movement_id,
        'from_warehouse_id', p_from_warehouse_id,
        'to_warehouse_id', p_to_warehouse_id,
        'quantity_transferred', p_quantity,
        'from_new_quantity', v_from_quantity - p_quantity,
        'to_new_quantity', v_to_quantity + p_quantity,
        'from_available_quantity', v_from_available_quantity - p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update adjust_inventory function to accept user name
CREATE OR REPLACE FUNCTION adjust_inventory(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity_change INTEGER,
    p_movement_type TEXT,
    p_reason TEXT DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_current_quantity INTEGER;
    v_new_quantity INTEGER;
    v_organization_id TEXT;
    v_user_id TEXT;
    v_movement_id UUID;
    v_inventory_id UUID;
BEGIN
    -- Get organization and user from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- Lock the inventory row for update
    SELECT id, quantity INTO v_inventory_id, v_current_quantity
    FROM inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_warehouse_id
    FOR UPDATE;
    
    -- If inventory record doesn't exist and we're adding stock, create it
    IF v_inventory_id IS NULL AND p_quantity_change > 0 THEN
        INSERT INTO inventory (
            organization_clerk_id,
            product_id,
            warehouse_id,
            quantity,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            v_organization_id,
            p_product_id,
            p_warehouse_id,
            p_quantity_change,
            v_user_id,
            p_user_name
        )
        RETURNING id INTO v_inventory_id;
        
        v_new_quantity := p_quantity_change;
    ELSIF v_inventory_id IS NULL AND p_quantity_change <= 0 THEN
        RAISE EXCEPTION 'Cannot remove stock from non-existent inventory';
    ELSE
        -- Calculate new quantity
        v_new_quantity := v_current_quantity + p_quantity_change;
        
        -- Check if new quantity would be negative
        IF v_new_quantity < 0 THEN
            RAISE EXCEPTION 'Insufficient stock. Current: %, Requested change: %', 
                v_current_quantity, p_quantity_change;
        END IF;
        
        -- Update inventory quantity
        UPDATE inventory
        SET quantity = v_new_quantity,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_inventory_id;
    END IF;
    
    -- Record the movement with user name
    INSERT INTO stock_movements (
        organization_clerk_id,
        movement_type,
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        reason,
        reference_number,
        reference_type,
        created_by_clerk_user_id,
        created_by_name
    ) VALUES (
        v_organization_id,
        p_movement_type,
        p_product_id,
        CASE WHEN p_quantity_change < 0 THEN p_warehouse_id ELSE NULL END,
        CASE WHEN p_quantity_change > 0 THEN p_warehouse_id ELSE NULL END,
        ABS(p_quantity_change),
        p_reason,
        p_reference_number,
        p_reference_type,
        v_user_id,
        p_user_name
    )
    RETURNING id INTO v_movement_id;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'inventory_id', v_inventory_id,
        'movement_id', v_movement_id,
        'previous_quantity', COALESCE(v_current_quantity, 0),
        'new_quantity', v_new_quantity,
        'quantity_change', p_quantity_change
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comments with proper parameter specification
COMMENT ON FUNCTION transfer_inventory(UUID, UUID, UUID, INTEGER, TEXT, TEXT, TEXT) IS 'Transfers inventory between warehouses, checking available quantity and recording user name';
COMMENT ON FUNCTION adjust_inventory(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Adjusts inventory levels and records user name for audit trail';