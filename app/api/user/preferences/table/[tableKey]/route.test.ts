import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import { 
  getDefaultTablePreferences, 
  resetTablePreferences,
  updateTablePreferences} from "@/app/lib/services/user-preferences.service";
import { isAdmin } from "@/app/utils/roles";

import { DELETE, GET,PATCH } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/user-preferences.service");
vi.mock("@/app/utils/roles");

describe("User Table Preferences API Route", () => {
  describe("PATCH /api/user/preferences/table/[tableKey]", () => {
    const tablePreferences = {
      columnVisibility: { name: true, sku: true, price: false },
      columnSizes: { name: 200, sku: 150 },
      sorting: [{ id: "name", desc: false }],
    };

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "PATCH",
          body: JSON.stringify(tablePreferences),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should update table preferences successfully", async () => {
      const mockUpdatedPreferences = {
        id: "pref_123",
        user_clerk_id: "user_123",
        products_table: tablePreferences,
      };

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(updateTablePreferences).mockResolvedValue(mockUpdatedPreferences);

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "PATCH",
          body: JSON.stringify(tablePreferences),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdatedPreferences);
      expect(updateTablePreferences).toHaveBeenCalledWith(
        "user_123",
        "products",
        tablePreferences
      );
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(updateTablePreferences).mockRejectedValue(new Error("Database error"));

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "PATCH",
          body: JSON.stringify(tablePreferences),
          headers: { "Content-Type": "application/json" },
        }
      );

      const response = await PATCH(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to update table preferences" });
    });
  });

  describe("DELETE /api/user/preferences/table/[tableKey]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should reset table preferences successfully", async () => {
      const mockResetPreferences = {
        id: "pref_123",
        user_clerk_id: "user_123",
        products_table: null,
      };

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(resetTablePreferences).mockResolvedValue(mockResetPreferences);

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockResetPreferences);
      expect(resetTablePreferences).toHaveBeenCalledWith("user_123", "products");
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(resetTablePreferences).mockRejectedValue(new Error("Database error"));

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to reset table preferences" });
    });
  });

  describe("GET /api/user/preferences/table/[tableKey]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "GET",
        }
      );

      const response = await GET(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return default preferences for regular users", async () => {
      const mockDefaults = {
        columnVisibility: { name: true, sku: true },
        columnSizes: {},
      };

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(false);
      vi.mocked(getDefaultTablePreferences).mockReturnValue(mockDefaults);

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "GET",
        }
      );

      const response = await GET(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockDefaults);
      expect(getDefaultTablePreferences).toHaveBeenCalledWith("products", false);
    });

    it("should return admin defaults for admin users", async () => {
      const mockDefaults = {
        columnVisibility: { name: true, sku: true, createdAt: true },
        columnSizes: {},
      };

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getDefaultTablePreferences).mockReturnValue(mockDefaults);

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "GET",
        }
      );

      const response = await GET(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockDefaults);
      expect(getDefaultTablePreferences).toHaveBeenCalledWith("products", true);
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockRejectedValue(new Error("Auth error"));

      const request = new Request(
        "http://localhost:3000/api/user/preferences/table/products",
        {
          method: "GET",
        }
      );

      const response = await GET(request, { params: { tableKey: "products" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch default preferences" });
    });
  });
});