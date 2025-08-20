'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { type CreateWarehouseInput, type UpdateWarehouseInput } from '@/app/lib/validations/warehouse';
import { type Warehouse } from '@/app/types/warehouse';

// Fetch all warehouses
export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await fetch('/api/warehouses');
      if (!response.ok) {
        throw new Error('Failed to fetch warehouses');
      }
      return response.json() as Promise<Warehouse[]>;
    },
  });
}

// Fetch a single warehouse
export function useWarehouse(id: string | undefined) {
  return useQuery({
    queryKey: ['warehouses', id],
    queryFn: async () => {
      if (!id) throw new Error('No warehouse ID provided');
      const response = await fetch(`/api/warehouses/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch warehouse');
      }
      return response.json() as Promise<Warehouse>;
    },
    enabled: !!id,
  });
}

// Create a new warehouse
export function useCreateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWarehouseInput) => {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create warehouse');
      }
      
      return result as Warehouse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(`Warehouse "${data.name}" created successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create warehouse');
    },
  });
}

// Update a warehouse
export function useUpdateWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWarehouseInput }) => {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update warehouse');
      }
      
      return result as Warehouse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', data.id] });
      toast.success(`Warehouse "${data.name}" updated successfully`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update warehouse');
    },
  });
}

// Delete a warehouse
export function useDeleteWarehouse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete warehouse');
      }
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.removeQueries({ queryKey: ['warehouses', id] });
      toast.success('Warehouse deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete warehouse');
    },
  });
}