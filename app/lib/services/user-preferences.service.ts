import { createClient } from "@/app/lib/supabase/server";
import type { 
  TablePreference, 
  UpdateUserPreferencesInput, 
  UserPreferences} from "@/app/types/user-preferences";

/**
 * Get user preferences from the database
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      // No preferences found, return null
      return null;
    }
    console.error('Error fetching user preferences:', error);
    throw error;
  }
  
  return data as UserPreferences;
}

/**
 * Create or update user preferences
 */
export async function upsertUserPreferences(
  userId: string,
  orgId: string,
  preferences: UpdateUserPreferencesInput
): Promise<UserPreferences> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      clerk_user_id: userId,
      organization_clerk_id: orgId,
      ...preferences,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'clerk_user_id'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error upserting user preferences:', error);
    throw error;
  }
  
  return data as UserPreferences;
}

/**
 * Update table preferences for a specific table
 */
export async function updateTablePreferences(
  userId: string,
  tableKey: string,
  preferences: TablePreference
): Promise<Record<string, TablePreference>> {
  const supabase = await createClient();
  
  // Use the database function for atomic update
  const { data, error } = await supabase.rpc('update_table_preferences', {
    p_user_id: userId,
    p_table_key: tableKey,
    p_preferences: preferences
  });
  
  if (error) {
    console.error('Error updating table preferences:', error);
    throw error;
  }
  
  return data as Record<string, TablePreference>;
}

/**
 * Reset table preferences to defaults for a specific table
 */
export async function resetTablePreferences(
  userId: string,
  tableKey: string
): Promise<Record<string, TablePreference>> {
  const supabase = await createClient();
  
  // Get current preferences
  const { data: current, error: fetchError } = await supabase
    .from('user_preferences')
    .select('table_preferences')
    .eq('clerk_user_id', userId)
    .single();
    
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching preferences for reset:', fetchError);
    throw fetchError;
  }
  
  // Remove the specific table preferences
  const updatedPreferences = { ...(current?.table_preferences || {}) };
  delete updatedPreferences[tableKey];
  
  // Update the database
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      table_preferences: updatedPreferences,
      updated_at: new Date().toISOString()
    })
    .eq('clerk_user_id', userId)
    .select('table_preferences')
    .single();
    
  if (error) {
    console.error('Error resetting table preferences:', error);
    throw error;
  }
  
  return data.table_preferences as Record<string, TablePreference>;
}

/**
 * Get default table preferences
 */
export function getDefaultTablePreferences(tableKey: string, isAdmin: boolean = false): TablePreference {
  const defaults: Record<string, TablePreference> = {
    products: {
      columnVisibility: {
        name: true,
        sku: true,
        category: true,
        subcategory: false,
        description: false,
        cost: isAdmin,
        price: true,
        status: true,
        photo_urls: true,
        features: false,
        created_at: false,
        updated_at: false,
      },
      sorting: [],
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
        available_quantity: true,
        reserved_quantity: true,
        reorder_point: true,
        location_details: false,
        notes: false,
        created_at: false,
        updated_at: false,
      },
      sorting: [],
      density: 'normal',
      pageSize: 25,
      viewMode: 'list',
    },
    warehouses: {
      columnVisibility: {
        name: true,
        type: true,
        address: true,
        city: true,
        state_province: true,
        country: true,
        postal_code: false,
        status: true,
        is_default: true,
        notes: false,
        created_at: false,
        updated_at: false,
      },
      sorting: [],
      density: 'normal',
      pageSize: 25,
      viewMode: 'list',
    },
  };
  
  return defaults[tableKey] || {
    columnVisibility: {},
    sorting: [],
    density: 'normal',
    pageSize: 25,
    viewMode: 'list',
  };
}