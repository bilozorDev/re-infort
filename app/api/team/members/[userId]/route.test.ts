import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PATCH } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@/app/utils/roles", () => ({
  isAdmin: vi.fn(),
}));

describe("/api/team/members/[userId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PATCH", () => {
    it("should return 401 if user is not authenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null } as any);

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ role: "org:admin" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 403 if user is not admin", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(false);

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ role: "org:admin" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only administrators can update user roles");
    });

    it("should return 400 if trying to change own role", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ role: "org:member" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "user123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You cannot change your own role");
    });

    it("should return 400 if role is invalid", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ role: "invalid" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Valid role is required");
    });

    it("should update role successfully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockMembership = {
        id: "mem123",
        publicUserData: { userId: "target123" },
        role: "org:member",
      };

      const mockClient = {
        organizations: {
          getOrganizationMembershipList: vi.fn().mockResolvedValue({
            data: [mockMembership],
          }),
          updateOrganizationMembership: vi.fn().mockResolvedValue({}),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ role: "org:admin" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockClient.organizations.updateOrganizationMembership).toHaveBeenCalledWith({
        organizationId: "org123",
        userId: "target123",
        role: "org:admin",
      });
    });

    it("should return 404 if user is not a member", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockClient = {
        organizations: {
          getOrganizationMembershipList: vi.fn().mockResolvedValue({
            data: [],
          }),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ role: "org:admin" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("User is not a member of this organization");
    });
  });

  describe("DELETE", () => {
    it("should return 401 if user is not authenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null } as any);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, { params: Promise.resolve({ userId: "target123" }) });
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

      const response = await DELETE(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only administrators can remove users");
    });

    it("should return 400 if trying to remove self", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, { params: Promise.resolve({ userId: "user123" }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("You cannot remove yourself from the organization");
    });

    it("should remove user successfully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockClient = {
        organizations: {
          deleteOrganizationMembership: vi.fn().mockResolvedValue({}),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockClient.organizations.deleteOrganizationMembership).toHaveBeenCalledWith({
        organizationId: "org123",
        userId: "target123",
      });
    });

    it("should handle errors gracefully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockClient = {
        organizations: {
          deleteOrganizationMembership: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", { method: "DELETE" });

      const response = await DELETE(request, { params: Promise.resolve({ userId: "target123" }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to remove user");
    });
  });
});
