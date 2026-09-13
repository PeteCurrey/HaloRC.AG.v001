// tests/supplier-procurement-readiness.test.ts
// Phase 11 — 7-Factor Procurement Readiness Evaluator & Purchase Gating (Scenarios N, O)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateProcurementReadiness,
  setSupplierCommercialTerms,
  createSupplier,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Phase 11: 7-Factor Procurement Readiness Engine (Scenarios N, O)', () => {
  it('Scenario N: Authoritative verified supplier achieves 100% readiness and PROCUREMENT_READY state', async () => {
    const readiness = await calculateProcurementReadiness('sup-cml', 'brand-xray')

    expect(readiness.supplierId).toBe('sup-cml')
    expect(readiness.brandId).toBe('brand-xray')
    expect(readiness.isProcurementReady).toBe(true)
    expect(readiness.score).toBe(100)
    expect(readiness.state).toBe('PROCUREMENT_READY')
    expect(readiness.blockers.length).toBe(0)
    expect(readiness.checklist.hasVerifiedRelationship).toBe(true)
    expect(readiness.checklist.hasApprovedAccount).toBe(true)
    expect(readiness.checklist.isTerritorySupported).toBe(true)
    expect(readiness.checklist.hasVerifiedTerms).toBe(true)
    expect(readiness.checklist.hasActiveFeedOrOffer).toBe(true)
    expect(readiness.checklist.hasVerifiedProductMappings).toBe(true)
    expect(readiness.checklist.hasFreshInventory).toBe(true)
    expect(readiness.nextRecommendedAction).toContain('fully authorized')
  })

  it('Scenario O: Unverified brand relationship blocks procurement readiness and reports action', async () => {
    // RC Mart has an unverified relationship claim for Team XRAY
    const readiness = await calculateProcurementReadiness('sup-rcmart', 'brand-xray')

    expect(readiness.isProcurementReady).toBe(false)
    expect(readiness.checklist.hasVerifiedRelationship).toBe(false)
    expect(readiness.state).toBe('RELATIONSHIP_UNVERIFIED')
    expect(readiness.blockers).toContain(
      'Brand "brand-xray" is not officially verified as distributed by this supplier.'
    )
    expect(readiness.nextRecommendedAction).toContain(
      'Obtain manufacturer distribution authorization evidence'
    )
  })

  it('Newly created supplier starts in NOT_READY / blocked state across missing factors', async () => {
    const newSupplier = await createSupplier(
      {
        name: 'Schumacher Racing UK',
        slug: 'schumacher-racing-uk',
        supplierType: 'DIRECT_BRAND',
        country: 'GB',
        currency: 'GBP',
        relationshipStatus: 'PROSPECTIVE',
        integrationType: 'MANUAL',
      },
      'admin-usr'
    )

    const readiness = await calculateProcurementReadiness(newSupplier.id)

    expect(readiness.isProcurementReady).toBe(false)
    expect(readiness.score).toBeLessThan(50)
    expect(readiness.checklist.hasApprovedAccount).toBe(false)
    expect(readiness.checklist.hasVerifiedTerms).toBe(false)
    expect(readiness.blockers.length).toBeGreaterThan(0)
  })

  it('Verifying commercial terms satisfies the terms factor in the 7-factor checklist', async () => {
    // sup-horizon-us: check initial readiness
    const initial = await calculateProcurementReadiness('sup-horizon-us', 'brand-arrma')

    // Set verified commercial terms
    await setSupplierCommercialTerms({
      supplierId: 'sup-horizon-us',
      currency: 'USD',
      paymentTerms: 'NET_30',
      paymentTermsDays: 30,
      minimumOrderQuantityUnits: 1,
      minimumOrderValueMinorUnits: 50000,
      dropShipAvailable: true,
      isVerified: true,
      verifiedBy: 'buyer@halo-rc.com',
    })

    const updated = await calculateProcurementReadiness('sup-horizon-us', 'brand-arrma')
    expect(updated.checklist.hasVerifiedTerms).toBe(true)
    expect(updated.score).toBeGreaterThanOrEqual(initial.score)
  })
})
