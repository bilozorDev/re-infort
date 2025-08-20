import { createClient } from "@/app/lib/supabase/server";
import {
  type CreateStockMovementInput,
  type InventoryAdjustment,
  type InventoryTransfer,
  type InventoryWithDetails,
  type ProductInventorySummary,
  type StockMovement,
  type StockMovementWithDetails,
} from "@/app/types/inventory";

export async function getInventoryByWarehouse(
  warehouseId: string,
  organizationId: string
): Promise<InventoryWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_details")
    .select("*")
    .eq("warehouse_id", warehouseId)
    .eq("organization_clerk_id", organizationId)
    .order("product_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch inventory: ${error.message}`);
  }

  return data || [];
}

export async function getInventoryByProduct(
  productId: string,
  organizationId: string
): Promise<InventoryWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_details")
    .select("*")
    .eq("product_id", productId)
    .eq("organization_clerk_id", organizationId)
    .order("warehouse_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch product inventory: ${error.message}`);
  }

  return data || [];
}

export async function getProductTotalInventory(
  productId: string
): Promise<ProductInventorySummary> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_product_total_inventory", { p_product_id: productId });

  if (error) {
    throw new Error(`Failed to fetch product total inventory: ${error.message}`);
  }

  // The function returns an array, get the first element
  const result = data?.[0];
  
  return result || {
    total_quantity: 0,
    total_reserved: 0,
    total_available: 0,
    warehouse_count: 0,
    warehouses: [],
  };
}

export async function adjustInventory(
  adjustment: InventoryAdjustment
): Promise<{
  success: boolean;
  inventory_id: string;
  movement_id: string;
  previous_quantity: number;
  new_quantity: number;
  quantity_change: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("adjust_inventory", {
    p_product_id: adjustment.product_id,
    p_warehouse_id: adjustment.warehouse_id,
    p_quantity_change: adjustment.quantity_change,
    p_movement_type: adjustment.movement_type,
    p_reason: adjustment.reason,
    p_reference_number: adjustment.reference_number,
    p_reference_type: adjustment.reference_type,
  });

  if (error) {
    throw new Error(`Failed to adjust inventory: ${error.message}`);
  }

  return data;
}

export async function transferInventory(
  transfer: InventoryTransfer
): Promise<{
  success: boolean;
  movement_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity_transferred: number;
  from_new_quantity: number;
  to_new_quantity: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("transfer_inventory", {
    p_product_id: transfer.product_id,
    p_from_warehouse_id: transfer.from_warehouse_id,
    p_to_warehouse_id: transfer.to_warehouse_id,
    p_quantity: transfer.quantity,
    p_reason: transfer.reason,
    p_notes: transfer.notes,
  });

  if (error) {
    throw new Error(`Failed to transfer inventory: ${error.message}`);
  }

  return data;
}

export async function reserveInventory(
  productId: string,
  warehouseId: string,
  quantity: number,
  referenceNumber?: string
): Promise<{
  success: boolean;
  inventory_id: string;
  reserved_quantity: number;
  reference_number: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("reserve_inventory", {
    p_product_id: productId,
    p_warehouse_id: warehouseId,
    p_quantity: quantity,
    p_reference_number: referenceNumber,
  });

  if (error) {
    throw new Error(`Failed to reserve inventory: ${error.message}`);
  }

  return data;
}

export async function releaseReservation(
  productId: string,
  warehouseId: string,
  quantity: number
): Promise<{
  success: boolean;
  inventory_id: string;
  released_quantity: number;
  new_reserved_quantity: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("release_reservation", {
    p_product_id: productId,
    p_warehouse_id: warehouseId,
    p_quantity: quantity,
  });

  if (error) {
    throw new Error(`Failed to release reservation: ${error.message}`);
  }

  return data;
}

export async function getStockMovements(
  filters: {
    productId?: string;
    warehouseId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  },
  organizationId: string
): Promise<StockMovementWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("stock_movements_details")
    .select("*")
    .eq("organization_clerk_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.productId) {
    query = query.eq("product_id", filters.productId);
  }

  if (filters.warehouseId) {
    query = query.or(
      `from_warehouse_id.eq.${filters.warehouseId},to_warehouse_id.eq.${filters.warehouseId}`
    );
  }

  if (filters.movementType) {
    query = query.eq("movement_type", filters.movementType);
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch stock movements: ${error.message}`);
  }

  return data || [];
}

export async function getRecentMovements(
  limit: number = 10,
  organizationId: string
): Promise<StockMovementWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_movements_details")
    .select("*")
    .eq("organization_clerk_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent movements: ${error.message}`);
  }

  return data || [];
}

export async function getLowStockItems(
  organizationId: string
): Promise<InventoryWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventory_details")
    .select("*")
    .eq("organization_clerk_id", organizationId)
    .filter("reorder_point", "not.is", null)
    .filter("quantity", "lte", "reorder_point")
    .order("quantity", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch low stock items: ${error.message}`);
  }

  return data || [];
}

export async function createManualMovement(
  input: CreateStockMovementInput,
  organizationId: string,
  userId: string
): Promise<StockMovement> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_movements")
    .insert({
      ...input,
      organization_clerk_id: organizationId,
      created_by_clerk_user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create stock movement: ${error.message}`);
  }

  return data;
}

export async function cancelMovement(
  movementId: string,
  organizationId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("stock_movements")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_by_clerk_user_id: userId,
    })
    .eq("id", movementId)
    .eq("organization_clerk_id", organizationId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to cancel movement: ${error.message}`);
  }
}