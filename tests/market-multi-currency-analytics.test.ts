// tests/market-multi-currency-analytics.test.ts
// Phase 9: Scenarios J & M — Catalogue completeness & segregated multi-currency analytics.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getMarketCompletenessReport,
  getMultiMarketAnalytics,
  createPendingOrder,
  markOrderPaid,
  createCheckoutSnapshot,
  getOrCreateBasket,
  addToBasket,
  __resetMarketsStoreForTesting,
  __resetCommerceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetMarketsStoreForTesting()
  __resetCommerceStoreForTesting()
})

describe('Phase 9 — Multi-Market Analytics & Reporting (Scenarios J & M)', () => {
  it('Scenario J: generates completeness report for UK and US independently', async () => {
    const report = await getMarketCompletenessReport()
    expect(report).toHaveLength(2)

    const uk = report.find((r) => r.marketCode === 'UK')!
    const us = report.find((r) => r.marketCode === 'US')!

    expect(uk.totalProductsCount).toBeGreaterThan(0)
    expect(uk.offeredProductsCount).toBeGreaterThan(0)
    expect(uk.coveragePercentage).toBeGreaterThanOrEqual(0)
    expect(uk.coveragePercentage).toBeLessThanOrEqual(100)
    expect(['COMPLETE', 'PARTIAL', 'MISSING']).toContain(uk.status)

    expect(us.totalProductsCount).toBeGreaterThan(0)
    expect(us.offeredProductsCount).toBeGreaterThan(0)
    expect(['COMPLETE', 'PARTIAL', 'MISSING']).toContain(us.status)
  })

  it('Scenario M: segregated multi-currency analytics enforces zero cross-currency addition', async () => {
    const analytics = getMultiMarketAnalytics()
    expect(analytics.markets).toHaveLength(2)

    const uk = analytics.markets.find((m) => m.marketCode === 'UK')!
    const us = analytics.markets.find((m) => m.marketCode === 'US')!

    expect(uk.currency).toBe('GBP')
    expect(us.currency).toBe('USD')

    // UK metrics
    expect(uk.totalOrders).toBe(1)
    expect(uk.grossRevenueMinorUnits).toBe(72900) // Initial £729.00 order
    expect(uk.averageOrderValueMinorUnits).toBe(72900)

    // US metrics
    expect(us.totalOrders).toBe(1)
    expect(us.grossRevenueMinorUnits).toBe(114900) // Initial $1,149.00 order
    expect(us.averageOrderValueMinorUnits).toBe(114900)

    // INVARIANT CHECK: There is NO single "totalGrossRevenue" adding £ + $
    expect((analytics as any).totalGrossRevenue).toBeUndefined()
    expect((analytics as any).combinedRevenue).toBeUndefined()
  })

  it('adding and paying a new US order updates only US analytics', async () => {
    const usBasket = await getOrCreateBasket({
      basketId: null,
      userId: 'usr-new-us',
      marketCode: 'US',
    })

    await addToBasket(usBasket.id, {
      productId: 'prod-traxxas-xmaxx-8s',
      quantity: 1,
      marketCode: 'US',
    })

    const snapshot = await createCheckoutSnapshot(usBasket.id, 'usr-new-us')
    const pendingOrder = await createPendingOrder(snapshot, 'usr-new-us')
    await markOrderPaid({ orderId: pendingOrder.id })

    const updated = getMultiMarketAnalytics()
    const uk = updated.markets.find((m) => m.marketCode === 'UK')!
    const us = updated.markets.find((m) => m.marketCode === 'US')!

    // UK remains completely unchanged
    expect(uk.totalOrders).toBe(1)
    expect(uk.grossRevenueMinorUnits).toBe(72900)

    // US increased by 1 order
    expect(us.totalOrders).toBe(2)
    expect(us.grossRevenueMinorUnits).toBe(114900 + snapshot.totalMinorUnits)
  })
})
