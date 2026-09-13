import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveBuildToGarageVehicle,
  getVehicleActiveBuild,
  resolveBuildConfiguration,
  __resetGarageStoreForTesting,
} from '@halo-rc/db'

describe('Phase 4: Garage Market Isolation & Tax Semantics Preserved', () => {
  const CUSTOMER_ID = 'usr-customer'

  beforeEach(() => {
    __resetGarageStoreForTesting()
  })

  it('saves UK build with GBP currency and INCLUSIVE tax mode semantics', async () => {
    const ukBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    expect(ukBuild.marketCode).toBe('UK')
    expect(ukBuild.currency).toBe('GBP')
    expect(ukBuild.taxMode).toBe('INCLUSIVE')

    const saved = await saveBuildToGarageVehicle(CUSTOMER_ID, {
      garageVehicleId: 'veh-x4-customer',
      name: 'UK BMR Setup',
      marketCode: 'UK',
      configuredBuild: ukBuild,
    })

    expect(saved.snapshot.marketCode).toBe('UK')
    expect(saved.snapshot.currency).toBe('GBP')
    expect(saved.snapshot.taxMode).toBe('INCLUSIVE')

    // Every slot in the snapshot must retain UK tax semantics
    for (const slot of Object.values(saved.snapshot.slots)) {
      expect(slot.currency).toBe('GBP')
      expect(slot.taxMode).toBe('INCLUSIVE')
    }
  })

  it('saves US build with USD currency and EXCLUSIVE tax mode semantics', async () => {
    const usBuild = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'US',
    })

    expect(usBuild.marketCode).toBe('US')
    expect(usBuild.currency).toBe('USD')
    expect(usBuild.taxMode).toBe('EXCLUSIVE')

    const saved = await saveBuildToGarageVehicle(CUSTOMER_ID, {
      garageVehicleId: 'veh-xmaxx-customer',
      name: 'US Bash Spec',
      marketCode: 'US',
      configuredBuild: usBuild,
    })

    expect(saved.snapshot.marketCode).toBe('US')
    expect(saved.snapshot.currency).toBe('USD')
    expect(saved.snapshot.taxMode).toBe('EXCLUSIVE')

    // Every slot in the snapshot must retain US tax semantics
    for (const slot of Object.values(saved.snapshot.slots)) {
      expect(slot.currency).toBe('USD')
      expect(slot.taxMode).toBe('EXCLUSIVE')
    }
  })

  it('strictly rejects saving a build with mismatched marketCode', async () => {
    const ukBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    // Attempt to save UK build declared as US market
    await expect(
      saveBuildToGarageVehicle(CUSTOMER_ID, {
        garageVehicleId: 'veh-x4-customer',
        name: 'Mismatched Market Attempt',
        marketCode: 'US',
        configuredBuild: ukBuild,
      })
    ).rejects.toThrow('Market mismatch: input marketCode US does not match configured build marketCode UK')
  })

  it('strictly rejects saving a US build with input marketCode UK', async () => {
    const usBuild = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'US',
    })

    await expect(
      saveBuildToGarageVehicle(CUSTOMER_ID, {
        garageVehicleId: 'veh-xmaxx-customer',
        name: 'Reverse Mismatched Market Attempt',
        marketCode: 'UK',
        configuredBuild: usBuild,
      })
    ).rejects.toThrow('Market mismatch: input marketCode UK does not match configured build marketCode US')
  })

  it('verifies both UK and US saved builds coexist in customer garage without cross-contamination', async () => {
    const ukBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    const usBuild = await resolveBuildConfiguration({
      machineId: 'prod-traxxas-xmaxx-8s',
      marketCode: 'US',
    })

    const ukSaved = await saveBuildToGarageVehicle(CUSTOMER_ID, {
      garageVehicleId: 'veh-x4-customer',
      name: 'UK Fleet Member',
      marketCode: 'UK',
      configuredBuild: ukBuild,
    })

    const usSaved = await saveBuildToGarageVehicle(CUSTOMER_ID, {
      garageVehicleId: 'veh-xmaxx-customer',
      name: 'US Fleet Member',
      marketCode: 'US',
      configuredBuild: usBuild,
    })

    expect(ukSaved.snapshot.currency).toBe('GBP')
    expect(ukSaved.snapshot.taxMode).toBe('INCLUSIVE')

    expect(usSaved.snapshot.currency).toBe('USD')
    expect(usSaved.snapshot.taxMode).toBe('EXCLUSIVE')
  })
})
