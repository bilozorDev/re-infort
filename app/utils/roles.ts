import { auth } from '@clerk/nextjs/server'

import { type UserRole } from '@/types/globals'

/**
 * Check if the current user has a specific role
 */
export async function checkRole(role: UserRole): Promise<boolean> {
  const { sessionClaims } = await auth()
  
  // Check organization role from Clerk (o.rol in JWT)
  const orgRole = (sessionClaims as any)?.o?.rol
  
  // Check metadata - it might be a string like "org:admin" or an object
  const metadata = sessionClaims?.metadata
  const metadataRole = typeof metadata === 'string' 
    ? (metadata === 'org:admin' ? 'admin' : undefined)
    : metadata?.role
  
  return metadataRole === role || orgRole === role
}

/**
 * Get the current user's role
 */
export async function getCurrentUserRole(): Promise<UserRole | undefined> {
  const { sessionClaims } = await auth()
  
  // Check organization role from Clerk (o.rol in JWT)
  const orgRole = (sessionClaims as any)?.o?.rol
  
  // If user has org admin role, return admin
  if (orgRole === 'admin') {
    return 'admin'
  }
  
  // Check metadata - it might be a string like "org:admin" or an object
  const metadata = sessionClaims?.metadata
  if (typeof metadata === 'string') {
    return metadata === 'org:admin' ? 'admin' : undefined
  }
  
  return metadata?.role
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return checkRole('admin')
}

/**
 * Get the current user's organization ID
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const { sessionClaims } = await auth()
  // Organization ID is in o.id in Clerk's JWT structure
  return (sessionClaims as any)?.o?.id || sessionClaims?.org_id || null
}

/**
 * Get the current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}