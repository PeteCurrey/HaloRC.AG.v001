import { describe, it, expect } from 'vitest'
import { resolveBuildConfiguration } from '@halo-rc/db'

describe('Build Engine — Scenario B: Competition Kit Machines', () => {
  it('generates mandatory electronics slots and starts as DRAFT when no selections made', async () => {
    // XRAY X4 '26 Kit
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    expect(build.machine?.productType).toBe('KIT')
    expect(build.status).toBe('DRAFT')
    expect(build.completeness.isComplete).toBe(false)

    // Check mandatory slots: MOTOR, ESC, SERVO_STEERING, BATTERY
    const requiredRoles = build.slots
      .filter((s) => s.requirement === 'REQUIRED')
      .map((s) => s.role)

    expect(requiredRoles).toContain('MOTOR')
    expect(requiredRoles).toContain('ESC')
    expect(requiredRoles).toContain('SERVO_STEERING')
    expect(requiredRoles).toContain('BATTERY')
    expect(build.completeness.totalRequiredSlots).toBe(requiredRoles.length)
    expect(build.completeness.completedRequiredSlots).toBe(0)
    expect(build.completeness.missingRequiredSlots).toEqual(requiredRoles)
  })

  it('reports INCOMPLETE status when only partial required slots are satisfied', async () => {
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        ESC: 'prod-hw-xr10-pro-g3', // Only ESC selected
      },
      marketCode: 'UK',
    })

    expect(build.status).toBe('INCOMPLETE')
    expect(build.completeness.isComplete).toBe(false)
    expect(build.completeness.completedRequiredSlots).toBe(1)
    expect(build.completeness.missingRequiredSlots).toContain('MOTOR')
    expect(build.completeness.missingRequiredSlots).toContain('SERVO_STEERING')
    expect(build.completeness.missingRequiredSlots).toContain('BATTERY')
  })

  it('completes build when all required slots are satisfied with verified parts', async () => {
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
      },
      marketCode: 'UK',
    })

    expect(build.status).toBe('COMPLETE')
    expect(build.completeness.isComplete).toBe(true)
    expect(build.completeness.missingRequiredSlots).toEqual([])
    expect(build.completeness.invalidSlots).toEqual([])
    expect(build.completeness.unavailableSlots).toEqual([])

    // Price total includes machine + 4 required items
    expect(build.priceState).toBe('KNOWN_PRICE')
    expect(build.totalMinorUnits).toBeGreaterThan(72900)
    // 72900 (X4) + 8900 (Motor) + 18900 (ESC) + 12900 (Servo) + 6500 (Battery) = 120100 (£1,201.00)
    expect(build.totalMinorUnits).toBe(72900 + 8900 + 18900 + 12900 + 6500)
  })

  it('does NOT treat RECOMMENDED slots (Radio, Charger) as mandatory to complete build', async () => {
    // Only required slots selected, leaving RADIO and CHARGER unselected
    const build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
      },
      marketCode: 'UK',
    })

    const radioSlot = build.slots.find((s) => s.role === 'RADIO')
    expect(radioSlot?.requirement).toBe('RECOMMENDED')
    expect(radioSlot?.selectedProduct).toBeNull()

    // Build is still COMPLETE because recommended slots are not mandatory
    expect(build.status).toBe('COMPLETE')
    expect(build.completeness.isComplete).toBe(true)
  })
})
