import type { UserPreferences, TablePreference } from '@/app/types/user-preferences'

export const mockUserPreferences: UserPreferences[] = [
  {
    id: 'pref-1',
    clerk_user_id: 'user_test123',
    organization_clerk_id: 'org_test123',
    navigation_state: null,
    table_preferences: {
      products: {
        columnVisibility: {
          name: true,
          sku: true,
          category: true,
          price: true,
          status: true,
        },
        sorting: [{ id: 'name', desc: false }],
        columnFilters: [],
        globalFilter: '',
        density: 'normal',
        pageSize: 25,
        viewMode: 'list',
      },
      inventory: {
        columnVisibility: {
          product_name: true,
          warehouse_name: true,
          quantity: true,
        },
        sorting: [],
        density: 'compact',
        pageSize: 50,
        viewMode: 'list',
      },
    },
    ui_preferences: {
      sidebarCollapsed: false,
      theme: 'light',
      language: 'en',
      dateFormat: 'MM/dd/yyyy',
      currency: 'USD',
      timezone: 'America/New_York',
    },
    feature_settings: {
      experimentalFeatures: false,
      betaFeatures: true,
      developerMode: false,
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pref-2',
    clerk_user_id: 'user_admin',
    organization_clerk_id: 'org_test123',
    navigation_state: { inventory_expanded: true },
    table_preferences: {
      products: {
        columnVisibility: {
          name: true,
          sku: true,
          category: true,
          cost: true,
          price: true,
          status: true,
        },
        sorting: [],
        columnFilters: [],
        globalFilter: '',
        density: 'comfortable',
        pageSize: 10,
        viewMode: 'grid',
      },
    },
    ui_preferences: {
      sidebarCollapsed: true,
      theme: 'dark',
      language: 'en',
      dateFormat: 'yyyy-MM-dd',
      currency: 'USD',
      timezone: 'UTC',
    },
    feature_settings: {
      experimentalFeatures: true,
      betaFeatures: true,
      developerMode: true,
    },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

export const createMockUserPreferences = (overrides?: Partial<UserPreferences>): UserPreferences => ({
  id: 'pref-test',
  clerk_user_id: 'user_test',
  organization_clerk_id: 'org_test123',
  navigation_state: null,
  table_preferences: {
    products: {
      columnVisibility: { name: true, sku: true },
      sorting: [],
      columnFilters: [],
      globalFilter: '',
      density: 'normal',
      pageSize: 25,
      viewMode: 'list',
    },
  },
  ui_preferences: {
    sidebarCollapsed: false,
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/dd/yyyy',
    currency: 'USD',
    timezone: 'America/New_York',
  },
  feature_settings: {
    experimentalFeatures: false,
    betaFeatures: false,
    developerMode: false,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockTablePreference = (overrides?: Partial<TablePreference>): TablePreference => ({
  columnVisibility: { name: true, sku: true },
  sorting: [],
  columnFilters: [],
  globalFilter: '',
  density: 'normal',
  pageSize: 25,
  viewMode: 'list',
  ...overrides,
})