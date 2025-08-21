import { NextRequest } from "next/server";
import { vi } from "vitest";

import type * as RolesModule from "@/app/utils/roles";

/**
 * Creates a mock NextRequest object for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "GET", headers = {}, body, searchParams = {} } = options;

  // Build URL with search params
  const urlObj = new URL(url, "http://localhost:3000");
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  // Create request init
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(body && method !== "GET" && method !== "HEAD" ? { body: JSON.stringify(body) } : {})
  };

  return new NextRequest(urlObj.toString(), init);
}

/**
 * Mocks Clerk authentication
 */
export function mockAuth(
  userId: string | null = "user_test123",
  orgId: string | null = "org_test123"
) {
  const authMock = vi.fn().mockResolvedValue({
    userId,
    orgId,
    sessionClaims: {
      org_id: orgId,
      metadata: orgId ? "org:admin" : undefined,
    },
  });

  vi.mock("@clerk/nextjs/server", () => ({
    auth: authMock,
  }));

  return authMock;
}

/**
 * Mocks the getCurrentOrgId utility
 */
export function mockGetCurrentOrgId(orgId: string | null = "org_test123") {
  const mock = vi.fn().mockResolvedValue(orgId);
  
  vi.mock("@/app/utils/roles", async () => {
    const actual = await vi.importActual<typeof RolesModule>(
      "@/app/utils/roles"
    );
    return {
      ...actual,
      getCurrentOrgId: mock,
    };
  });

  return mock;
}

/**
 * Mocks the isAdmin utility
 */
export function mockIsAdmin(isAdmin: boolean = true) {
  const mock = vi.fn().mockResolvedValue(isAdmin);
  
  vi.mock("@/app/utils/roles", async () => {
    const actual = await vi.importActual<typeof RolesModule>(
      "@/app/utils/roles"
    );
    return {
      ...actual,
      isAdmin: mock,
    };
  });

  return mock;
}

/**
 * Extracts JSON response from NextResponse
 */
export async function getJsonResponse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? JSON.parse(text) as T : null as T;
}

/**
 * Creates a mock supabase client for testing
 */
export function mockSupabaseClient() {
  const mockFrom = vi.fn().mockReturnThis();
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockReturnThis();
  
  const mockClient = {
    from: mockFrom,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
  };

  return {
    client: mockClient,
    mocks: {
      from: mockFrom,
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      single: mockSingle,
    },
  };
}