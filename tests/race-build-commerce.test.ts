// tests/race-build-commerce.test.ts
// Phase 6 — Halo Build commerce integration: add-to-basket with build provenance.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateBasket,
  getBasket,
  addToBasket,
  __resetCommerceStoreForTesting,
  __resetRaceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetCommerceStoreForTesting()
  __resetRaceStoreForTesting()
})

describe('Halo Build provenance in basket', () => {
  it('records build provenance on basket items when buildProvenance is supplied', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-001', marketCode: 'UK' })

    await addToBasket(basket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
      buildProvenance: {
        buildId: 'hbld-x4-comp-001',
        buildVersion: '1.0',
        buildSlug: 'halo-x4-competition-spec',
        buildRole: 'BASE_MACHINE',
      },
    })

    const updated = await getBasket(basket.id)
    const item = updated?.items[0]
    expect(item).toBeDefined()
    expect(item?.buildId).toBe('hbld-x4-comp-001')
    expect(item?.buildVersion).toBe('1.0')
    expect(item?.buildSlug).toBe('halo-x4-competition-spec')
    expect(item?.buildRole).toBe('BASE_MACHINE')
  })

  it('items without build provenance have null build fields', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-001', marketCode: 'UK' })
    await addToBasket(basket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
    })
    const updated = await getBasket(basket.id)
    const item = updated?.items[0]
    expect(item?.buildId ?? null).toBeNull()
  })

  it('multiple build components can be added to the same basket with same build provenance', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-001', marketCode: 'UK' })

    // Add two components from the same Halo Build
    await addToBasket(basket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
      buildProvenance: {
        buildId: 'hbld-x4-comp-001',
        buildVersion: '1.0',
        buildSlug: 'halo-x4-competition-spec',
        buildRole: 'BASE_MACHINE',
      },
    })
    await addToBasket(basket.id, {
      productId: 'prod-hw-v10-g4-135t',
      quantity: 1,
      marketCode: 'UK',
      buildProvenance: {
        buildId: 'hbld-x4-comp-001',
        buildVersion: '1.0',
        buildSlug: 'halo-x4-competition-spec',
        buildRole: 'MOTOR',
      },
    })

    const updated = await getBasket(basket.id)
    expect(updated?.items).toHaveLength(2)
    const buildItems = updated?.items.filter((i) => i.buildId === 'hbld-x4-comp-001') ?? []
    expect(buildItems).toHaveLength(2)
  })

  it('build provenance does not affect market pricing — product graph remains authoritative', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-001', marketCode: 'UK' })
    await addToBasket(basket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
      buildProvenance: {
        buildId: 'hbld-x4-comp-001',
        buildVersion: '1.0',
        buildSlug: 'halo-x4-competition-spec',
        buildRole: 'BASE_MACHINE',
      },
    })
    const updated = await getBasket(basket.id)
    const item = updated?.items[0]!
    expect(item.currency).toBe('GBP')
    expect(item.unitPriceMinorUnits).toBeGreaterThan(0)
  })
})
