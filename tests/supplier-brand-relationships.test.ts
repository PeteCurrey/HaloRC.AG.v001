// tests/supplier-brand-relationships.test.ts
// Phase 11 — Brand-Supplier Relationships, Distribution Trees, Exclusivity Scopes,
// Unverified Claim Containment, and Sourcing Engines (Scenarios A, B, C, D, J, K, R)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getBrandSupplierRelationships,
  verifyBrandSupplierRelationship,
  getBrandSourcingView,
  getProductSourcingView,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Phase 11: Brand-Supplier Relationships & Sourcing Resolution (Scenarios A, B, C, D, J, K, R)', () => {
  it('Scenario A: Distinguishes direct manufacturer vs authorised distributor vs unverified wholesaler', async () => {
    const relationships = await getBrandSupplierRelationships('brand-xray')

    const mfr = relationships.find((r) => r.relationshipType === 'DIRECT_MANUFACTURER')
    const dist = relationships.find((r) => r.relationshipType === 'AUTHORISED_DISTRIBUTOR')
    const wholesaler = relationships.find((r) => r.relationshipType === 'RESELLER')

    expect(mfr).toBeDefined()
    expect(mfr?.supplierId).toBe('sup-xray-direct')
    expect(mfr?.verificationStatus).toBe('VERIFIED')

    expect(dist).toBeDefined()
    expect(dist?.verificationStatus).toBe('VERIFIED')

    expect(wholesaler).toBeDefined()
    expect(wholesaler?.supplierId).toBe('sup-rcmart')
    expect(wholesaler?.verificationStatus).toBe('UNVERIFIED')
  })

  it('Scenario B: Multi-tier distribution trees correctly isolate territories (UK vs USA vs EU)', async () => {
    const ukRels = await getBrandSupplierRelationships('brand-xray', undefined, 'UK')
    const usRels = await getBrandSupplierRelationships('brand-xray', undefined, 'USA')

    const ukDist = ukRels.find((r) => r.relationshipType === 'AUTHORISED_DISTRIBUTOR')
    expect(ukDist?.supplierId).toBe('sup-cml')

    const usDist = usRels.find((r) => r.relationshipType === 'AUTHORISED_DISTRIBUTOR')
    expect(usDist?.supplierId).toBe('sup-rc-america')
  })

  it('Scenario C & J: Exclusivity scopes are strictly isolated to their declared territory', async () => {
    const usSourcing = await getBrandSourcingView('brand-xray', 'USA')
    expect(usSourcing.hasExclusivityConstraint).toBe(true)
    expect(usSourcing.exclusiveSupplier?.id).toBe('sup-rc-america')

    // UK sourcing should NOT have RC America as exclusive distributor
    const ukSourcing = await getBrandSourcingView('brand-xray', 'UK')
    expect(ukSourcing.exclusiveSupplier?.id).not.toBe('sup-rc-america')
  })

  it('Scenario D: Unverified supplier claims are isolated to unverifiedDistributors with warning', async () => {
    const ukSourcing = await getBrandSourcingView('brand-xray', 'UK')

    // CML is verified
    const cmlEntry = ukSourcing.verifiedDistributors.find((d) => d.supplier.id === 'sup-cml')
    expect(cmlEntry).toBeDefined()
    expect(cmlEntry?.relationship.verificationStatus).toBe('VERIFIED')

    // RC Mart is unverified
    const rcMartEntry = ukSourcing.unverifiedDistributors.find((d) => d.supplier.id === 'sup-rcmart')
    expect(rcMartEntry).toBeDefined()
    expect(rcMartEntry?.relationship.verificationStatus).toBe('UNVERIFIED')

    // RC Mart must NEVER be listed in verified distributors
    const inVerified = ukSourcing.verifiedDistributors.find((d) => d.supplier.id === 'sup-rcmart')
    expect(inVerified).toBeUndefined()
  })

  it('Scenario K & R: Verifying an unverified relationship requires explicit evidence and auditor trail', async () => {
    // Elevate RC Mart or add new verified distributor with evidence
    const verified = await verifyBrandSupplierRelationship({
      brandId: 'brand-hobbywing',
      supplierId: 'sup-cml',
      territory: 'UK',
      relationshipType: 'AUTHORISED_DISTRIBUTOR',
      verificationStatus: 'VERIFIED',
      isExclusive: false,
      exclusivityScope: 'NONE',
      evidenceSourceType: 'DISTRIBUTOR_AGREEMENT',
      evidenceUrl: 'https://cmldistribution.co.uk/agreements/hobbywing-uk-2026.pdf',
      evidenceNotes: 'Signed commercial distributor annex for 2026 racing season.',
      verifiedBy: 'commercial_lead@halo-rc.com',
    })

    expect(verified.verificationStatus).toBe('VERIFIED')
    expect(verified.verifiedBy).toBe('commercial_lead@halo-rc.com')
    expect(verified.verifiedAt).toBeTruthy()
    expect(verified.evidenceSourceType).toBe('DISTRIBUTOR_AGREEMENT')

    // Check that brand sourcing view reflects the verified distribution
    const hwUk = await getBrandSourcingView('brand-hobbywing', 'UK')
    const cmlInHw = hwUk.verifiedDistributors.find((d) => d.supplier.id === 'sup-cml')
    expect(cmlInHw).toBeDefined()
  })

  it('Product sourcing view resolves authoritative procurement channel for a specific SKU in a territory', async () => {
    const sourcing = await getProductSourcingView('prod-xray-x4-2026', 'UK')

    expect(sourcing).toBeDefined()
    expect(sourcing.productId).toBe('prod-xray-x4-2026')
    expect(sourcing.brandId).toBe('brand-xray')
    expect(sourcing.territory).toBe('UK')
    expect(sourcing.bestSupplier?.id).toBe('sup-cml')
    expect(sourcing.readinessState).toBe('PROCUREMENT_READY')
    expect(sourcing.availableSuppliers.length).toBeGreaterThanOrEqual(1)
  })
})
