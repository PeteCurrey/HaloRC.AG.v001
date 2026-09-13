import { describe, it, expect } from 'vitest'
import { sanitizeSpecifications, type SpecificationRecord } from '@halo-rc/db'

describe('Data Confidence & Provenance Verification', () => {
  const sampleSpecifications: SpecificationRecord[] = [
    {
      key: 'Wheelbase',
      value: '257 mm',
      unit: 'mm',
      confidence: 'VERIFIED',
      sourceType: 'CAD Datasheet',
      sourceUrl: 'https://teamxray.com/x4/specs',
      sourceDocument: 'X4 2026 Manual v1.0',
      verifiedAt: new Date('2026-09-12'),
    },
    {
      key: 'Secondary Observation',
      value: 'Observed track weight 1340g',
      unit: 'g',
      confidence: 'KNOWN',
      sourceType: 'COMMUNITY',
      sourceUrl: null,
      sourceDocument: null,
      verifiedAt: null,
    },
    {
      key: 'Estimated Top Speed',
      value: '50+ mph',
      unit: 'mph',
      confidence: 'INFERRED',
      sourceType: 'INFERRED',
      sourceUrl: null,
      sourceDocument: null,
      verifiedAt: null,
    },
    {
      key: 'Unconfirmed Bearing Count',
      value: '24 bearings (unverified)',
      unit: null,
      confidence: 'UNKNOWN',
      sourceType: null,
      sourceUrl: null,
      sourceDocument: null,
      verifiedAt: null,
    },
  ]

  it('preserves VERIFIED, KNOWN, and INFERRED specifications', () => {
    const sanitized = sanitizeSpecifications(sampleSpecifications)

    expect(sanitized).toHaveLength(3)
    const keys = sanitized.map((s) => s.key)
    expect(keys).toContain('Wheelbase')
    expect(keys).toContain('Secondary Observation')
    expect(keys).toContain('Estimated Top Speed')
  })

  it('strictly excludes UNKNOWN confidence specifications from public view', () => {
    const sanitized = sanitizeSpecifications(sampleSpecifications)

    const keys = sanitized.map((s) => s.key)
    expect(keys).not.toContain('Unconfirmed Bearing Count')
  })

  it('preserves provenance metadata on verified specifications', () => {
    const sanitized = sanitizeSpecifications(sampleSpecifications)
    const verifiedSpec = sanitized.find((s) => s.key === 'Wheelbase')

    expect(verifiedSpec?.confidence).toBe('VERIFIED')
    expect(verifiedSpec?.sourceType).toBe('CAD Datasheet')
    expect(verifiedSpec?.sourceDocument).toBe('X4 2026 Manual v1.0')
    expect(verifiedSpec?.verifiedAt).toBeInstanceOf(Date)
  })
})
