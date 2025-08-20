import { createClient } from "@/app/lib/supabase/server";
import {
  type Category,
  type CreateCategoryInput,
  type CreateSubcategoryInput,
  type Subcategory,
  type UpdateCategoryInput,
  type UpdateSubcategoryInput,
} from "@/app/types/product";
import { isAdmin } from "@/app/utils/roles";

export async function getAllCategories(organizationId: string): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("organization_clerk_id", organizationId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data || [];
}

export async function getActiveCategories(organizationId: string): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("organization_clerk_id", organizationId)
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch active categories: ${error.message}`);
  }

  return data || [];
}

export async function getCategoryById(
  id: string,
  organizationId: string
): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("organization_clerk_id", organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch category: ${error.message}`);
  }

  return data;
}

export async function createCategory(
  input: CreateCategoryInput,
  organizationId: string,
  userId: string
): Promise<Category> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can create categories");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      ...input,
      organization_clerk_id: organizationId,
      created_by_clerk_user_id: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A category with this name already exists");
    }
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
  organizationId: string
): Promise<Category> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can update categories");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .eq("organization_clerk_id", organizationId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A category with this name already exists");
    }
    throw new Error(`Failed to update category: ${error.message}`);
  }

  if (!data) {
    throw new Error("Category not found");
  }

  return data;
}

export async function deleteCategory(id: string, organizationId: string): Promise<void> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can delete categories");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("organization_clerk_id", organizationId);

  if (error) {
    if (error.message.includes("products")) {
      throw new Error("Cannot delete category with existing products");
    }
    throw new Error(`Failed to delete category: ${error.message}`);
  }
}

// Subcategory functions

export async function getAllSubcategories(organizationId: string): Promise<Subcategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("organization_clerk_id", organizationId)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch subcategories: ${error.message}`);
  }

  return data || [];
}

export async function getSubcategoriesByCategory(
  categoryId: string,
  organizationId: string
): Promise<Subcategory[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("category_id", categoryId)
    .eq("organization_clerk_id", organizationId)
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch subcategories: ${error.message}`);
  }

  return data || [];
}

export async function getSubcategoryById(
  id: string,
  organizationId: string
): Promise<Subcategory | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("id", id)
    .eq("organization_clerk_id", organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(`Failed to fetch subcategory: ${error.message}`);
  }

  return data;
}

export async function createSubcategory(
  input: CreateSubcategoryInput,
  organizationId: string,
  userId: string
): Promise<Subcategory> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can create subcategories");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .insert({
      ...input,
      organization_clerk_id: organizationId,
      created_by_clerk_user_id: userId,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A subcategory with this name already exists in this category");
    }
    throw new Error(`Failed to create subcategory: ${error.message}`);
  }

  return data;
}

export async function updateSubcategory(
  id: string,
  input: UpdateSubcategoryInput,
  organizationId: string
): Promise<Subcategory> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can update subcategories");
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("subcategories")
    .update(input)
    .eq("id", id)
    .eq("organization_clerk_id", organizationId)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("A subcategory with this name already exists in this category");
    }
    throw new Error(`Failed to update subcategory: ${error.message}`);
  }

  if (!data) {
    throw new Error("Subcategory not found");
  }

  return data;
}

export async function deleteSubcategory(id: string, organizationId: string): Promise<void> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error("Only administrators can delete subcategories");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("subcategories")
    .delete()
    .eq("id", id)
    .eq("organization_clerk_id", organizationId);

  if (error) {
    if (error.message.includes("products")) {
      throw new Error("Cannot delete subcategory with existing products");
    }
    throw new Error(`Failed to delete subcategory: ${error.message}`);
  }
}