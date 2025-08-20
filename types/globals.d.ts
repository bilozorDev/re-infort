export {}

export type UserRole = 'admin' | 'member'

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: UserRole
    }
    org_id?: string
    org_role?: string
    org_slug?: string
  }
}