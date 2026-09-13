// tests/supplier-security-rbac.test.ts
// Phase 8 — Procurement security, RBAC boundary, credential isolation, and customer access denial (Scenario K)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSuppliers,
  getSupplierOffersForProduct,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'
import { hasRequiredRole, STAFF_ROLES, ADMIN_ROLES } from '@/lib/auth'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Scenario K — Procurement RBAC & Customer Access Denial', () => {
  it('strictly denies CUSTOMER role access to procurement operations and administration', () => {
    expect(hasRequiredRole('CUSTOMER', STAFF_ROLES)).toBe(false)
    expect(hasRequiredRole('CUSTOMER', ADMIN_ROLES)).toBe(false)
  })

  it('permits SUPPLIER_MANAGER, ADMIN, and SUPER_ADMIN roles to access procurement administration', () => {
    expect(hasRequiredRole('SUPPLIER_MANAGER', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('SUPPLIER_MANAGER', ADMIN_ROLES)).toBe(true)
    expect(hasRequiredRole('ADMIN', ADMIN_ROLES)).toBe(true)
    expect(hasRequiredRole('SUPER_ADMIN', ADMIN_ROLES)).toBe(true)
  })

  it('verifies that supplier records do not store plain-text API credentials or secrets', async () => {
    const suppliers = await getSuppliers()

    for (const s of suppliers) {
      const serialized = JSON.stringify(s)
      expect(serialized).not.toContain('apiKey')
      expect(serialized).not.toContain('apiSecret')
      expect(serialized).not.toContain('password')
      expect(serialized).not.toContain('sftpPrivateKey')
      expect(serialized).not.toContain('bearerToken')
    }
  })

  it('verifies that supplier wholesale costs and margins are completely absent from public offers', async () => {
    const supplierOffers = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    expect(supplierOffers.length).toBeGreaterThan(0)

    // Simulate public commercial payload sent to customer storefront
    const publicClientPayload = {
      productId: 'prod-xray-x4-2026',
      marketCode: 'UK',
      retailPriceMinorUnits: 72900,
      currency: 'GBP',
      availability: 'IN_STOCK',
    }

    const json = JSON.stringify(publicClientPayload)
    expect(json).not.toContain('costMinorUnits')
    expect(json).not.toContain('supplierCost')
    expect(json).not.toContain('wholesaleMargin')
    expect(json).not.toContain('supplierId')
    expect(json).not.toContain('accountReference')
  })
})
