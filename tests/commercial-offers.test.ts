import { describe, it, expect } from 'vitest'
import { resolveMarketOffer, type ResolvedMarketOffer } from '@halo-rc/db'

describe('Commercial Offer Model & Market Logic Verification', () => {
  const sampleOffers: ResolvedMarketOffer[] = [
    {
      id: 'offer-xray-uk',
      productVariantId: 'var-xray-x4',
      marketCode: 'UK',
      retailPriceMinorUnits: 72900, // £729.00
      currency: 'GBP',
      taxMode: 'INCLUSIVE',
      availability: 'IN_STOCK',
      leadTimeDays: 2,
      supplyRoute: 'UK_DISTRIBUTOR',
    },
    {
      id: 'offer-xray-us',
      productVariantId: 'var-xray-x4',
      marketCode: 'US',
      retailPriceMinorUnits: 89900, // $899.00
      currency: 'USD',
      taxMode: 'EXCLUSIVE',
      availability: 'IN_STOCK',
      leadTimeDays: 4,
      supplyRoute: 'DIRECT_MANUFACTURER',
    },
  ]

  const ukOnlyOffers: ResolvedMarketOffer[] = [
    {
      id: 'offer-awesomatix-uk',
      productVariantId: 'var-a800mx',
      marketCode: 'UK',
      retailPriceMinorUnits: 78900,
      currency: 'GBP',
      taxMode: 'INCLUSIVE',
      availability: 'LOW_STOCK',
      leadTimeDays: 3,
      supplyRoute: 'DIRECT_MANUFACTURER',
    },
  ]

  it('resolves UK market offer with GBP and VAT inclusive', () => {
    const offer = resolveMarketOffer(sampleOffers, 'UK')

    expect(offer).not.toBeNull()
    expect(offer?.retailPriceMinorUnits).toBe(72900)
    expect(offer?.currency).toBe('GBP')
    expect(offer?.taxMode).toBe('INCLUSIVE')
    expect(offer?.leadTimeDays).toBe(2)
  })

  it('resolves US market offer with USD and tax exclusive', () => {
    const offer = resolveMarketOffer(sampleOffers, 'US')

    expect(offer).not.toBeNull()
    expect(offer?.retailPriceMinorUnits).toBe(89900)
    expect(offer?.currency).toBe('USD')
    expect(offer?.taxMode).toBe('EXCLUSIVE')
    expect(offer?.leadTimeDays).toBe(4)
  })

  it('enforces non-negotiable rule: Missing market offer returns NULL (NOT_AVAILABLE)', () => {
    // Product only has UK offer; requesting US market offer
    const offer = resolveMarketOffer(ukOnlyOffers, 'US')

    expect(offer).toBeNull()
  })

  it('never silently substitutes another market offer when target market is absent', () => {
    const offer = resolveMarketOffer(ukOnlyOffers, 'US')

    // Must NOT fall back to GBP or £789.00
    expect(offer?.currency).not.toBe('GBP')
    expect(offer?.retailPriceMinorUnits).not.toBe(78900)
  })
})
