// tests/supplier-diffing-sync.test.ts
// Phase 8 — Diff detection, product disappearance safety, and feed failure resilience (Scenarios C, D & F)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ingestSupplierFeed,
  handleProductDisappearance,
  getSupplierOffersForProduct,
  getSupplierChangeEvents,
  getSupplierSyncRuns,
  SEED_PRODUCTS,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Scenario C — Product disappearance from supplier feed', () => {
  it('marks supplier offer stale/unavailable when dropped from feed, while canonical product remains intact', async () => {
    // 1. Verify canonical product exists before
    const canonicalBefore = SEED_PRODUCTS.find((p) => p.id === 'prod-xray-x4-2026')
    expect(canonicalBefore).not.toBeNull()
    expect(canonicalBefore?.published).toBe(true)

    // 2. Simulate product disappearance from CML feed
    await handleProductDisappearance('sup-cml', 'XRAY-300040')

    // 3. Supplier offer is marked stale and unavailable
    const offers = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const cmlOffer = offers.find((o) => o.supplierId === 'sup-cml')!

    expect(cmlOffer.status).toBe('STALE')
    expect(cmlOffer.availability).toBe('NOT_AVAILABLE')
    expect(cmlOffer.freshnessState).toBe('EXPIRED')

    // 4. INVARIANT: Canonical Halo RC product remains untouched and published
    const canonicalAfter = SEED_PRODUCTS.find((p) => p.id === 'prod-xray-x4-2026')
    expect(canonicalAfter).not.toBeNull()
    expect(canonicalAfter?.id).toBe('prod-xray-x4-2026')
    expect(canonicalAfter?.published).toBe(true)

    // 5. Diff event was logged in audit trail
    const events = await getSupplierChangeEvents('sup-cml')
    expect(events.some((e) => e.changeType === 'REMOVED_FROM_FEED')).toBe(true)
  })
})

describe('Scenario D — Supplier wholesale price drift detection', () => {
  it('detects wholesale cost change, updates offer, and records diff event', async () => {
    // Ingest updated feed where cost increases from 49500 to 51000 (£495 -> £510)
    const syncRun = await ingestSupplierFeed('sup-cml', [
      {
        supplierSku: 'XRAY-300040',
        manufacturerSku: 'XRAY-300040',
        title: 'XRAY X4 Kit',
        cost: 51000,
        currency: 'GBP',
        availability: 'in stock',
      },
    ])

    expect(syncRun.recordsChanged).toBeGreaterThanOrEqual(1)

    // Verify updated supplier offer
    const offers = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const cmlOffer = offers.find((o) => o.supplierId === 'sup-cml')!
    expect(cmlOffer.costMinorUnits).toBe(51000)

    // Verify diff event logged
    const events = await getSupplierChangeEvents('sup-cml')
    const costEvent = events.find((e) => e.changeType === 'COST_CHANGED')
    expect(costEvent).toBeDefined()
    expect(costEvent?.oldValue).toBe(49500)
    expect(costEvent?.newValue).toBe(51000)
  })
})

describe('Scenario F — Supplier feed failure resilience', () => {
  it('retains previous valid state when a sync fails or contains rejected items', async () => {
    const offersBefore = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const cmlOfferBefore = offersBefore.find((o) => o.supplierId === 'sup-cml')!
    const costBefore = cmlOfferBefore.costMinorUnits

    // Run feed with an invalid item missing supplier SKU
    const syncRun = await ingestSupplierFeed('sup-cml', [
      {
        supplierSku: '', // Invalid empty SKU
        title: 'Corrupted item payload',
        cost: 1000,
        currency: 'GBP',
        availability: 'in stock',
      },
    ])

    expect(syncRun.recordsRejected).toBe(1)
    expect(syncRun.warnings.length).toBeGreaterThan(0)

    // INVARIANT: Previous valid state is completely retained
    const offersAfter = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const cmlOfferAfter = offersAfter.find((o) => o.supplierId === 'sup-cml')!
    expect(cmlOfferAfter.costMinorUnits).toBe(costBefore)
    expect(cmlOfferAfter.availability).toBe(cmlOfferBefore.availability)
  })

  it('is idempotent when the same feed is ingested multiple times', async () => {
    const feed = [
      {
        supplierSku: 'XRAY-300040',
        manufacturerSku: 'XRAY-300040',
        title: 'XRAY X4 Kit',
        cost: 49500,
        currency: 'GBP' as const,
        availability: 'in stock',
      },
    ]

    const run1 = await ingestSupplierFeed('sup-cml', feed)
    const run2 = await ingestSupplierFeed('sup-cml', feed)

    expect(run1.status).toBe('COMPLETED')
    expect(run2.status).toBe('COMPLETED')
    // No spurious duplicate offers created
    const offers = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const cmlOffers = offers.filter((o) => o.supplierId === 'sup-cml')
    expect(cmlOffers.length).toBe(1)
  })
})
