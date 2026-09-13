// tests/market-resolution-persistence.test.ts
// Phase 9: Scenarios A & B — Market resolution, defaults, locales, measurement systems.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getMarketConfig,
  getAllMarketConfigs,
  __resetMarketsStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetMarketsStoreForTesting()
})

describe('Phase 9 — Market Resolution & Persistence (Scenarios A & B)', () => {
  it('Scenario A: resolves UK market config with GBP, Metric, and VAT included', () => {
    const config = getMarketConfig('UK')
    expect(config.marketCode).toBe('UK')
    expect(config.countryCode).toBe('GB')
    expect(config.currency).toBe('GBP')
    expect(config.locale).toBe('en-GB')
    expect(config.taxMode).toBe('INCLUSIVE')
    expect(config.taxDisplayMode).toBe('TAX_INCLUDED')
    expect(config.measurementSystem).toBe('METRIC')
    expect(config.shippingRegion).toBe('UK_DOMESTIC')
    expect(config.enabled).toBe(true)
  })

  it('Scenario B: resolves US market config with USD, Imperial, and tax excluded', () => {
    const config = getMarketConfig('US')
    expect(config.marketCode).toBe('US')
    expect(config.countryCode).toBe('US')
    expect(config.currency).toBe('USD')
    expect(config.locale).toBe('en-US')
    expect(config.taxMode).toBe('EXCLUSIVE')
    expect(config.taxDisplayMode).toBe('TAX_EXCLUDED')
    expect(config.measurementSystem).toBe('IMPERIAL')
    expect(config.shippingRegion).toBe('US_DOMESTIC')
    expect(config.enabled).toBe(true)
  })

  it('defaults to UK config if invalid market is passed', () => {
    const config = getMarketConfig('FR' as any)
    expect(config.marketCode).toBe('UK')
    expect(config.currency).toBe('GBP')
  })

  it('lists all active markets', () => {
    const all = getAllMarketConfigs()
    expect(all).toHaveLength(2)
    const codes = all.map((m) => m.marketCode)
    expect(codes).toContain('UK')
    expect(codes).toContain('US')
  })
})
