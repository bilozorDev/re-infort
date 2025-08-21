import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createCategory,
  getActiveCategories,
  getAllCategories,
} from "@/app/lib/services/category.service";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import type { Category } from "@/app/types/product";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { GET, POST } from "../route";

// Automatically use manual mocks
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/services/category.service");

describe("Categories API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/categories", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return all categories when no filter is applied", async () => {
      const mockCategories = [
        { id: "1", name: "Category 1", status: "active" },
        { id: "2", name: "Category 2", status: "inactive" },
      ];

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getAllCategories).mockResolvedValue(mockCategories as Category[]);

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockCategories);
      expect(getAllCategories).toHaveBeenCalledWith("org_123");
    });

    it("should return only active categories when active=true", async () => {
      const mockActiveCategories = [
        { id: "1", name: "Category 1", status: "active" },
      ];

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getActiveCategories).mockResolvedValue(mockActiveCategories as Category[]);

      const request = new NextRequest("http://localhost:3000/api/categories?active=true");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockActiveCategories);
      expect(getActiveCategories).toHaveBeenCalledWith("org_123");
      expect(getAllCategories).not.toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getAllCategories).mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/categories");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("POST /api/categories", () => {
    const validCategoryData = {
      name: "New Category",
      description: "Category description",
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createPostRequest(validCategoryData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createPostRequest(validCategoryData);
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({
        error: "Only administrators can create categories",
      });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createPostRequest(validCategoryData);
      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should create category successfully when user is admin", async () => {
      const mockCreatedCategory = {
        id: "cat_123",
        ...validCategoryData,
        organization_clerk_id: "org_123",
        created_by_clerk_user_id: "user_123",
        status: "active",
        display_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createCategory).mockResolvedValue(mockCreatedCategory as Category);

      const request = createPostRequest(validCategoryData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCreatedCategory);
      expect(createCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "New Category",
          description: "Category description",
          status: "active",
          display_order: 0,
        }),
        "org_123",
        "user_123"
      );
    });

    it("should return 400 for invalid category data", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");

      const invalidData = { name: "" }; // Invalid: empty name

      const request = createPostRequest(invalidData);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      // The actual error is a Zod validation error
      expect(data.error).toBeDefined();
      expect(data.error).toContain("Category name is required");
    });

    it("should handle service errors during creation", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createCategory).mockRejectedValue(new Error("Database error"));

      const request = createPostRequest(validCategoryData);
      const response = await POST(request);

      // Error messages get caught and returned as 400 status
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});