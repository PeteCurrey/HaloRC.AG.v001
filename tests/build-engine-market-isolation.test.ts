import { describe, it, expect } from 'vitest'
import { resolveBuildConfiguration } from '@halo-rc/db'

describe('Build Engine — Scenarios D & E: Market Isolation & Pricing Boundary Conditions', () => {
  it('calculates UK build pricing strictly in GBP with INC_VAT tax mode', async () => {
    const build = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'UK',
    })

    expect(build.marketCode).toBe('UK')
    expect(build.currency).toBe('GBP')
    expect(build.taxMode).toBe('INCLUSIVE')
    expect(build.priceState).toBe('KNOWN_PRICE')
    expect(build.totalMinorUnits).toBe(104900) // £1,049.00
  })

  it('calculates US build pricing strictly in USD with EXCLUSIVE tax mode and independent amounts', async () => {
    const build = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'US',
    })

    expect(build.marketCode).toBe('US')
    expect(build.currency).toBe('USD')
    expect(build.taxMode).toBe('EXCLUSIVE')
    expect(build.priceState).toBe('KNOWN_PRICE')
    expect(build.totalMinorUnits).toBe(114900) // $1,149.00
    // Verify it is completely distinct from the UK price
    expect(build.totalMinorUnits).not.toBe(104900)
  })

  it('handles component with missing target market offer: yields UNAVAILABLE slot and PRICE_UNAVAILABLE total', async () => {
    // Mon-Tech Hyper 190mm body shell has a UK offer (£34.00) but NO US offer

    // 1. In UK market: valid offer exists, total includes body price
    const ukBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
        BODY: 'prod-montech-hyper-body',
      },
      marketCode: 'UK',
    })

    const ukBodySlot = ukBuild.slots.find((s) => s.role === 'BODY')
    expect(ukBodySlot?.slotState).toBe('SELECTED')
    expect(ukBodySlot?.selectedProduct?.offer).not.toBeNull()
    expect(ukBodySlot?.selectedProduct?.offer?.retailPriceMinorUnits).toBe(3400)
    expect(ukBuild.priceState).toBe('KNOWN_PRICE')
    expect(ukBuild.totalMinorUnits).toBe(72900 + 8900 + 18900 + 12900 + 6500 + 3400) // £1,235.00

    // 2. In US market: NO offer exists for Mon-Tech body shell
    const usBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
        SERVO_STEERING: 'prod-savox-sb2292sg',
        BATTERY: 'prod-sunpadow-6000-lipo',
        BODY: 'prod-montech-hyper-body',
      },
      marketCode: 'US',
    })

    const usBodySlot = usBuild.slots.find((s) => s.role === 'BODY')
    expect(usBodySlot).toBeDefined()
    expect(usBodySlot?.slotState).toBe('UNAVAILABLE')
    expect(usBodySlot?.selectedProduct?.offer).toBeNull()
    expect(usBodySlot?.validationError).toContain('Component "Mon-Tech Hyper 190mm Touring Car Clear Body Shell" is compatible but has no active commercial offer in the US market')

    // Price state must be PRICE_UNAVAILABLE — NEVER £0 / $0 / free!
    expect(usBuild.priceState).toBe('PRICE_UNAVAILABLE')
    expect(usBuild.totalMinorUnits).toBeNull()
  })

  it('never cross-falls back across borders when a component offer is missing in the requested market', async () => {
    const usBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      selectedComponents: {
        BODY: 'prod-montech-hyper-body',
      },
      marketCode: 'US',
    })

    const bodyCandidate = usBuild.slots
      .find((s) => s.role === 'BODY')
      ?.compatibleProducts.find((p) => p.id === 'prod-montech-hyper-body')

    expect(bodyCandidate).toBeDefined()
    // Must NOT fall back to UK offer (£36.00)
    expect(bodyCandidate?.offer).toBeNull()
  })
})
