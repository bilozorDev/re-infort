import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createFeatureDefinition,
  getFeatureDefinitions,
} from "@/app/lib/services/feature-definition.service";
import type { FeatureDefinition } from "@/app/types/features";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { GET, POST } from "../route";

// Automatically use manual mocks
vi.mock("@clerk/nextjs/server");
vi.mock("@/app/utils/roles");
vi.mock("@/app/lib/services/feature-definition.service");

describe("Feature Definitions API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/feature-definitions", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = new NextRequest("http://localhost:3000/api/feature-definitions");
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/feature-definitions");
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return feature definitions successfully", async () => {
      const mockDefinitions = [
        { id: "def1", name: "Color", type: "select", options: ["Red", "Blue"] },
        { id: "def2", name: "Size", type: "number" },
      ];

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getFeatureDefinitions).mockResolvedValue(mockDefinitions as FeatureDefinition[]);

      const request = new NextRequest("http://localhost:3000/api/feature-definitions?categoryId=cat_123&subcategoryId=sub_123");
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockDefinitions);
      expect(getFeatureDefinitions).toHaveBeenCalledWith("org_123", "cat_123", "sub_123");
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getFeatureDefinitions).mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost:3000/api/feature-definitions");
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("POST /api/feature-definitions", () => {
    const validFeatureData = {
      name: "Material",
      type: "select",
      category_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      subcategory_id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      options: ["Cotton", "Polyester", "Wool"],
      is_required: true,
    };

    function createPostRequest(body: Record<string, unknown>) {
      return new NextRequest("http://localhost:3000/api/feature-definitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = createPostRequest(validFeatureData);
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createPostRequest(validFeatureData);
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({
        error: "Only administrators can create feature definitions",
      });
    });

    it("should create feature definition successfully when user is admin", async () => {
      const mockCreatedDefinition = {
        id: "def_123",
        ...validFeatureData,
        organization_clerk_id: "org_123",
        created_by_clerk_user_id: "user_123",
      };

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createFeatureDefinition).mockResolvedValue(mockCreatedDefinition as FeatureDefinition);

      const request = createPostRequest(validFeatureData);
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(mockCreatedDefinition);
    });

    it("should handle service errors during creation", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(createFeatureDefinition).mockRejectedValue(new Error("Database error"));

      const request = createPostRequest(validFeatureData);
      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});