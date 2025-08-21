import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach,describe, expect, it, vi } from "vitest";

import {
  createSubcategory,
  getSubcategoriesByCategory,
} from "@/app/lib/services/category.service";
import type { Subcategory } from "@/app/types/product";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { GET, POST } from "../route";

// Automatically use manual mocks
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/services/category.service");

describe("Subcategories API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/subcategories", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = new NextRequest("http://localhost:3000/api/subcategories?categoryId=cat_123");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/subcategories?categoryId=cat_123");
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return 400 when categoryId is not provided", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");

      const request = new NextRequest("http://localhost:3000/api/subcategories");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Category ID is required" });
    });

    it("should return subcategories for given categoryId", async () => {
      const mockSubcategories = [
        { id: "sub1", name: "Subcategory 1", category_id: "cat_123" },
        { id: "sub2", name: "Subcategory 2", category_id: "cat_123" },
      ];

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getSubcategoriesByCategory).mockResolvedValue(mockSubcategories as Subcategory[]);

      const request = new NextRequest("http://localhost:3000/api/subcategories?categoryId=cat_123");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockSubcategories);
      expect(getSubcategoriesByCategory).toHaveBeenCalledWith("cat_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getSubcategoriesByCategory).mockRejectedValue(
        new Error("Database error")
      );

      const request = new NextRequest("http://localhost:3000/api/subcategories?categoryId=cat_123");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("POST /api/subcategories", () => {
    const validSubcategoryData = {
      name: "New Subcategory",
      category_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      description: "Subcategory description",
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/subcategories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = createPostRequest(validSubcategoryData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createPostRequest(validSubcategoryData);
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({
        error: "Only administrators can create subcategories",
      });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createPostRequest(validSubcategoryData);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should create subcategory successfully when user is admin", async () => {
      const mockCreatedSubcategory = {
        id: "sub_123",
        ...validSubcategoryData,
        organization_clerk_id: "org_123",
        created_by_clerk_user_id: "user_123",
        status: "active",
        position: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createSubcategory).mockResolvedValue(mockCreatedSubcategory as Subcategory);

      const request = createPostRequest(validSubcategoryData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCreatedSubcategory);
    });

    it("should handle service errors during creation", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createSubcategory).mockRejectedValue(new Error("Database error"));

      const request = createPostRequest(validSubcategoryData);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});