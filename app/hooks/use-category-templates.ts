import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  ImportProgress,
  ImportTemplateRequest,
  ImportTemplateResponse,
  TemplateDetailResponse,
  TemplateListResponse,
} from "@/app/types/category-template";

// Query keys
const TEMPLATE_KEYS = {
  all: ["category-templates"] as const,
  detail: (id: string) => ["category-templates", id] as const,
  progress: (jobId: string) => ["import-progress", jobId] as const,
};

// Fetch all templates
export function useCategoryTemplates() {
  return useQuery({
    queryKey: TEMPLATE_KEYS.all,
    queryFn: async (): Promise<TemplateListResponse> => {
      const response = await fetch("/api/category-templates");
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }
      return response.json();
    },
  });
}

// Fetch template details
export function useCategoryTemplate(templateId: string | null) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.detail(templateId || ""),
    queryFn: async (): Promise<TemplateDetailResponse> => {
      if (!templateId) {
        throw new Error("Template ID is required");
      }
      const response = await fetch(`/api/category-templates/${templateId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch template details");
      }
      return response.json();
    },
    enabled: !!templateId,
  });
}

// Import template mutation
export function useImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      request,
    }: {
      templateId: string;
      request: Omit<ImportTemplateRequest, "templateId">;
    }): Promise<ImportTemplateResponse> => {
      const response = await fetch(`/api/category-templates/${templateId}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import template");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate categories to show the newly imported items
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["subcategories"] });
      toast.success("Template import started successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Fetch import progress
export function useImportProgress(jobId: string | null, enabled = true) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.progress(jobId || ""),
    queryFn: async (): Promise<ImportProgress> => {
      if (!jobId) {
        throw new Error("Job ID is required");
      }
      const response = await fetch(`/api/category-templates/import-progress/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch import progress");
      }
      return response.json();
    },
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data as ImportProgress | undefined;
      // Poll every 500ms while importing, stop when completed/error
      if (data?.status === "importing" || data?.status === "preparing") {
        return 500;
      }
      return false;
    },
  });
}

// Cancel import mutation
export function useCancelImport() {
  return useMutation({
    mutationFn: async (jobId: string): Promise<void> => {
      const response = await fetch(`/api/category-templates/import-progress/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel import");
      }
    },
    onSuccess: () => {
      toast.info("Import cancelled");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}