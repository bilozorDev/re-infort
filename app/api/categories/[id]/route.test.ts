import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthenticatedMock, createUnauthenticatedMock } from "@/app/test-utils/clerk-mocks";

import {
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/app/lib/services/category.service";
import { createClient } from "@/app/lib/supabase/server";
import { createMockCategory, type MockAuthObject } from "@/app/test-utils/types";

import { DELETE, GET, PATCH } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/category.service");
vi.mock("@/app/lib/supabase/server");

const createRequest = (method: string, body?: unknown, url?: string): NextRequest => {
  const requestUrl = url || "http://localhost:3000/api/categories/cat_123";
  const init = { 
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(requestUrl, init);
};

const createMockSupabaseClient = () => {
  const client = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  
  // Make eq chainable and return final result
  client.eq = vi.fn().mockImplementation(() => client);
  
  return client;
};

describe("Categories [id] API Route", () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    // @ts-expect-error - Mocking Supabase client
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient);
  });

  describe("GET /api/categories/[id]", () => {
    it("should return 401 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return 404 when category is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(getCategoryById).mockResolvedValue(null);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Category not found" });
    });

    it("should return category with counts successfully", async () => {
      const mockCategory = createMockCategory({
        id: "cat_123",
        name: "Electronics",
        organization_clerk_id: "org_123",
      });

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(getCategoryById).mockResolvedValue(mockCategory);
      
      // Mock supabase counts - chain returns { count: number }
      let callCount = 0;
      mockSupabaseClient.eq.mockImplementation(() => {
        callCount++;
        if (callCount === 2) return { count: 5 }; // subcategories after 2 eq calls
        if (callCount === 4) return { count: 10 }; // products after 4 eq calls
        return mockSupabaseClient;
      });

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        ...mockCategory,
        subcategory_count: 5,
        product_count: 10,
      });
      expect(getCategoryById).toHaveBeenCalledWith("cat_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(getCategoryById).mockRejectedValue(new Error("Database error"));

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("PATCH /api/categories/[id]", () => {
    const updateData = { name: "Updated Electronics" };

    it("should return 401 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should update category successfully", async () => {
      const mockUpdatedCategory = createMockCategory({
        id: "cat_123",
        name: "Updated Electronics",
        organization_clerk_id: "org_123",
      });

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(updateCategory).mockResolvedValue(mockUpdatedCategory);

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdatedCategory);
    });

    it("should handle admin error with 403", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(updateCategory).mockRejectedValue(
        new Error("Only administrators can update categories")
      );

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can update categories" });
    });

    it("should handle duplicate name error with 409", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(updateCategory).mockRejectedValue(
        new Error("Category with this name already exists")
      );

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toEqual({ error: "Category with this name already exists" });
    });

    it("should handle generic errors with 400", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(updateCategory).mockRejectedValue(new Error("Validation error"));

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Validation error" });
    });
  });

  describe("DELETE /api/categories/[id]", () => {
    it("should return 401 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 409 when category has dependencies", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      
      // Mock supabase counts showing dependencies
      let callCount = 0;
      mockSupabaseClient.eq.mockImplementation(() => {
        callCount++;
        if (callCount === 2) return { count: 3 }; // subcategories after 2 eq calls
        if (callCount === 4) return { count: 5 }; // products after 4 eq calls
        return mockSupabaseClient;
      });

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe("Category has dependencies");
      expect(data.subcategory_count).toBe(3);
      expect(data.product_count).toBe(5);
    });

    it("should delete category successfully when no dependencies", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(deleteCategory).mockResolvedValue(undefined);
      
      // Mock supabase counts showing no dependencies
      let callCount = 0;
      mockSupabaseClient.eq.mockImplementation(() => {
        callCount++;
        if (callCount === 2) return { count: 0 }; // subcategories
        if (callCount === 4) return { count: 0 }; // products
        return mockSupabaseClient;
      });

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(deleteCategory).toHaveBeenCalledWith("cat_123", "org_123", false);
    });

    it("should force delete when force=true", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      vi.mocked(deleteCategory).mockResolvedValue(undefined);

      const request = createRequest("DELETE", null, "http://localhost:3000/api/categories/cat_123?force=true");
      const response = await DELETE(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(deleteCategory).toHaveBeenCalledWith("cat_123", "org_123", true);
    });

    it("should handle admin error with 403", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      
      // Mock no dependencies
      let callCount = 0;
      mockSupabaseClient.eq.mockImplementation(() => {
        callCount++;
        if (callCount === 2) return { count: 0 }; // subcategories
        if (callCount === 4) return { count: 0 }; // products
        return mockSupabaseClient;
      });
      
      vi.mocked(deleteCategory).mockRejectedValue(
        new Error("Only administrators can delete categories")
      );

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can delete categories" });
    });

    it("should handle generic errors with 400", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock('user_123', 'org_123'));
      
      // Mock no dependencies
      let callCount = 0;
      mockSupabaseClient.eq.mockImplementation(() => {
        callCount++;
        if (callCount === 2) return { count: 0 }; // subcategories
        if (callCount === 4) return { count: 0 }; // products
        return mockSupabaseClient;
      });
      
      vi.mocked(deleteCategory).mockRejectedValue(new Error("Database error"));

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "cat_123" } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});