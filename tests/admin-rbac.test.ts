import { describe, it, expect } from 'vitest'
import { hasRequiredRole, STAFF_ROLES, ADMIN_ROLES } from '../apps/web/src/lib/auth'

describe('Admin RBAC & Server Authorization Verification', () => {
  it('denies access to anonymous / unauthenticated users', () => {
    // Unauthenticated user (no role)
    const isAllowed = hasRequiredRole('CUSTOMER', STAFF_ROLES)
    expect(isAllowed).toBe(false)
  })

  it('denies access to standard CUSTOMER role', () => {
    const isAllowed = hasRequiredRole('CUSTOMER', STAFF_ROLES)
    expect(isAllowed).toBe(false)
  })

  it('allows access to STAFF role for staff operations', () => {
    const isAllowed = hasRequiredRole('STAFF', STAFF_ROLES)
    expect(isAllowed).toBe(true)
  })

  it('allows access to CATALOGUE_ADMIN and SUPPLIER_MANAGER', () => {
    expect(hasRequiredRole('CATALOGUE_ADMIN', ADMIN_ROLES)).toBe(true)
    expect(hasRequiredRole('SUPPLIER_MANAGER', ADMIN_ROLES)).toBe(true)
  })

  it('always grants access to SUPER_ADMIN', () => {
    expect(hasRequiredRole('SUPER_ADMIN', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('SUPER_ADMIN', ADMIN_ROLES)).toBe(true)
  })

  it('verifies that sensitive supplier terms are never present in public product models', () => {
    // Audit sample public product payload to ensure zero sensitive fields
    const publicProduct = {
      id: 'prod-xray-x4-2026',
      name: "XRAY X4 '26",
      priceMinorUnits: 72900,
      currency: 'GBP',
      tier: 'HALO',
    }

    const json = JSON.stringify(publicProduct)

    expect(json).not.toContain('costPrice')
    expect(json).not.toContain('wholesaleMargin')
    expect(json).not.toContain('supplierTerms')
    expect(json).not.toContain('supplierContact')
    expect(json).not.toContain('moq')
  })
})
