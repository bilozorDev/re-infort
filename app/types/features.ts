export type FeatureInputType = 'text' | 'number' | 'select' | 'boolean' | 'date';

export interface FeatureDefinition {
  id: string;
  organization_clerk_id: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  name: string;
  input_type: FeatureInputType;
  options?: string[] | null;
  unit?: string | null;
  is_required: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by_clerk_user_id: string;
}

export interface ProductFeature {
  id: string;
  organization_clerk_id: string;
  product_id: string;
  feature_definition_id?: string | null;
  name: string;
  value: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFeatureDefinitionInput {
  category_id?: string | null;
  subcategory_id?: string | null;
  name: string;
  input_type: FeatureInputType;
  options?: string[] | null;
  unit?: string | null;
  is_required?: boolean;
  display_order?: number;
}

export interface UpdateFeatureDefinitionInput {
  name?: string;
  input_type?: FeatureInputType;
  options?: string[] | null;
  unit?: string | null;
  is_required?: boolean;
  display_order?: number;
}

export interface CreateProductFeatureInput {
  feature_definition_id?: string | null;
  name: string;
  value: string;
  is_custom?: boolean;
}

export interface UpdateProductFeatureInput {
  value: string;
}