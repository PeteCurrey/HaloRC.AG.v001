import { describe, it, expect } from 'vitest'
import { resolveBuildConfiguration } from '@halo-rc/db'

describe('Build Engine — Scenario F: Superseded Parts & Replacement Lineage', () => {
  it('detects superseded part selection, marks slot INVALID, and provides modern replacement link', async () => {
    // Customer selects the superseded hard composite arm (XRAY-301000) on X4
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
        OPTION_PART: 'prod-xray-legacy-front-arm', // Superseded part
      },
      marketCode: 'UK',
    })

    expect(build.status).toBe('INVALID')
    expect(build.completeness.isComplete).toBe(false)
    expect(build.completeness.invalidSlots).toContain('OPTION_PART')

    const optionSlot = build.slots.find((s) => s.role === 'OPTION_PART')
    expect(optionSlot).toBeDefined()
    expect(optionSlot?.slotState).toBe('INVALID')
    expect(optionSlot?.validationError).toContain('has been superseded')
    expect(optionSlot?.validationError).toContain('XRAY Front Lower Suspension Arm — Graphite')

    // Selected product maintains user selection (no silent substitution)
    expect(optionSlot?.selectedProduct?.id).toBe('prod-xray-legacy-front-arm')
    expect(optionSlot?.selectedProduct?.sku).toBe('XRAY-301000')
    expect(optionSlot?.selectedProduct?.lifecycle).toBe('REPLACED')

    // Verifies modern replacement details are provided
    expect(optionSlot?.selectedProduct?.replacement).not.toBeNull()
    expect(optionSlot?.selectedProduct?.replacement?.id).toBe('prod-xray-front-lower-arm')
    expect(optionSlot?.selectedProduct?.replacement?.sku).toBe('XRAY-302000')
    expect(optionSlot?.selectedProduct?.replacement?.name).toBe('XRAY Front Lower Suspension Arm — Graphite')
  })

  it('exposes replacement metadata on candidate options without hiding legacy lineage', async () => {
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    const optionSlot = build.slots.find((s) => s.role === 'OPTION_PART')
    const legacyCandidate = optionSlot?.compatibleProducts.find(
      (p) => p.id === 'prod-xray-legacy-front-arm'
    )

    expect(legacyCandidate).toBeDefined()
    expect(legacyCandidate?.lifecycle).toBe('REPLACED')
    expect(legacyCandidate?.replacement).not.toBeNull()
    expect(legacyCandidate?.replacement?.sku).toBe('XRAY-302000')
  })

  it('restores COMPLETE build status when user accepts modern replacement part', async () => {
    // User switches from legacy arm to graphite arm (XRAY-302000)
    const validBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
        OPTION_PART: 'prod-xray-front-lower-arm', // Modern replacement
      },
      marketCode: 'UK',
    })

    expect(validBuild.status).toBe('COMPLETE')
    expect(validBuild.completeness.isComplete).toBe(true)
    expect(validBuild.completeness.invalidSlots).toEqual([])

    const optionSlot = validBuild.slots.find((s) => s.role === 'OPTION_PART')
    expect(optionSlot?.slotState).toBe('SELECTED')
    expect(optionSlot?.selectedProduct?.lifecycle).toBe('ACTIVE')
    expect(optionSlot?.selectedProduct?.sku).toBe('XRAY-302000')
    expect(optionSlot?.validationError).toBeNull()
  })
})
