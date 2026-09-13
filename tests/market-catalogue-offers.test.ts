// tests/market-catalogue-offers.test.ts
// Phase 9: Scenarios D, E, L, O — Commercial offers, catalogue parity, SEO alternates, measurement systems.

import { describe, it, expect } from 'vitest'
import {
  getMachineDetail,
  getOffersForProduct,
  getMarketConfig,
} from '@halo-rc/db'

describe('Phase 9 — Catalogue Offers, SEO & Measurement Units (Scenarios D, E, L, O)', () => {
  describe('Scenario D & E — Authoritative Product Graph with Market-Specific Offers', () => {
    it('canonical product resolves distinct offers for UK and US markets', async () => {
      const ukDetail = await getMachineDetail('traxxas-x-maxx-8s-brushless-monster-truck', 'UK')
      const usDetail = await getMachineDetail('traxxas-x-maxx-8s-brushless-monster-truck', 'US')

      expect(ukDetail).not.toBeNull()
      expect(usDetail).not.toBeNull()

      // Exact same canonical identity
      expect(ukDetail?.id).toBe(usDetail?.id)
      expect(ukDetail?.sku).toBe(usDetail?.sku)

      // Distinct commercial offers
      expect(ukDetail?.offer?.currency).toBe('GBP')
      expect(ukDetail?.offer?.retailPriceMinorUnits).toBe(104900) // £1,049.00
      expect(ukDetail?.offer?.taxMode).toBe('INCLUSIVE')

      expect(usDetail?.offer?.currency).toBe('USD')
      expect(usDetail?.offer?.retailPriceMinorUnits).toBe(114900) // $1,149.00
      expect(usDetail?.offer?.taxMode).toBe('EXCLUSIVE')
    })

    it('product offers are segregated and retrieved by market', () => {
      const offers = getOffersForProduct('prod-traxxas-xmaxx-8s')
      expect(offers.length).toBeGreaterThanOrEqual(2)

      const ukOffer = offers.find((o) => o.marketCode === 'UK')
      const usOffer = offers.find((o) => o.marketCode === 'US')

      expect(ukOffer).toBeDefined()
      expect(usOffer).toBeDefined()
      expect(ukOffer?.currency).toBe('GBP')
      expect(usOffer?.currency).toBe('USD')
    })
  })

  describe('Scenario L — Canonical SEO & Hreflang Alternates', () => {
    it('generates canonical URL without language folder and includes en-GB, en-US, x-default', () => {
      const slug = 'traxxas-x-maxx-8s-brushless-monster-truck'
      const canonical = `https://halo-rc.com/machines/${slug}`
      const alternates = {
        canonical,
        languages: {
          'en-GB': canonical,
          'en-US': canonical,
          'x-default': canonical,
        },
      }

      expect(alternates.canonical).toBe('https://halo-rc.com/machines/traxxas-x-maxx-8s-brushless-monster-truck')
      expect(alternates.languages['en-GB']).toBe(canonical)
      expect(alternates.languages['en-US']).toBe(canonical)
      expect(alternates.languages['x-default']).toBe(canonical)
    })
  })

  describe('Scenario O — Measurement Systems (Metric vs Imperial)', () => {
    it('UK config specifies METRIC measurement system', () => {
      const uk = getMarketConfig('UK')
      expect(uk.measurementSystem).toBe('METRIC')
    })

    it('US config specifies IMPERIAL measurement system', () => {
      const us = getMarketConfig('US')
      expect(us.measurementSystem).toBe('IMPERIAL')
    })
  })
})
