// AuthObject type from Clerk - using a simplified version for testing

import type { 
  CategoryTemplate, 
  CategoryTemplateWithStructure,
  ImportProgress 
} from "@/app/types/category-template";
import type { Database } from "@/app/types/database.types";
import type { UserPreferences } from "@/app/types/user-preferences";

// Custom session claims interface for Clerk auth
export interface MockCustomSessionClaims {
  org_id?: string;
  o?: {
    id?: string;
    rol?: string;
  };
  metadata?: string | {
    role?: string;
  };
}

// Mock auth object returned by @clerk/nextjs/server auth()
// We use a simplified version for testing, but cast to any to avoid typing issues
export interface MockAuthObject {
  userId: string | null;
  orgId?: string | null;
  sessionClaims?: MockCustomSessionClaims | null;
}

// Database row types
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Warehouse = Database["public"]["Tables"]["warehouses"]["Row"];
export type Subcategory = Database["public"]["Tables"]["subcategories"]["Row"];
export type FeatureDefinition = Database["public"]["Tables"]["feature_definitions"]["Row"];
export type ProductFeature = Database["public"]["Tables"]["product_features"]["Row"];
export type Inventory = Database["public"]["Tables"]["inventory"]["Row"];

// Partial types for testing (when we only need some fields)
export type PartialCategory = Partial<Category> & Pick<Category, "id" | "name" | "organization_clerk_id">;
export type PartialProduct = Partial<Product> & Pick<Product, "id" | "name" | "sku" | "organization_clerk_id">;
export type PartialWarehouse = Partial<Warehouse> & Pick<Warehouse, "id" | "name" | "organization_clerk_id">;


// Helper to create mock categories with required fields
export function createMockCategory(overrides?: Partial<Category>): Category {
  return {
    id: "cat_123",
    name: "Test Category",
    organization_clerk_id: "org_123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_clerk_user_id: "user_123",
    description: null,
    display_order: null,
    status: "active",
    ...overrides,
  };
}

// Helper to create mock products with required fields
export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: "prod_123",
    name: "Test Product",
    sku: "TEST-001",
    organization_clerk_id: "org_123",
    category_id: "cat_123",
    subcategory_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_clerk_user_id: "user_123",
    description: null,
    status: "active",
    link: null,
    price: null,
    cost: null,
    serial_number: null,
    photo_urls: null,
    ...overrides,
  };
}

// Helper to create mock warehouses with required fields
export function createMockWarehouse(overrides?: Partial<Warehouse>): Warehouse {
  return {
    id: "wh_123",
    name: "Test Warehouse",
    organization_clerk_id: "org_123",
    type: "office",
    status: "active",
    address: "123 Test St",
    city: "Test City",
    state_province: "Test State",
    postal_code: "12345",
    country: "Test Country",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_clerk_user_id: "user_123",
    notes: null,
    is_default: false,
    ...overrides,
  };
}

// Helper to create mock feature definitions
export function createMockFeatureDefinition(overrides?: Partial<FeatureDefinition>): FeatureDefinition {
  return {
    id: "def_123",
    name: "Test Feature",
    input_type: "text",
    organization_clerk_id: "org_123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_clerk_user_id: "user_123",
    is_required: false,
    display_order: null,
    options: null,
    unit: null,
    category_id: null,
    subcategory_id: null,
    ...overrides,
  };
}

// Helper to create mock subcategories
export function createMockSubcategory(overrides?: Partial<Subcategory>): Subcategory {
  return {
    id: "sub_123",
    name: "Test Subcategory",
    category_id: "cat_123",
    organization_clerk_id: "org_123",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_clerk_user_id: "user_123",
    description: null,
    display_order: null,
    status: "active",
    ...overrides,
  };
}

// Helper to create mock category templates
export function createMockCategoryTemplate(overrides?: Partial<CategoryTemplate>): CategoryTemplate {
  return {
    id: "template_123",
    name: "Test Template",
    description: null,
    business_type: "retail",
    icon: null,
    is_active: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create mock category template with structure
export function createMockCategoryTemplateWithStructure(
  overrides?: Partial<CategoryTemplateWithStructure>
): CategoryTemplateWithStructure {
  return {
    id: "template_123",
    name: "Test Template",
    description: null,
    business_type: "retail",
    icon: null,
    is_active: true,
    usage_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [],
    ...overrides,
  };
}

// Helper to create mock import progress
export function createMockImportProgress(overrides?: Partial<ImportProgress>): ImportProgress {
  return {
    jobId: "job_123",
    status: "importing",
    totalItems: 100,
    completedItems: 50,
    currentItem: "Test Item",
    currentItemType: "category",
    percentage: 50,
    errors: [],
    startTime: Date.now(),
    estimatedTimeRemaining: null,
    ...overrides,
  };
}

// Helper to create mock user preferences
export function createMockUserPreferences(overrides?: Partial<UserPreferences>): UserPreferences {
  return {
    id: "pref_123",
    clerk_user_id: "user_123",
    organization_clerk_id: "org_123",
    table_preferences: {},
    ui_preferences: {},
    feature_settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}