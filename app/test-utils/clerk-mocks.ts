/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@clerk/nextjs/server';
import { vi } from 'vitest';

/**
 * Session claims structure based on Clerk's JWT
 */
export interface SessionClaims {
  org_id?: string;
  metadata?: string | { [key: string]: unknown };
  o?: {
    id?: string;
    rol?: string;
  };
  [key: string]: unknown;
}

/**
 * Type definition for Clerk auth mock
 * Based on the actual auth() function from @clerk/nextjs/server
 */
export interface AuthMockResult {
  userId: string | null;
  orgId?: string | null;
  sessionClaims: SessionClaims | null;
  sessionId?: string | null;
  actor?: unknown;
  getToken?: () => Promise<string | null>;
  debug?: () => unknown;
}

/**
 * Creates a properly typed auth mock for testing
 * Returns `any` to bypass TypeScript type checking since we're mocking
 */
export function createAuthMock(
  userId: string | null = null,
  orgId: string | null = null,
  sessionClaims: SessionClaims | null = null
): any {
  return {
    userId,
    orgId,
    sessionClaims: sessionClaims || (orgId ? { org_id: orgId } : null),
  };
}

/**
 * Creates an authenticated user mock with default values
 * Returns `any` to bypass TypeScript type checking since we're mocking
 */
export function createAuthenticatedMock(
  userId: string = 'user_test123',
  orgId: string = 'org_test123',
  isAdmin: boolean = false
): any {
  return {
    userId,
    orgId,
    sessionClaims: {
      org_id: orgId,
      metadata: isAdmin ? 'org:admin' : undefined,
      o: orgId ? { id: orgId, rol: isAdmin ? 'admin' : 'member' } : undefined,
    },
  };
}

/**
 * Creates an unauthenticated user mock
 * Returns `any` to bypass TypeScript type checking since we're mocking
 */
export function createUnauthenticatedMock(): any {
  return {
    userId: null,
    sessionClaims: null,
  };
}

/**
 * Mocks the auth function from @clerk/nextjs/server
 */
export function mockAuth(result: any | (() => any)) {
  const authMock = vi.fn().mockResolvedValue(
    typeof result === 'function' ? result() : result
  );
  
  // We need to use a type assertion here because Clerk's auth type is complex
  // and not exported for mocking purposes
  const mockedAuth = vi.mocked(auth);
  (mockedAuth as ReturnType<typeof vi.fn>).mockImplementation(authMock);
  
  return authMock;
}