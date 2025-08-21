-- Function for batch inventory adjustments
CREATE OR REPLACE FUNCTION batch_adjust_inventory(
  p_adjustments JSONB,
  p_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := '[]'::JSONB;
  v_adjustment RECORD;
  v_item_result JSONB;
  v_current_quantity INTEGER;
  v_new_quantity INTEGER;
  v_org_id TEXT;
BEGIN
  -- Get organization ID from the first adjustment
  SELECT organization_clerk_id INTO v_org_id
  FROM inventory
  WHERE product_id = (p_adjustments->0->>'product_id')::UUID
  LIMIT 1;

  -- Process each adjustment
  FOR v_adjustment IN SELECT * FROM jsonb_array_elements(p_adjustments)
  LOOP
    BEGIN
      -- Start a savepoint for this adjustment
      EXECUTE 'SAVEPOINT adjustment_' || v_adjustment.ordinality;
      
      -- Lock the inventory row
      SELECT quantity INTO v_current_quantity
      FROM inventory
      WHERE product_id = (v_adjustment.value->>'product_id')::UUID
        AND warehouse_id = (v_adjustment.value->>'warehouse_id')::UUID
      FOR UPDATE;
      
      -- Calculate new quantity based on operation type
      IF v_adjustment.value->>'operation_type' = 'set' THEN
        v_new_quantity := (v_adjustment.value->>'quantity_change')::INTEGER;
      ELSIF v_adjustment.value->>'operation_type' = 'add' THEN
        v_new_quantity := v_current_quantity + (v_adjustment.value->>'quantity_change')::INTEGER;
      ELSE
        v_new_quantity := v_current_quantity + (v_adjustment.value->>'quantity_change')::INTEGER;
      END IF;
      
      -- Validate new quantity
      IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'Insufficient inventory';
      END IF;
      
      -- Update inventory
      UPDATE inventory
      SET 
        quantity = v_new_quantity,
        updated_at = NOW()
      WHERE product_id = (v_adjustment.value->>'product_id')::UUID
        AND warehouse_id = (v_adjustment.value->>'warehouse_id')::UUID;
      
      -- Record movement
      INSERT INTO stock_movements (
        product_id,
        warehouse_id,
        quantity,
        movement_type,
        reason,
        created_by_clerk_user_id,
        organization_clerk_id
      ) VALUES (
        (v_adjustment.value->>'product_id')::UUID,
        (v_adjustment.value->>'warehouse_id')::UUID,
        (v_adjustment.value->>'quantity_change')::INTEGER,
        CASE 
          WHEN (v_adjustment.value->>'quantity_change')::INTEGER > 0 THEN 'receipt'
          ELSE 'adjustment'
        END,
        v_adjustment.value->>'reason',
        p_user_id,
        v_org_id
      );
      
      -- Add success result
      v_item_result := jsonb_build_object(
        'product_id', v_adjustment.value->>'product_id',
        'warehouse_id', v_adjustment.value->>'warehouse_id',
        'success', true,
        'new_quantity', v_new_quantity
      );
      
      -- Release savepoint
      EXECUTE 'RELEASE SAVEPOINT adjustment_' || v_adjustment.ordinality;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Rollback this adjustment
        EXECUTE 'ROLLBACK TO SAVEPOINT adjustment_' || v_adjustment.ordinality;
        
        -- Add failure result
        v_item_result := jsonb_build_object(
          'product_id', v_adjustment.value->>'product_id',
          'warehouse_id', v_adjustment.value->>'warehouse_id',
          'success', false,
          'error', SQLERRM
        );
    END;
    
    -- Append result
    v_result := v_result || v_item_result;
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION batch_adjust_inventory TO authenticated;

-- Function to validate batch operations before execution
CREATE OR REPLACE FUNCTION validate_batch_operation(
  p_operation_type TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB := jsonb_build_object(
    'valid', true,
    'errors', '[]'::JSONB,
    'warnings', '[]'::JSONB
  );
  v_errors JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_item RECORD;
BEGIN
  -- Validate based on operation type
  CASE p_operation_type
    WHEN 'inventory_adjustment' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
        -- Check if product exists
        IF NOT EXISTS (
          SELECT 1 FROM products 
          WHERE id = (v_item.value->>'product_id')::UUID
        ) THEN
          v_errors := v_errors || jsonb_build_object(
            'item', v_item.value,
            'error', 'Product does not exist'
          );
        END IF;
        
        -- Check if warehouse exists
        IF NOT EXISTS (
          SELECT 1 FROM warehouses 
          WHERE id = (v_item.value->>'warehouse_id')::UUID
        ) THEN
          v_errors := v_errors || jsonb_build_object(
            'item', v_item.value,
            'error', 'Warehouse does not exist'
          );
        END IF;
        
        -- Check for negative quantities
        IF (v_item.value->>'quantity')::INTEGER < 0 THEN
          v_warnings := v_warnings || jsonb_build_object(
            'item', v_item.value,
            'warning', 'Negative quantity adjustment'
          );
        END IF;
      END LOOP;
      
    WHEN 'product_import' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
      LOOP
        -- Check required fields
        IF v_item.value->>'name' IS NULL THEN
          v_errors := v_errors || jsonb_build_object(
            'item', v_item.value,
            'error', 'Product name is required'
          );
        END IF;
        
        IF v_item.value->>'sku' IS NULL THEN
          v_errors := v_errors || jsonb_build_object(
            'item', v_item.value,
            'error', 'Product SKU is required'
          );
        END IF;
        
        -- Check for duplicate SKUs
        IF EXISTS (
          SELECT 1 FROM products 
          WHERE sku = v_item.value->>'sku'
        ) THEN
          v_warnings := v_warnings || jsonb_build_object(
            'item', v_item.value,
            'warning', 'SKU already exists'
          );
        END IF;
      END LOOP;
      
    ELSE
      v_errors := v_errors || jsonb_build_object(
        'error', 'Unknown operation type'
      );
  END CASE;
  
  -- Update result
  v_result := jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors,
    'warnings', v_warnings
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_batch_operation TO authenticated;