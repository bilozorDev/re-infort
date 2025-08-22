import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@/app/utils/roles", () => ({
  isAdmin: vi.fn(),
}));

describe("/api/team/invitations/[invitationId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DELETE", () => {
    it("should return 401 if user is not authenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null } as any);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, {
        params: Promise.resolve({ invitationId: "inv123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, {
        params: Promise.resolve({ invitationId: "inv123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only administrators can revoke invitations");
    });

    it("should return 404 if organization is not found", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: null } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, {
        params: Promise.resolve({ invitationId: "inv123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Organization not found");
    });

    it("should revoke invitation successfully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockClient = {
        organizations: {
          revokeOrganizationInvitation: vi.fn().mockResolvedValue({}),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, {
        params: Promise.resolve({ invitationId: "inv123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockClient.organizations.revokeOrganizationInvitation).toHaveBeenCalledWith({
        organizationId: "org123",
        invitationId: "inv123",
        requestingUserId: "user123",
      });
    });

    it("should handle errors gracefully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockClient = {
        organizations: {
          revokeOrganizationInvitation: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, {
        params: Promise.resolve({ invitationId: "inv123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to revoke invitation");
    });
  });
});
