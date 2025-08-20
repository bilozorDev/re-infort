import { createClient } from '@/app/lib/supabase/server';
import { type CreateWarehouseInput, type UpdateWarehouseInput,type Warehouse } from '@/app/types/warehouse';
import { isAdmin } from '@/app/utils/roles';

async function unsetDefaultWarehouses(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organizationId: string,
  excludeId?: string
): Promise<void> {
  let query = supabase
    .from('warehouses')
    .update({ is_default: false })
    .eq('organization_clerk_id', organizationId)
    .eq('is_default', true);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { error } = await query;

  if (error) {
    throw new Error(`Failed to unset default warehouses: ${error.message}`);
  }
}

export async function getAllWarehouses(organizationId: string): Promise<Warehouse[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('organization_clerk_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch warehouses: ${error.message}`);
  }

  return data || [];
}

export async function getWarehouseById(id: string, organizationId: string): Promise<Warehouse | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', id)
    .eq('organization_clerk_id', organizationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch warehouse: ${error.message}`);
  }

  return data;
}

export async function getWarehouseByCode(code: string, organizationId: string): Promise<Warehouse | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('code', code)
    .eq('organization_clerk_id', organizationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch warehouse by code: ${error.message}`);
  }

  return data;
}

export async function createWarehouse(
  input: CreateWarehouseInput,
  organizationId: string,
  userId: string
): Promise<Warehouse> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error('Only administrators can create warehouses');
  }

  const supabase = await createClient();
  
  // Check if code already exists for this organization
  const existing = await getWarehouseByCode(input.code, organizationId);
  if (existing) {
    throw new Error(`Warehouse with code ${input.code} already exists`);
  }

  // If this is set as default, unset other defaults
  if (input.is_default) {
    await unsetDefaultWarehouses(supabase, organizationId);
  }

  const { data, error } = await supabase
    .from('warehouses')
    .insert({
      ...input,
      organization_clerk_id: organizationId,
      created_by_clerk_user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create warehouse: ${error.message}`);
  }

  return data;
}

export async function updateWarehouse(
  id: string,
  input: UpdateWarehouseInput,
  organizationId: string
): Promise<Warehouse> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error('Only administrators can update warehouses');
  }

  const supabase = await createClient();
  
  // If updating code, check it doesn't already exist
  if (input.code) {
    const existing = await getWarehouseByCode(input.code, organizationId);
    if (existing && existing.id !== id) {
      throw new Error(`Warehouse with code ${input.code} already exists`);
    }
  }

  // If setting as default, unset other defaults
  if (input.is_default) {
    await unsetDefaultWarehouses(supabase, organizationId, id);
  }

  const { data, error } = await supabase
    .from('warehouses')
    .update(input)
    .eq('id', id)
    .eq('organization_clerk_id', organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update warehouse: ${error.message}`);
  }

  if (!data) {
    throw new Error('Warehouse not found');
  }

  return data;
}

export async function deleteWarehouse(id: string, organizationId: string): Promise<void> {
  // Check if user is admin
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    throw new Error('Only administrators can delete warehouses');
  }

  const supabase = await createClient();
  
  const { error } = await supabase
    .from('warehouses')
    .delete()
    .eq('id', id)
    .eq('organization_clerk_id', organizationId);

  if (error) {
    throw new Error(`Failed to delete warehouse: ${error.message}`);
  }
}

export async function getActiveWarehouses(organizationId: string): Promise<Warehouse[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('organization_clerk_id', organizationId)
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch active warehouses: ${error.message}`);
  }

  return data || [];
}

export async function getDefaultWarehouse(organizationId: string): Promise<Warehouse | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('organization_clerk_id', organizationId)
    .eq('is_default', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch default warehouse: ${error.message}`);
  }

  return data;
}