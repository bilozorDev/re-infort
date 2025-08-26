import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach,describe, expect, it, vi } from "vitest";

import {
  deleteSubcategory,
  getSubcategoryById,
  updateSubcategory,
} from "@/app/lib/services/category.service";
import { createClient } from "@/app/lib/supabase/server";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import { createMockSubcategory } from "@/app/test-utils/types";

import { DELETE,GET, PATCH } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/category.service");
vi.mock("@/app/lib/supabase/server");

const createRequest = (method: string, body?: unknown, url?: string): NextRequest => {
  const requestUrl = url || "http://localhost:3000/api/subcategories/sub_123";
  const init = { 
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };
  return new NextRequest(requestUrl, init);
};

interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
}

const createMockSupabaseClient = (): MockSupabaseClient => {
  const client: MockSupabaseClient = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };
  
  // Make eq chainable and return final result
  client.eq = vi.fn().mockImplementation(() => client);
  
  return client;
};

describe("Subcategories [id] API Route", () => {
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseClient>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    // Type assertion needed due to partial mock implementation
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as unknown as Awaited<ReturnType<typeof createClient>>);
  });

  describe("GET /api/subcategories/[id]", () => {
    it("should return 401 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return 404 when subcategory is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getSubcategoryById).mockResolvedValue(null);

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Subcategory not found" });
    });

    it("should return subcategory with product count successfully", async () => {
      const mockSubcategory = createMockSubcategory({
        id: "sub_123",
        name: "Laptops",
        category_id: "cat_123",
        organization_clerk_id: "org_123",
      });

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getSubcategoryById).mockResolvedValue(mockSubcategory);
      
      // Mock product count
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient)
                         .mockReturnValueOnce({ count: 5 }); // products

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({
        ...mockSubcategory,
        product_count: 5,
      });
      expect(getSubcategoryById).toHaveBeenCalledWith("sub_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getSubcategoryById).mockRejectedValue(new Error("Database error"));

      const request = createRequest("GET");
      const response = await GET(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("PATCH /api/subcategories/[id]", () => {
    const updateData = { name: "Gaming Laptops" };

    it("should return 401 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should update subcategory successfully", async () => {
      const mockUpdated = createMockSubcategory({
        id: "sub_123",
        name: "Gaming Laptops",
        category_id: "cat_123",
        organization_clerk_id: "org_123",
      });

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(updateSubcategory).mockResolvedValue(mockUpdated);

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdated);
    });

    it("should handle admin error with 403", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(updateSubcategory).mockRejectedValue(
        new Error("Only administrators can update subcategories")
      );

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can update subcategories" });
    });

    it("should handle duplicate name error with 409", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(updateSubcategory).mockRejectedValue(
        new Error("Subcategory with this name already exists")
      );

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toEqual({ error: "Subcategory with this name already exists" });
    });

    it("should handle generic errors with 400", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(updateSubcategory).mockRejectedValue(new Error("Validation error"));

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Validation error" });
    });
  });

  describe("DELETE /api/subcategories/[id]", () => {
    it("should return 401 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 409 when subcategory has products", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      
      // Mock product count
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient)
                         .mockReturnValueOnce({ count: 5 }); // products

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toBe("Subcategory has products");
      expect(data.product_count).toBe(5);
    });

    it("should delete subcategory successfully when no products", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(deleteSubcategory).mockResolvedValue(undefined);
      
      // Mock no products
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient)
                         .mockReturnValueOnce({ count: 0 }); // products

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(deleteSubcategory).toHaveBeenCalledWith("sub_123", "org_123", false);
    });

    it("should force delete when force=true", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(deleteSubcategory).mockResolvedValue(undefined);

      const request = createRequest("DELETE", null, "http://localhost:3000/api/subcategories/sub_123?force=true");
      const response = await DELETE(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(deleteSubcategory).toHaveBeenCalledWith("sub_123", "org_123", true);
    });

    it("should handle admin error with 403", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      
      // Mock no products
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient)
                         .mockReturnValueOnce({ count: 0 });
      
      vi.mocked(deleteSubcategory).mockRejectedValue(
        new Error("Only administrators can delete subcategories")
      );

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can delete subcategories" });
    });

    it("should handle generic errors with 400", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      
      // Mock no products
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient)
                         .mockReturnValueOnce({ count: 0 });
      
      vi.mocked(deleteSubcategory).mockRejectedValue(new Error("Database error"));

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: Promise.resolve({ id: "sub_123" }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});