-- Function to adjust inventory quantity
CREATE OR REPLACE FUNCTION adjust_inventory(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity_change INTEGER,
    p_movement_type TEXT,
    p_reason TEXT DEFAULT NULL,
    p_reference_number TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL
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
            created_by_clerk_user_id
        ) VALUES (
            v_organization_id,
            p_product_id,
            p_warehouse_id,
            p_quantity_change,
            v_user_id
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
    
    -- Record the movement
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
        created_by_clerk_user_id
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
        v_user_id
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

-- Function to transfer inventory between warehouses
CREATE OR REPLACE FUNCTION transfer_inventory(
    p_product_id UUID,
    p_from_warehouse_id UUID,
    p_to_warehouse_id UUID,
    p_quantity INTEGER,
    p_reason TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_from_quantity INTEGER;
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
    
    -- Lock and get source inventory
    SELECT id, quantity INTO v_from_inventory_id, v_from_quantity
    FROM inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_from_warehouse_id
    FOR UPDATE;
    
    -- Check source inventory exists and has sufficient quantity
    IF v_from_inventory_id IS NULL THEN
        RAISE EXCEPTION 'Product not found in source warehouse';
    END IF;
    
    IF v_from_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock in source warehouse. Available: %, Requested: %', 
            v_from_quantity, p_quantity;
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
            created_by_clerk_user_id
        ) VALUES (
            v_organization_id,
            p_product_id,
            p_to_warehouse_id,
            p_quantity,
            v_user_id
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
    
    -- Record the transfer movement
    INSERT INTO stock_movements (
        organization_clerk_id,
        movement_type,
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        reason,
        notes,
        created_by_clerk_user_id
    ) VALUES (
        v_organization_id,
        'transfer',
        p_product_id,
        p_from_warehouse_id,
        p_to_warehouse_id,
        p_quantity,
        p_reason,
        p_notes,
        v_user_id
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
        'to_new_quantity', v_to_quantity + p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total inventory across all warehouses for a product
CREATE OR REPLACE FUNCTION get_product_total_inventory(p_product_id UUID)
RETURNS TABLE (
    total_quantity INTEGER,
    total_reserved INTEGER,
    total_available INTEGER,
    warehouse_count INTEGER,
    warehouses JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(i.quantity), 0)::INTEGER as total_quantity,
        COALESCE(SUM(i.reserved_quantity), 0)::INTEGER as total_reserved,
        COALESCE(SUM(i.quantity - i.reserved_quantity), 0)::INTEGER as total_available,
        COUNT(DISTINCT i.warehouse_id)::INTEGER as warehouse_count,
        json_agg(
            json_build_object(
                'warehouse_id', w.id,
                'warehouse_name', w.name,
                'quantity', i.quantity,
                'reserved', i.reserved_quantity,
                'available', i.quantity - i.reserved_quantity
            )
        ) as warehouses
    FROM inventory i
    JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.product_id = p_product_id
    AND i.organization_clerk_id = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
    GROUP BY i.product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reserve inventory
CREATE OR REPLACE FUNCTION reserve_inventory(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER,
    p_reference_number TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_available_quantity INTEGER;
    v_inventory_id UUID;
BEGIN
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
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'inventory_id', v_inventory_id,
        'reserved_quantity', p_quantity,
        'reference_number', p_reference_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release reserved inventory
CREATE OR REPLACE FUNCTION release_reservation(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_reserved_quantity INTEGER;
    v_inventory_id UUID;
BEGIN
    -- Get current reserved quantity
    SELECT id, reserved_quantity INTO v_inventory_id, v_reserved_quantity
    FROM inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_warehouse_id
    FOR UPDATE;
    
    -- Check if inventory exists
    IF v_inventory_id IS NULL THEN
        RAISE EXCEPTION 'Product not found in warehouse';
    END IF;
    
    -- Check if sufficient reserved quantity exists
    IF v_reserved_quantity < p_quantity THEN
        RAISE EXCEPTION 'Cannot release more than reserved. Reserved: %, Requested: %', 
            v_reserved_quantity, p_quantity;
    END IF;
    
    -- Update reserved quantity
    UPDATE inventory
    SET reserved_quantity = reserved_quantity - p_quantity,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_inventory_id;
    
    -- Return result
    RETURN json_build_object(
        'success', true,
        'inventory_id', v_inventory_id,
        'released_quantity', p_quantity,
        'new_reserved_quantity', v_reserved_quantity - p_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION adjust_inventory IS 'Adjusts inventory quantity and records the movement';
COMMENT ON FUNCTION transfer_inventory IS 'Transfers inventory between warehouses';
COMMENT ON FUNCTION get_product_total_inventory IS 'Gets total inventory across all warehouses for a product';
COMMENT ON FUNCTION reserve_inventory IS 'Reserves inventory for future use';
COMMENT ON FUNCTION release_reservation IS 'Releases previously reserved inventory';