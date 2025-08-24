import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "@/app/lib/supabase/server";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import { getCurrentOrgId } from "@/app/utils/roles";
import { mockProducts } from "@/test/fixtures/products";
import { mockServices } from "@/test/fixtures/quotes";

import { GET } from "../route";

// Mock dependencies
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/supabase/server");

describe("Search API Route", () => {
  const mockSupabase: any = {
    from: vi.fn(() => mockSupabase),
    select: vi.fn(() => mockSupabase),
    eq: vi.fn(() => mockSupabase),
    or: vi.fn(() => mockSupabase),
    ilike: vi.fn(() => mockSupabase),
    limit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe("GET /api/search", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = new NextRequest("http://localhost:3000/api/search?q=test");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/search?q=test");
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return 400 when query is missing", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");

      const request = new NextRequest("http://localhost:3000/api/search");
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Search query is required" });
    });

    it("should search all types by default", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      // Mock product search
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockProducts.slice(0, 2),
        error: null,
      });
      
      // Mock service search
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockServices.slice(0, 2),
        error: null,
      });
      
      // Mock inventory query
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/search?q=test");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.results).toHaveLength(4); // 2 products + 2 services
      expect(mockSupabase.from).toHaveBeenCalledWith("products");
      expect(mockSupabase.from).toHaveBeenCalledWith("services");
    });

    it("should search only products when type=product", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockProducts.slice(0, 2),
        error: null,
      });
      
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/search?q=test&type=product");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.results).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith("products");
      expect(mockSupabase.from).not.toHaveBeenCalledWith("services");
    });

    it("should search only services when type=service", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockServices.slice(0, 2),
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/search?q=test&type=service");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.results).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith("services");
      expect(mockSupabase.from).not.toHaveBeenCalledWith("products");
    });

    it("should limit results based on limit parameter", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockProducts.slice(0, 1),
        error: null,
      });
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockServices.slice(0, 1),
        error: null,
      });
      
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/search?q=test&limit=5");
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });

    it("should handle database errors for products", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: null,
        error: { message: "Product search failed" },
      });
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockServices,
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/search?q=test");
      const response = await GET(request);

      // Should still return successful response with services only
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.results).toHaveLength(mockServices.length);
    });

    it("should handle database errors for services", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: mockProducts,
        error: null,
      });
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: null,
        error: { message: "Service search failed" },
      });
      
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/search?q=test");
      const response = await GET(request);

      // Should still return successful response with products only
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.results.every((r: any) => r.type === "product")).toBe(true);
    });

    it("should format search results correctly", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock());
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_test123");
      
      const mockProduct = mockProducts[0];
      const mockService = mockServices[0];
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: [mockProduct],
        error: null,
      });
      
      mockSupabase.limit.mockResolvedValueOnce({
        data: [mockService],
        error: null,
      });
      
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/search?q=test");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Check product formatting
      const productResult = data.results.find((r: any) => r.type === "product");
      expect(productResult).toMatchObject({
        id: mockProduct.id,
        type: "product",
        name: mockProduct.name,
        sku: mockProduct.sku,
        price: mockProduct.price,
      });
      
      // Check service formatting
      const serviceResult = data.results.find((r: any) => r.type === "service");
      expect(serviceResult).toMatchObject({
        id: mockService.id,
        type: "service",
        name: mockService.name,
        rate: mockService.rate,
        rate_type: mockService.rate_type,
      });
    });
  });
});