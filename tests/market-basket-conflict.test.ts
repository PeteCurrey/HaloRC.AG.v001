// tests/market-basket-conflict.test.ts
// Phase 9: Scenario C — Market switch basket conflict handling & currency isolation.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateBasket,
  getBasket,
  addToBasket,
  handleMarketSwitchBasket,
  __resetCommerceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetCommerceStoreForTesting()
})

describe('Phase 9 — Basket Conflict Handling on Market Switch (Scenario C)', () => {
  it('Scenario C1: customer with active UK basket chooses KEEP_CURRENT', async () => {
    const ukBasket = await getOrCreateBasket({
      basketId: null,
      userId: 'usr-customer-uk',
      marketCode: 'UK',
    })

    await addToBasket(ukBasket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
    })

    const initial = await getBasket(ukBasket.id)
    expect(initial?.marketCode).toBe('UK')
    expect(initial?.currency).toBe('GBP')
    expect(initial?.items).toHaveLength(1)

    // User triggers market switch to US with KEEP_CURRENT
    const switchResult = await handleMarketSwitchBasket({
      basketId: ukBasket.id,
      targetMarket: 'US',
      action: 'KEEP_CURRENT',
      userId: 'usr-customer-uk',
    })

    expect(switchResult.switched).toBe(false)
    expect(switchResult.basket.marketCode).toBe('UK')
    expect(switchResult.basket.currency).toBe('GBP')
    expect(switchResult.basket.items).toHaveLength(1)
    expect(switchResult.message).toContain('Retained current UK basket')
  })

  it('Scenario C2: customer with active UK basket chooses START_NEW (preserves previous cart)', async () => {
    const ukBasket = await getOrCreateBasket({
      basketId: null,
      userId: 'usr-customer-dual',
      marketCode: 'UK',
    })

    await addToBasket(ukBasket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 1,
      marketCode: 'UK',
    })

    // Switch to US with START_NEW
    const switchResult = await handleMarketSwitchBasket({
      basketId: ukBasket.id,
      targetMarket: 'US',
      action: 'START_NEW',
      userId: 'usr-customer-dual',
    })

    expect(switchResult.switched).toBe(true)
    expect(switchResult.basket.marketCode).toBe('US')
    expect(switchResult.basket.currency).toBe('USD')
    expect(switchResult.basket.items).toHaveLength(0) // New fresh basket for US

    // Crucial: Previous UK basket was NOT deleted or overwritten!
    const oldUkBasket = await getBasket(ukBasket.id)
    expect(oldUkBasket).not.toBeNull()
    expect(oldUkBasket?.marketCode).toBe('UK')
    expect(oldUkBasket?.currency).toBe('GBP')
    expect(oldUkBasket?.items).toHaveLength(1)
    expect(oldUkBasket?.items[0]?.productId).toBe('prod-xray-x4-2026')
  })

  it('prohibits adding US offer to a UK basket (Strict Market Isolation)', async () => {
    const ukBasket = await getOrCreateBasket({
      basketId: null,
      userId: 'usr-attacker',
      marketCode: 'UK',
    })

    // Attempt to add a product using US marketCode to UK basket
    await expect(
      addToBasket(ukBasket.id, {
        productId: 'prod-traxxas-xmaxx-8s',
        quantity: 1,
        marketCode: 'US' as any, // Cross-market attempt
      })
    ).rejects.toThrow()
  })
})
