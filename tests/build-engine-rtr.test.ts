import { describe, it, expect } from 'vitest'
import { resolveBuildConfiguration } from '@halo-rc/db'

describe('Build Engine — Scenario A: Ready-To-Run (RTR) Vehicles', () => {
  it('generates zero mandatory electronics slots for RTR vehicles', async () => {
    // Traxxas X-Maxx 8S is an RTR monster truck
    const build = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'UK',
    })

    expect(build.status).toBe('COMPLETE')
    expect(build.machine).not.toBeNull()
    expect(build.machine?.productType).toBe('RTR_MACHINE')

    // No mandatory slots
    const requiredSlots = build.slots.filter((s) => s.requirement === 'REQUIRED')
    expect(requiredSlots.length).toBe(0)
    expect(build.completeness.isComplete).toBe(true)
    expect(build.completeness.totalRequiredSlots).toBe(0)
    expect(build.completeness.missingRequiredSlots).toEqual([])
  })

  it('generates optional upgrade slots populated with verified platform parts', async () => {
    const build = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'UK',
    })

    const optionSlots = build.slots.filter((s) => s.requirement === 'OPTIONAL')
    expect(optionSlots.length).toBeGreaterThan(0)

    const upgradeSlot = optionSlots.find((s) => s.role === 'OPTION_PART')
    expect(upgradeSlot).toBeDefined()
    expect(upgradeSlot?.compatibleProducts.length).toBeGreaterThan(0)

    // Verify compatible products are platform verified
    const partSkus = upgradeSlot!.compatibleProducts.map((p) => p.sku)
    expect(partSkus).toContain('TRX-7750X') // Heavy Duty Steel Driveshafts
  })

  it('calculates valid build total out of the box and updates when options are added', async () => {
    // Base vehicle only
    const baseBuild = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'UK',
    })

    expect(baseBuild.priceState).toBe('KNOWN_PRICE')
    expect(baseBuild.totalMinorUnits).toBe(104900) // £1,049.00
    expect(baseBuild.currency).toBe('GBP')

    // Add optional steel driveshaft (TRX-7750X, £84.50 = 8450 minor units)
    const upgradedBuild = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      selectedComponents: {
        OPTION_PART: 'prod-traxxas-hd-driveshafts',
      },
      marketCode: 'UK',
    })

    expect(upgradedBuild.status).toBe('COMPLETE')
    expect(upgradedBuild.totalMinorUnits).toBe(104900 + 8450)
  })
})
