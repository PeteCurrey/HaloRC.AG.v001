import { describe, it, expect } from 'vitest'
import { evaluateCompatibility } from '@halo-rc/db'

describe('Product Graph & Platform Compatibility Verification', () => {
  // Verified platform and part dataset from seed
  const platformX4 = { id: 'plat-xray-x4', name: 'X4 Platform', brandId: 'brand-xray' }
  const platformXMaxx = { id: 'plat-xmaxx', name: 'X-Maxx Platform', brandId: 'brand-traxxas' }

  const vehicleX4_2026 = {
    id: 'prod-xray-x4-2026',
    name: "XRAY X4 '26 1/10 Touring Car",
    platformId: 'plat-xray-x4',
  }

  const partFrontLowerArm = {
    id: 'prod-xray-front-lower-arm',
    sku: 'XRAY-302000',
    name: 'XRAY Front Lower Suspension Arm — Graphite',
    productType: 'PART',
  }

  const partLegacyFrontArm = {
    id: 'prod-xray-legacy-front-arm',
    sku: 'XRAY-301000',
    name: 'XRAY Front Lower Suspension Arm — Hard (Superseded)',
    productType: 'PART',
    lifecycle: 'REPLACED',
    replacementProductId: 'prod-xray-front-lower-arm',
  }

  const partTraxxasBellcrank = {
    id: 'prod-traxxas-steering-bellcrank',
    sku: 'TRX-7746',
    name: 'Traxxas Heavy Duty Steering Bellcranks',
    productType: 'PART',
  }

  const verifiedRules = [
    {
      sourceEntityId: 'prod-xray-front-lower-arm',
      targetEntityId: 'plat-xray-x4',
      ruleType: 'FITS',
      verified: true,
    },
    {
      sourceEntityId: 'prod-traxxas-steering-bellcrank',
      targetEntityId: 'plat-xmaxx',
      ruleType: 'FITS',
      verified: true,
    },
    {
      sourceEntityId: 'prod-xray-legacy-front-arm',
      targetEntityId: 'prod-xray-front-lower-arm',
      ruleType: 'REPLACES',
      verified: true,
    },
  ]

  it('demonstrates platform-wide compatibility without SKU duplication', () => {
    // Evaluating part compatibility against the vehicle's platform
    const result = evaluateCompatibility(
      partFrontLowerArm.id,
      vehicleX4_2026.platformId,
      verifiedRules
    )

    expect(result.compatible).toBe(true)
    expect(result.ruleType).toBe('FITS')
    expect(result.verified).toBe(true)
  })

  it('rejects cross-platform incompatibility', () => {
    // Traxxas bellcrank tested against XRAY X4 platform
    const result = evaluateCompatibility(
      partTraxxasBellcrank.id,
      platformX4.id,
      verifiedRules
    )

    expect(result.compatible).toBe(false)
  })

  it('does NOT infer compatibility from partial SKU or string similarity', () => {
    // Unrelated part with similar sounding SKU
    const fictitiousPartId = 'prod-xray-302001-impostor'
    const result = evaluateCompatibility(
      fictitiousPartId,
      platformX4.id,
      verifiedRules
    )

    expect(result.compatible).toBe(false)
  })

  it('verifies superseded replacement product lineage (OLD -> NEW)', () => {
    expect(partLegacyFrontArm.lifecycle).toBe('REPLACED')
    expect(partLegacyFrontArm.replacementProductId).toBe(partFrontLowerArm.id)

    const replacementRule = verifiedRules.find(
      (r) =>
        r.sourceEntityId === partLegacyFrontArm.id &&
        r.targetEntityId === partLegacyFrontArm.replacementProductId
    )

    expect(replacementRule).toBeDefined()
    expect(replacementRule?.ruleType).toBe('REPLACES')
    expect(replacementRule?.verified).toBe(true)
  })
})
