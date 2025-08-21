import { auth } from '@clerk/nextjs/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MockAuthObject } from '@/app/test-utils/types'
import {
  checkRole,
  getCurrentOrgId,
  getCurrentUserId,
  getCurrentUserRole,
  isAdmin,
} from '../roles'

// Mock the Clerk auth function
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

describe('Role Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkRole', () => {
    it('should return true when user has role via metadata object', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: 'admin' },
        },
      } as any)

      const result = await checkRole('admin')
      expect(result).toBe(true)
    })

    it('should return true when user has role via metadata string', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: 'org:admin',
        },
      } as any)

      const result = await checkRole('admin')
      expect(result).toBe(true)
    })

    it('should return true when user has role via organization role', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          o: { rol: 'admin' },
        },
      } as any)

      const result = await checkRole('admin')
      expect(result).toBe(true)
    })

    it('should return false when user does not have role', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: 'user' },
          o: { rol: 'member' },
        },
      } as any)

      const result = await checkRole('admin')
      expect(result).toBe(false)
    })

    it('should return false when user has different string metadata', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: 'org:user',
        },
      } as any)

      const result = await checkRole('admin')
      expect(result).toBe(false)
    })

    it('should return false when sessionClaims is null', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: null,
      } as any)

      const result = await checkRole('admin')
      expect(result).toBe(false)
    })

    it('should return false when no metadata or org role', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {},
      } as any)

      const result = await checkRole('admin')
      expect(result).toBe(false)
    })
  })

  describe('getCurrentUserRole', () => {
    it('should return admin when org role is admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          o: { rol: 'admin' },
        },
      } as any)

      const result = await getCurrentUserRole()
      expect(result).toBe('admin')
    })

    it('should return admin when metadata string is org:admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: 'org:admin',
        },
      } as any)

      const result = await getCurrentUserRole()
      expect(result).toBe('admin')
    })

    it('should return role from metadata object', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: 'user' },
        },
      } as any)

      const result = await getCurrentUserRole()
      expect(result).toBe('user')
    })

    it('should return undefined when no role found', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: 'other:value',
        },
      } as any)

      const result = await getCurrentUserRole()
      expect(result).toBe(undefined)
    })

    it('should prioritize org role over metadata', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          o: { rol: 'admin' },
          metadata: { role: 'user' },
        },
      } as any)

      const result = await getCurrentUserRole()
      expect(result).toBe('admin')
    })

    it('should return undefined when sessionClaims is null', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: null,
      } as any)

      const result = await getCurrentUserRole()
      expect(result).toBe(undefined)
    })
  })

  describe('isAdmin', () => {
    it('should return true when user is admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          o: { rol: 'admin' },
        },
      } as any)

      const result = await isAdmin()
      expect(result).toBe(true)
    })

    it('should return false when user is not admin', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          metadata: { role: 'user' },
        },
      } as any)

      const result = await isAdmin()
      expect(result).toBe(false)
    })

    it('should return false when no session', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: null,
      } as any)

      const result = await isAdmin()
      expect(result).toBe(false)
    })
  })

  describe('getCurrentOrgId', () => {
    it('should return org ID from o.id', async () => {
      const orgId = 'org_123456789'
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          o: { id: orgId },
        },
      } as any)

      const result = await getCurrentOrgId()
      expect(result).toBe(orgId)
    })

    it('should return org ID from org_id fallback', async () => {
      const orgId = 'org_123456789'
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          org_id: orgId,
        },
      } as any)

      const result = await getCurrentOrgId()
      expect(result).toBe(orgId)
    })

    it('should prioritize o.id over org_id', async () => {
      const primaryOrgId = 'org_primary'
      const fallbackOrgId = 'org_fallback'
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          o: { id: primaryOrgId },
          org_id: fallbackOrgId,
        },
      } as any)

      const result = await getCurrentOrgId()
      expect(result).toBe(primaryOrgId)
    })

    it('should return null when no org ID found', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: {
          some_other_field: 'value',
        },
      } as any)

      const result = await getCurrentOrgId()
      expect(result).toBe(null)
    })

    it('should return null when sessionClaims is null', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_123',
        sessionClaims: null,
      } as any)

      const result = await getCurrentOrgId()
      expect(result).toBe(null)
    })
  })

  describe('getCurrentUserId', () => {
    it('should return user ID when available', async () => {
      const userId = 'user_123456789'
      vi.mocked(auth).mockResolvedValue({
        userId,
      } as any)

      const result = await getCurrentUserId()
      expect(result).toBe(userId)
    })

    it('should return null when user ID is not available', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: null,
      } as any)

      const result = await getCurrentUserId()
      expect(result).toBe(null)
    })

    it('should return null when userId is undefined', async () => {
      vi.mocked(auth).mockResolvedValue({} as any)

      const result = await getCurrentUserId()
      expect(result).toBe(undefined)
    })
  })

  describe('Complex scenarios', () => {
    it('should handle complete session claims structure', async () => {
      const mockSessionClaims = {
        o: {
          id: 'org_12345',
          rol: 'admin',
        },
        org_id: 'org_fallback',
        metadata: {
          role: 'user',
          other_field: 'value',
        },
      }

      vi.mocked(auth).mockResolvedValue({
        userId: 'user_12345',
        sessionClaims: mockSessionClaims,
      } as any)

      // Test all functions with the same mock
      const [isAdminResult, currentRole, orgId, userId] = await Promise.all([
        isAdmin(),
        getCurrentUserRole(),
        getCurrentOrgId(),
        getCurrentUserId(),
      ])

      expect(isAdminResult).toBe(true) // org role is admin
      expect(currentRole).toBe('admin') // org role takes precedence
      expect(orgId).toBe('org_12345') // o.id takes precedence
      expect(userId).toBe('user_12345')
    })

    it('should handle minimal session claims', async () => {
      vi.mocked(auth).mockResolvedValue({
        userId: 'user_minimal',
        sessionClaims: {
          metadata: 'org:admin',
        },
      } as any)

      const [isAdminResult, currentRole, orgId, userId] = await Promise.all([
        isAdmin(),
        getCurrentUserRole(),
        getCurrentOrgId(),
        getCurrentUserId(),
      ])

      expect(isAdminResult).toBe(true) // metadata string indicates admin
      expect(currentRole).toBe('admin') // parsed from string metadata
      expect(orgId).toBe(null) // no org ID in claims
      expect(userId).toBe('user_minimal')
    })
  })
})