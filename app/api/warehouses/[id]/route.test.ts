import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import {
  deleteWarehouse,
  getWarehouseById,
  updateWarehouse,
} from "@/app/lib/services/warehouse.service";
import { createAuthenticatedMock, createUnauthenticatedMock } from "@/app/test-utils/clerk-mocks";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { DELETE, GET, PUT } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/warehouse.service");
vi.mock("@/app/utils/roles");

const createRequest = (method: string, body?: unknown): Request => {
  const url = "http://localhost:3000/api/warehouses/wh_123";
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { "Content-Type": "application/json" };
  }
  return new Request(url, init);
};

describe("Warehouses [id] API Route", () => {
  describe("GET /api/warehouses/[id]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return warehouse successfully", async () => {
      const mockWarehouse = {
        id: "wh_123",
        name: "Main Warehouse",
        address: "123 Main St",
        city: "New York",
        state_province: "NY",
        postal_code: "10001",
        country: "US",
        phone: null,
        email: null,
        type: "office" as const,
        status: "active" as const,
        capacity: 10000,
        is_default: false,
        notes: null,
        organization_clerk_id: "org_123",
        created_by_clerk_user_id: "user_123",
        created_by_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getWarehouseById).mockResolvedValue(mockWarehouse);

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockWarehouse);
      expect(getWarehouseById).toHaveBeenCalledWith("wh_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getWarehouseById).mockRejectedValue(new Error("Database error"));

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch warehouse" });
    });
  });

  describe("PUT /api/warehouses/[id]", () => {
    const updateData = { name: "Updated Warehouse", city: "New York" };

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can update warehouses" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should update warehouse successfully", async () => {
      const mockUpdated = {
        id: "wh_123",
        name: "Updated Warehouse",
        address: "123 Updated St",
        city: "New York",
        state_province: "NY",
        postal_code: "10001",
        country: "US",
        phone: null,
        email: null,
        type: "office" as const,
        status: "active" as const,
        capacity: 15000,
        is_default: false,
        notes: null,
        organization_clerk_id: "org_123",
        created_by_clerk_user_id: "user_123",
        created_by_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateWarehouse).mockResolvedValue(mockUpdated);

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdated);
      expect(updateWarehouse).toHaveBeenCalledWith(
        "wh_123",
        {
          name: "Updated Warehouse",
          city: "New York",
          status: "active",
          is_default: false,
        },
        "org_123"
      );
    });

    it("should handle duplicate name error", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateWarehouse).mockRejectedValue(
        new Error("Warehouse with this name already exists")
      );

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Warehouse with this name already exists" });
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateWarehouse).mockRejectedValue(new Error("Database error"));

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("DELETE /api/warehouses/[id]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can delete warehouses" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should delete warehouse successfully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(deleteWarehouse).mockResolvedValue(undefined);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(deleteWarehouse).toHaveBeenCalledWith("wh_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(deleteWarehouse).mockRejectedValue(new Error("Database error"));

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "wh_123" }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to delete warehouse" });
    });
  });
});
