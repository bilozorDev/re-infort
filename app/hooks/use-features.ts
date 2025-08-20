import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateFeatureDefinitionInput,
  CreateProductFeatureInput,
  FeatureDefinition,
  ProductFeature,
  UpdateFeatureDefinitionInput,
} from "@/app/types/features";

export function useFeatureDefinitions(
  categoryId?: string,
  subcategoryId?: string
) {
  return useQuery<FeatureDefinition[]>({
    queryKey: ["feature-definitions", categoryId, subcategoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.append("categoryId", categoryId);
      if (subcategoryId) params.append("subcategoryId", subcategoryId);

      const response = await fetch(`/api/feature-definitions?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch feature definitions");
      }
      return response.json();
    },
    enabled: !!(categoryId || subcategoryId),
  });
}

export function useCreateFeatureDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFeatureDefinitionInput) => {
      const response = await fetch("/api/feature-definitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create feature definition");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-definitions"] });
      toast.success("Feature definition created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create feature definition");
    },
  });
}

export function useUpdateFeatureDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFeatureDefinitionInput;
    }) => {
      const response = await fetch(`/api/feature-definitions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update feature definition");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-definitions"] });
      toast.success("Feature definition updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update feature definition");
    },
  });
}

export function useDeleteFeatureDefinition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/feature-definitions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete feature definition");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-definitions"] });
      toast.success("Feature definition deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete feature definition");
    },
  });
}

export function useProductFeatures(productId: string) {
  return useQuery<ProductFeature[]>({
    queryKey: ["product-features", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/features`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch product features");
      }
      return response.json();
    },
    enabled: !!productId,
  });
}

export function useUpdateProductFeatures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      features,
    }: {
      productId: string;
      features: CreateProductFeatureInput[];
    }) => {
      const response = await fetch(`/api/products/${productId}/features`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ features }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update product features");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["product-features", variables.productId],
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product features updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product features");
    },
  });
}