import type {
  CategoryTemplate,
  CategoryTemplateWithStructure,
  ImportProgress,
  ImportResult,
  ImportTemplateRequest,
  TemplateCategoryWithSubcategories,
  TemplateSubcategoryWithFeatures,
} from "@/app/types/category-template";
import type { CreateFeatureDefinitionInput } from "@/app/types/features";

import { createClient } from "../supabase/server";
import { createCategorySchema, createSubcategorySchema } from "../validations/product";
import { createCategory } from "./category.service";
import { createFeatureDefinition } from "./feature-definition.service";
import { createSubcategory } from "./subcategory.service";

// In-memory storage for import progress (in production, use Redis or similar)
const importProgressMap = new Map<string, ImportProgress>();

export async function getTemplates(): Promise<CategoryTemplate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("category_templates")
    .select("*")
    .eq("is_active", true)
    .order("business_type", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching category templates:", error);
    throw new Error("Failed to fetch category templates");
  }

  return data || [];
}

export async function getTemplateById(id: string): Promise<CategoryTemplateWithStructure | null> {
  const supabase = await createClient();

  // Fetch template
  const { data: template, error: templateError } = await supabase
    .from("category_templates")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (templateError) {
    if (templateError.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching template:", templateError);
    throw new Error("Failed to fetch template");
  }

  if (!template) {
    return null;
  }

  // Fetch categories
  const { data: categories, error: categoriesError } = await supabase
    .from("template_categories")
    .select("*")
    .eq("template_id", id)
    .order("display_order", { ascending: true });

  if (categoriesError) {
    console.error("Error fetching template categories:", categoriesError);
    throw new Error("Failed to fetch template categories");
  }

  // Fetch all subcategories for this template's categories
  const categoryIds = categories?.map((c) => c.id) || [];
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from("template_subcategories")
    .select("*")
    .in("template_category_id", categoryIds)
    .order("display_order", { ascending: true });

  if (subcategoriesError) {
    console.error("Error fetching template subcategories:", subcategoriesError);
    throw new Error("Failed to fetch template subcategories");
  }

  // Fetch all features
  const subcategoryIds = subcategories?.map((s) => s.id) || [];
  const { data: features, error: featuresError } = await supabase
    .from("template_features")
    .select("*")
    .or(
      `template_category_id.in.(${categoryIds.join(",")}),template_subcategory_id.in.(${subcategoryIds.join(",")})`
    )
    .order("display_order", { ascending: true });

  if (featuresError) {
    console.error("Error fetching template features:", featuresError);
    throw new Error("Failed to fetch template features");
  }

  // Build the structured response
  const structuredCategories: TemplateCategoryWithSubcategories[] = (categories || []).map((category) => {
    const categorySubcategories = (subcategories || [])
      .filter((sub) => sub.template_category_id === category.id)
      .map((subcategory) => {
        const subcategoryFeatures = (features || []).filter(
          (f) => f.template_subcategory_id === subcategory.id
        );
        return {
          ...subcategory,
          features: subcategoryFeatures,
        } as TemplateSubcategoryWithFeatures;
      });

    const categoryFeatures = (features || []).filter(
      (f) => f.template_category_id === category.id && !f.template_subcategory_id
    );

    return {
      ...category,
      subcategories: categorySubcategories,
      features: categoryFeatures,
    };
  });

  return {
    ...template,
    categories: structuredCategories,
  };
}

export async function importTemplate(
  request: ImportTemplateRequest,
  orgId: string,
  userId: string
): Promise<string> {
  // Generate a unique job ID
  const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Initialize progress tracking
  const progress: ImportProgress = {
    jobId,
    status: "preparing",
    totalItems: 0,
    completedItems: 0,
    currentItem: null,
    currentItemType: null,
    percentage: 0,
    errors: [],
    startTime: Date.now(),
    estimatedTimeRemaining: null,
  };

  importProgressMap.set(jobId, progress);

  // Start the import process asynchronously
  importTemplateAsync(request, orgId, userId, jobId).catch((error) => {
    const progress = importProgressMap.get(jobId);
    if (progress) {
      progress.status = "error";
      progress.errors.push({
        item: "Import Process",
        itemType: "category",
        error: error.message,
        timestamp: Date.now(),
      });
    }
  });

  return jobId;
}

async function importTemplateAsync(
  request: ImportTemplateRequest,
  orgId: string,
  userId: string,
  jobId: string
): Promise<void> {
  const progress = importProgressMap.get(jobId);
  if (!progress) return;

  try {
    // Fetch the template structure
    const template = await getTemplateById(request.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Calculate total items to import
    let totalItems = 0;
    for (const catSelection of request.selections.categories) {
      totalItems++; // Category itself
      if (catSelection.includeFeatures && catSelection.featureIds) {
        totalItems += catSelection.featureIds.length;
      }
      for (const subSelection of catSelection.subcategories) {
        totalItems++; // Subcategory itself
        if (subSelection.includeFeatures && subSelection.featureIds) {
          totalItems += subSelection.featureIds.length;
        }
      }
    }

    progress.totalItems = totalItems;
    progress.status = "importing";

    const result: ImportResult = {
      categoriesCreated: 0,
      subcategoriesCreated: 0,
      featuresCreated: 0,
      categoriesSkipped: 0,
      subcategoriesSkipped: 0,
      featuresSkipped: 0,
      errors: [],
    };

    // Import each selected category
    for (const catSelection of request.selections.categories) {
      const templateCategory = template.categories.find(
        (c) => c.id === catSelection.templateCategoryId
      );

      if (!templateCategory) {
        progress.errors.push({
          item: catSelection.templateCategoryId,
          itemType: "category",
          error: "Template category not found",
          timestamp: Date.now(),
        });
        continue;
      }

      progress.currentItem = `Category: ${templateCategory.name}`;
      progress.currentItemType = "category";
      updateProgress(progress);

      try {
        // Create the category
        const categoryData = createCategorySchema.parse({
          name: templateCategory.name,
          description: templateCategory.description,
          status: "active",
          display_order: templateCategory.display_order,
        });

        const createdCategory = await createCategory(categoryData, orgId, userId);
        result.categoriesCreated++;
        progress.completedItems++;

        // Import category-level features if selected
        if (catSelection.includeFeatures && catSelection.featureIds) {
          for (const featureId of catSelection.featureIds) {
            const templateFeature = templateCategory.features.find((f) => f.id === featureId);
            if (!templateFeature) continue;

            progress.currentItem = `Feature: ${templateFeature.name}`;
            progress.currentItemType = "feature";
            updateProgress(progress);

            try {
              const featureData: CreateFeatureDefinitionInput = {
                category_id: createdCategory.id,
                name: templateFeature.name,
                input_type: templateFeature.input_type,
                options: templateFeature.options,
                unit: templateFeature.unit,
                is_required: templateFeature.is_required,
                display_order: templateFeature.display_order,
              };

              await createFeatureDefinition(featureData, orgId, userId);
              result.featuresCreated++;
              progress.completedItems++;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              progress.errors.push({
                item: templateFeature.name,
                itemType: "feature",
                error: errorMessage,
                timestamp: Date.now(),
              });
              result.errors.push({
                item: templateFeature.name,
                itemType: "feature",
                error: errorMessage,
                timestamp: Date.now(),
              });
            }
          }
        }

        // Import subcategories
        for (const subSelection of catSelection.subcategories) {
          const templateSubcategory = templateCategory.subcategories.find(
            (s) => s.id === subSelection.templateSubcategoryId
          );

          if (!templateSubcategory) {
            progress.errors.push({
              item: subSelection.templateSubcategoryId,
              itemType: "subcategory",
              error: "Template subcategory not found",
              timestamp: Date.now(),
            });
            continue;
          }

          progress.currentItem = `Subcategory: ${templateSubcategory.name}`;
          progress.currentItemType = "subcategory";
          updateProgress(progress);

          try {
            // Create the subcategory
            const subcategoryData = createSubcategorySchema.parse({
              category_id: createdCategory.id,
              name: templateSubcategory.name,
              description: templateSubcategory.description,
              status: "active",
              display_order: templateSubcategory.display_order,
            });

            const createdSubcategory = await createSubcategory(subcategoryData, orgId, userId);
            result.subcategoriesCreated++;
            progress.completedItems++;

            // Import subcategory-level features if selected
            if (subSelection.includeFeatures && subSelection.featureIds) {
              for (const featureId of subSelection.featureIds) {
                const templateFeature = templateSubcategory.features.find((f) => f.id === featureId);
                if (!templateFeature) continue;

                progress.currentItem = `Feature: ${templateFeature.name}`;
                progress.currentItemType = "feature";
                updateProgress(progress);

                try {
                  const featureData: CreateFeatureDefinitionInput = {
                    subcategory_id: createdSubcategory.id,
                    name: templateFeature.name,
                    input_type: templateFeature.input_type,
                    options: templateFeature.options,
                    unit: templateFeature.unit,
                    is_required: templateFeature.is_required,
                    display_order: templateFeature.display_order,
                  };

                  await createFeatureDefinition(featureData, orgId, userId);
                  result.featuresCreated++;
                  progress.completedItems++;
                } catch (error) {
                  const errorMessage = error instanceof Error ? error.message : "Unknown error";
                  progress.errors.push({
                    item: templateFeature.name,
                    itemType: "feature",
                    error: errorMessage,
                    timestamp: Date.now(),
                  });
                  result.errors.push({
                    item: templateFeature.name,
                    itemType: "feature",
                    error: errorMessage,
                    timestamp: Date.now(),
                  });
                }
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            // Check if it's a duplicate error
            if (errorMessage.includes("already exists")) {
              result.subcategoriesSkipped++;
              progress.completedItems++;
            } else {
              progress.errors.push({
                item: templateSubcategory.name,
                itemType: "subcategory",
                error: errorMessage,
                timestamp: Date.now(),
              });
              result.errors.push({
                item: templateSubcategory.name,
                itemType: "subcategory",
                error: errorMessage,
                timestamp: Date.now(),
              });
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Check if it's a duplicate error
        if (errorMessage.includes("already exists")) {
          result.categoriesSkipped++;
          progress.completedItems++;
        } else {
          progress.errors.push({
            item: templateCategory.name,
            itemType: "category",
            error: errorMessage,
            timestamp: Date.now(),
          });
          result.errors.push({
            item: templateCategory.name,
            itemType: "category",
            error: errorMessage,
            timestamp: Date.now(),
          });
        }
      }

      updateProgress(progress);
    }

    // Update template usage count
    await incrementTemplateUsage(request.templateId);

    // Mark import as completed
    progress.status = "completed";
    progress.currentItem = null;
    progress.currentItemType = null;
    progress.percentage = 100;
    progress.result = result;
    updateProgress(progress);

    // Clean up progress after 5 minutes
    setTimeout(() => {
      importProgressMap.delete(jobId);
    }, 5 * 60 * 1000);
  } catch (error) {
    progress.status = "error";
    progress.errors.push({
      item: "Import Process",
      itemType: "category",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: Date.now(),
    });
    updateProgress(progress);
  }
}

function updateProgress(progress: ImportProgress): void {
  // Calculate percentage
  if (progress.totalItems > 0) {
    progress.percentage = Math.round((progress.completedItems / progress.totalItems) * 100);
  }

  // Estimate time remaining
  const elapsedTime = Date.now() - progress.startTime;
  if (progress.completedItems > 0 && progress.completedItems < progress.totalItems) {
    const timePerItem = elapsedTime / progress.completedItems;
    const remainingItems = progress.totalItems - progress.completedItems;
    progress.estimatedTimeRemaining = Math.round(timePerItem * remainingItems);
  } else {
    progress.estimatedTimeRemaining = null;
  }
}

export async function getImportProgress(jobId: string): Promise<ImportProgress | null> {
  return importProgressMap.get(jobId) || null;
}

export async function cancelImport(jobId: string): Promise<boolean> {
  const progress = importProgressMap.get(jobId);
  if (progress && progress.status === "importing") {
    progress.status = "cancelled";
    return true;
  }
  return false;
}

async function incrementTemplateUsage(templateId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("increment", {
    table_name: "category_templates",
    column_name: "usage_count",
    row_id: templateId,
  });

  if (error) {
    console.error("Error incrementing template usage:", error);
    // Non-critical error, don't throw
  }
}