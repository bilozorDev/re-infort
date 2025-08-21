import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import {
  deleteFeatureDefinition,
  getFeatureDefinitionById,
  updateFeatureDefinition,
} from "@/app/lib/services/feature-definition.service";
import { createMockFeatureDefinition } from "@/app/test-utils/types";
import type { FeatureDefinition } from "@/app/types/features";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { DELETE,GET, PUT } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/feature-definition.service");
vi.mock("@/app/utils/roles");

const createRequest = (method: string, body?: unknown): NextRequest => {
  const url = "http://localhost:3000/api/feature-definitions/def_123";
  const init = { 
    method, 
    headers: body ? { "Content-Type": "application/json" } : undefined, 
    body: body ? JSON.stringify(body) : undefined 
  };
  return new NextRequest(url, init);
};

describe("Feature Definitions [id] API Route", () => {
  describe("GET /api/feature-definitions/[id]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "def_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "def_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return feature definition successfully", async () => {
      const mockDefinition = createMockFeatureDefinition({
        id: "def_123",
        name: "Color",
        data_type: "text",
        is_required: false,
        display_order: 1,
        organization_clerk_id: "org_123",
      });

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getFeatureDefinitionById).mockResolvedValue(mockDefinition as FeatureDefinition);

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "def_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockDefinition);
      expect(getFeatureDefinitionById).toHaveBeenCalledWith("def_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getFeatureDefinitionById).mockRejectedValue(new Error("Database error"));

      const request = createRequest("GET");
      const response = await GET(request, { params: { id: "def_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("PUT /api/feature-definitions/[id]", () => {
    const updateData = { name: "Updated Color", display_order: 2 };

    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: { id: "def_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: { id: "def_123" } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can update feature definitions" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: { id: "def_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should update feature definition successfully", async () => {
      const mockUpdated = createMockFeatureDefinition({
        id: "def_123",
        name: "Updated Color",
        display_order: 2,
        organization_clerk_id: "org_123",
      });

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateFeatureDefinition).mockResolvedValue(mockUpdated as FeatureDefinition);

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: { id: "def_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUpdated);
      expect(updateFeatureDefinition).toHaveBeenCalledWith("def_123", updateData, "org_123");
    });


    it("should handle duplicate name error", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateFeatureDefinition).mockRejectedValue(
        new Error("Feature definition with this name already exists")
      );

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: { id: "def_123" } });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data).toEqual({ error: "Feature definition with this name already exists" });
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(updateFeatureDefinition).mockRejectedValue(new Error("Database error"));

      const request = createRequest("PUT", updateData);
      const response = await PUT(request, { params: { id: "def_123" } });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });

  describe("DELETE /api/feature-definitions/[id]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "def_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "def_123" } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can delete feature definitions" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "def_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should delete feature definition successfully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(deleteFeatureDefinition).mockResolvedValue(undefined);

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "def_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(deleteFeatureDefinition).toHaveBeenCalledWith("def_123", "org_123");
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(deleteFeatureDefinition).mockRejectedValue(new Error("Database error"));

      const request = createRequest("DELETE");
      const response = await DELETE(request, { params: { id: "def_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Database error" });
    });
  });
});