"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

import type { TablePreference, UserPreferences } from "@/app/types/user-preferences";

/**
 * Get default table preferences (client-side version)
 */
function getDefaultTablePreferences(tableKey: string, isAdmin: boolean = false): TablePreference {
  const defaults: Record<string, TablePreference> = {
    products: {
      columnVisibility: {
        photo: true,
        name: true,
        sku: true,
        category: true,
        cost: isAdmin,
        price: true,
        quantity: true,
        status: true,
        created_at: false,
        actions: true,
      },
      sorting: [],
      columnFilters: [],
      globalFilter: "",
      density: "normal",
      pageSize: 25,
      viewMode: "list",
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
      density: "normal",
      pageSize: 25,
      viewMode: "list",
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
      density: "normal",
      pageSize: 25,
      viewMode: "list",
    },
  };

  return (
    defaults[tableKey] || {
      columnVisibility: {},
      sorting: [],
      density: "normal",
      pageSize: 25,
      viewMode: "list",
    }
  );
}

/**
 * Hook to fetch and manage user preferences
 */
export function useUserPreferences() {
  return useQuery({
    queryKey: ["user-preferences"],
    queryFn: async () => {
      const res = await fetch("/api/user/preferences");
      if (!res.ok) {
        throw new Error("Failed to fetch preferences");
      }
      return res.json() as Promise<UserPreferences>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
}

/**
 * Hook to manage table-specific preferences
 */
export function useTablePreferences(tableKey: string, isAdmin: boolean = false) {
  const queryClient = useQueryClient();
  const { data: userPreferences, isLoading: isLoadingPreferences } = useUserPreferences();

  // Get default preferences for this table
  const defaultPreferences = useMemo(
    () => getDefaultTablePreferences(tableKey, isAdmin),
    [tableKey, isAdmin]
  );

  // Merge user preferences with defaults
  const preferences = useMemo(() => {
    const userTablePrefs = userPreferences?.table_preferences?.[tableKey];
    if (!userTablePrefs) return defaultPreferences;

    return {
      ...defaultPreferences,
      ...userTablePrefs,
      // Deep merge for nested objects
      columnVisibility: {
        ...defaultPreferences.columnVisibility,
        ...userTablePrefs.columnVisibility,
      },
    };
  }, [userPreferences, tableKey, defaultPreferences]);

  // Mutation to update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs: Partial<TablePreference>) => {
      const res = await fetch(`/api/user/preferences/table/${tableKey}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPrefs),
      });

      if (!res.ok) {
        throw new Error("Failed to update preferences");
      }

      return res.json();
    },
    onMutate: async (newPrefs) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["user-preferences"] });

      // Snapshot the previous value
      const previousPrefs = queryClient.getQueryData(["user-preferences"]);

      // Optimistically update to the new value
      queryClient.setQueryData(["user-preferences"], (old: UserPreferences | undefined) => {
        if (!old) {
          return {
            table_preferences: {
              [tableKey]: newPrefs,
            },
            ui_preferences: {},
            feature_settings: {},
          };
        }

        return {
          ...old,
          table_preferences: {
            ...old.table_preferences,
            [tableKey]: {
              ...old.table_preferences?.[tableKey],
              ...newPrefs,
            },
          },
        };
      });

      // Return a context object with the snapshotted value
      return { previousPrefs };
    },
    onError: (err, newPrefs, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPrefs) {
        queryClient.setQueryData(["user-preferences"], context.previousPrefs);
      }
      toast.error("Failed to save preferences");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });

  // Reset preferences mutation
  const resetPreferencesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/user/preferences/table/${tableKey}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to reset preferences");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
      toast.success("Preferences reset to defaults");
    },
    onError: () => {
      toast.error("Failed to reset preferences");
    },
  });

  // Debounced update function
  const updatePreferences = useCallback(
    (newPrefs: Partial<TablePreference>) => {
      updatePreferencesMutation.mutate(newPrefs);
    },
    [updatePreferencesMutation]
  );

  const resetPreferences = useCallback(() => {
    resetPreferencesMutation.mutate();
  }, [resetPreferencesMutation]);

  return {
    preferences,
    defaultPreferences,
    updatePreferences,
    resetPreferences,
    isLoading: isLoadingPreferences,
    isUpdating: updatePreferencesMutation.isPending,
    isResetting: resetPreferencesMutation.isPending,
  };
}
