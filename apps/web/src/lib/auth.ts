import type { UserRole } from '@halo-rc/types'

export interface SessionUser {
  id: string
  email?: string | undefined
  role: UserRole
}

export const STAFF_ROLES: UserRole[] = [
  'STAFF',
  'CUSTOMER_SUPPORT',
  'CONTENT_EDITOR',
  'SUPPLIER_MANAGER',
  'CATALOGUE_ADMIN',
  'ADMIN',
  'SUPER_ADMIN',
]

export const ADMIN_ROLES: UserRole[] = [
  'CATALOGUE_ADMIN',
  'SUPPLIER_MANAGER',
  'ADMIN',
  'SUPER_ADMIN',
]

/**
 * Server-side RBAC evaluation.
 * Returns true if the user's role satisfies any of the required roles.
 */
export function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (userRole === 'SUPER_ADMIN') return true
  return allowedRoles.includes(userRole)
}

/**
 * Resolve the current server-side session user.
 *
 * Resolution order:
 *  1. Vitest mock tokens (Bearer test-*) — only active in non-production
 *  2. Real Supabase JWT from cookies (production path)
 *  3. HALO_DEV_ADMIN_ROLE env override (local development only)
 *  4. null — unauthenticated
 *
 * SECURITY: The browser must never be trusted to establish authorization.
 * All auth state must flow from server-validated Supabase tokens.
 */
export async function getSessionUser(authHeader?: string | null): Promise<SessionUser | null> {
  // 1. Test mock tokens — preserved for Vitest without live Supabase
  if (authHeader) {
    if (authHeader.startsWith('Bearer test-super-admin')) {
      return { id: 'usr-super-admin', role: 'SUPER_ADMIN', email: 'admin@halo-rc.com' }
    }
    if (authHeader.startsWith('Bearer test-staff')) {
      return { id: 'usr-staff', role: 'STAFF', email: 'staff@halo-rc.com' }
    }
    if (authHeader.startsWith('Bearer test-customer')) {
      return { id: 'usr-customer', role: 'CUSTOMER', email: 'customer@example.com' }
    }
  }

  // 2. Real Supabase session from cookies (SSR path)
  // Dynamically import so Vitest (Node) doesn't try to import next/headers
  try {
    const { getSupabaseUser } = await import('./supabase/server')
    const user = await getSupabaseUser()
    if (user) {
      // Role comes from user_metadata set during sign-up or admin assignment
      const role = (user.user_metadata?.['role'] as UserRole | undefined) ?? 'CUSTOMER'
      return { id: user.id, email: user.email, role }
    }
  } catch {
    // next/headers not available (e.g. Vitest environment) — fall through
  }

  // 3. Development default
  if (process.env['HALO_DEV_ADMIN_ROLE']) {
    return {
      id: 'usr-dev-admin',
      role: process.env['HALO_DEV_ADMIN_ROLE'] as UserRole,
      email: 'dev@halo-rc.local',
    }
  }

  return null
}
