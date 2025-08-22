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
      // First try the RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_product_total_inventory", {
        p_product_id: productId,
      });

      // If RPC returns data (could be array or single object), use it
      if (rpcData && !rpcError) {
        // Handle case where RPC returns array with single element
        const result = Array.isArray(rpcData) && rpcData.length > 0 ? rpcData[0] : rpcData;
        if (result && typeof result === "object" && "total_quantity" in result) {
          return result as InventorySummary;
        }
      }

      // Fallback: manually aggregate inventory data
      const { data: inventory, error: invError } = await supabase
        .from("inventory")
        .select(
          `
          *,
          warehouse:warehouses(id, name)
        `
        )
        .eq("product_id", productId);

      if (invError) throw invError;

      if (!inventory || inventory.length === 0) {
        return {
          total_quantity: 0,
          total_reserved: 0,
          total_available: 0,
          warehouse_count: 0,
          warehouses: [],
        } as ProductInventorySummary;
      }

      // Aggregate the data
      const summary: ProductInventorySummary = {
        total_quantity: 0,
        total_reserved: 0,
        total_available: 0,
        warehouse_count: inventory.length,
        warehouses: [],
      };

      inventory.forEach((item) => {
        summary.total_quantity += item.quantity || 0;
        summary.total_reserved += item.reserved_quantity || 0;
        summary.total_available += (item.quantity || 0) - (item.reserved_quantity || 0);

        if (item.warehouse) {
          summary.warehouses.push({
            warehouse_id: item.warehouse_id,
            warehouse_name: item.warehouse.name,
            quantity: item.quantity || 0,
            reserved: item.reserved_quantity || 0,
            available: (item.quantity || 0) - (item.reserved_quantity || 0),
          });
        }
      });

      return summary;
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: AdjustStockParams) => {
      // Get current user name for audit trail
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: params.productId,
          warehouseId: params.warehouseId,
          quantity: params.quantity,
          movementType: params.movementType,
          reason: params.reason,
          referenceNumber: params.referenceNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to adjust inventory");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["product-inventory", variables.productId] });
      queryClient.invalidateQueries({
        queryKey: ["product-warehouse-inventory", variables.productId],
      });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["recent-movements", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-analytics", variables.productId] });
    },
  });
}

// Hook to transfer stock between warehouses
export function useTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TransferStockParams) => {
      const response = await fetch("/api/inventory/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: params.productId,
          fromWarehouseId: params.fromWarehouseId,
          toWarehouseId: params.toWarehouseId,
          quantity: params.quantity,
          reason: params.reason,
          notes: params.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to transfer inventory");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["product-inventory", variables.productId] });
      queryClient.invalidateQueries({
        queryKey: ["product-warehouse-inventory", variables.productId],
      });
      queryClient.invalidateQueries({ queryKey: ["stock-movements", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["recent-movements", variables.productId] });
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
      const movementBreakdown = movements?.reduce(
        (acc: Record<string, { count: number; quantity: number }>, m) => {
          if (!acc[m.movement_type]) {
            acc[m.movement_type] = { count: 0, quantity: 0 };
          }
          acc[m.movement_type].count++;
          acc[m.movement_type].quantity += m.quantity;
          return acc;
        },
        {}
      );

      // Top warehouses by activity
      const warehouseActivity = movements?.reduce(
        (acc: Record<string, { id: string; name: string; movements: number }>, m) => {
          const warehouseId = m.from_warehouse_id || m.to_warehouse_id;
          const warehouseName = m.from_warehouse_name || m.to_warehouse_name;
          if (warehouseId) {
            if (!acc[warehouseId]) {
              acc[warehouseId] = { id: warehouseId, name: warehouseName, movements: 0 };
            }
            acc[warehouseId].movements++;
          }
          return acc;
        },
        {}
      );

      const topWarehouses = Object.values(warehouseActivity || {})
        .sort((a, b) => b.movements - a.movements)
        .slice(0, 5);

      // Calculate turnover rate (movements / average inventory)
      const turnoverRate = totalQuantity > 0 ? totalMovement / totalQuantity : 0;

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

// Hook to get all products inventory summary
export function useAllProductsInventory(productIds: string[]) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["all-products-inventory", productIds],
    queryFn: async () => {
      if (!productIds || productIds.length === 0) {
        return new Map<string, InventorySummary>();
      }

      // Batch fetch inventory summaries for all products
      const inventoryPromises = productIds.map(async (productId) => {
        try {
          const { data, error } = await supabase.rpc("get_product_total_inventory", {
            p_product_id: productId,
          });

          if (error) {
            console.error(`Failed to fetch inventory for product ${productId}:`, error);
            return [productId, null];
          }

          // Log the response to debug
          console.log(`Inventory for product ${productId}:`, data);

          // The RPC function returns an array with one row, so we need to get the first element
          const inventoryData = Array.isArray(data) && data.length > 0 ? data[0] : data;
          return [productId, inventoryData as InventorySummary];
        } catch (error) {
          console.error(`Failed to fetch inventory for product ${productId}:`, error);
          return [productId, null];
        }
      });

      const results = await Promise.all(inventoryPromises);
      const inventoryMap = new Map<string, InventorySummary>();

      results.forEach(([productId, inventory]) => {
        if (inventory) {
          inventoryMap.set(productId as string, inventory as InventorySummary);
        }
      });

      return inventoryMap;
    },
    enabled: productIds.length > 0,
  });
}

// Hook to get organization-wide inventory with filters
export interface InventoryFilters {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  warehouseId?: string;
  stockStatus?: "all" | "in-stock" | "low-stock" | "out-of-stock";
  sortBy?: "product_name" | "quantity" | "available" | "category" | "updated_at";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface OrganizationInventoryItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  category_name: string;
  subcategory_name: string | null;
  total_quantity: number;
  total_reserved: number;
  total_available: number;
  reorder_point: number;
  warehouse_count: number;
  warehouses: Array<{
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
    reserved: number;
    available: number;
  }>;
  stock_status: "in-stock" | "low-stock" | "out-of-stock";
  last_movement_date: string | null;
}

export function useOrganizationInventory(filters: InventoryFilters = {}) {
  const supabase = useSupabase();

  return useQuery({
    queryKey: ["organization-inventory", filters],
    queryFn: async () => {
      // Start with base query
      let query = supabase.from("inventory_details").select(`
          product_id,
          product_name,
          product_sku,
          quantity,
          reserved_quantity,
          available_quantity,
          reorder_point,
          warehouse_id,
          warehouse_name,
          category_id,
          subcategory_id,
          updated_at
        `);

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `product_name.ilike.%${filters.search}%,product_sku.ilike.%${filters.search}%`
        );
      }

      // Apply category filter
      if (filters.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      // Apply subcategory filter
      if (filters.subcategoryId) {
        query = query.eq("subcategory_id", filters.subcategoryId);
      }

      // Apply warehouse filter
      if (filters.warehouseId) {
        query = query.eq("warehouse_id", filters.warehouseId);
      }

      const { data: inventoryData, error } = await query;

      if (error) throw error;

      // Get category and subcategory names
      const categoryIds = [
        ...new Set(inventoryData?.map((item) => item.category_id).filter(Boolean)),
      ];
      const subcategoryIds = [
        ...new Set(inventoryData?.map((item) => item.subcategory_id).filter(Boolean)),
      ];

      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .in("id", categoryIds);

      const { data: subcategories } = await supabase
        .from("subcategories")
        .select("id, name")
        .in("id", subcategoryIds);

      const categoryMap = new Map(categories?.map((c) => [c.id, c.name]));
      const subcategoryMap = new Map(subcategories?.map((s) => [s.id, s.name]));

      // Group by product
      const productGroups = inventoryData?.reduce(
        (acc: Record<string, (typeof inventoryData)[0][]>, item) => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = [];
          }
          acc[item.product_id].push(item);
          return acc;
        },
        {}
      );

      // Transform to organization inventory items
      let items: OrganizationInventoryItem[] = Object.entries(productGroups || {}).map(
        ([productId, warehouses]) => {
          const firstItem = warehouses[0];
          const totalQuantity = warehouses.reduce((sum, w) => sum + w.quantity, 0);
          const totalReserved = warehouses.reduce((sum, w) => sum + w.reserved_quantity, 0);
          const totalAvailable = warehouses.reduce((sum, w) => sum + w.available_quantity, 0);
          const maxReorderPoint = Math.max(...warehouses.map((w) => w.reorder_point || 0));

          // Determine stock status
          let stockStatus: "in-stock" | "low-stock" | "out-of-stock";
          if (totalQuantity === 0) {
            stockStatus = "out-of-stock";
          } else if (totalQuantity <= maxReorderPoint) {
            stockStatus = "low-stock";
          } else {
            stockStatus = "in-stock";
          }

          return {
            product_id: productId,
            product_name: firstItem.product_name,
            product_sku: firstItem.product_sku,
            category_name: categoryMap.get(firstItem.category_id) || "Uncategorized",
            subcategory_name: firstItem.subcategory_id
              ? subcategoryMap.get(firstItem.subcategory_id) || null
              : null,
            total_quantity: totalQuantity,
            total_reserved: totalReserved,
            total_available: totalAvailable,
            reorder_point: maxReorderPoint,
            warehouse_count: warehouses.length,
            warehouses: warehouses.map((w) => ({
              warehouse_id: w.warehouse_id,
              warehouse_name: w.warehouse_name,
              quantity: w.quantity,
              reserved: w.reserved_quantity,
              available: w.available_quantity,
            })),
            stock_status: stockStatus,
            last_movement_date: warehouses.reduce((latest, w) => {
              return !latest || w.updated_at > latest ? w.updated_at : latest;
            }, null),
          };
        }
      );

      // Apply stock status filter
      if (filters.stockStatus && filters.stockStatus !== "all") {
        items = items.filter((item) => item.stock_status === filters.stockStatus);
      }

      // Apply sorting
      const sortBy = filters.sortBy || "product_name";
      const sortOrder = filters.sortOrder || "asc";

      items.sort((a, b) => {
        let aVal, bVal;
        switch (sortBy) {
          case "product_name":
            aVal = a.product_name.toLowerCase();
            bVal = b.product_name.toLowerCase();
            break;
          case "quantity":
            aVal = a.total_quantity;
            bVal = b.total_quantity;
            break;
          case "available":
            aVal = a.total_available;
            bVal = b.total_available;
            break;
          case "category":
            aVal = a.category_name.toLowerCase();
            bVal = b.category_name.toLowerCase();
            break;
          case "updated_at":
            aVal = a.last_movement_date || "";
            bVal = b.last_movement_date || "";
            break;
          default:
            aVal = a.product_name.toLowerCase();
            bVal = b.product_name.toLowerCase();
        }

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      // Apply pagination
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 50;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = items.slice(startIndex, endIndex);

      return {
        items: paginatedItems,
        totalItems: items.length,
        totalPages: Math.ceil(items.length / pageSize),
        currentPage: page,
        pageSize,
      };
    },
  });
}
