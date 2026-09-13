import { describe, it, expect } from 'vitest'
import { resolveBuildConfiguration } from '@halo-rc/db'

describe('Build Engine — Scenario G: Vehicle Switching & Component Re-Evaluation', () => {
  it('re-evaluates selections when switching from Kit to RTR machine, flagging incompatible parts', async () => {
    // 1. Initial valid X4 build
    const x4Build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        OPTION_PART: 'prod-xray-titanium-pivot',
      },
      marketCode: 'UK',
    })
    const x4OptionSlot = x4Build.slots.find((s) => s.role === 'OPTION_PART')
    expect(x4OptionSlot?.slotState).toBe('SELECTED')
    expect(x4OptionSlot?.validationError).toBeNull()

    // 2. Customer switches vehicle to Traxxas X-Maxx (RTR) keeping the same selection dictionary
    const xmaxxBuild = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      selectedComponents: {
        OPTION_PART: 'prod-xray-titanium-pivot', // XRAY part carried over
      },
      marketCode: 'UK',
    })

    // X-Maxx must immediately detect that the XRAY titanium pivot balls do not fit X-Maxx
    expect(xmaxxBuild.status).toBe('INVALID')
    expect(xmaxxBuild.completeness.isComplete).toBe(false)
    expect(xmaxxBuild.completeness.invalidSlots).toContain('OPTION_PART')

    const xmaxxOptionSlot = xmaxxBuild.slots.find((s) => s.role === 'OPTION_PART')
    expect(xmaxxOptionSlot?.slotState).toBe('INVALID')
    expect(xmaxxOptionSlot?.validationError).toContain('Selected component "XRAY X4 Titanium Pivot Ball Set (4pcs)" is not compatible with Traxxas X-Maxx 8S')
    expect(xmaxxOptionSlot?.validationError).toContain('X-Maxx')

    // 3. User switches option to genuine Traxxas HD driveshafts -> immediately becomes valid
    const resolvedXMaxxBuild = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      selectedComponents: {
        OPTION_PART: 'prod-traxxas-hd-driveshafts',
      },
      marketCode: 'UK',
    })

    expect(resolvedXMaxxBuild.status).toBe('COMPLETE')
    expect(resolvedXMaxxBuild.completeness.isComplete).toBe(true)
    expect(resolvedXMaxxBuild.completeness.invalidSlots).toEqual([])
    expect(resolvedXMaxxBuild.slots.find((s) => s.role === 'OPTION_PART')?.slotState).toBe('SELECTED')
  })

  it('re-evaluates cross-kit vehicle switching: preserves shared electronics while isolating chassis-specific options', async () => {
    // 1. Initial complete XRAY X4 build with shared electronics and chassis-specific titanium pivot balls
    const sharedSelections = {
      MOTOR: 'prod-hw-v10-g4-135t',
      ESC: 'prod-hw-xr10-pro-g3',
      SERVO_STEERING: 'prod-savox-sb2292sg',
      BATTERY: 'prod-sunpadow-6000-lipo',
      OPTION_PART: 'prod-xray-titanium-pivot',
    }

    const x4Build = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: sharedSelections,
      marketCode: 'UK',
    })
    expect(x4Build.status).toBe('COMPLETE')

    // 2. User switches to Yokomo Master Drift MD 2.0 with the same component selections
    const yokomoBuild = await resolveBuildConfiguration({
      machineId: 'prod-yokomo-md-2',
      selectedComponents: sharedSelections,
      marketCode: 'UK',
    })

    // Shared competition electronics (Motor, ESC, Servo, Battery) remain valid on MD 2.0
    expect(yokomoBuild.slots.find((s) => s.role === 'MOTOR')?.slotState).toBe('SELECTED')
    expect(yokomoBuild.slots.find((s) => s.role === 'ESC')?.slotState).toBe('SELECTED')
    expect(yokomoBuild.slots.find((s) => s.role === 'SERVO_STEERING')?.slotState).toBe('SELECTED')
    expect(yokomoBuild.slots.find((s) => s.role === 'BATTERY')?.slotState).toBe('SELECTED')

    // But XRAY-specific titanium pivot ball option is INVALID on Yokomo chassis
    const yokomoOptionSlot = yokomoBuild.slots.find((s) => s.role === 'OPTION_PART')
    expect(yokomoOptionSlot?.slotState).toBe('INVALID')
    expect(yokomoOptionSlot?.validationError).toContain('Selected component "XRAY X4 Titanium Pivot Ball Set (4pcs)" is not compatible with Yokomo Master Drift MD 2.0')
    expect(yokomoBuild.status).toBe('INVALID')

    // 3. User switches OPTION_PART to Yokomo Precision Aluminum Steering Bellcrank Set
    const validYokomoBuild = await resolveBuildConfiguration({
      machineId: 'prod-yokomo-md-2',
      selectedComponents: {
        ...sharedSelections,
        OPTION_PART: 'prod-yokomo-alum-steering',
      },
      marketCode: 'UK',
    })

    expect(validYokomoBuild.status).toBe('COMPLETE')
    expect(validYokomoBuild.completeness.isComplete).toBe(true)
    expect(validYokomoBuild.completeness.invalidSlots).toEqual([])
  })
})
