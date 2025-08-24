import type {
  CreateSubcategoryInput,
  Subcategory,
  UpdateSubcategoryInput,
} from "@/app/types/product";

import { createClient } from "../supabase/server";

export async function getSubcategories(
  orgId: string,
  categoryId?: string
): Promise<Subcategory[]> {
  const supabase = await createClient();

  let query = supabase
    .from("subcategories")
    .select("*")
    .eq("organization_clerk_id", orgId)
    .order("created_at", { ascending: true });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching subcategories:", error);
    throw new Error("Failed to fetch subcategories");
  }

  return data || [];
}

export async function getSubcategoryById(
  id: string,
  orgId: string
): Promise<Subcategory | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("id", id)
    .eq("organization_clerk_id", orgId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching subcategory:", error);
    throw new Error("Failed to fetch subcategory");
  }

  return data;
}

export async function createSubcategory(
  input: CreateSubcategoryInput,
  orgId: string,
  userId: string
): Promise<Subcategory> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .insert({
      ...input,
      organization_clerk_id: orgId,
      created_by_clerk_user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating subcategory:", error);
    if (error.code === "23505") {
      throw new Error("A subcategory with this name already exists in this category");
    }
    throw new Error("Failed to create subcategory");
  }

  return data;
}

export async function updateSubcategory(
  id: string,
  input: UpdateSubcategoryInput,
  orgId: string
): Promise<Subcategory> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .update(input)
    .eq("id", id)
    .eq("organization_clerk_id", orgId)
    .select()
    .single();

  if (error) {
    console.error("Error updating subcategory:", error);
    if (error.code === "23505") {
      throw new Error("A subcategory with this name already exists in this category");
    }
    throw new Error("Failed to update subcategory");
  }

  return data;
}

export async function deleteSubcategory(
  id: string,
  orgId: string
): Promise<void> {
  const supabase = await createClient();

  // Check if subcategory has products
  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("subcategory_id", id);

  if (count && count > 0) {
    const error = new Error("Cannot delete subcategory with existing products") as Error & {
      hasDependencies: boolean;
      product_count: number;
    };
    error.hasDependencies = true;
    error.product_count = count;
    throw error;
  }

  const { error } = await supabase
    .from("subcategories")
    .delete()
    .eq("id", id)
    .eq("organization_clerk_id", orgId);

  if (error) {
    console.error("Error deleting subcategory:", error);
    throw new Error("Failed to delete subcategory");
  }
}