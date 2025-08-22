import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@/app/utils/roles", () => ({
  isAdmin: vi.fn(),
}));

describe("/api/team/invitations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return 401 if user is not authenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if organization is not found", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: null } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Organization not found");
    });

    it("should return pending invitations successfully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");

      const mockInvitation = {
        id: "inv123",
        emailAddress: "invited@example.com",
        role: "org:member",
        status: "pending",
        createdAt: Date.now(),
      };

      const mockClient = {
        organizations: {
          getOrganizationInvitationList: vi.fn().mockResolvedValue({
            data: [mockInvitation],
          }),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: "inv123",
        email: "invited@example.com",
        role: "org:member",
        status: "pending",
      });
    });
  });

  describe("POST", () => {
    it("should return 401 if user is not authenticated", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      vi.mocked(auth).mockResolvedValue({ userId: null, orgId: null } as any);

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", role: "org:member" }),
      });

      const response = await POST(request);
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
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", role: "org:member" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Only administrators can invite users");
    });

    it("should return 400 if email or role is missing", async () => {
      const { auth } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Email and role are required");
    });

    it("should create invitation successfully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockInvitation = {
        id: "inv123",
        emailAddress: "test@example.com",
        role: "org:member",
        status: "pending",
        createdAt: Date.now(),
      };

      const mockClient = {
        organizations: {
          createOrganizationInvitation: vi.fn().mockResolvedValue(mockInvitation),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", role: "org:member" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: "inv123",
        email: "test@example.com",
        role: "org:member",
        status: "pending",
      });

      expect(mockClient.organizations.createOrganizationInvitation).toHaveBeenCalledWith({
        organizationId: "org123",
        emailAddress: "test@example.com",
        role: "org:member",
        inviterUserId: "user123",
      });
    });

    it("should handle errors gracefully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");
      const { isAdmin } = await import("@/app/utils/roles");

      const mockClient = {
        organizations: {
          createOrganizationInvitation: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(isAdmin).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com", role: "org:member" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create invitation");
    });
  });
});
