import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { createProduct, getAllProducts } from "@/app/lib/services/product.service";
import type { MockAuthObject } from "@/app/test-utils/types";
import type { Product } from "@/app/types/product";
import { getCurrentOrgId } from "@/app/utils/roles";

import { GET, POST } from "../route";

// Automatically use manual mocks
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/services/product.service");

describe("Products API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/products", () => {
    it("should return 401 when organization is not found", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return products successfully", async () => {
      const mockProducts = [
        { id: "1", name: "Product 1", sku: "SKU001" },
        { id: "2", name: "Product 2", sku: "SKU002" },
      ];

      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getAllProducts).mockResolvedValue(mockProducts as Product[]);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockProducts);
      expect(getAllProducts).toHaveBeenCalledWith("org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getAllProducts).mockRejectedValue(new Error("Database error"));

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("POST /api/products", () => {
    const validProductData = {
      name: "New Product",
      sku: "SKU123",
      category_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      subcategory_id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      description: "Product description",
      cost: 50.00,
      price: 99.99,
      link: "https://example.com/product",
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated or org not found", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createPostRequest(validProductData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should create product successfully", async () => {
      const mockCreatedProduct = {
        id: "prod_123",
        ...validProductData,
        organization_clerk_id: "org_123",
        created_by_clerk_user_id: "user_123",
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createProduct).mockResolvedValue(mockCreatedProduct as Product);

      const request = createPostRequest(validProductData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCreatedProduct);
    });

    it("should handle service errors during creation", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as any);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createProduct).mockRejectedValue(new Error("Database error"));

      const request = createPostRequest(validProductData);
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});