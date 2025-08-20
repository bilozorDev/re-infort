import { type Tables, type TablesInsert, type TablesUpdate } from "./database.types";

export type Product = Tables<"products">;
export type CreateProductInput = Omit<
  TablesInsert<"products">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;
export type UpdateProductInput = Omit<
  TablesUpdate<"products">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;

export type Category = Tables<"categories">;
export type CreateCategoryInput = Omit<
  TablesInsert<"categories">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;
export type UpdateCategoryInput = Omit<
  TablesUpdate<"categories">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;

export type Subcategory = Tables<"subcategories">;
export type CreateSubcategoryInput = Omit<
  TablesInsert<"subcategories">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;
export type UpdateSubcategoryInput = Omit<
  TablesUpdate<"subcategories">,
  "id" | "organization_clerk_id" | "created_by_clerk_user_id" | "created_at" | "updated_at"
>;

export type ProductWithCategory = Product & {
  category?: Category | null;
  subcategory?: Subcategory | null;
};

export type ProductStatus = "active" | "inactive" | "discontinued";
export type CategoryStatus = "active" | "inactive";