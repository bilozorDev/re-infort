import { auth } from "@clerk/nextjs/server";

import { type UserRole } from "@/types/globals";

// Define the shape of our custom session claims
interface CustomSessionClaims {
  org_id?: string;
  o?: {
    id?: string;
    rol?: string;
  };
  metadata?:
    | string
    | {
        role?: UserRole;
      };
}

/**
 * Check if the current user has a specific role
 */
export async function checkRole(role: UserRole): Promise<boolean> {
  const { sessionClaims } = await auth();

  // Type-safe access to custom claims
  const customClaims = sessionClaims as CustomSessionClaims | null;

  // Check organization role from Clerk (o.rol in JWT)
  const orgRole = customClaims?.o?.rol;

  // Check metadata - it might be a string like "org:admin" or an object
  const metadata = customClaims?.metadata;
  const metadataRole =
    typeof metadata === "string"
      ? metadata === "org:admin"
        ? "admin"
        : undefined
      : metadata?.role;

  return metadataRole === role || orgRole === role;
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | undefined> {
  const { sessionClaims } = await auth();

  // Type-safe access to custom claims
  const customClaims = sessionClaims as CustomSessionClaims | null;

  // Check organization role from Clerk (o.rol in JWT)
  const orgRole = customClaims?.o?.rol;

  // If user has org admin role, return admin
  if (orgRole === "admin") {
    return "admin";
  }

  // If user has org member role, return member
  if (orgRole === "member") {
    return "member";
  }

  // Check metadata - it might be a string like "org:admin" or an object
  const metadata = customClaims?.metadata;
  if (typeof metadata === "string") {
    return metadata === "org:admin" ? "admin" : undefined;
  }

  return metadata?.role;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return checkRole("admin");
}

/**
 * Get the current user's organization ID
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const { sessionClaims } = await auth();

  // Type-safe access to custom claims
  const customClaims = sessionClaims as CustomSessionClaims | null;

  // Organization ID is in o.id in Clerk's JWT structure
  return customClaims?.o?.id || customClaims?.org_id || null;
}

/**
 * Get the current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}
