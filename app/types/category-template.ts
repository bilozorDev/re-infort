import type { FeatureInputType } from "./features";

// Database table types
export interface CategoryTemplate {
  id: string;
  name: string;
  description: string | null;
  business_type: string;
  icon: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateCategory {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface TemplateSubcategory {
  id: string;
  template_category_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

export interface TemplateFeature {
  id: string;
  template_category_id: string | null;
  template_subcategory_id: string | null;
  name: string;
  input_type: FeatureInputType;
  options: string[] | null;
  unit: string | null;
  is_required: boolean;
  display_order: number;
  created_at: string;
}

// Composite types for UI
export interface TemplateSubcategoryWithFeatures extends TemplateSubcategory {
  features: TemplateFeature[];
  selected?: boolean; // For checkbox selection
}

export interface TemplateCategoryWithSubcategories extends TemplateCategory {
  subcategories: TemplateSubcategoryWithFeatures[];
  features: TemplateFeature[]; // Direct category features
  selected?: boolean; // For checkbox selection
  partiallySelected?: boolean; // When some children are selected
}

export interface CategoryTemplateWithStructure extends CategoryTemplate {
  categories: TemplateCategoryWithSubcategories[];
}

// Selection state for import
export interface TemplateSelectionState {
  templateId: string;
  selectedCategories: Set<string>;
  selectedSubcategories: Set<string>;
  selectedFeatures: Set<string>;
}

// Import request types
export interface ImportTemplateRequest {
  templateId: string;
  importMode: "merge" | "replace";
  selections: {
    categories: Array<{
      templateCategoryId: string;
      includeFeatures: boolean;
      subcategories: Array<{
        templateSubcategoryId: string;
        includeFeatures: boolean;
        featureIds?: string[];
      }>;
      featureIds?: string[];
    }>;
  };
}

// Import progress tracking
export interface ImportProgress {
  jobId: string;
  status: "preparing" | "importing" | "completed" | "error" | "cancelled";
  totalItems: number;
  completedItems: number;
  currentItem: string | null;
  currentItemType: "category" | "subcategory" | "feature" | null;
  percentage: number;
  errors: ImportError[];
  startTime: number;
  estimatedTimeRemaining: number | null;
  result?: ImportResult;
}

export interface ImportError {
  item: string;
  itemType: "category" | "subcategory" | "feature";
  error: string;
  timestamp: number;
}

export interface ImportResult {
  categoriesCreated: number;
  subcategoriesCreated: number;
  featuresCreated: number;
  categoriesSkipped: number;
  subcategoriesSkipped: number;
  featuresSkipped: number;
  errors: ImportError[];
}

// API response types
export interface TemplateListResponse {
  templates: CategoryTemplate[];
  totalCount: number;
}

export interface TemplateDetailResponse {
  template: CategoryTemplateWithStructure;
}

export interface ImportTemplateResponse {
  jobId: string;
  message: string;
}

// UI helper types
export interface TemplateTreeNode {
  id: string;
  type: "category" | "subcategory" | "feature";
  name: string;
  description?: string | null;
  parent?: string | null;
  children?: TemplateTreeNode[];
  selected: boolean;
  partiallySelected: boolean;
  metadata?: {
    inputType?: FeatureInputType;
    options?: string[] | null;
    unit?: string | null;
    isRequired?: boolean;
  };
}