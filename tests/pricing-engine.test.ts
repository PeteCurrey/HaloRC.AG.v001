// tests/pricing-engine.test.ts
// Vitest suite verifying the Fail-Closed Pricing Engine, FX conversions,
// UK/US tax rules, and server-side margin protection.

import { describe, it, expect } from 'vitest'
import { PricingEngine } from '@halo-rc/db'

describe('PricingEngine Unit & Commercial Integrity', () => {
  it('fails closed when category has configured = false', async () => {
    const engine = new PricingEngine()
    // Mock the rules cache directly for unit test
    ;(engine as any).rulesCache.set('COMPLETE_KIT', {
      id: 'pr-complete-kit',
      category: 'COMPLETE_KIT',
      markupPercentage: null,
      roundingRule: 'ROUND_WHOLE',
      minimumMarginPercentage: null,
      configured: false,
    })
    ;(engine as any).fxCache.set('EUR:GBP', 0.8542)

    const result = engine.calculatePrice({
      netEur: 529.0,
      category: 'COMPLETE_KIT',
      market: 'GB',
    })

    expect(result.canSell).toBe(false)
    expect(result.retailPrice).toBeNull()
    expect(result.reasonIfNotSellable).toContain('PRICING_NOT_CONFIGURED')
  })

  it('correctly calculates UK retail price with VAT and rounding when configured', () => {
    const engine = new PricingEngine()
    ;(engine as any).rulesCache.set('COMPLETE_KIT', {
      id: 'pr-complete-kit',
      category: 'COMPLETE_KIT',
      markupPercentage: '40', // 40% markup on landed cost
      roundingRule: 'ROUND_WHOLE',
      minimumMarginPercentage: '20',
      configured: true,
    })
    ;(engine as any).fxCache.set('EUR:GBP', 0.8542)

    // Net €529 + €15 shipping = €544 * 1.02 duty = €554.88
    // Landed GBP = 554.88 * 0.8542 = £473.978
    // Ex-Tax = £473.978 * 1.40 = £663.57
    // UK VAT 20% = £663.57 * 1.20 = £796.28 -> Rounded whole: £796.00
    const result = engine.calculatePrice({
      netEur: 529.0,
      category: 'COMPLETE_KIT',
      market: 'GB',
      shippingEur: 15.0,
      dutyRate: 0.02,
    })

    expect(result.canSell).toBe(true)
    expect(result.displayCurrency).toBe('GBP')
    expect(result.taxInclusive).toBe(true)
    expect(result.retailPrice).toBe(796)
    expect(result.retailPriceMinor).toBe(79600)
    expect(result._internal?.landedCost).toBeCloseTo(473.98, 1)
    expect(result._internal?.grossMarginPercentage).toBeGreaterThanOrEqual(20)
  })

  it('calculates US retail price without VAT', () => {
    const engine = new PricingEngine()
    ;(engine as any).rulesCache.set('OPTION_PART', {
      id: 'pr-option-part',
      category: 'OPTION_PART',
      markupPercentage: '50',
      roundingRule: 'ROUND_50',
      minimumMarginPercentage: '25',
      configured: true,
    })
    ;(engine as any).fxCache.set('EUR:USD', 1.0825)

    // Net €20 + €1.50 shipping = €21.50 * 1.02 duty = €21.93
    // Landed USD = 21.93 * 1.0825 = $23.74
    // Ex-Tax = $23.74 * 1.50 = $35.61
    // US: Pre-tax display -> Round to .50: $35.50
    const result = engine.calculatePrice({
      netEur: 20.0,
      category: 'OPTION_PART',
      market: 'US',
      shippingEur: 1.5,
      dutyRate: 0.02,
    })

    expect(result.canSell).toBe(true)
    expect(result.displayCurrency).toBe('USD')
    expect(result.taxInclusive).toBe(false)
    expect(result.retailPrice).toBe(35.5)
    expect(result.retailPriceMinor).toBe(3550)
  })

  it('blocks sale if margin is below required minimum threshold', () => {
    const engine = new PricingEngine()
    ;(engine as any).rulesCache.set('COMPLETE_KIT', {
      id: 'pr-complete-kit',
      category: 'COMPLETE_KIT',
      markupPercentage: '10', // 10% markup gives ~9.09% gross margin
      roundingRule: 'ROUND_WHOLE',
      minimumMarginPercentage: '25', // requires 25% minimum margin
      configured: true,
    })
    ;(engine as any).fxCache.set('EUR:GBP', 0.8542)

    const result = engine.calculatePrice({
      netEur: 529.0,
      category: 'COMPLETE_KIT',
      market: 'GB',
    })

    expect(result.canSell).toBe(false)
    expect(result.retailPrice).toBeNull()
    expect(result.reasonIfNotSellable).toContain('MARGIN_BELOW_MINIMUM')
  })
})
