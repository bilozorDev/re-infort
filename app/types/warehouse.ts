import { type Tables, type TablesInsert, type TablesUpdate } from './database.types';

export type WarehouseType = 'office' | 'vehicle' | 'other';
export type WarehouseStatus = 'active' | 'inactive';

export type Warehouse = Tables<'warehouses'>;
export type CreateWarehouseInput = Omit<TablesInsert<'warehouses'>, 'id' | 'created_at' | 'updated_at' | 'organization_clerk_id' | 'created_by_clerk_user_id'>;
export type UpdateWarehouseInput = Omit<TablesUpdate<'warehouses'>, 'id' | 'created_at' | 'updated_at' | 'organization_clerk_id' | 'created_by_clerk_user_id'>;