import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { useSupabase } from "./use-supabase";

export interface StockMovement {
  id: string;
  movement_type: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  from_warehouse_id: string | null;
  from_warehouse_name: string | null;
  to_warehouse_id: string | null;
  to_warehouse_name: string | null;
  quantity: number;
  reference_number: string | null;
  reference_type: string | null;
  reason: string | null;
  notes: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  status: string;
  created_at: string;
  created_by_clerk_user_id: string;
  created_by_name?: string;
}

interface MovementFilters {
  type?: string;
  startDate?: string;
  endDate?: string;
  warehouseId?: string;
  status?: string;
}

// Hook to get stock movements for a product
export function useStockMovements(productId?: string | undefined, filters?: MovementFilters) {
  const supabase = useSupabase();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ["stock-movements", productId, filters, orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization context required");
      }
      
      let query = supabase
        .from("stock_movements_details")
        .select("*")
        .eq("organization_clerk_id", orgId);

      // Apply product filter if provided
      if (productId) {
        query = query.eq("product_id", productId);
      }

      // Apply type filter
      if (filters?.type) {
        query = query.eq("movement_type", filters.type);
      }

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      // Apply warehouse filter safely
      if (filters?.warehouseId) {
        // Validate warehouseId is a valid UUID to prevent injection
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(filters.warehouseId)) {
          query = query.or(
            `from_warehouse_id.eq.${filters.warehouseId},to_warehouse_id.eq.${filters.warehouseId}`
          );
        }
      }

      // Apply status filter
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      // Order by created_at descending
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

// Hook to get recent movements for a product (for activity feed)
export function useRecentMovements(productId: string, limit: number = 5) {
  const supabase = useSupabase();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ["recent-movements", productId, limit, orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization context required");
      }
      
      const { data, error } = await supabase
        .from("stock_movements_details")
        .select("*")
        .eq("product_id", productId)
        .eq("organization_clerk_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!productId,
  });
}

// Hook to get all movements for organization (for global inventory page)
export function useOrganizationMovements(filters?: MovementFilters) {
  const supabase = useSupabase();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ["organization-movements", filters, orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization context required");
      }
      
      let query = supabase
        .from("stock_movements_details")
        .select("*")
        .eq("organization_clerk_id", orgId);

      // Apply filters
      if (filters?.type) {
        query = query.eq("movement_type", filters.type);
      }
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }
      if (filters?.warehouseId) {
        // Validate warehouseId is a valid UUID to prevent injection
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(filters.warehouseId)) {
          query = query.or(
            `from_warehouse_id.eq.${filters.warehouseId},to_warehouse_id.eq.${filters.warehouseId}`
          );
        }
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      // Order by created_at descending
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

// Hook to get movement statistics
export function useMovementStatistics(period: string = "30d") {
  const supabase = useSupabase();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ["movement-statistics", period, orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization context required");
      }
      
      // Parse period
      const days = parseInt(period.replace("d", ""));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all movements for the period with org filtering
      const { data: movements, error } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("organization_clerk_id", orgId)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Calculate statistics
      const totalMovements = movements?.length || 0;
      const movementsByType = movements?.reduce((acc: Record<string, number>, m) => {
        acc[m.movement_type] = (acc[m.movement_type] || 0) + 1;
        return acc;
      }, {});

      const totalQuantityMoved = movements?.reduce((sum, m) => sum + m.quantity, 0) || 0;
      const avgMovementSize = totalMovements > 0 ? totalQuantityMoved / totalMovements : 0;

      // Get top products by movement
      const productMovements = movements?.reduce(
        (acc: Record<string, { count: number; quantity: number }>, m) => {
          if (!acc[m.product_id]) {
            acc[m.product_id] = { count: 0, quantity: 0 };
          }
          acc[m.product_id].count++;
          acc[m.product_id].quantity += m.quantity;
          return acc;
        },
        {}
      );

      return {
        totalMovements,
        movementsByType,
        totalQuantityMoved,
        avgMovementSize,
        productMovements,
        period,
      };
    },
  });
}
