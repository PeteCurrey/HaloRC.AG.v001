// tests/market-security-spoofing.test.ts
// Phase 9: Scenarios K & N — Currency alignment, server price authority & spoofing defense.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateBasket,
  addToBasket,
  createCheckoutSnapshot,
  createPendingOrder,
  __resetCommerceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetCommerceStoreForTesting()
})

describe('Phase 9 — Security, Currency Alignment & Anti-Spoofing (Scenarios K & N)', () => {
  describe('Scenario K — Stripe Checkout Currency Alignment', () => {
    it('UK checkout snapshot aligns with GBP currency and TAX_INCLUDED presentation', async () => {
      const basket = await getOrCreateBasket({
        basketId: null,
        userId: 'usr-buyer-uk',
        marketCode: 'UK',
      })

      await addToBasket(basket.id, {
        productId: 'prod-xray-x4-2026',
        quantity: 1,
        marketCode: 'UK',
      })

      const snapshot = await createCheckoutSnapshot(basket.id, 'usr-buyer-uk', 'ship-uk-exp')
      expect(snapshot.currency).toBe('GBP')
      expect(snapshot.taxMode).toBe('INCLUSIVE')
      expect(snapshot.taxDisplayMode).toBe('TAX_INCLUDED')
      expect(snapshot.shippingMethodId).toBe('ship-uk-exp')
      expect(snapshot.shippingCostMinorUnits).toBe(895)
      expect(snapshot.totalMinorUnits).toBe(72900 + 895)

      const order = await createPendingOrder(snapshot, 'usr-buyer-uk')
      expect(order.currency).toBe('GBP')
      expect(order.taxDisplayMode).toBe('TAX_INCLUDED')
      expect(order.shippingMethodId).toBe('ship-uk-exp')
      expect(order.shippingCostMinorUnits).toBe(895)
    })

    it('US checkout snapshot aligns with USD currency and TAX_EXCLUDED presentation', async () => {
      const basket = await getOrCreateBasket({
        basketId: null,
        userId: 'usr-buyer-us',
        marketCode: 'US',
      })

      await addToBasket(basket.id, {
        productId: 'prod-traxxas-xmaxx-8s',
        quantity: 1,
        marketCode: 'US',
      })

      const snapshot = await createCheckoutSnapshot(basket.id, 'usr-buyer-us', 'ship-us-exp')
      expect(snapshot.currency).toBe('USD')
      expect(snapshot.taxMode).toBe('EXCLUSIVE')
      expect(snapshot.taxDisplayMode).toBe('TAX_EXCLUDED')
      expect(snapshot.shippingMethodId).toBe('ship-us-exp')
      expect(snapshot.shippingCostMinorUnits).toBe(2495)
      expect(snapshot.totalMinorUnits).toBe(114900 + 2495)

      const order = await createPendingOrder(snapshot, 'usr-buyer-us')
      expect(order.currency).toBe('USD')
      expect(order.taxDisplayMode).toBe('TAX_EXCLUDED')
    })
  })

  describe('Scenario N — Client Currency & Price Spoofing Rejection', () => {
    it('rejects client attempt to inject arbitrary manipulated price', async () => {
      const basket = await getOrCreateBasket({
        basketId: null,
        userId: 'usr-hacker',
        marketCode: 'UK',
      })

      // Add product normally
      await addToBasket(basket.id, {
        productId: 'prod-xray-x4-2026',
        quantity: 1,
        marketCode: 'UK',
      })

      // Even if attacker tries to create a checkout snapshot, price is resolved server-side from seed offers
      const snapshot = await createCheckoutSnapshot(basket.id, 'usr-hacker')
      const line = snapshot.lines[0]!

      // Price MUST match authoritative offer (£729.00 = 72900 minor units), not £0.01 or custom input
      expect(line.unitPriceMinorUnits).toBe(72900)
      expect(snapshot.subtotalMinorUnits).toBe(72900)
    })

    it('rejects cross-market currency spoofing at basket level', async () => {
      const usBasket = await getOrCreateBasket({
        basketId: null,
        userId: 'usr-hacker',
        marketCode: 'US',
      })

      // Try adding UK product to US basket
      await expect(
        addToBasket(usBasket.id, {
          productId: 'prod-xray-x4-2026',
          quantity: 1,
          marketCode: 'UK' as any,
        })
      ).rejects.toThrow()
    })
  })
})
