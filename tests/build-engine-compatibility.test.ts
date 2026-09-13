import { describe, it, expect } from 'vitest'
import { resolveBuildConfiguration } from '@halo-rc/db'

describe('Build Engine — Scenario C: Compatibility Resolution & Conflict Handling', () => {
  it('detects and flags an incompatible component with factual architectural explanation', async () => {
    // Attempt to configure an XRAY X4 2026 with a Traxxas X-Maxx heavy duty bellcrank in the option slot
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
        OPTION_PART: 'prod-traxxas-steering-bellcrank', // Incompatible Traxxas part!
      },
      marketCode: 'UK',
    })

    expect(build.status).toBe('INVALID')
    expect(build.completeness.isComplete).toBe(false)
    expect(build.completeness.invalidSlots).toContain('OPTION_PART')

    const optionSlot = build.slots.find((s) => s.role === 'OPTION_PART')
    expect(optionSlot).toBeDefined()
    expect(optionSlot?.slotState).toBe('INVALID')
    expect(optionSlot?.validationError).toContain('Selected component "Traxxas Heavy Duty Steering Bellcranks with Bearings" is not compatible with')
    expect(optionSlot?.validationError).toContain("XRAY X4 '26 1/10 Electric Touring Car Kit")
    expect(optionSlot?.validationError).toContain('(X4)')
  })

  it('strictly excludes unverified compatibility rules (verified: false) from candidate options', async () => {
    // There is an unverified rule linking prod-traxxas-steering-bellcrank to prod-xray-x4-2026
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    // Check all slots to ensure the unverified product is never offered
    for (const slot of build.slots) {
      const containsUnverified = slot.compatibleProducts.some(
        (p) => p.id === 'prod-traxxas-steering-bellcrank'
      )
      expect(containsUnverified).toBe(false)
    }
  })

  it('only surfaces candidate products with authoritative, verified compatibility rules', async () => {
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    const motorSlot = build.slots.find((s) => s.role === 'MOTOR')
    expect(motorSlot).toBeDefined()
    expect(motorSlot?.compatibleProducts.length).toBeGreaterThan(0)

    // Verify all candidates have a non-empty compatibilityReason from verified rules
    for (const candidate of motorSlot!.compatibleProducts) {
      expect(candidate.compatibilityReason).toBeTruthy()
      expect(candidate.ruleType).toMatch(/^(REQUIRED|RECOMMENDED|COMPATIBLE|OPTION|FITS|UPGRADE)$/)
    }
  })

  it('clears conflict state when an incompatible component is replaced with a verified compatible one', async () => {
    // 1. Initial build with conflict
    const invalidBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
        OPTION_PART: 'prod-traxxas-steering-bellcrank',
      },
      marketCode: 'UK',
    })
    expect(invalidBuild.status).toBe('INVALID')

    // 2. Resolve conflict by selecting verified X4 titanium pivot balls
    const validBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
        OPTION_PART: 'prod-xray-titanium-pivot', // Verified upgrade
      },
      marketCode: 'UK',
    })

    expect(validBuild.status).toBe('COMPLETE')
    expect(validBuild.completeness.isComplete).toBe(true)
    expect(validBuild.completeness.invalidSlots).toEqual([])
    const optionSlot = validBuild.slots.find((s) => s.role === 'OPTION_PART')
    expect(optionSlot?.slotState).toBe('SELECTED')
    expect(optionSlot?.validationError).toBeNull()
  })
})
