import type { ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";

export interface UserPreferences {
  id: string;
  clerk_user_id: string;
  organization_clerk_id: string;
  table_preferences: TablePreferences;
  ui_preferences: UIPreferences;
  feature_settings: FeatureSettings;
  navigation_state: NavigationState | null;
  created_at: string;
  updated_at: string;
}

export interface NavigationState {
  inventory_expanded?: boolean;
  [key: string]: boolean | undefined;
}

export interface TablePreferences {
  [tableKey: string]: TablePreference;
}

export interface TablePreference {
  columnVisibility?: VisibilityState;
  columnOrder?: string[];
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  globalFilter?: string;
  density?: 'compact' | 'normal' | 'comfortable';
  pageSize?: 10 | 25 | 50 | 100;
  viewMode?: 'list' | 'grid';
}

export interface UIPreferences {
  sidebarCollapsed?: boolean;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  dateFormat?: string;
  currency?: string;
  timezone?: string;
}

export interface FeatureSettings {
  experimentalFeatures?: boolean;
  betaFeatures?: boolean;
  developerMode?: boolean;
  [key: string]: boolean | undefined;
}

export type CreateUserPreferencesInput = Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUserPreferencesInput = Partial<Omit<UserPreferences, 'id' | 'clerk_user_id' | 'organization_clerk_id' | 'created_at' | 'updated_at'>>;
export type { NavigationState };