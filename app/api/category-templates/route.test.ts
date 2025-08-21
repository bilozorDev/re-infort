import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import { getTemplates } from "@/app/lib/services/category-template.service";
import { createMockCategoryTemplate } from "@/app/test-utils/types";
import { getCurrentOrgId } from "@/app/utils/roles";

import { GET } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/category-template.service");
vi.mock("@/app/utils/roles");

describe("Category Templates API Route", () => {
  describe("GET /api/category-templates", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const response = await GET();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const response = await GET();

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should return templates successfully", async () => {
      const mockTemplates = [
        createMockCategoryTemplate({
          id: "template_1",
          name: "Electronics Template",
        }),
        createMockCategoryTemplate({
          id: "template_2",
          name: "Furniture Template",
        }),
      ];

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      // @ts-expect-error - Mock templates may not have all fields
      vi.mocked(getTemplates).mockResolvedValue(mockTemplates);

      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ templates: mockTemplates, totalCount: 2 });
      expect(getTemplates).toHaveBeenCalled();
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(getTemplates).mockRejectedValue(new Error("Database error"));

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch templates" });
    });
  });
});