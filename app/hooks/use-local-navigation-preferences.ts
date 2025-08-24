"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "navigation-preferences";

interface NavigationPreferences {
  inventoryExpanded: boolean;
  quotingExpanded: boolean;
}

const DEFAULT_PREFERENCES: NavigationPreferences = {
  inventoryExpanded: true,
  quotingExpanded: true,
};

export function useLocalNavigationPreferences() {
  const [preferences, setPreferences] = useState<NavigationPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NavigationPreferences;
        setPreferences(parsed);
      }
    } catch (error) {
      console.error("Failed to load navigation preferences:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const updatePreferences = useCallback((updates: Partial<NavigationPreferences>) => {
    setPreferences((current) => {
      const newPreferences = { ...current, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      } catch (error) {
        console.error("Failed to save navigation preferences:", error);
      }
      return newPreferences;
    });
  }, []);

  const setInventoryExpanded = useCallback((expanded: boolean) => {
    updatePreferences({ inventoryExpanded: expanded });
  }, [updatePreferences]);

  const setQuotingExpanded = useCallback((expanded: boolean) => {
    updatePreferences({ quotingExpanded: expanded });
  }, [updatePreferences]);

  return {
    inventoryExpanded: preferences.inventoryExpanded,
    setInventoryExpanded,
    quotingExpanded: preferences.quotingExpanded,
    setQuotingExpanded,
    isLoaded,
  };
}