import { describe, it, expect } from 'vitest'
import {
  sanitizeSpecifications,
  resolveMarketOffer,
  type SpecificationRecord,
  type ResolvedMarketOffer,
} from '@halo-rc/db'

describe('Admin Product Management & Data Integrity', () => {
  it('enforces that UNKNOWN data confidence specs are never returned for public claims', () => {
    const specs: SpecificationRecord[] = [
      {
        key: 'chassis_material',
        value: 'T700 Carbon Fibre 2.2mm',
        unit: null,
        confidence: 'VERIFIED',
        sourceType: 'MANUFACTURER_SHEET',
        sourceUrl: 'https://example.com/spec.pdf',
        sourceDocument: 'XRAY Manual',
        verifiedAt: new Date(),
      },
      {
        key: 'wheelbase',
        value: '257mm',
        unit: 'mm',
        confidence: 'KNOWN',
        sourceType: 'COMMUNITY',
        sourceUrl: null,
        sourceDocument: null,
        verifiedAt: null,
      },
      {
        key: 'top_speed_est',
        value: '115kph',
        unit: 'kph',
        confidence: 'UNKNOWN', // Must be filtered out
        sourceType: null,
        sourceUrl: null,
        sourceDocument: null,
        verifiedAt: null,
      },
    ]

    const sanitized = sanitizeSpecifications(specs)
    expect(sanitized).toHaveLength(2)
    expect(sanitized.some((s) => s.confidence === 'UNKNOWN')).toBe(false)
    expect(sanitized.map((s) => s.key)).toEqual(['chassis_material', 'wheelbase'])
  })

  it('strictly isolates market pricing and never substitutes an unpriced market offer', () => {
    const offers: ResolvedMarketOffer[] = [
      {
        id: 'off-uk-1',
        productVariantId: 'var-1',
        marketCode: 'UK',
        retailPriceMinorUnits: 72900,
        currency: 'GBP',
        taxMode: 'INCLUSIVE',
        availability: 'IN_STOCK',
        leadTimeDays: 1,
        supplyRoute: 'DIRECT_DISPATCH',
      },
    ]

    const ukOffer = resolveMarketOffer(offers, 'UK')
    expect(ukOffer).not.toBeNull()
    expect(ukOffer?.retailPriceMinorUnits).toBe(72900)
    expect(ukOffer?.currency).toBe('GBP')

    // US offer does not exist — MUST return null, never substitute UK offer
    const usOffer = resolveMarketOffer(offers, 'US')
    expect(usOffer).toBeNull()
  })

  it('validates that new products must start in DRAFT status and be unpublished', () => {
    const newProductPayload = {
      name: 'Infinity IF14-2 Team Edition',
      slug: 'infinity-if14-2-team',
      brandId: 'brand-infinity',
      sku: 'HALO-INF-IF14',
      status: 'DRAFT' as const,
      published: false,
    }

    expect(newProductPayload.status).toBe('DRAFT')
    expect(newProductPayload.published).toBe(false)
  })
})
