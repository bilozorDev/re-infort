import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { createWarehouse, getAllWarehouses } from "@/app/lib/services/warehouse.service";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import type { Warehouse } from "@/app/types/warehouse";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { GET, POST } from "../route";

// Automatically use manual mocks
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/services/warehouse.service");

describe("Warehouses API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/warehouses", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = new NextRequest("http://localhost:3000/api/warehouses");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/warehouses");
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return warehouses successfully", async () => {
      const mockWarehouses = [
        {
          id: "w1",
          name: "Main Warehouse",
          type: "office",
          address: "123 Main St",
          city: "Test City",
          state_province: "TS",
          postal_code: "12345",
          country: "US",
          status: "active",
        },
        {
          id: "w2",
          name: "Secondary Warehouse",
          type: "vehicle",
          address: "456 Second Ave",
          city: "Test City",
          state_province: "TS",
          postal_code: "12346",
          country: "US",
          status: "active",
        },
      ];

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getAllWarehouses).mockResolvedValue(mockWarehouses as Warehouse[]);

      const request = new NextRequest("http://localhost:3000/api/warehouses");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockWarehouses);
      expect(getAllWarehouses).toHaveBeenCalledWith("org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getAllWarehouses).mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/warehouses");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch warehouses" });
    });
  });

  describe("POST /api/warehouses", () => {
    const validWarehouseData = {
      name: "New Warehouse",
      type: "office",
      address: "789 New St",
      city: "New City",
      state_province: "NC",
      postal_code: "54321",
      country: "US",
      contact_phone: "+1234567890",
      contact_email: "warehouse@example.com",
      notes: "Test warehouse",
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/warehouses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createPostRequest(validWarehouseData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createPostRequest(validWarehouseData);
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({
        error: "Only administrators can create warehouses",
      });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createPostRequest(validWarehouseData);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should create warehouse successfully when user is admin", async () => {
      const mockCreatedWarehouse = {
        id: "w_123",
        ...validWarehouseData,
        organization_clerk_id: "org_123",
        created_by_clerk_user_id: "user_123",
        status: "active",
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createWarehouse).mockResolvedValue(mockCreatedWarehouse as Warehouse);

      const request = createPostRequest(validWarehouseData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCreatedWarehouse);
      expect(createWarehouse).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Warehouse",
          type: "office",
          address: "789 New St",
          city: "New City",
          state_province: "NC",
          postal_code: "54321",
          country: "US",
        }),
        "org_123",
        "user_123"
      );
    });

    it("should return 400 for invalid warehouse data", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");

      const invalidData = {
        name: "", // Invalid: empty name
        type: "invalid_type", // Invalid type
      };

      const request = createPostRequest(invalidData);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error).toBe("Invalid input");
      expect(data.details).toBeDefined();
    });

    it("should handle duplicate warehouse name error", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      
      const error = new Error("Warehouse with this name already exists");
      vi.mocked(createWarehouse).mockRejectedValue(error);

      const request = createPostRequest(validWarehouseData);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain("Warehouse with this name already exists");
    });

    it("should handle service errors during creation", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createWarehouse).mockRejectedValue(new Error("Database error"));

      const request = createPostRequest(validWarehouseData);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toContain("Database error");
    });
  });
});