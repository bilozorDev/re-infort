"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type Tables } from "@/app/types/database.types";

type ServiceCategory = Tables<"service_categories">;

export function useServiceCategories(activeOnly = false) {
  return useQuery({
    queryKey: ["service-categories", { active: activeOnly }],
    queryFn: async () => {
      const url = activeOnly ? "/api/service-categories?active=true" : "/api/service-categories";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch service categories");
      }
      return response.json() as Promise<ServiceCategory[]>;
    },
  });
}

export function useServiceCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["service-category", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/service-categories/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch service category");
      }
      return response.json() as Promise<ServiceCategory & { service_count: number }>;
    },
    enabled: !!id,
  });
}

export function useCreateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      description?: string | null; 
      status?: "active" | "inactive"; 
      display_order?: number 
    }) => {
      const response = await fetch("/api/service-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create service category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service category created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: Partial<{ 
        name: string; 
        description?: string | null; 
        status?: "active" | "inactive"; 
        display_order?: number 
      }> 
    }) => {
      const response = await fetch(`/api/service-categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update service category");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["service-category", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service category updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/service-categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409 && data.service_count !== undefined) {
          // Return the dependency info for the UI to handle
          throw { 
            message: data.message,
            service_count: data.service_count,
            hasDependencies: true 
          };
        }
        throw new Error(data.error || "Failed to delete service category");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service category deleted successfully");
    },
    onError: (error: unknown) => {
      const err = error as { hasDependencies?: boolean; message?: string };
      if (err.hasDependencies) {
        // Let the component handle the warning dialog
        toast.error(err.message || "Cannot delete category with existing services");
        return;
      }
      toast.error(err.message || "Failed to delete service category");
    },
  });
}