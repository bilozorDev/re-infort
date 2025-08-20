import { z } from "zod";

export const inventoryAdjustmentSchema = z.object({
  product_id: z.string().uuid("Valid product ID is required"),
  warehouse_id: z.string().uuid("Valid warehouse ID is required"),
  quantity_change: z.number().int("Quantity must be a whole number"),
  movement_type: z.enum([
    "receipt",
    "sale",
    "adjustment",
    "return",
    "damage",
    "production",
  ]),
  reason: z.string().optional().nullable(),
  reference_number: z.string().optional().nullable(),
  reference_type: z.string().optional().nullable(),
});

export const inventoryTransferSchema = z.object({
  product_id: z.string().uuid("Valid product ID is required"),
  from_warehouse_id: z.string().uuid("Valid source warehouse ID is required"),
  to_warehouse_id: z.string().uuid("Valid destination warehouse ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive whole number"),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const reserveInventorySchema = z.object({
  product_id: z.string().uuid("Valid product ID is required"),
  warehouse_id: z.string().uuid("Valid warehouse ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive whole number"),
  reference_number: z.string().optional().nullable(),
});

export const releaseReservationSchema = z.object({
  product_id: z.string().uuid("Valid product ID is required"),
  warehouse_id: z.string().uuid("Valid warehouse ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive whole number"),
});

export const stockMovementFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  movementType: z.enum([
    "receipt",
    "sale",
    "transfer",
    "adjustment",
    "return",
    "damage",
    "production",
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type InventoryAdjustmentInput = z.infer<typeof inventoryAdjustmentSchema>;
export type InventoryTransferInput = z.infer<typeof inventoryTransferSchema>;
export type ReserveInventoryInput = z.infer<typeof reserveInventorySchema>;
export type ReleaseReservationInput = z.infer<typeof releaseReservationSchema>;
export type StockMovementFilter = z.infer<typeof stockMovementFilterSchema>;