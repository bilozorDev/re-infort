import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  getProductFeatures,
  upsertProductFeatures,
} from "@/app/lib/services/product-features.service";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import type { ProductFeature } from "@/app/types/features";
import { getCurrentOrgId } from "@/app/utils/roles";

import { GET, POST } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/product-features.service");
vi.mock("@/app/utils/roles");

const createRequest = (method: string, body?: unknown): NextRequest => {
  const url = "http://localhost:3000/api/products/prod_123/features";
  const init = { 
    method, 
    headers: body ? { "Content-Type": "application/json" } : undefined, 
    body: body ? JSON.stringify(body) : undefined 
  };
  return new NextRequest(url, init);
};

describe("Product Features API Route", () => {
  describe("GET /api/products/[id]/features", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return product features successfully", async () => {
      const mockFeatures = [
        {
          id: "feat_1",
          product_id: "prod_123",
          feature_definition_id: "def_1",
          value: "Red",
        },
        {
          id: "feat_2",
          product_id: "prod_123",
          feature_definition_id: "def_2",
          value: "Large",
        },
      ];

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getProductFeatures).mockResolvedValue(mockFeatures as ProductFeature[]);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockFeatures);
      expect(getProductFeatures).toHaveBeenCalledWith("prod_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getProductFeatures).mockRejectedValue(new Error("Database error"));

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("POST /api/products/[id]/features", () => {
    const featuresData = {
      features: [
        { feature_definition_id: "def_1", value: "Blue" },
        { feature_definition_id: "def_2", value: "Medium" },
      ],
    };

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = createRequest("POST", featuresData);
      const response = await POST(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });


    it("should return 404 when organization is not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("POST", featuresData);
      const response = await POST(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should handle empty features array", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(upsertProductFeatures).mockResolvedValue([]);

      const request = createRequest("POST", {});
      const response = await POST(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual([]);
      expect(upsertProductFeatures).toHaveBeenCalledWith("prod_123", [], "org_123");
    });

    it("should update product features successfully", async () => {
      const mockUpdatedFeatures = [
        {
          id: "feat_1",
          product_id: "prod_123",
          feature_definition_id: "def_1",
          value: "Blue",
        },
        {
          id: "feat_2",
          product_id: "prod_123",
          feature_definition_id: "def_2",
          value: "Medium",
        },
      ];

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(upsertProductFeatures).mockResolvedValue(mockUpdatedFeatures as ProductFeature[]);

      const request = createRequest("POST", featuresData);
      const response = await POST(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdatedFeatures);
      expect(upsertProductFeatures).toHaveBeenCalledWith(
        "prod_123",
        featuresData.features,
        "org_123"
      );
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(upsertProductFeatures).mockRejectedValue(new Error("Database error"));

      const request = createRequest("POST", featuresData);
      const response = await POST(request, { params: { id: "prod_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});