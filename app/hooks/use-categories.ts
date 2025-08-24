"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { type Category, type Subcategory } from "@/app/types/product";

export function useCategories(activeOnly = false) {
  return useQuery({
    queryKey: ["categories", { active: activeOnly }],
    queryFn: async () => {
      const url = activeOnly ? "/api/categories?active=true" : "/api/categories";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json() as Promise<Category[]>;
    },
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json() as Promise<Category[]>;
    },
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`/api/categories/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch category");
      }
      return response.json() as Promise<Category & { subcategory_count: number; product_count: number }>;
    },
    enabled: !!id,
  });
}

export function useSubcategories(categoryId: string | null) {
  return useQuery({
    queryKey: ["subcategories", categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const response = await fetch(`/api/subcategories?categoryId=${categoryId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch subcategories");
      }
      return response.json() as Promise<Subcategory[]>;
    },
    enabled: !!categoryId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string | null; status?: "active" | "inactive" }) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { category_id: string; name: string; description?: string | null; status?: "active" | "inactive" }) => {
      const response = await fetch("/api/subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create subcategory");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      if (variables.category_id) {
        queryClient.invalidateQueries({ queryKey: ["subcategories", variables.category_id] });
      }
      toast.success("Subcategory created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ name: string; description?: string | null; status?: "active" | "inactive"; display_order?: number }> }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", variables.id] });
      toast.success("Category updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409 && data.subcategory_count !== undefined) {
          // Return the dependency info for the UI to handle
          throw { 
            message: data.message,
            subcategory_count: data.subcategory_count,
            product_count: data.product_count,
            hasDependencies: true 
          };
        }
        throw new Error(data.error || "Failed to delete category");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully");
    },
    onError: (error: unknown) => {
      const err = error as { hasDependencies?: boolean; message?: string };
      if (err.hasDependencies) {
        // Let the component handle the warning dialog
        return;
      }
      toast.error(err.message || "Failed to delete category");
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ category_id?: string; name: string; description?: string | null; status?: "active" | "inactive"; display_order?: number }> }) => {
      const response = await fetch(`/api/subcategories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update subcategory");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/subcategories/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 409 && data.product_count !== undefined) {
          // Return the dependency info for the UI to handle
          throw { 
            message: data.message,
            product_count: data.product_count,
            hasDependencies: true 
          };
        }
        throw new Error(data.error || "Failed to delete subcategory");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Subcategory deleted successfully");
    },
    onError: (error: unknown) => {
      const err = error as { hasDependencies?: boolean; message?: string };
      if (err.hasDependencies) {
        // Let the component handle the warning dialog
        return;
      }
      toast.error(err.message || "Failed to delete subcategory");
    },
  });
}