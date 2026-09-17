// tests/supplier-inventory-authority.test.ts
// Phase 8 — Inventory authority separation, timestamped freshness, and AI advisory grounding (Scenarios E, G & L)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSupplierOffersForProduct,
  ingestSupplierFeed,
  createSupplier,
  __resetProcurementStoreForTesting,
  __addSupplierOfferForTesting,
} from '@halo-rc/db'
import { consultSupplierStock } from '@/lib/ai/consultation'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Scenario E — Inventory authority separation (OWN_STOCK vs SUPPLIER_STOCK)', () => {
  it('records supplier quantity as SUPPLIER_STOCK authority and never claims Halo RC owns the units', async () => {
    await ingestSupplierFeed('sup-cml', [
      {
        supplierSku: 'XRAY-300040',
        manufacturerSku: 'XRAY-300040',
        title: 'XRAY X4 Kit',
        cost: 49500,
        currency: 'GBP',
        availability: 'in stock',
        quantity: 2, // Supplier reports 2 units in their warehouse
        leadTimeDays: 2,
        leadTimeText: '1–2 days distributor dispatch',
      },
    ])

    const offers = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const offer = offers.find((o) => o.supplierId === 'sup-cml')!

    // INVARIANT: Inventory authority is strictly SUPPLIER_STOCK
    expect(offer.inventoryAuthority).toBe('SUPPLIER_STOCK')
    expect(offer.quantity).toBe(2)
    expect(offer.leadTimeText).toContain('1–2 days')
  })
})

describe('Scenario G — Stale supplier data & freshness tracking', () => {
  it('tracks freshness state and verification timestamps on supplier offers', async () => {
    const offers = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const offer = offers.find((o) => o.supplierId === 'sup-cml')!

    expect(offer.freshnessState).toBe('FRESH')
    expect(offer.lastCheckedAt).toBeTruthy()
    // Verification timestamp is valid ISO string
    expect(new Date(offer.lastCheckedAt).getTime()).not.toBeNaN()
  })
})

describe('Scenario L — Grounded AI inventory consultation', () => {
  it('AI consultation explicitly identifies SUPPLIER_STOCK authority and reports check timestamp', async () => {
    // For the GROUNDED path we need a supplier with ACTIVE relationship status,
    // since selectBestSupplierOffer gates on relationshipStatus === 'ACTIVE'.
    // No seeded supplier is currently ACTIVE (all are PROSPECT/RESEARCH — real business state).
    // We create a dedicated ACTIVE test supplier and inject a fresh offer to exercise the path.
    const activeSup = await createSupplier(
      {
        name: 'Test Grounded Distributor',
        slug: `test-grounded-dist-${Date.now()}`,
        supplierType: 'DISTRIBUTOR',
        country: 'GB',
        currency: 'GBP',
        relationshipStatus: 'ACTIVE',
        integrationType: 'CSV',
      },
      'admin-usr'
    )

    __addSupplierOfferForTesting({
      id: `so-grounded-test-${Date.now()}`,
      canonicalProductId: 'prod-xray-x4-2026',
      canonicalVariantId: 'var-xray-x4-2026-kit',
      supplierId: activeSup.id,
      supplierName: 'Test Grounded Distributor',
      supplierSku: 'XRAY-300040-GROUNDED',
      costMinorUnits: 50000,
      currency: 'GBP',
      supplierRrpMinorUnits: 72900,
      availability: 'IN_STOCK',
      inventoryAuthority: 'SUPPLIER_STOCK',
      quantity: 8,
      leadTimeDays: 2,
      leadTimeText: '1–2 Days',
      marketCode: 'UK',
      freshnessState: 'FRESH',
      lastCheckedAt: new Date().toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const response = await consultSupplierStock('prod-xray-x4-2026', 'UK')

    expect(response.groundingState).toBe('GROUNDED')
    expect(response.intent).toBe('MARKET_AVAILABILITY')

    // Must disclose that stock is held by distributor rather than physical Halo RC workshop
    expect(response.answer).toContain('Distributor Sourcing Status')
    expect(response.answer).toContain('distributor inventory authority')
    expect(response.warnings.some((w) => w.includes('SUPPLIER_STOCK'))).toBe(true)

    // Strictly REDACTS wholesale cost, margins, and supplier account numbers
    expect(response.answer).not.toContain('50000')
    expect(response.answer).not.toContain('margin')
    expect(response.answer).not.toContain('ACC-HALO-UK-01')
  })

  it('AI consultation reports INSUFFICIENT_EVIDENCE when no verified supply feed exists', async () => {
    const response = await consultSupplierStock('prod-does-not-exist', 'UK')

    expect(response.groundingState).toBe('INSUFFICIENT_EVIDENCE')
    expect(response.answer).toContain('not currently held in Avorria RC physical workshop inventory')
    expect(response.warnings.length).toBeGreaterThan(0)
  })
})
