// tests/supplier-offer-isolation.test.ts
// Phase 8 — Multi-supplier sourcing, cost isolation, and market segregation (Scenarios H & I)

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSupplierOffersForProduct,
  selectBestSupplierOffer,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Scenario H — Multi-supplier sourcing for a single canonical product', () => {
  it('supports independent supplier offers for the same canonical product from different suppliers', async () => {
    // prod-xray-x4-2026 is sourced via both CML (UK) and RC Mart (US)
    const offers = await getSupplierOffersForProduct('prod-xray-x4-2026')
    expect(offers.length).toBeGreaterThanOrEqual(2)

    const cmlOffer = offers.find((o) => o.supplierId === 'sup-cml')
    const rcmartOffer = offers.find((o) => o.supplierId === 'sup-rcmart')

    expect(cmlOffer).toBeDefined()
    expect(rcmartOffer).toBeDefined()

    // Each supplier has independent cost, currency, lead time, and quantity
    expect(cmlOffer?.currency).toBe('GBP')
    expect(rcmartOffer?.currency).toBe('USD')
    expect(cmlOffer?.costMinorUnits).not.toBe(rcmartOffer?.costMinorUnits)
  })

  it('keeps supplier wholesale costs strictly separate from customer retail price', async () => {
    const offers = await getSupplierOffersForProduct('prod-xray-x4-2026', 'UK')
    const cmlOffer = offers.find((o) => o.supplierId === 'sup-cml')!

    // Wholesale cost is £495.00 (49500 minor units)
    expect(cmlOffer.costMinorUnits).toBe(49500)
    // Supplier RRP is £729.00 (72900 minor units)
    expect(cmlOffer.supplierRrpMinorUnits).toBe(72900)

    // Verify gross margin is positive and verifiable internally without exposing to client
    const marginMinorUnits = (cmlOffer.supplierRrpMinorUnits ?? 0) - cmlOffer.costMinorUnits
    expect(marginMinorUnits).toBe(23400) // £234.00 gross margin
  })
})

describe('Scenario I — Strict market isolation across supplier offers', () => {
  it('does NOT permit US market to inherit UK supplier offers', async () => {
    // prod-hw-v10-g4-135t only has a UK supplier offer (Hobbywing Direct UK)
    const ukOffers = await getSupplierOffersForProduct('prod-hw-v10-g4-135t', 'UK')
    const usOffers = await getSupplierOffersForProduct('prod-hw-v10-g4-135t', 'US')

    expect(ukOffers.length).toBeGreaterThanOrEqual(1)
    expect(usOffers.length).toBe(0) // No US supplier offer exists

    // Best offer resolver for US market returns null — no cross-market inheritance
    const bestUs = selectBestSupplierOffer('prod-hw-v10-g4-135t', 'US')
    expect(bestUs).toBeNull()

    const bestUk = selectBestSupplierOffer('prod-hw-v10-g4-135t', 'UK')
    expect(bestUk).not.toBeNull()
    expect(bestUk?.marketCode).toBe('UK')
    expect(bestUk?.currency).toBe('GBP')
  })

  it('selects best supplier offer deterministically based on stock, cost, and lead time', () => {
    const bestUk = selectBestSupplierOffer('prod-xray-x4-2026', 'UK')
    expect(bestUk).not.toBeNull()
    expect(bestUk?.supplierId).toBe('sup-cml')
    expect(bestUk?.availability).toBe('IN_STOCK')
  })
})
