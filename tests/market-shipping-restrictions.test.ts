// tests/market-shipping-restrictions.test.ts
// Phase 9: Scenarios F, G, H — Shipping methods, free thresholds & hazardous/oversize constraints.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getShippingMethodsForMarket,
  checkShippingEligibility,
  __resetMarketsStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetMarketsStoreForTesting()
})

describe('Phase 9 — Shipping Methods & Eligibility Engine (Scenarios F, G, H)', () => {
  describe('Scenario F — Free Shipping Thresholds by Market', () => {
    it('UK: charges £4.95 under £50 threshold, free over £50 threshold', () => {
      // Below £50 (£30 subtotal = 3000 minor units)
      const underThreshold = getShippingMethodsForMarket('UK', 3000)
      const stdUnder = underThreshold.find((m) => m.id === 'ship-uk-std')!
      expect(stdUnder.costMinorUnits).toBe(495)

      // Above £50 (£75 subtotal = 7500 minor units)
      const overThreshold = getShippingMethodsForMarket('UK', 7500)
      const stdOver = overThreshold.find((m) => m.id === 'ship-uk-std')!
      expect(stdOver.costMinorUnits).toBe(0) // Free shipping applied
    })

    it('US: charges $9.95 under $100 threshold, free over $100 threshold', () => {
      // Below $100 ($80 subtotal = 8000 minor units)
      const underThreshold = getShippingMethodsForMarket('US', 8000)
      const stdUnder = underThreshold.find((m) => m.id === 'ship-us-std')!
      expect(stdUnder.costMinorUnits).toBe(995)

      // Above $100 ($150 subtotal = 15000 minor units)
      const overThreshold = getShippingMethodsForMarket('US', 15000)
      const stdOver = overThreshold.find((m) => m.id === 'ship-us-std')!
      expect(stdOver.costMinorUnits).toBe(0) // Free shipping applied
    })

    it('Express methods never apply free shipping thresholds', () => {
      const ukOver = getShippingMethodsForMarket('UK', 100000)
      const expUk = ukOver.find((m) => m.id === 'ship-uk-exp')!
      expect(expUk.costMinorUnits).toBe(895) // Always full price

      const usOver = getShippingMethodsForMarket('US', 100000)
      const expUs = usOver.find((m) => m.id === 'ship-us-exp')!
      expect(expUs.costMinorUnits).toBe(2495) // Always full price
    })
  })

  describe('Scenario G — Hazardous Item Restrictions (LiPo Battery)', () => {
    it('allows compliant quantity of hazardous LiPo battery (<= 2)', () => {
      const result = checkShippingEligibility(
        'ship-uk-std',
        'GB',
        [{ productId: 'prod-lipo-battery-comp', quantity: 2 }]
      )

      expect(result.eligible).toBe(true)
      expect(result.requiresSpecialHandling).toBe(true)
      expect(result.isHazardous).toBe(true)
    })

    it('rejects consignment exceeding maximum hazardous quantity limit (> 2)', () => {
      const result = checkShippingEligibility(
        'ship-uk-std',
        'GB',
        [{ productId: 'prod-lipo-battery-comp', quantity: 3 }]
      )

      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toContain('exceeds maximum allowed consignment limit')
    })
  })

  describe('Scenario H — Oversize Freight Constraints (1/5 Scale)', () => {
    it('allows single 1/5 scale freight chassis and flags special handling', () => {
      const result = checkShippingEligibility(
        'ship-us-std',
        'US',
        [{ productId: 'prod-large-scale-5t-gas', quantity: 1 }]
      )

      expect(result.eligible).toBe(true)
      expect(result.isOversize).toBe(true)
      expect(result.requiresSpecialHandling).toBe(true)
      expect(result.restrictionNote).toContain('oversize transport surcharge')
    })

    it('rejects consignment exceeding oversize freight limit (> 1)', () => {
      const result = checkShippingEligibility(
        'ship-us-std',
        'US',
        [{ productId: 'prod-large-scale-5t-gas', quantity: 2 }]
      )

      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toContain('exceeds maximum allowed consignment limit')
    })
  })

  describe('Destination Region Alignment', () => {
    it('rejects UK domestic method for US destination address', () => {
      const result = checkShippingEligibility('ship-uk-std', 'US', [])
      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toContain('does not service destination')
    })

    it('rejects US domestic method for GB destination address', () => {
      const result = checkShippingEligibility('ship-us-std', 'GB', [])
      expect(result.eligible).toBe(false)
      expect(result.reasons[0]).toContain('does not service destination')
    })
  })
})
