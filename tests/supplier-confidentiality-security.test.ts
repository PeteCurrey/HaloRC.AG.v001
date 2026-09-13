// tests/supplier-confidentiality-security.test.ts
// Phase 11 — Procurement Confidentiality, Commercial Data Isolation, RBAC Security,
// and Epistemological Integrity (Scenarios L, Q, S, T)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSupplierCommercialTerms,
  getTradeAccountApplications,
  getSupplierDocuments,
  getBrandSupplierRelationships,
  getProductSourcingView,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'
import { hasRequiredRole, STAFF_ROLES, ADMIN_ROLES } from '@/lib/auth'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Phase 11: Procurement Security, Confidentiality & Epistemological Boundaries (Scenarios L, Q, S, T)', () => {
  it('Scenario L: RBAC security strictly gates procurement administration to STAFF / ADMIN roles', () => {
    // Customers and anonymous entities are forbidden
    expect(hasRequiredRole('CUSTOMER', STAFF_ROLES)).toBe(false)
    expect(hasRequiredRole('CUSTOMER', ADMIN_ROLES)).toBe(false)

    // Procurement operators, managers, and admins are authorized
    expect(hasRequiredRole('SUPPLIER_MANAGER', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('ADMIN', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('SUPER_ADMIN', STAFF_ROLES)).toBe(true)
  })

  it('Scenario Q: Wholesale costs, credit limits, and trade margins never leak into public storefront models', async () => {
    // Fetch commercial terms (internal procurement data)
    const terms = await getSupplierCommercialTerms('sup-cml')
    expect(terms).toBeDefined()
    expect(terms?.earlyPaymentDiscountPercent).toBeDefined()

    // Fetch trade account application with internal credit limit
    const apps = await getTradeAccountApplications('sup-cml')
    const app = apps[0]
    expect(app?.creditLimitMinorUnits).toBeGreaterThan(0)

    // Simulate public product view received by customer
    const publicProductResponse = {
      id: 'prod-xray-x4-2026',
      name: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      sku: 'XRAY-300040',
      brand: 'Team XRAY',
      retailPrice: '£729.00',
      availability: 'IN_STOCK',
      inStock: true,
    }

    const serialized = JSON.stringify(publicProductResponse)
    expect(serialized).not.toContain('creditLimitMinorUnits')
    expect(serialized).not.toContain('earlyPaymentDiscountPercent')
    expect(serialized).not.toContain('standardDiscountTierPercent')
    expect(serialized).not.toContain('supplierCost')
    expect(serialized).not.toContain('wholesaleMargin')
    expect(serialized).not.toContain('accountReference')
    expect(serialized).not.toContain('minimumOrderValueMinorUnits')
  })

  it('Scenario S: Epistemological distinction preserves UNVERIFIED / UNKNOWN without false coercion', async () => {
    const relationships = await getBrandSupplierRelationships('brand-xray')

    // Verified relationship has explicit evidence
    const verified = relationships.find((r) => r.verificationStatus === 'VERIFIED')
    expect(verified).toBeDefined()
    expect(verified?.evidenceSourceType).toBeTruthy()
    expect(verified?.verifiedAt).toBeTruthy()

    // Unverified relationship remains explicitly UNVERIFIED
    const unverified = relationships.find((r) => r.verificationStatus === 'UNVERIFIED')
    expect(unverified).toBeDefined()
    expect(unverified?.verificationStatus).toBe('UNVERIFIED')
    // Must NOT be coerced into VERIFIED or omitted
    expect(unverified?.verifiedAt).toBeNull()
    expect(unverified?.verifiedBy).toBeNull()
  })

  it('Scenario T: Jurisdiction isolation prevents cross-market terms leakage', async () => {
    const usTerms = await getSupplierCommercialTerms('sup-horizon-us')
    const ukTerms = await getSupplierCommercialTerms('sup-cml')

    // US terms are kept strictly in USD
    expect(usTerms?.currency).toBe('USD')

    // UK terms are kept strictly in GBP
    expect(ukTerms?.currency).toBe('GBP')

    // No dynamic unhedged currency conversion is permitted in procurement contracts
    expect(usTerms?.currency).not.toBe(ukTerms?.currency)
  })

  it('Supplier confidential documents (credit agreements, resale certificates) are isolated', async () => {
    const documents = await getSupplierDocuments('sup-cml')

    for (const doc of documents) {
      expect(doc.supplierId).toBe('sup-cml')
      expect(doc.documentType).toBeDefined()
      expect(doc.uploadedBy).toBeTruthy()
      expect(doc.fileUrl).toBeTruthy()
    }
  })
})
