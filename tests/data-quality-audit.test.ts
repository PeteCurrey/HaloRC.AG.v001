import { describe, it, expect } from 'vitest'
import { getDataQualityAudit, sanitizeSpecifications, type SpecificationRecord } from '@halo-rc/db'

describe('Data Quality & Provenance Audit Engine (getDataQualityAudit)', () => {
  it('generates comprehensive catalogue health metrics', async () => {
    const audit = await getDataQualityAudit()

    expect(audit.totalProducts).toBeGreaterThanOrEqual(15)
    expect(audit.totalVariants).toBeGreaterThanOrEqual(15)
    expect(audit.totalSpecifications).toBeGreaterThanOrEqual(15)
    expect(audit.verifiedSpecificationsCount).toBeGreaterThan(0)
    expect(audit.ukOffersCount).toBeGreaterThan(0)
    expect(audit.usOffersCount).toBeGreaterThan(0)
  })

  it('detects and counts deliberate UNKNOWN confidence specifications', async () => {
    const audit = await getDataQualityAudit()
    // We intentionally have UNKNOWN specifications in seed to verify auditing and sanitization
    expect(audit.unknownSpecificationsCount).toBeGreaterThan(0)
  })

  it('proves sanitizeSpecifications strictly removes UNKNOWN confidence from public exposure', () => {
    const testSpecs: SpecificationRecord[] = [
      {
        key: 'Chassis Material',
        value: '7075-T6 Aluminium',
        unit: null,
        confidence: 'VERIFIED',
        sourceType: 'Manufacturer Spec',
        sourceUrl: 'https://example.com',
        sourceDocument: null,
        verifiedAt: new Date(),
      },
      {
        key: 'Weight (Dry)',
        value: '1450g',
        unit: 'g',
        confidence: 'KNOWN',
        sourceType: 'Datasheet',
        sourceUrl: null,
        sourceDocument: 'SpecSheet.pdf',
        verifiedAt: null,
      },
      {
        key: 'Internal Factory Batch Code',
        value: 'Unverified Data',
        unit: null,
        confidence: 'UNKNOWN',
        sourceType: null,
        sourceUrl: null,
        sourceDocument: null,
        verifiedAt: null,
      },
    ]

    const sanitized = sanitizeSpecifications(testSpecs)
    expect(sanitized.length).toBe(2)
    expect(sanitized.some((s) => s.confidence === 'UNKNOWN')).toBe(false)
    expect(sanitized.map((s) => s.key)).toEqual(['Chassis Material', 'Weight (Dry)'])
  })

  it('confirms zero orphaned products in the catalogue', async () => {
    const audit = await getDataQualityAudit()
    // Every product in Halo RC must belong to an authoritative brand
    expect(audit.orphanedProductsCount).toBe(0)
  })

  it('tracks discontinued and superseded lifecycle items', async () => {
    const audit = await getDataQualityAudit()
    expect(audit.discontinuedProductsCount).toBeGreaterThan(0)
  })
})
