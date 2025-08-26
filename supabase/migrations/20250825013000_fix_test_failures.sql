-- Fix test failures by ensuring all functions use proper schema prefixes
-- This addresses the "relation does not exist" errors in tests

-- Fix prevent_product_deletion_with_inventory function
DROP FUNCTION IF EXISTS public.prevent_product_deletion_with_inventory() CASCADE;

CREATE OR REPLACE FUNCTION public.prevent_product_deletion_with_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    inventory_count INTEGER;
BEGIN
    -- Count inventory records for this product
    SELECT COUNT(*) INTO inventory_count
    FROM public.inventory
    WHERE product_id = OLD.id AND quantity > 0;

    IF inventory_count > 0 THEN
        RAISE EXCEPTION 'Cannot delete product with existing inventory. Product has inventory in % warehouse(s).', inventory_count;
    END IF;

    RETURN OLD;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER prevent_product_deletion_with_inventory_trigger
BEFORE DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.prevent_product_deletion_with_inventory();

-- Fix update_product_status_from_inventory trigger function
DROP FUNCTION IF EXISTS public.update_product_status_from_inventory() CASCADE;

CREATE OR REPLACE FUNCTION public.update_product_status_from_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    total_inventory INTEGER;
BEGIN
    -- Calculate total inventory across all warehouses
    SELECT COALESCE(SUM(quantity), 0) INTO total_inventory
    FROM public.inventory
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);
    
    -- Update product status based on total inventory
    UPDATE public.products
    SET status = CASE
        WHEN total_inventory > 0 THEN 'active'
        ELSE 'out_of_stock'
    END
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_product_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_product_status_from_inventory();

-- Fix adjust_inventory function to use proper schema prefixes
DROP FUNCTION IF EXISTS public.adjust_inventory(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.adjust_inventory(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity_change INTEGER,
    p_movement_type TEXT,
    p_reason TEXT,
    p_reference_number TEXT DEFAULT NULL,
    p_reference_type TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT 'System'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_movement_id UUID;
    v_org_id TEXT;
    v_new_quantity INTEGER;
    v_old_quantity INTEGER;
    v_inventory_id UUID;
BEGIN
    -- Get organization ID from JWT
    v_org_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    
    -- Get current inventory record
    SELECT id, quantity INTO v_inventory_id, v_old_quantity
    FROM public.inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_warehouse_id
    AND organization_clerk_id = v_org_id;
    
    IF v_inventory_id IS NULL THEN
        -- Create inventory record if it doesn't exist
        IF p_quantity_change < 0 THEN
            RAISE EXCEPTION 'Cannot remove stock from non-existent inventory';
        END IF;
        
        INSERT INTO public.inventory (
            product_id,
            warehouse_id,
            quantity,
            reserved_quantity,
            organization_clerk_id,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            p_product_id,
            p_warehouse_id,
            p_quantity_change,
            0,
            v_org_id,
            COALESCE(
                current_setting('request.jwt.claims', true)::json->>'sub',
                current_setting('request.jwt.claims', true)::json->>'user_id'
            ),
            p_user_name
        )
        RETURNING id, quantity INTO v_inventory_id, v_new_quantity;
    ELSE
        -- Update existing inventory
        v_new_quantity := v_old_quantity + p_quantity_change;
        
        IF v_new_quantity < 0 THEN
            RAISE EXCEPTION 'Insufficient stock. Current: %, Requested change: %', v_old_quantity, p_quantity_change;
        END IF;
        
        UPDATE public.inventory
        SET quantity = v_new_quantity,
            updated_at = NOW()
        WHERE id = v_inventory_id;
    END IF;
    
    -- Record the stock movement
    INSERT INTO public.stock_movements (
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        movement_type,
        quantity,
        reason,
        reference_number,
        reference_type,
        status,
        organization_clerk_id,
        created_by_clerk_user_id,
        created_by_name
    ) VALUES (
        p_product_id,
        CASE WHEN p_quantity_change < 0 THEN p_warehouse_id ELSE NULL END,
        CASE WHEN p_quantity_change > 0 THEN p_warehouse_id ELSE NULL END,
        p_movement_type,
        ABS(p_quantity_change),
        p_reason,
        p_reference_number,
        p_reference_type,
        'completed',
        v_org_id,
        COALESCE(
            current_setting('request.jwt.claims', true)::json->>'sub',
            current_setting('request.jwt.claims', true)::json->>'user_id'
        ),
        p_user_name
    )
    RETURNING id INTO v_movement_id;
    
    RETURN v_movement_id;
END;
$$;

-- Fix reserve_inventory function to use proper schema prefixes
DROP FUNCTION IF EXISTS public.reserve_inventory(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.reserve_inventory(
    p_product_id UUID,
    p_warehouse_id UUID,
    p_quantity INTEGER,
    p_reference_number TEXT,
    p_movement_type TEXT DEFAULT 'reservation',
    p_reason TEXT DEFAULT 'Reserved for order',
    p_user_name TEXT DEFAULT 'System'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_available_quantity INTEGER;
    v_inventory_id UUID;
    v_organization_id TEXT;
    v_user_id TEXT;
    v_movement_id UUID;
BEGIN
    -- Get organization and user from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    
    v_user_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claims', true)::json->>'user_id'
    );
    
    -- Get available quantity (quantity - reserved_quantity) with row lock
    SELECT id, (quantity - reserved_quantity) INTO v_inventory_id, v_available_quantity
    FROM public.inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_warehouse_id
    FOR UPDATE;
    
    IF v_inventory_id IS NULL THEN
        RAISE EXCEPTION 'No inventory record found for product % in warehouse %', 
            p_product_id, p_warehouse_id;
    END IF;
    
    -- Check if sufficient quantity is available
    IF v_available_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient available stock. Available: %, Requested: %', 
            v_available_quantity, p_quantity;
    END IF;
    
    -- Update reserved quantity
    UPDATE public.inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE id = v_inventory_id;
    
    -- Create stock movement record for the reservation
    INSERT INTO public.stock_movements (
        product_id,
        from_warehouse_id,
        movement_type,
        quantity,
        reason,
        reference_number,
        reference_type,
        status,
        organization_clerk_id,
        created_by_clerk_user_id,
        created_by_name
    ) VALUES (
        p_product_id,
        p_warehouse_id,
        p_movement_type,
        p_quantity,
        p_reason,
        p_reference_number,
        'reservation',
        'reserved',
        v_organization_id,
        v_user_id,
        p_user_name
    )
    RETURNING id INTO v_movement_id;
    
    RETURN v_movement_id;
END;
$$;

-- Fix transfer_inventory function to use proper schema prefixes
DROP FUNCTION IF EXISTS public.transfer_inventory(UUID, UUID, UUID, INTEGER, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.transfer_inventory(
    p_product_id UUID,
    p_from_warehouse_id UUID,
    p_to_warehouse_id UUID,
    p_quantity INTEGER,
    p_reason TEXT,
    p_notes TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT 'System'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id TEXT;
    v_user_id TEXT;
    v_movement_id UUID;
    v_from_inventory_id UUID;
    v_to_inventory_id UUID;
    v_from_quantity INTEGER;
    v_from_reserved_quantity INTEGER;
    v_from_available_quantity INTEGER;
    v_to_quantity INTEGER;
BEGIN
    -- Validate quantity
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Transfer quantity must be positive';
    END IF;
    
    -- Get org and user from JWT
    v_org_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    
    v_user_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claims', true)::json->>'user_id'
    );
    
    -- Get source inventory with lock
    SELECT id, quantity, reserved_quantity, (quantity - reserved_quantity) 
    INTO v_from_inventory_id, v_from_quantity, v_from_reserved_quantity, v_from_available_quantity
    FROM public.inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_from_warehouse_id
    AND organization_clerk_id = v_org_id
    FOR UPDATE;
    
    IF v_from_inventory_id IS NULL THEN
        RAISE EXCEPTION 'No inventory found in source warehouse';
    END IF;
    
    IF v_from_available_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock in source warehouse. Available: %, Requested: %', 
            v_from_available_quantity, p_quantity;
    END IF;
    
    -- Get or create destination inventory
    SELECT id, quantity INTO v_to_inventory_id, v_to_quantity
    FROM public.inventory
    WHERE product_id = p_product_id 
    AND warehouse_id = p_to_warehouse_id
    AND organization_clerk_id = v_org_id
    FOR UPDATE;
    
    IF v_to_inventory_id IS NULL THEN
        -- Create new inventory record for destination
        INSERT INTO public.inventory (
            product_id, 
            warehouse_id, 
            quantity, 
            reserved_quantity,
            organization_clerk_id,
            created_by_clerk_user_id,
            created_by_name
        ) VALUES (
            p_product_id, 
            p_to_warehouse_id, 
            0, 
            0,
            v_org_id,
            v_user_id,
            p_user_name
        )
        RETURNING id, quantity INTO v_to_inventory_id, v_to_quantity;
    END IF;
    
    -- Update source warehouse (decrease quantity)
    UPDATE public.inventory
    SET quantity = quantity - p_quantity,
        updated_at = NOW()
    WHERE id = v_from_inventory_id;
    
    -- Update destination warehouse (increase quantity)
    UPDATE public.inventory
    SET quantity = quantity + p_quantity,
        updated_at = NOW()
    WHERE id = v_to_inventory_id;
    
    -- Record the transfer movement
    INSERT INTO public.stock_movements (
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        movement_type,
        quantity,
        reason,
        notes,
        status,
        organization_clerk_id,
        created_by_clerk_user_id,
        created_by_name
    ) VALUES (
        p_product_id,
        p_from_warehouse_id,
        p_to_warehouse_id,
        'transfer',
        p_quantity,
        p_reason,
        p_notes,
        'completed',
        v_org_id,
        v_user_id,
        p_user_name
    )
    RETURNING id INTO v_movement_id;
    
    RETURN v_movement_id;
END;
$$;

-- Fix release_reservation function (movement_id version) to use proper schema prefixes
DROP FUNCTION IF EXISTS public.release_reservation(UUID, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION public.release_reservation(
    p_movement_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_user_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_product_id UUID;
    v_warehouse_id UUID;
    v_quantity INTEGER;
    v_movement_type TEXT;
    v_inventory_id UUID;
    v_reserved_quantity INTEGER;
    v_organization_id TEXT;
    v_user_id TEXT;
BEGIN
    -- Get organization from JWT
    v_organization_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    );
    
    v_user_id := COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claims', true)::json->>'user_id',
        'system'
    );
    
    -- Get and lock the stock movement record
    SELECT product_id, from_warehouse_id, quantity
    INTO v_product_id, v_warehouse_id, v_quantity
    FROM public.stock_movements
    WHERE id = p_movement_id 
    AND status = 'reserved'
    AND organization_clerk_id = v_organization_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Reservation not found or already released'
        );
    END IF;
    
    -- Get and lock the inventory record
    SELECT id, reserved_quantity INTO v_inventory_id, v_reserved_quantity
    FROM public.inventory
    WHERE product_id = v_product_id 
    AND warehouse_id = v_warehouse_id
    AND organization_clerk_id = v_organization_id
    FOR UPDATE;
    
    IF v_inventory_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Inventory record not found'
        );
    END IF;
    
    IF v_reserved_quantity < v_quantity THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Insufficient reserved quantity to release'
        );
    END IF;
    
    -- Release the reservation from inventory
    UPDATE public.inventory
    SET reserved_quantity = reserved_quantity - v_quantity,
        updated_at = NOW()
    WHERE id = v_inventory_id;
    
    -- Delete the stock movement record (reservations that are released are removed)
    DELETE FROM public.stock_movements
    WHERE id = p_movement_id;
    
    RETURN json_build_object(
        'success', true,
        'movement_id', p_movement_id,
        'quantity_released', v_quantity
    );
END;
$$;

-- Fix get_product_total_inventory function to use proper schema prefixes
DROP FUNCTION IF EXISTS public.get_product_total_inventory(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_product_total_inventory(p_product_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (SELECT json_build_object(
        'total_quantity', COALESCE(SUM(i.quantity), 0)::INTEGER,
        'total_reserved', COALESCE(SUM(i.reserved_quantity), 0)::INTEGER,
        'total_available', COALESCE(SUM(i.quantity - i.reserved_quantity), 0)::INTEGER,
        'warehouse_count', COUNT(DISTINCT i.warehouse_id)::INTEGER,
        'warehouses', json_agg(
            json_build_object(
                'warehouse_id', w.id,
                'warehouse_name', w.name,
                'quantity', i.quantity,
                'reserved', i.reserved_quantity,
                'available', i.quantity - i.reserved_quantity
            )
        )
    )
    FROM public.inventory i
    JOIN public.warehouses w ON i.warehouse_id = w.id
    WHERE i.product_id = p_product_id
    AND i.organization_clerk_id = COALESCE(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        current_setting('request.jwt.claims', true)::json->'o'->>'id'
    )
    GROUP BY i.product_id);
END;
$$;

-- Grant execute permissions (specify full signature for overloaded function)
GRANT EXECUTE ON FUNCTION public.adjust_inventory(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.prevent_product_deletion_with_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_status_from_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_inventory(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_inventory(UUID, UUID, UUID, INTEGER, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_reservation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_total_inventory(UUID) TO authenticated;

-- Add confirmation notices
DO $$
BEGIN
  RAISE NOTICE 'Fixed test failures:';
  RAISE NOTICE '  - prevent_product_deletion_with_inventory() - now uses schema prefix';
  RAISE NOTICE '  - adjust_inventory() - now uses schema prefix';
  RAISE NOTICE '  - update_product_status_from_inventory() - now uses schema prefix';
  RAISE NOTICE '  - reserve_inventory() - now uses schema prefix';
  RAISE NOTICE '  - transfer_inventory() - now uses schema prefix';
  RAISE NOTICE '  - release_reservation() - now uses schema prefix';
  RAISE NOTICE '  - get_product_total_inventory() - now uses schema prefix';
  RAISE NOTICE 'All functions now properly reference public schema';
END $$;