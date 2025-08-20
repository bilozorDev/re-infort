import type {
  CreateProductFeatureInput,
  ProductFeature,
  UpdateProductFeatureInput,
} from "@/app/types/features";
import type { ProductWithCategory } from "@/app/types/product";

import { createClient } from "../supabase/client";

export async function getProductFeatures(
  productId: string,
  orgId: string
): Promise<ProductFeature[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_features")
    .select("*")
    .eq("product_id", productId)
    .eq("organization_clerk_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching product features:", error);
    throw new Error("Failed to fetch product features");
  }

  return data || [];
}

export async function createProductFeature(
  productId: string,
  input: CreateProductFeatureInput,
  orgId: string
): Promise<ProductFeature> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_features")
    .insert({
      ...input,
      product_id: productId,
      organization_clerk_id: orgId,
      is_custom: input.is_custom ?? !input.feature_definition_id,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating product feature:", error);
    if (error.code === "23505") {
      throw new Error("A feature with this name already exists for this product");
    }
    throw new Error("Failed to create product feature");
  }

  return data;
}

export async function updateProductFeature(
  id: string,
  input: UpdateProductFeatureInput,
  orgId: string
): Promise<ProductFeature> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_features")
    .update(input)
    .eq("id", id)
    .eq("organization_clerk_id", orgId)
    .select()
    .single();

  if (error) {
    console.error("Error updating product feature:", error);
    throw new Error("Failed to update product feature");
  }

  return data;
}

export async function deleteProductFeature(
  id: string,
  orgId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_features")
    .delete()
    .eq("id", id)
    .eq("organization_clerk_id", orgId);

  if (error) {
    console.error("Error deleting product feature:", error);
    throw new Error("Failed to delete product feature");
  }
}

export async function upsertProductFeatures(
  productId: string,
  features: CreateProductFeatureInput[],
  orgId: string
): Promise<ProductFeature[]> {
  const supabase = await createClient();

  // First, delete all existing features for this product
  const { error: deleteError } = await supabase
    .from("product_features")
    .delete()
    .eq("product_id", productId)
    .eq("organization_clerk_id", orgId);

  if (deleteError) {
    console.error("Error deleting existing product features:", deleteError);
    throw new Error("Failed to update product features");
  }

  // If no features to add, return empty array
  if (features.length === 0) {
    return [];
  }

  // Insert new features
  const featuresToInsert = features.map((feature) => ({
    ...feature,
    product_id: productId,
    organization_clerk_id: orgId,
    is_custom: feature.is_custom ?? !feature.feature_definition_id,
  }));

  const { data, error: insertError } = await supabase
    .from("product_features")
    .insert(featuresToInsert)
    .select();

  if (insertError) {
    console.error("Error inserting product features:", insertError);
    throw new Error("Failed to update product features");
  }

  return data || [];
}

export async function getProductsWithFeatures(
  orgId: string,
  filters?: {
    categoryId?: string;
    subcategoryId?: string;
    featureFilters?: Array<{ name: string; value: string }>;
  }
): Promise<ProductWithCategory[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`
      *,
      product_features!inner (
        name,
        value
      )
    `)
    .eq("organization_clerk_id", orgId);

  if (filters?.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters?.subcategoryId) {
    query = query.eq("subcategory_id", filters.subcategoryId);
  }

  // Apply feature filters
  if (filters?.featureFilters && filters.featureFilters.length > 0) {
    for (const filter of filters.featureFilters) {
      query = query
        .eq("product_features.name", filter.name)
        .eq("product_features.value", filter.value);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products with features:", error);
    throw new Error("Failed to fetch products with features");
  }

  return data || [];
}