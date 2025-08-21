import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/app/lib/services/product.service";
import { createMockProduct } from "@/app/test-utils/types";
import type { ProductWithCategory } from "@/app/types/product";
import { getCurrentOrgId } from "@/app/utils/roles";

import { DELETE,GET, PATCH } from "./route";

vi.mock("@/app/lib/services/product.service");
vi.mock("@/app/utils/roles");

const createRequest = (method: string, body?: unknown): NextRequest => {
  const url = "http://localhost:3000/api/products/prod_123";
  const init = { 
    method, 
    headers: body ? { "Content-Type": "application/json" } : undefined, 
    body: body ? JSON.stringify(body) : undefined 
  };
  return new NextRequest(url, init);
};

describe("Products [id] API Route", () => {
  describe("GET /api/products/[id]", () => {
    it("should return 401 when organization is not found", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return 404 when product is not found", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getProductById).mockResolvedValue(null);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Product not found" });
    });

    it("should return product successfully", async () => {
      const mockProduct = createMockProduct({
        id: "prod_123",
        name: "Laptop",
        sku: "LAP-001",
        category_id: "cat_123",
        subcategory_id: "sub_123",
        organization_clerk_id: "org_123",
      });

      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getProductById).mockResolvedValue(mockProduct as ProductWithCategory);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockProduct);
      expect(getProductById).toHaveBeenCalledWith("prod_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getProductById).mockRejectedValue(new Error("Database error"));

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("PATCH /api/products/[id]", () => {
    const updateData = { name: "Updated Laptop", sku: "LAP-002" };

    it("should return 401 when organization is not found", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should update product successfully", async () => {
      const mockUpdated = createMockProduct({
        id: "prod_123",
        name: "Updated Laptop",
        sku: "LAP-002",
        organization_clerk_id: "org_123",
      });

      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateProduct).mockResolvedValue(mockUpdated as ProductWithCategory);

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdated);
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateProduct).mockRejectedValue(new Error("Database error"));

      const request = createRequest("PATCH", updateData);
      const response = await PATCH(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("DELETE /api/products/[id]", () => {
    it("should return 401 when organization is not found", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should delete product successfully", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(deleteProduct).mockResolvedValue(undefined);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(deleteProduct).toHaveBeenCalledWith("prod_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(deleteProduct).mockRejectedValue(new Error("Database error"));

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});