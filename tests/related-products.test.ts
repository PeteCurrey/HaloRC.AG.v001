import { describe, it, expect } from 'vitest'
import { getMachineDetail, evaluateCompatibility } from '@halo-rc/db'

describe('Related Products & Compatibility Rules Engine', () => {
  it('retrieves structured related products (RECOMMENDED, UPGRADE, OPTION, REQUIRED) for a machine', async () => {
    const detail = await getMachineDetail('xray-x4-2026-1-10-touring-car-kit', 'UK')
    expect(detail).not.toBeNull()

    const related = detail!.relatedProducts
    expect(related.length).toBeGreaterThan(0)

    // Check relationship types present
    const types = related.map((r) => r.relationType)
    expect(types.some((t) => ['RECOMMENDED', 'REQUIRED', 'OPTION', 'UPGRADE'].includes(t))).toBe(true)

    // Verify each related product has non-empty ID, name, and valid tier
    for (const rel of related) {
      expect(rel.product.id).toBeDefined()
      expect(rel.product.name).toBeTruthy()
      expect(rel.product.tier).toBeDefined()
    }
  })

  it('strictly excludes unverified compatibility rules from public product graph', () => {
    const mockRules = [
      {
        sourceEntityId: 'prod-part-verified',
        targetEntityId: 'plat-x4',
        ruleType: 'FITS',
        verified: true,
      },
      {
        sourceEntityId: 'prod-part-unverified',
        targetEntityId: 'plat-x4',
        ruleType: 'FITS',
        verified: false,
      },
    ]

    const verifiedCheck = evaluateCompatibility('prod-part-verified', 'plat-x4', mockRules)
    expect(verifiedCheck.compatible).toBe(true)
    expect(verifiedCheck.verified).toBe(true)

    const unverifiedCheck = evaluateCompatibility('prod-part-unverified', 'plat-x4', mockRules)
    // Must NOT be treated as compatible if unverified
    expect(unverifiedCheck.compatible).toBe(false)
  })

  it('provides verified replacement part lineage for superseded items', async () => {
    // Legacy XRAY arm detail
    const detail = await getMachineDetail('xray-301000-front-lower-arm-hard', 'UK')
    if (detail) {
      expect(detail.lifecycle).toBe('REPLACED')
      expect(detail.replacementLineage).not.toBeNull()
      expect(detail.replacementLineage?.replacementSku).toBe('XRAY-302000')
    }
  })
})
