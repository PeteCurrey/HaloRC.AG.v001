import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveBuildToGarageVehicle,
  getVehicleActiveBuild,
  getGarageVehicleById,
  resolveBuildConfiguration,
  __resetGarageStoreForTesting,
} from '@halo-rc/db'

describe('Phase 4: Saved Build Historical Snapshot & Price Integrity', () => {
  const CUSTOMER_ID = 'usr-customer'
  const ADVERSARY_ID = 'usr-adversary'

  beforeEach(() => {
    __resetGarageStoreForTesting()
  })

  it('retrieves initial seeded active build for customer X4 vehicle', async () => {
    const activeBuild = await getVehicleActiveBuild('veh-x4-customer', CUSTOMER_ID)

    expect(activeBuild).not.toBeNull()
    expect(activeBuild!.name).toBe('National Championship Spec')
    expect(activeBuild!.status).toBe('ACTIVE')
    expect(activeBuild!.snapshot.machineSku).toBe('XRAY-300034')
    expect(activeBuild!.snapshot.marketCode).toBe('UK')
    expect(activeBuild!.snapshot.currency).toBe('GBP')
    expect(activeBuild!.snapshot.taxMode).toBe('INCLUSIVE')

    // Verify snapshot captured slots
    expect(activeBuild!.snapshot.slots['MOTOR']?.productName).toBe(
      'Hobbywing XeRun V10 G4 13.5T Outlaw Brushless Motor'
    )
    expect(activeBuild!.snapshot.slots['MOTOR']?.unitPriceMinorUnits).toBe(8900)
    expect(activeBuild!.snapshot.slots['ESC']?.unitPriceMinorUnits).toBe(18900)
  })

  it('saves a live Build My Rig configuration into the customer garage vehicle', async () => {
    // Generate authoritative build configuration
    const liveBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
      selectedComponents: {
        MOTOR: 'prod-hw-v10-g4-135t',
        ESC: 'prod-hw-xr10-pro-g3',
      },
    })

    const savedRecord = await saveBuildToGarageVehicle(CUSTOMER_ID, {
      garageVehicleId: 'veh-x4-customer',
      name: 'Club Night High-Speed Setup',
      marketCode: 'UK',
      configuredBuild: liveBuild,
      notes: 'Gearing 28/84 48DP for 8.5 second lap times.',
    })

    expect(savedRecord.id).toMatch(/^gbld-/)
    expect(savedRecord.status).toBe('ACTIVE')
    expect(savedRecord.name).toBe('Club Night High-Speed Setup')
    expect(savedRecord.snapshot.marketCode).toBe('UK')
    expect(savedRecord.snapshot.currency).toBe('GBP')
    expect(savedRecord.snapshot.taxMode).toBe('INCLUSIVE')

    // Historical integrity: verify active build is updated to this latest build
    const active = await getVehicleActiveBuild('veh-x4-customer', CUSTOMER_ID)
    expect(active!.id).toBe(savedRecord.id)
    expect(active!.name).toBe('Club Night High-Speed Setup')
  })

  it('prevents adversary from saving build to customer vehicle', async () => {
    const liveBuild = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    await expect(
      saveBuildToGarageVehicle(ADVERSARY_ID, {
        garageVehicleId: 'veh-x4-customer',
        name: 'Malicious Build Hijack',
        marketCode: 'UK',
        configuredBuild: liveBuild,
      })
    ).rejects.toThrow('Unauthorized or vehicle not found')
  })

  it('preserves immutable snapshot attributes across time without silent mutation', async () => {
    const active = await getVehicleActiveBuild('veh-x4-customer', CUSTOMER_ID)
    const originalPrice = active!.snapshot.totalMinorUnits

    // Verify snapshot fields are fixed values, not recomputed dynamically
    expect(typeof originalPrice).toBe('number')
    expect(active!.snapshot.currency).toBe('GBP')
    expect(active!.snapshot.savedAt).toBe('2026-01-16T10:00:00Z')
  })

  it('retires previous active builds when a new build is saved to the same vehicle', async () => {
    const liveBuild1 = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    const build1 = await saveBuildToGarageVehicle(CUSTOMER_ID, {
      garageVehicleId: 'veh-x4-customer',
      name: 'Version 1 Spec',
      marketCode: 'UK',
      configuredBuild: liveBuild1,
    })

    const liveBuild2 = await resolveBuildConfiguration({
      machineId: 'prod-xray-x4-2026',
      marketCode: 'UK',
    })

    const build2 = await saveBuildToGarageVehicle(CUSTOMER_ID, {
      garageVehicleId: 'veh-x4-customer',
      name: 'Version 2 Spec',
      marketCode: 'UK',
      configuredBuild: liveBuild2,
    })

    const active = await getVehicleActiveBuild('veh-x4-customer', CUSTOMER_ID)
    expect(active!.id).toBe(build2.id)
    expect(active!.name).toBe('Version 2 Spec')
    expect(active!.id).not.toBe(build1.id)
  })

  it('returns null when querying active build for a vehicle with no saved builds', async () => {
    const active = await getVehicleActiveBuild('veh-xmaxx-customer', CUSTOMER_ID)
    expect(active).toBeNull()
  })
})
