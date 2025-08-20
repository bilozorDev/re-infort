import { createClient } from "@/app/lib/supabase/server";
import {
  type CreateProductInput,
  type Product,
  type ProductWithCategory,
  type UpdateProductInput,
} from "@/app/types/product";

export async function getAllProducts(organizationId: string): Promise<ProductWithCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      features:product_features(*)
    `)
    .eq("organization_clerk_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    // Handle JWT timing issues gracefully
    if (error.message?.includes("JWT") || error.message?.includes("not yet valid")) {
      console.warn("JWT timing issue detected, returning empty array:", error.message);
      return [];
    }
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data || [];
}

export async function getActiveProducts(organizationId: string): Promise<ProductWithCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      features:product_features(*)
    `)
    .eq("organization_clerk_id", organizationId)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    // Handle JWT timing issues gracefully
    if (error.message?.includes("JWT") || error.message?.includes("not yet valid")) {
      console.warn("JWT timing issue detected, returning empty array:", error.message);
      return [];
    }
    throw new Error(`Failed to fetch active products: ${error.message}`);
  }

  return data || [];
}

export async function getProductById(
  id: string,
  organizationId: string
): Promise<ProductWithCategory | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*),
      features:product_features(*)
    `)
    .eq("id", id)
    .eq("organization_clerk_id", organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data;
}

export async function getProductBySku(
  sku: string,
  organizationId: string
): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("sku", sku)
    .eq("organization_clerk_id", organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch product by SKU: ${error.message}`);
  }

  return data;
}

export async function createProduct(
  input: CreateProductInput,
  organizationId: string,
  userId: string
): Promise<Product> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...input,
      organization_clerk_id: organizationId,
      created_by_clerk_user_id: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505" && error.message.includes("sku")) {
      throw new Error("A product with this SKU already exists");
    }
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data;
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  organizationId: string
): Promise<Product> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id)
    .eq("organization_clerk_id", organizationId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505" && error.message.includes("sku")) {
      throw new Error("A product with this SKU already exists");
    }
    throw new Error(`Failed to update product: ${error.message}`);
  }

  if (!data) {
    throw new Error("Product not found");
  }

  return data;
}

export async function deleteProduct(id: string, organizationId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("organization_clerk_id", organizationId);

  if (error) {
    if (error.message.includes("inventory")) {
      throw new Error("Cannot delete product with existing inventory. Please adjust inventory to 0 first.");
    }
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

export async function getProductsByCategory(
  categoryId: string,
  organizationId: string
): Promise<Product[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("category_id", categoryId)
    .eq("organization_clerk_id", organizationId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch products by category: ${error.message}`);
  }

  return data || [];
}

export async function searchProducts(
  searchTerm: string,
  organizationId: string
): Promise<ProductWithCategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      category:categories(*),
      subcategory:subcategories(*)
    `)
    .eq("organization_clerk_id", organizationId)
    .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to search products: ${error.message}`);
  }

  return data || [];
}