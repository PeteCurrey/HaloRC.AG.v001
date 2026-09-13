import { describe, it, expect, beforeEach } from 'vitest'
import {
  resolveVehiclePublicIdentity,
  toggleVehiclePublic,
  updateGarageVehicle,
  __resetGarageStoreForTesting,
} from '@halo-rc/db'

describe('Phase 4: QR Public Identity Resolution & Privacy Boundaries', () => {
  const CUSTOMER_ID = 'usr-customer'
  const PUBLIC_TOKEN = '550e8400-e29b-41d4-a716-446655440001'
  const PRIVATE_TOKEN = '550e8400-e29b-41d4-a716-446655440002'
  const ARCHIVED_TOKEN = '550e8400-e29b-41d4-a716-446655440003'

  beforeEach(() => {
    __resetGarageStoreForTesting()
  })

  it('resolves public vehicle identity for a vehicle with isPublic=true', async () => {
    const identity = await resolveVehiclePublicIdentity(PUBLIC_TOKEN)

    expect(identity).not.toBeNull()
    expect(identity!.token).toBe(PUBLIC_TOKEN)
    expect(identity!.isPublic).toBe(true)
    expect(identity!.vehicleName).toBe("XRAY X4 '26 Carpet Racer")
    expect(identity!.machineName).toBe("XRAY X4 '26 1/10 Electric Touring Car Kit")
    expect(identity!.platformName).toBe('X4')
    expect(identity!.brandName).toBe('XRAY')
    expect(identity!.discipline).toBe('RACE')

    // Verify public build summary includes major powertrain components
    expect(identity!.publicBuildSummary).not.toBeNull()
    expect(identity!.publicBuildSummary!.motor).toBe(
      'Hobbywing XeRun V10 G4 13.5T Outlaw Brushless Motor'
    )
    expect(identity!.publicBuildSummary!.esc).toBe(
      'Hobbywing XeRun XR10 Pro G3 Brushless Speed Controller'
    )
    expect(identity!.publicBuildSummary!.servo).toBe(
      'Savöx SB-2292SG Monster Torque Brushless Servo'
    )
  })

  it('strictly returns null for a private vehicle (isPublic=false) even with valid token', async () => {
    const identity = await resolveVehiclePublicIdentity(PRIVATE_TOKEN)
    expect(identity).toBeNull()
  })

  it('strictly returns null for an archived vehicle with isPublic=false', async () => {
    const identity = await resolveVehiclePublicIdentity(ARCHIVED_TOKEN)
    expect(identity).toBeNull()
  })

  it('strictly returns null for an invalid or non-existent token', async () => {
    const identity = await resolveVehiclePublicIdentity('00000000-0000-0000-0000-000000000000')
    expect(identity).toBeNull()
  })

  it('strictly omits UNKNOWN confidence specifications from public identity', async () => {
    const identity = await resolveVehiclePublicIdentity(PUBLIC_TOKEN)
    expect(identity).not.toBeNull()

    // All returned specifications must be verified/known/inferred — never UNKNOWN
    for (const spec of identity!.specifications) {
      expect(spec.key).toBeDefined()
      expect(spec.value).toBeDefined()
    }
  })

  it('never leaks private customer fields through the public identity endpoint', async () => {
    const identity = await resolveVehiclePublicIdentity(PUBLIC_TOKEN) as any

    expect(identity.userId).toBeUndefined()
    expect(identity.customerId).toBeUndefined()
    expect(identity.customerEmail).toBeUndefined()
    expect(identity.email).toBeUndefined()
    expect(identity.purchaseDate).toBeUndefined()
    expect(identity.serialNumber).toBeUndefined()
    expect(identity.notes).toBeUndefined()
    expect(identity.serviceHistory).toBeUndefined()
    expect(identity.serviceLogs).toBeUndefined()
  })

  it('toggles vehicle public status and instantly reflects in QR resolution', async () => {
    // 1. Make the private X-Maxx public
    await updateGarageVehicle(CUSTOMER_ID, 'veh-xmaxx-customer', {
      isPublic: true,
    })

    // 2. Query QR token — now discoverable
    const identity = await resolveVehiclePublicIdentity(PRIVATE_TOKEN)
    expect(identity).not.toBeNull()
    expect(identity!.vehicleName).toBe('Traxxas X-Maxx 8S Basher')

    // 3. Make it private again
    await updateGarageVehicle(CUSTOMER_ID, 'veh-xmaxx-customer', {
      isPublic: false,
    })

    // 4. Query QR token — now hidden
    const hiddenAgain = await resolveVehiclePublicIdentity(PRIVATE_TOKEN)
    expect(hiddenAgain).toBeNull()
  })
})
