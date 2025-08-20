import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(50),
  description: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  cost: z.number().min(0, "Cost must be non-negative").optional().nullable(),
  price: z.number().min(0, "Price must be non-negative").optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  link: z.string().url().optional().nullable(),
  serial_number: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "discontinued"]).default("active"),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  display_order: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createSubcategorySchema = z.object({
  category_id: z.string().uuid("Valid category ID is required"),
  name: z.string().min(1, "Subcategory name is required").max(100),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  display_order: z.number().int().min(0).default(0),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;