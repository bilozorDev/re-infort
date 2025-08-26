import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach,describe, expect, it, vi } from "vitest";

import {
  getUserPreferences,
  upsertUserPreferences,
} from "@/app/lib/services/user-preferences.service";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import type { UserPreferences } from "@/app/types/user-preferences";

import { GET, PATCH } from "../route";

// Automatically use manual mocks
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/services/user-preferences.service");

describe("User Preferences API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/user/preferences", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const response = await GET();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return empty preferences when none exist", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getUserPreferences).mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        table_preferences: {},
        ui_preferences: {},
        feature_settings: {}
      });
    });

    it("should return user preferences successfully", async () => {
      const mockPreferences: UserPreferences = {
        id: "pref_123",
        clerk_user_id: "user_123",
        organization_clerk_id: "org_123",
        navigation_state: null,
        table_preferences: { products: { pageSize: 25 } },
        ui_preferences: { theme: "dark" },
        feature_settings: { notifications: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getUserPreferences).mockResolvedValue(mockPreferences);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockPreferences);
      expect(getUserPreferences).toHaveBeenCalledWith("user_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getUserPreferences).mockRejectedValue(new Error("Database error"));

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch preferences" });
    });
  });

  describe("PATCH /api/user/preferences", () => {
    const validPreferencesData: UserPreferences = {
      theme: "dark" as const,
      notifications_enabled: false,
      language: "fr",
    };

    function createPatchRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createPatchRequest(validPreferencesData);
      const response = await PATCH(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should update preferences successfully", async () => {
      const mockUpdatedPreferences: UserPreferences = {
        id: "pref_123",
        clerk_user_id: "user_123",
        organization_clerk_id: "org_123",
        navigation_state: null,
        table_preferences: {},
        ui_preferences: validPreferencesData,
        feature_settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(upsertUserPreferences).mockResolvedValue(mockUpdatedPreferences);

      const request = createPatchRequest(validPreferencesData);
      const response = await PATCH(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdatedPreferences);
      expect(upsertUserPreferences).toHaveBeenCalledWith(
        "user_123",
        "org_123",
        validPreferencesData
      );
    });

    it("should handle service errors during update", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(upsertUserPreferences).mockRejectedValue(new Error("Database error"));

      const request = createPatchRequest(validPreferencesData);
      const response = await PATCH(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to update preferences" });
    });
  });
});