import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import { importTemplate } from "@/app/lib/services/category-template.service";
import { getCurrentOrgId, isAdmin } from "@/app/utils/roles";

import { POST } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/category-template.service");
vi.mock("@/app/utils/roles");

describe("Category Template Import API Route", () => {
  describe("POST /api/category-templates/[id]/import", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null, sessionClaims: null } as any);

      const request = new Request("http://localhost:3000/api/category-templates/template_123/import", {
        method: "POST",
      });
      const response = await POST(request, { params: { id: "template_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 403 when user is not admin", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = new Request("http://localhost:3000/api/category-templates/template_123/import", {
        method: "POST",
      });
      const response = await POST(request, { params: { id: "template_123" } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data).toEqual({ error: "Only administrators can import templates" });
    });

    it("should return 404 when organization is not found", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/category-templates/template_123/import", {
        method: "POST",
      });
      const response = await POST(request, { params: { id: "template_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Organization not found" });
    });

    it("should import template successfully", async () => {
      const mockJobId = "job_123";

      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(importTemplate).mockResolvedValue(mockJobId);

      const request = new Request("http://localhost:3000/api/category-templates/template_123/import", {
        method: "POST",
        body: JSON.stringify({ 
          selections: { categories: {} },
          importMode: "merge"
        }),
      });
      const response = await POST(request, { params: { id: "template_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ 
        jobId: mockJobId,
        message: "Import started successfully"
      });
      expect(importTemplate).toHaveBeenCalledWith(
        {
          templateId: "template_123",
          importMode: "merge",
          selections: { categories: {} }
        },
        "org_123", 
        "user_123"
      );
    });

    it("should handle import in progress error", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(importTemplate).mockRejectedValue(new Error("Import already in progress"));

      const request = new Request("http://localhost:3000/api/category-templates/template_123/import", {
        method: "POST",
        body: JSON.stringify({ selections: { categories: {} } }),
      });
      const response = await POST(request, { params: { id: "template_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to import template" });
    });

    it("should handle template not found error", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(importTemplate).mockRejectedValue(new Error("Template not found"));

      const request = new Request("http://localhost:3000/api/category-templates/template_123/import", {
        method: "POST",
        body: JSON.stringify({ selections: { categories: {} } }),
      });
      const response = await POST(request, { params: { id: "template_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to import template" });
    });

    it("should handle service errors gracefully", async () => {
      (vi.mocked(auth) as any).mockResolvedValue({ userId: "user_123", orgId: "org_123", sessionClaims: null });
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(getCurrentOrgId).mockResolvedValue("org_123");
      vi.mocked(importTemplate).mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost:3000/api/category-templates/template_123/import", {
        method: "POST",
        body: JSON.stringify({ selections: { categories: {} } }),
      });
      const response = await POST(request, { params: { id: "template_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to import template" });
    });
  });
});