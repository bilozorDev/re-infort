import { auth } from "@clerk/nextjs/server";
import { describe, expect, it, vi } from "vitest";

import {
  cancelImport,
  getImportProgress,
} from "@/app/lib/services/category-template.service";
import {
  createAuthenticatedMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";
import { createMockImportProgress } from "@/app/test-utils/types";

import { DELETE, GET } from "./route";

vi.mock("@clerk/nextjs/server");
vi.mock("@/app/lib/services/category-template.service");

describe("Category Template Import Progress API Route", () => {
  describe("GET /api/category-templates/import-progress/[jobId]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123");
      const response = await GET(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when import job not found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getImportProgress).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123");
      const response = await GET(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Import job not found" });
    });

    it("should return import progress successfully", async () => {
      const mockProgress = createMockImportProgress({
        jobId: "job_123",
        status: "importing",
        percentage: 50,
        currentItem: "Importing subcategories...",
        completedItems: 5,
        totalItems: 10,
      });

      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getImportProgress).mockResolvedValue(mockProgress);

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123");
      const response = await GET(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockProgress);
      expect(getImportProgress).toHaveBeenCalledWith("job_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(getImportProgress).mockRejectedValue(new Error("Database error"));

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123");
      const response = await GET(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to fetch import progress" });
    });
  });

  describe("DELETE /api/category-templates/import-progress/[jobId]", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 when import job not found or already completed", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(cancelImport).mockResolvedValue(false);

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Import job not found or already completed" });
    });

    it("should cancel import successfully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(cancelImport).mockResolvedValue(true);

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ message: "Import cancelled successfully" });
      expect(cancelImport).toHaveBeenCalledWith("job_123");
    });

    it("should handle service errors gracefully", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));
      vi.mocked(cancelImport).mockRejectedValue(new Error("Failed to cancel"));

      const request = new Request("http://localhost:3000/api/category-templates/import-progress/job_123", {
        method: "DELETE",
      });
      const response = await DELETE(request, { params: { jobId: "job_123" } });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Failed to cancel import" });
    });
  });
});