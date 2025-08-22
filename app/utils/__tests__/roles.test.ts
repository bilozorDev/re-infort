import { auth } from "@clerk/nextjs/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAuthenticatedMock,
  createAuthMock,
  createUnauthenticatedMock,
} from "@/app/test-utils/clerk-mocks";

import {
  checkRole,
  getCurrentOrgId,
  getCurrentUserId,
  getCurrentUserRole,
  isAdmin,
} from "../roles";

// Mock the Clerk auth function
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

describe("Role Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkRole", () => {
    it("should return true when user has role via metadata object", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: { role: "admin" },
        })
      );

      const result = await checkRole("admin");
      expect(result).toBe(true);
    });

    it("should return true when user has role via metadata string", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: "org:admin",
        })
      );

      const result = await checkRole("admin");
      expect(result).toBe(true);
    });

    it("should return true when user has role via organization role", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          o: { rol: "admin" },
        })
      );

      const result = await checkRole("admin");
      expect(result).toBe(true);
    });

    it("should return false when user does not have role", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: { role: "user" },
          o: { rol: "member" },
        })
      );

      const result = await checkRole("admin");
      expect(result).toBe(false);
    });

    it("should return false when user has different string metadata", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: "org:user",
        })
      );

      const result = await checkRole("admin");
      expect(result).toBe(false);
    });

    it("should return false when sessionClaims is null", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthMock("user_123", null, null));

      const result = await checkRole("admin");
      expect(result).toBe(false);
    });

    it("should return false when no metadata or org role", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthMock("user_123", null, {}));

      const result = await checkRole("admin");
      expect(result).toBe(false);
    });
  });

  describe("getCurrentUserRole", () => {
    it("should return admin when org role is admin", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          o: { rol: "admin" },
        })
      );

      const result = await getCurrentUserRole();
      expect(result).toBe("admin");
    });

    it("should return admin when metadata string is org:admin", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: "org:admin",
        })
      );

      const result = await getCurrentUserRole();
      expect(result).toBe("admin");
    });

    it("should return admin when metadata object has admin role", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: { role: "admin" },
        })
      );

      const result = await getCurrentUserRole();
      expect(result).toBe("admin");
    });

    it("should return member when org role is member", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          o: { rol: "member" },
        })
      );

      const result = await getCurrentUserRole();
      expect(result).toBe("member");
    });

    it("should return member when metadata has member role", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: { role: "member" },
        })
      );

      const result = await getCurrentUserRole();
      expect(result).toBe("member");
    });

    it("should return undefined when sessionClaims is null", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthMock("user_123", null, null));

      const result = await getCurrentUserRole();
      expect(result).toBeUndefined();
    });

    it("should return undefined when no role is found", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthMock("user_123", null, {}));

      const result = await getCurrentUserRole();
      expect(result).toBeUndefined();
    });
  });

  describe("isAdmin", () => {
    it("should return true when user has admin role via org role", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          o: { rol: "admin" },
        })
      );

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it("should return true when user has admin role via metadata string", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: "org:admin",
        })
      );

      const result = await isAdmin();
      expect(result).toBe(true);
    });

    it("should return false when user has member role", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          o: { rol: "member" },
        })
      );

      const result = await isAdmin();
      expect(result).toBe(false);
    });

    it("should return false when sessionClaims is null", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthMock("user_123", null, null));

      const result = await isAdmin();
      expect(result).toBe(false);
    });
  });

  describe("getCurrentOrgId", () => {
    it("should return org ID from o.id when v is 2", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          v: 2,
          o: { id: "org_456" },
        })
      );

      const result = await getCurrentOrgId();
      expect(result).toBe("org_456");
    });

    it("should return org ID from org_id when v is not 2", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          org_id: "org_789",
        })
      );

      const result = await getCurrentOrgId();
      expect(result).toBe("org_789");
    });

    it("should prioritize o.id over org_id when both exist", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          v: 2,
          o: { id: "org_primary" },
          org_id: "org_secondary",
        })
      );

      const result = await getCurrentOrgId();
      expect(result).toBe("org_primary");
    });

    it("should return null when no org ID is found", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          some_other_field: "value",
        })
      );

      const result = await getCurrentOrgId();
      expect(result).toBeNull();
    });

    it("should return null when sessionClaims is null", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthMock("user_123", null, null));

      const result = await getCurrentOrgId();
      expect(result).toBeNull();
    });
  });

  describe("getCurrentUserId", () => {
    it("should return user ID when authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthenticatedMock("user_123", "org_123"));

      const result = await getCurrentUserId();
      expect(result).toBe("user_123");
    });

    it("should return null when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(createUnauthenticatedMock());

      const result = await getCurrentUserId();
      expect(result).toBeNull();
    });

    it("should handle missing auth object", async () => {
      vi.mocked(auth).mockResolvedValue(createAuthMock(undefined, undefined, {}));

      const result = await getCurrentUserId();
      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle all role checks with mixed metadata types", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", "org_123", {
          o: { id: "org_123", rol: "admin" },
          org_id: "org_123",
          metadata: {
            role: "admin",
            other_field: "value",
          },
        })
      );

      const roleResult = await checkRole("admin");
      const isAdminResult = await isAdmin();
      const orgId = await getCurrentOrgId();
      const userId = await getCurrentUserId();

      expect(roleResult).toBe(true);
      expect(isAdminResult).toBe(true);
      expect(orgId).toBe("org_123");
      expect(userId).toBe("user_123");
    });

    it("should handle invalid metadata string format", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: "invalid:format:string",
        })
      );

      const result = await checkRole("admin");
      expect(result).toBe(false);
    });

    it("should handle empty metadata object", async () => {
      vi.mocked(auth).mockResolvedValue(
        createAuthMock("user_123", null, {
          metadata: {},
        })
      );

      const result = await checkRole("admin");
      expect(result).toBe(false);
    });
  });
});
