import { currentUser } from "@clerk/nextjs/server";

/**
 * Gets the full name of the currently authenticated user from Clerk
 * @returns The user's full name or "Unknown User" if not available
 */
export async function getCurrentUserName(): Promise<string> {
  try {
    const user = await currentUser();

    if (!user) {
      return "Unknown User";
    }

    // Construct full name from first and last name
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";

    const fullName = `${firstName} ${lastName}`.trim();

    // Return full name if available, otherwise fallback to email or username
    if (fullName) {
      return fullName;
    } else if (user.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress;
    } else if (user.username) {
      return user.username;
    }

    return "Unknown User";
  } catch (error) {
    console.error("Error fetching current user name:", error);
    return "Unknown User";
  }
}

/**
 * Gets user information for display purposes
 * @returns Object with user details
 */
export async function getCurrentUserInfo() {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        id: null,
        name: "Unknown User",
        email: null,
        firstName: null,
        lastName: null,
      };
    }

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || user.username || "Unknown User";

    return {
      id: user.id,
      name: fullName,
      email: user.emailAddresses?.[0]?.emailAddress || null,
      firstName,
      lastName,
    };
  } catch (error) {
    console.error("Error fetching current user info:", error);
    return {
      id: null,
      name: "Unknown User",
      email: null,
      firstName: null,
      lastName: null,
    };
  }
}
