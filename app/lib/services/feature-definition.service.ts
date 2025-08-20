import type {
  CreateFeatureDefinitionInput,
  FeatureDefinition,
  UpdateFeatureDefinitionInput,
} from "@/app/types/features";

import { createSupabaseClient } from "../supabase/client";

export async function getFeatureDefinitions(
  orgId: string,
  categoryId?: string,
  subcategoryId?: string
): Promise<FeatureDefinition[]> {
  const supabase = await createSupabaseClient();

  let query = supabase
    .from("feature_definitions")
    .select("*")
    .eq("organization_clerk_id", orgId)
    .order("display_order", { ascending: true });

  if (subcategoryId) {
    // If subcategory is specified, get features for both category and subcategory
    const { data: subcategory } = await supabase
      .from("subcategories")
      .select("category_id")
      .eq("id", subcategoryId)
      .single();

    if (subcategory) {
      query = query.or(`subcategory_id.eq.${subcategoryId},category_id.eq.${subcategory.category_id}`);
    }
  } else if (categoryId) {
    // If only category is specified, get features for that category
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching feature definitions:", error);
    throw new Error("Failed to fetch feature definitions");
  }

  return data || [];
}

export async function getFeatureDefinitionById(
  id: string,
  orgId: string
): Promise<FeatureDefinition | null> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("feature_definitions")
    .select("*")
    .eq("id", id)
    .eq("organization_clerk_id", orgId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching feature definition:", error);
    throw new Error("Failed to fetch feature definition");
  }

  return data;
}

export async function createFeatureDefinition(
  input: CreateFeatureDefinitionInput,
  orgId: string,
  userId: string
): Promise<FeatureDefinition> {
  const supabase = await createSupabaseClient();

  // Validate that either category_id or subcategory_id is provided
  if (!input.category_id && !input.subcategory_id) {
    throw new Error("Either category_id or subcategory_id must be provided");
  }

  const { data, error } = await supabase
    .from("feature_definitions")
    .insert({
      ...input,
      organization_clerk_id: orgId,
      created_by_clerk_user_id: userId,
      display_order: input.display_order ?? 0,
      is_required: input.is_required ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating feature definition:", error);
    if (error.code === "23505") {
      throw new Error("A feature with this name already exists for this category/subcategory");
    }
    throw new Error("Failed to create feature definition");
  }

  return data;
}

export async function updateFeatureDefinition(
  id: string,
  input: UpdateFeatureDefinitionInput,
  orgId: string
): Promise<FeatureDefinition> {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("feature_definitions")
    .update(input)
    .eq("id", id)
    .eq("organization_clerk_id", orgId)
    .select()
    .single();

  if (error) {
    console.error("Error updating feature definition:", error);
    if (error.code === "23505") {
      throw new Error("A feature with this name already exists for this category/subcategory");
    }
    throw new Error("Failed to update feature definition");
  }

  return data;
}

export async function deleteFeatureDefinition(
  id: string,
  orgId: string
): Promise<void> {
  const supabase = await createSupabaseClient();

  const { error } = await supabase
    .from("feature_definitions")
    .delete()
    .eq("id", id)
    .eq("organization_clerk_id", orgId);

  if (error) {
    console.error("Error deleting feature definition:", error);
    throw new Error("Failed to delete feature definition");
  }
}

export async function reorderFeatureDefinitions(
  featureIds: string[],
  orgId: string
): Promise<void> {
  const supabase = await createSupabaseClient();

  // Update display_order for each feature
  const updates = featureIds.map((id, index) => ({
    id,
    display_order: index,
  }));

  for (const update of updates) {
    const { error } = await supabase
      .from("feature_definitions")
      .update({ display_order: update.display_order })
      .eq("id", update.id)
      .eq("organization_clerk_id", orgId);

    if (error) {
      console.error("Error reordering feature definition:", error);
      throw new Error("Failed to reorder feature definitions");
    }
  }
}