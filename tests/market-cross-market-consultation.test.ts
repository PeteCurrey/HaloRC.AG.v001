// tests/market-cross-market-consultation.test.ts
// Phase 9: Scenario I — AI Cross-market pricing inquiry consultation.

import { describe, it, expect } from 'vitest'
import { consultCrossMarketPrice } from '../apps/web/src/lib/ai/consultation'

describe('Phase 9 — AI Consultation Cross-Market Pricing (Scenario I)', () => {
  it('consults US price for UK customer without fabricating exchange rates', async () => {
    const res = await consultCrossMarketPrice('prod-traxxas-xmaxx-8s', 'US', 'UK')

    expect(res.groundingState).toBe('GROUNDED')
    expect(res.intent).toBe('PRODUCT_DISCOVERY')

    // Explains US price clearly
    expect(res.answer).toContain('US')
    expect(res.answer).toContain('$1149.00 USD')
    expect(res.answer).toContain('excl. tax')

    // Explains UK ordering requirement for UK delivery
    expect(res.answer).toContain('UK delivery')
    expect(res.answer).toContain('£1049.00 GBP')
    expect(res.answer).toContain('inc. VAT')

    // Refusal of arbitrary currency conversion
    expect(res.answer).toContain('does not calculate arbitrary live exchange rates')

    // Grounded in authoritative commercial offer
    expect(res.sources).toHaveLength(1)
    expect(res.sources[0]?.sourceType).toBe('MARKET_OFFER')
    expect(res.sources[0]?.reference).toContain('USD 1149.00')
  })

  it('returns insufficient evidence when product does not exist', async () => {
    const res = await consultCrossMarketPrice('prod-nonexistent', 'US', 'UK')
    expect(res.groundingState).toBe('INSUFFICIENT_EVIDENCE')
    expect(res.answer).toContain('was not found in the catalogue')
  })
})
