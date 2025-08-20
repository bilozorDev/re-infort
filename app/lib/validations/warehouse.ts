import { z } from "zod";

export const warehouseTypeEnum = z.enum(["office", "vehicle", "other"]);
export const warehouseStatusEnum = z.enum(["active", "inactive"]);

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required").max(100),
  type: warehouseTypeEnum,
  status: warehouseStatusEnum.default("active"),
  address: z.string().min(1, "Address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state_province: z.string().min(1, "State/Province is required").max(100),
  postal_code: z.string().min(1, "Postal code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
  notes: z.string().max(500).optional().nullable(),
  is_default: z.boolean().default(false),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
