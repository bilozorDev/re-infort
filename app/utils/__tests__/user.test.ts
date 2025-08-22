import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCurrentUserInfo, getCurrentUserName } from "../user";

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: vi.fn(),
}));

// Import after mocking
import { currentUser } from "@clerk/nextjs/server";

describe("User Utilities", () => {
  let mockCurrentUser: ReturnType<typeof vi.fn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockCurrentUser = vi.mocked(currentUser);
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });

  describe("getCurrentUserName", () => {
    it("should return full name when both first and last name are available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "John",
        lastName: "Doe",
        emailAddresses: [{ emailAddress: "john@example.com" }],
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("John Doe");
    });

    it("should return first name only when last name is not available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "John",
        lastName: null,
        emailAddresses: [{ emailAddress: "john@example.com" }],
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("John");
    });

    it("should return last name only when first name is not available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: null,
        lastName: "Doe",
        emailAddresses: [{ emailAddress: "john@example.com" }],
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("Doe");
    });

    it("should return email when no name is available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "",
        lastName: "",
        emailAddresses: [{ emailAddress: "john@example.com" }],
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("john@example.com");
    });

    it("should return username when no name or email is available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "",
        lastName: "",
        emailAddresses: [],
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("johndoe");
    });

    it("should return Unknown User when user is null", async () => {
      mockCurrentUser.mockResolvedValue(null);

      const name = await getCurrentUserName();
      expect(name).toBe("Unknown User");
    });

    it("should return Unknown User when no user data is available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "",
        lastName: "",
        emailAddresses: [],
        username: null,
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("Unknown User");
    });

    it("should handle empty email addresses array", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "",
        lastName: "",
        emailAddresses: null,
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("johndoe");
    });

    it("should handle whitespace-only names", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "  ",
        lastName: "  ",
        emailAddresses: [{ emailAddress: "john@example.com" }],
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("john@example.com");
    });

    it("should handle Clerk API errors gracefully", async () => {
      const error = new Error("Clerk API error");
      mockCurrentUser.mockRejectedValue(error);

      const name = await getCurrentUserName();
      expect(name).toBe("Unknown User");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching current user name:", error);
    });

    it("should handle undefined email in emailAddresses array", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "",
        lastName: "",
        emailAddresses: [{ emailAddress: undefined }],
        username: "johndoe",
      } as never);

      const name = await getCurrentUserName();
      expect(name).toBe("johndoe");
    });
  });

  describe("getCurrentUserInfo", () => {
    it("should return complete user info when all data is available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-123",
        firstName: "John",
        lastName: "Doe",
        emailAddresses: [{ emailAddress: "john@example.com" }],
        username: "johndoe",
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("should handle partial user data", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-456",
        firstName: "Jane",
        lastName: null,
        emailAddresses: [],
        username: null,
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-456",
        name: "Jane",
        email: null,
        firstName: "Jane",
        lastName: "",
      });
    });

    it("should return default values when user is null", async () => {
      mockCurrentUser.mockResolvedValue(null);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: null,
        name: "Unknown User",
        email: null,
        firstName: null,
        lastName: null,
      });
    });

    it("should use username as name when no first/last name available", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-789",
        firstName: "",
        lastName: "",
        emailAddresses: [{ emailAddress: "user@example.com" }],
        username: "cooluser",
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-789",
        name: "cooluser",
        email: "user@example.com",
        firstName: "",
        lastName: "",
      });
    });

    it("should handle empty emailAddresses array", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-999",
        firstName: "Bob",
        lastName: "Smith",
        emailAddresses: [],
        username: "bobsmith",
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-999",
        name: "Bob Smith",
        email: null,
        firstName: "Bob",
        lastName: "Smith",
      });
    });

    it("should handle null emailAddresses", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-111",
        firstName: "Alice",
        lastName: "Johnson",
        emailAddresses: null,
        username: "alicej",
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-111",
        name: "Alice Johnson",
        email: null,
        firstName: "Alice",
        lastName: "Johnson",
      });
    });

    it("should handle Clerk API errors gracefully", async () => {
      const error = new Error("Clerk API failure");
      mockCurrentUser.mockRejectedValue(error);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: null,
        name: "Unknown User",
        email: null,
        firstName: null,
        lastName: null,
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching current user info:", error);
    });

    it("should use Unknown User when all name fields are empty", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-222",
        firstName: "",
        lastName: "",
        emailAddresses: [{ emailAddress: "test@test.com" }],
        username: null,
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-222",
        name: "Unknown User",
        email: "test@test.com",
        firstName: "",
        lastName: "",
      });
    });

    it("should handle whitespace-only names correctly", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-333",
        firstName: "  ",
        lastName: "  ",
        emailAddresses: [{ emailAddress: "space@test.com" }],
        username: "spaceuser",
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-333",
        name: "spaceuser",
        email: "space@test.com",
        firstName: "  ",
        lastName: "  ",
      });
    });

    it("should handle undefined values in user object", async () => {
      mockCurrentUser.mockResolvedValue({
        id: "user-444",
        firstName: undefined,
        lastName: undefined,
        emailAddresses: undefined,
        username: undefined,
      } as never);

      const info = await getCurrentUserInfo();
      expect(info).toEqual({
        id: "user-444",
        name: "Unknown User",
        email: null,
        firstName: "",
        lastName: "",
      });
    });
  });
});
