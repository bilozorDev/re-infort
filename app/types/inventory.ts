import { type Tables, type TablesInsert, type TablesUpdate } from "./database.types";
import { type Product } from "./product";
import { type Warehouse } from "./warehouse";

export type Inventory = Tables<"inventory">;
export type CreateInventoryInput = Omit<
  TablesInsert<"inventory">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;
export type UpdateInventoryInput = Omit<
  TablesUpdate<"inventory">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;

export type StockMovement = Tables<"stock_movements">;
export type CreateStockMovementInput = Omit<
  TablesInsert<"stock_movements">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at"
>;

export type PriceHistory = Tables<"price_history">;

export type InventoryWithDetails = Inventory & {
  product?: Product;
  warehouse?: Warehouse;
  available_quantity?: number;
};

export type StockMovementWithDetails = StockMovement & {
  product?: Product;
  from_warehouse?: Warehouse | null;
  to_warehouse?: Warehouse | null;
};

export type MovementType = 
  | "receipt"
  | "sale"
  | "transfer"
  | "adjustment"
  | "return"
  | "damage"
  | "production";

export type MovementStatus = "pending" | "completed" | "cancelled";

export interface InventoryAdjustment {
  product_id: string;
  warehouse_id: string;
  quantity_change: number;
  movement_type: MovementType;
  reason?: string;
  reference_number?: string;
  reference_type?: string;
}

export interface InventoryTransfer {
  product_id: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  quantity: number;
  reason?: string;
  notes?: string;
}

export interface ProductInventorySummary {
  total_quantity: number;
  total_reserved: number;
  total_available: number;
  warehouse_count: number;
  warehouses: Array<{
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
    reserved: number;
    available: number;
  }>;
}