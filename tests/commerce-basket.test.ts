// tests/commerce-basket.test.ts
// Phase 5 — Basket integrity, market isolation, price-change detection.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateBasket,
  getBasket,
  addToBasket,
  updateBasketItemQuantity,
  clearBasket,
  detectBasketPriceChanges,
  __resetCommerceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetCommerceStoreForTesting()
})

describe('Basket — creation and retrieval', () => {
  it('creates a new basket when no basketId is supplied', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    expect(basket.id).toBeTruthy()
    expect(basket.marketCode).toBe('UK')
    expect(basket.status).toBe('ACTIVE')
    expect(basket.items).toHaveLength(0)
  })

  it('returns the same basket when the same basketId is passed', async () => {
    const first = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    const second = await getOrCreateBasket({ basketId: first.id, userId: null, marketCode: 'UK' })
    expect(second.id).toBe(first.id)
  })

  it('creates a US-market basket with USD currency', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'US' })
    expect(basket.marketCode).toBe('US')
    expect(basket.currency).toBe('USD')
  })

  it('getBasket returns null for unknown basket', async () => {
    const result = await getBasket('non-existent-basket-id')
    expect(result).toBeNull()
  })
})

describe('Basket — add to basket', () => {
  it('adds an item to the basket from a known UK product', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    await addToBasket(basket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
    })
    const updated = await getBasket(basket.id)
    expect(updated?.items).toHaveLength(1)
    expect(updated?.items[0]?.productId).toBe('prod-xray-x4-2026')
    expect(updated?.items[0]?.quantity).toBe(1)
  })

  it('uses market-correct price and never crosses market boundaries', async () => {
    const ukBasket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    await addToBasket(ukBasket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
    })
    const updated = await getBasket(ukBasket.id)
    const item = updated?.items[0]
    expect(item?.currency).toBe('GBP')
    expect(item?.unitPriceMinorUnits).toBeGreaterThan(0)
  })

  it('throws when a product has no offer in the requested market', async () => {
    const usBasket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'US' })
    // prod-awesomatix-a800mx-kit has UK-only seed offer
    await expect(
      addToBasket(usBasket.id, {
        productId: 'prod-awesomatix-a800mx-kit',
        quantity: 1,
        marketCode: 'US',
      })
    ).rejects.toThrow()
  })

  it('increments quantity when adding the same product twice', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 2, marketCode: 'UK' })
    const updated = await getBasket(basket.id)
    const totalQty = updated?.items.reduce((s, i) => s + i.quantity, 0) ?? 0
    expect(totalQty).toBe(3)
  })
})

describe('Basket — quantity management', () => {
  it('updates item quantity', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    const updated = await getBasket(basket.id)
    const itemId = updated!.items[0]!.id
    await updateBasketItemQuantity(basket.id, itemId, 5)
    const final = await getBasket(basket.id)
    expect(final?.items[0]?.quantity).toBe(5)
  })

  it('removes an item when quantity is set to 0', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    const updated = await getBasket(basket.id)
    const itemId = updated!.items[0]!.id
    await updateBasketItemQuantity(basket.id, itemId, 0)
    const final = await getBasket(basket.id)
    expect(final?.items).toHaveLength(0)
  })
})

describe('Basket — clear and price-change detection', () => {
  it('clears all items from the basket', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    await clearBasket(basket.id)
    const cleared = await getBasket(basket.id)
    expect(cleared?.items).toHaveLength(0)
  })

  it('reports no price changes when prices are stable', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: null, marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    const result = await detectBasketPriceChanges(basket.id)
    expect(result.hasChanges).toBe(false)
    expect(result.changedItems).toHaveLength(0)
  })
})
