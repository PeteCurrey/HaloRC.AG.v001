// tests/supplier-procurement-readiness.test.ts
// Phase 11 — 7-Factor Procurement Readiness Evaluator & Purchase Gating (Scenarios N, O)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateProcurementReadiness,
  setSupplierCommercialTerms,
  setSupplierTerritoryCoverage,
  verifyBrandSupplierRelationship,
  createSupplier,
  __resetProcurementStoreForTesting,
  __addSupplierOfferForTesting,
  __addSupplierMappingForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Phase 11: 7-Factor Procurement Readiness Engine (Scenarios N, O)', () => {
  it('Scenario N: Authoritative verified supplier achieves 100% readiness and PROCUREMENT_READY state', async () => {
    // Build a fully-qualified synthetic supplier with all 7 factors satisfied.
    // This tests the happy-path PROCUREMENT_READY gate using controlled in-test data,
    // not assumptions about real supplier statuses (which change as relationships progress).
    const supplier = await createSupplier(
      {
        name: 'Test Active Distributor',
        slug: `test-active-dist-${Date.now()}`,
        supplierType: 'DISTRIBUTOR',
        country: 'GB',
        currency: 'GBP',
        relationshipStatus: 'ACTIVE', // Explicitly ACTIVE — represents a confirmed trading relationship
        integrationType: 'CSV',        // non-MANUAL: satisfies hasActiveFeedOrOffer for factor 5
      },
      'admin-usr'
    )

    // Factor 1: Verified brand-supplier relationship
    await verifyBrandSupplierRelationship({
      supplierId: supplier.id,
      brandId: 'brand-xray',
      territory: 'UK',
      relationshipType: 'AUTHORIZED_DISTRIBUTOR',
      verificationStatus: 'VERIFIED',
      evidenceSourceType: 'DISTRIBUTOR_AGREEMENT',
      evidenceNotes: 'Test distributor agreement for Scenario N',
      verifiedBy: 'buyer@halo-rc.com',
    })

    // Factor 2: hasApprovedAccount — supplier.relationshipStatus === 'ACTIVE' satisfies this directly

    // Factor 3: Supported territory
    await setSupplierTerritoryCoverage({
      supplierId: supplier.id,
      territory: 'UK',
      state: 'SUPPORTED',
      verifiedBy: 'buyer@halo-rc.com',
    })

    // Factor 4: Verified commercial terms
    await setSupplierCommercialTerms({
      supplierId: supplier.id,
      currency: 'GBP',
      paymentTerms: 'NET_30',
      paymentTermsDays: 30,
      minimumOrderQuantityUnits: 1,
      minimumOrderValueMinorUnits: 10000,
      dropShipAvailable: false,
      isVerified: true,
      verifiedBy: 'buyer@halo-rc.com',
    })

    // Factors 5 & 7: Active offer with fresh inventory
    __addSupplierOfferForTesting({
      id: `so-test-dist-xray-uk-${Date.now()}`,
      canonicalProductId: 'prod-xray-x4-2026',
      canonicalVariantId: 'var-xray-x4-2026-kit',
      supplierId: supplier.id,
      supplierName: 'Test Active Distributor',
      supplierSku: 'XRAY-300040-TEST',
      costMinorUnits: 49500,
      currency: 'GBP',
      supplierRrpMinorUnits: 72900,
      availability: 'IN_STOCK',
      inventoryAuthority: 'SUPPLIER_STOCK',
      quantity: 10,
      leadTimeDays: 3,
      leadTimeText: '2–3 Days',
      marketCode: 'UK',
      freshnessState: 'FRESH',
      lastCheckedAt: new Date().toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // Factor 6: Verified product mapping
    __addSupplierMappingForTesting({
      id: `map-test-dist-xray-01-${Date.now()}`,
      supplierId: supplier.id,
      supplierSku: 'XRAY-300040-TEST',
      canonicalProductId: 'prod-xray-x4-2026',
      canonicalVariantId: 'var-xray-x4-2026-kit',
      canonicalProductName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      canonicalProductSku: 'XRAY-300040',
      matchMethod: 'EXACT_SKU',
      matchConfidenceCategory: 'EXACT_MATCH',
      status: 'MATCHED',
      reviewedBy: 'usr-admin-initial',
      reviewedAt: new Date().toISOString(),
      rawTitle: 'XRAY X4 2026 1/10 Touring Car Kit',
      rawBrand: 'XRAY',
      rawCostMinorUnits: 49500,
      rawCurrency: 'GBP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const readiness = await calculateProcurementReadiness(supplier.id, 'brand-xray')

    expect(readiness.supplierId).toBe(supplier.id)
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
