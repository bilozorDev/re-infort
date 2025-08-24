import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(50),
  description: z.string().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  cost: z.number().min(0, "Cost must be non-negative").optional().nullable(),
  price: z.number().min(0, "Price must be non-negative").optional().nullable(),
  photo_urls: z.array(z.string()).max(5, "Maximum 5 photos allowed").optional().nullable(),
  link: z.string().url().optional().nullable(),
  serial_number: z.string().optional().nullable(),
  status: z.enum(["active", "inactive", "discontinued"]).default("active"),
});

export const updateProductSchema = createProductSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createSubcategorySchema = z.object({
  category_id: z.string().uuid("Valid category ID is required"),
  name: z.string().min(1, "Subcategory name is required").max(100),
  description: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export const createFeatureDefinitionSchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  subcategory_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Feature name is required").max(100),
  input_type: z.enum(["text", "number", "select", "boolean", "date"]),
  options: z.array(z.string()).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  is_required: z.boolean().default(false),
});

export const updateFeatureDefinitionSchema = createFeatureDefinitionSchema.partial();

export const createProductFeatureSchema = z.object({
  feature_definition_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Feature name is required").max(100),
  value: z.string().min(1, "Feature value is required"),
  is_custom: z.boolean().optional(),
});

export const updateProductFeatureSchema = z.object({
  value: z.string().min(1, "Feature value is required"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;
export type CreateFeatureDefinitionInput = z.infer<typeof createFeatureDefinitionSchema>;
export type UpdateFeatureDefinitionInput = z.infer<typeof updateFeatureDefinitionSchema>;
export type CreateProductFeatureInput = z.infer<typeof createProductFeatureSchema>;
export type UpdateProductFeatureInput = z.infer<typeof updateProductFeatureSchema>;