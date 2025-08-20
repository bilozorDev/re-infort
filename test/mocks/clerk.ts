import { vi } from 'vitest'
import React from 'react'

// Mock user data
export const mockClerkUser = {
  id: 'user_test123',
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  primaryEmailAddress: { emailAddress: 'test@example.com' },
  publicMetadata: {
    role: 'admin',
  },
  privateMetadata: {},
  unsafeMetadata: {},
}

// Mock organization data
export const mockOrganization = {
  id: 'org_test123',
  name: 'Test Organization',
  slug: 'test-org',
  membersCount: 5,
  publicMetadata: {},
  privateMetadata: {},
}

// Mock organization membership
export const mockMembership = {
  id: 'mem_test123',
  organization: mockOrganization,
  role: 'admin',
  publicMetadata: {},
  privateMetadata: {},
}

// Mock auth object for server-side
export const mockAuth = vi.fn(() => ({
  userId: 'user_test123',
  sessionId: 'sess_test123',
  orgId: 'org_test123',
  orgRole: 'admin',
  orgSlug: 'test-org',
  sessionClaims: {
    sub: 'user_test123',
    org_id: 'org_test123',
    org_role: 'admin',
  },
}))

// Mock currentUser for server-side
export const mockCurrentUser = vi.fn(async () => mockClerkUser)

// Mock React hooks
export const useAuth = vi.fn(() => ({
  isLoaded: true,
  isSignedIn: true,
  userId: 'user_test123',
  sessionId: 'sess_test123',
  orgId: 'org_test123',
  orgRole: 'admin',
  orgSlug: 'test-org',
  signOut: vi.fn(),
}))

export const useUser = vi.fn(() => ({
  isLoaded: true,
  isSignedIn: true,
  user: mockClerkUser,
}))

export const useOrganization = vi.fn(() => ({
  isLoaded: true,
  organization: mockOrganization,
  membership: mockMembership,
}))

export const useOrganizationList = vi.fn(() => ({
  isLoaded: true,
  organizationList: [mockOrganization],
  setActive: vi.fn(),
  createOrganization: vi.fn(),
}))

// Mock Clerk components
export const ClerkProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children)
}

export const SignIn = vi.fn(() => null)
export const SignUp = vi.fn(() => null)
export const SignOutButton = vi.fn(({ children }: any) => children)
export const SignInButton = vi.fn(({ children }: any) => children)
export const UserButton = vi.fn(() => null)
export const OrganizationSwitcher = vi.fn(() => null)

// Mock the @clerk/nextjs module
vi.mock('@clerk/nextjs', () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
  useAuth,
  useUser,
  useOrganization,
  useOrganizationList,
  ClerkProvider,
  SignIn,
  SignUp,
  SignOutButton,
  SignInButton,
  UserButton,
  OrganizationSwitcher,
}))

// Helper functions to set mock states
export const setClerkAuthState = (state: {
  isSignedIn?: boolean
  userId?: string | null
  orgId?: string | null
  orgRole?: string | null
  user?: any
}) => {
  const authState = {
    isLoaded: true,
    isSignedIn: state.isSignedIn ?? true,
    userId: state.userId ?? 'user_test123',
    sessionId: state.isSignedIn ? 'sess_test123' : null,
    orgId: state.orgId ?? 'org_test123',
    orgRole: state.orgRole ?? 'admin',
    orgSlug: state.orgId ? 'test-org' : null,
    signOut: vi.fn(),
  }

  useAuth.mockReturnValue(authState as any)
  
  if (state.user !== undefined) {
    useUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: state.isSignedIn ?? true,
      user: state.user,
    })
  }

  // Update server-side mocks
  mockAuth.mockReturnValue({
    userId: authState.userId,
    sessionId: authState.sessionId!,
    orgId: authState.orgId!,
    orgRole: authState.orgRole!,
    orgSlug: authState.orgSlug!,
    sessionClaims: authState.isSignedIn ? {
      sub: authState.userId!,
      org_id: authState.orgId!,
      org_role: authState.orgRole!,
    } : null!,
  } as any)

  mockCurrentUser.mockResolvedValue(state.user ?? (state.isSignedIn ? mockClerkUser : null))
}

// Helper to set organization state
export const setClerkOrganizationState = (org: any = mockOrganization, membership: any = mockMembership) => {
  useOrganization.mockReturnValue({
    isLoaded: true,
    organization: org,
    membership,
  })
}

// Helper to reset all Clerk mocks
export const resetClerkMocks = () => {
  vi.clearAllMocks()
  // Reset to default signed-in state
  setClerkAuthState({ isSignedIn: true })
  setClerkOrganizationState()
}