import { auth } from '@clerk/nextjs/server';
import { vi } from 'vitest';

/**
 * Type definition for Clerk auth mock
 * Based on the actual auth() function from @clerk/nextjs/server
 */
export interface AuthMockResult {
  userId: string | null;
  orgId?: string | null;
  sessionClaims: Record<string, any> | null;
  sessionId?: string | null;
  actor?: any;
  getToken?: () => Promise<string | null>;
  debug?: () => any;
}

/**
 * Creates a properly typed auth mock for testing
 */
export function createAuthMock(
  userId: string | null = null,
  orgId: string | null = null,
  sessionClaims: Record<string, any> | null = null
): any {
  return {
    userId,
    orgId,
    sessionClaims: sessionClaims || (orgId ? { org_id: orgId } : null),
  } as any;
}

/**
 * Creates an authenticated user mock with default values
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
  } as any;
}

/**
 * Creates an unauthenticated user mock
 */
export function createUnauthenticatedMock(): any {
  return {
    userId: null,
    sessionClaims: null,
  } as any;
}

/**
 * Mocks the auth function from @clerk/nextjs/server
 */
export function mockAuth(result: AuthMockResult | (() => AuthMockResult)) {
  const authMock = vi.fn().mockResolvedValue(
    typeof result === 'function' ? result() : result
  );
  
  vi.mocked(auth as any).mockImplementation(authMock);
  
  return authMock;
}