import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import { getTemplateById } from "@/app/lib/services/category-template.service";
import { createMockCategoryTemplateWithStructure } from "@/app/test-utils/types";
import { getCurrentOrgId } from "@/app/utils/roles";

import { GET } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/category-template.service");
vi.mock("@/app/utils/roles");

describe("Category Templates [id] API Route", () => {
  describe("GET /api/category-templates/[id]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = new Request("http://localhost:3000/api/category-templates/template_123");
      const response = await GET(request, { params: { id: "template_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/category-templates/template_123");
      const response = await GET(request, { params: { id: "template_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return 404 when template is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getTemplateById).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/category-templates/template_123");
      const response = await GET(request, { params: { id: "template_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Template not found" });
    });

    it("should return template successfully", async () => {
      const mockTemplate = createMockCategoryTemplateWithStructure({
        id: "template_123",
        name: "Electronics Template",
        categories: [
          { name: "Laptops", subcategories: [], features: [] },
          { name: "Phones", subcategories: [], features: [] },
        ],
        features: [
          { name: "Brand", data_type: "string", is_required: true },
          { name: "Model", data_type: "string", is_required: true },
        ],
      });

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);

      const request = new Request("http://localhost:3000/api/category-templates/template_123");
      const response = await GET(request, { params: { id: "template_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ template: mockTemplate });
      expect(getTemplateById).toHaveBeenCalledWith("template_123");
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getTemplateById).mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost:3000/api/category-templates/template_123");
      const response = await GET(request, { params: { id: "template_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch template" });
    });
  });
});