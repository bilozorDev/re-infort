import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type ProductInventorySummary } from "@/app/types/inventory";

import { useSupabase } from "./use-supabase";

// Re-export the type for convenience
export type InventorySummary = ProductInventorySummary;

// Type for warehouse inventory details
export interface WarehouseInventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  warehouse_name: string;
  warehouse_type: string;
  warehouse_status: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  location_details: string | null;
  reorder_point: number;
  reorder_quantity: number;
  since_date: string;
  created_at: string;
  updated_at: string;
}

interface AdjustStockParams {
  productId: string;
  warehouseId: string;
  quantity: number; // positive for add, negative for remove
  movementType: string;
  reason?: string;
  referenceNumber?: string;
}

interface TransferStockParams {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

// Hook to get product inventory summary
export function useProductInventory(productId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["product-inventory", productId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_product_total_inventory", {
        p_product_id: productId,
      });

      if (error) throw error;
      return data as InventorySummary;
    },
    enabled: !!productId,
  });
}

// Hook to get product inventory by warehouse
export function useProductWarehouseInventory(productId: string) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["product-warehouse-inventory", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_details")
        .select("*")
        .eq("product_id", productId)
        .order("warehouse_name");

      if (error) throw error;
      return data as WarehouseInventory[];
    },
    enabled: !!productId,
  });
}

// Hook to adjust stock
export function useAdjustStock() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AdjustStockParams) => {
      const { data, error } = await supabase.rpc("adjust_inventory", {
        p_product_id: params.productId,
        p_warehouse_id: params.warehouseId,
        p_quantity_change: params.quantity,
        p_movement_type: params.movementType,
        p_reason: params.reason,
        p_reference_number: params.referenceNumber,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["product-inventory", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product-warehouse-inventory", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics", variables.productId] });
    },
  });
}

// Hook to transfer stock between warehouses
export function useTransferStock() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TransferStockParams) => {
      const { data, error } = await supabase.rpc("transfer_inventory", {
        p_product_id: params.productId,
        p_from_warehouse_id: params.fromWarehouseId,
        p_to_warehouse_id: params.toWarehouseId,
        p_quantity: params.quantity,
        p_reason: params.reason,
        p_notes: params.notes,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["product-inventory", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product-warehouse-inventory", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics", variables.productId] });
    },
  });
}

// Hook to get inventory analytics
export function useInventoryAnalytics(productId: string, period: string = "30d") {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["inventory-analytics", productId, period],
    queryFn: async () => {
      // Parse period
      const days = parseInt(period.replace("d", ""));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get movements for the period
      const { data: movements, error: movementsError } = await supabase
        .from("stock_movements_details")
        .select("*")
        .eq("product_id", productId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (movementsError) throw movementsError;

      // Calculate analytics
      const totalMovement = movements?.reduce((sum, m) => sum + m.quantity, 0) || 0;
      const avgDailyMovement = totalMovement / days;

      // Get current inventory for stock value
      const { data: inventory, error: invError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", productId);

      if (invError) throw invError;

      const totalQuantity = inventory?.reduce((sum, i) => sum + i.quantity, 0) || 0;

      // Get product price for stock value calculation
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("price, cost")
        .eq("id", productId)
        .single();

      if (productError) throw productError;

      const stockValue = totalQuantity * (product?.cost || 0);

      // Movement breakdown by type
      const movementBreakdown = movements?.reduce((acc: Record<string, { count: number; quantity: number }>, m) => {
        if (!acc[m.movement_type]) {
          acc[m.movement_type] = { count: 0, quantity: 0 };
        }
        acc[m.movement_type].count++;
        acc[m.movement_type].quantity += m.quantity;
        return acc;
      }, {});

      // Top warehouses by activity
      const warehouseActivity = movements?.reduce((acc: Record<string, { id: string; name: string; movements: number }>, m) => {
        const warehouseId = m.from_warehouse_id || m.to_warehouse_id;
        const warehouseName = m.from_warehouse_name || m.to_warehouse_name;
        if (warehouseId) {
          if (!acc[warehouseId]) {
            acc[warehouseId] = { id: warehouseId, name: warehouseName, movements: 0 };
          }
          acc[warehouseId].movements++;
        }
        return acc;
      }, {});

      const topWarehouses = Object.values(warehouseActivity || {})
        .sort((a, b) => b.movements - a.movements)
        .slice(0, 5);

      // Calculate turnover rate (movements / average inventory)
      const turnoverRate = totalQuantity > 0 ? (totalMovement / totalQuantity) : 0;

      return {
        totalMovement,
        avgDailyMovement,
        stockValue,
        turnoverRate,
        movementBreakdown,
        topWarehouses,
        period,
      };
    },
    enabled: !!productId,
  });
}