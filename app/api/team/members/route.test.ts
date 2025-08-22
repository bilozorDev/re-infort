import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

describe("/api/team/members", () => {
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

    it("should return organization members successfully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");

      const mockUser = {
        id: "user123",
        firstName: "John",
        lastName: "Doe",
        emailAddresses: [{ emailAddress: "john@example.com" }],
        imageUrl: "https://example.com/image.jpg",
      };

      const mockMembership = {
        id: "mem123",
        publicUserData: { userId: "user123" },
        role: "org:admin",
        createdAt: Date.now(),
      };

      const mockClient = {
        organizations: {
          getOrganizationMembershipList: vi.fn().mockResolvedValue({
            data: [mockMembership],
          }),
        },
        users: {
          getUser: vi.fn().mockResolvedValue(mockUser),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: "mem123",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        imageUrl: "https://example.com/image.jpg",
        role: "org:admin",
        userId: "user123",
      });
    });

    it("should handle errors gracefully", async () => {
      const { auth, clerkClient } = await import("@clerk/nextjs/server");

      const mockClient = {
        organizations: {
          getOrganizationMembershipList: vi.fn().mockRejectedValue(new Error("API Error")),
        },
      };

      vi.mocked(auth).mockResolvedValue({ userId: "user123", orgId: "org123" } as any);
      vi.mocked(clerkClient).mockResolvedValue(mockClient as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch members");
    });
  });
});
