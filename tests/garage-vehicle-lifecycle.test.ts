import { describe, it, expect, beforeEach } from 'vitest'
import {
  createGarageVehicle,
  updateGarageVehicle,
  getGarageVehicleById,
  __resetGarageStoreForTesting,
} from '@halo-rc/db'

describe('Phase 4: Garage Vehicle Lifecycle & Catalogue Linking', () => {
  const CUSTOMER_ID = 'usr-customer'

  beforeEach(() => {
    __resetGarageStoreForTesting()
  })

  it('creates an unlinked vehicle (custom or vintage build)', async () => {
    const vehicle = await createGarageVehicle(CUSTOMER_ID, {
      name: 'Custom 1/8 Nitro Buggy Conversion',
      nickname: 'Old School Project',
      colour: 'Custom Airbrush Neon',
      purchaseDate: '2024-05-12',
      serialNumber: null,
      notes: 'Custom chassis plate CNC milled from 7075-T6 aluminium.',
    })

    expect(vehicle.id).toMatch(/^veh-/)
    expect(vehicle.productId).toBeNull()
    expect(vehicle.platformId).toBeNull()
    expect(vehicle.status).toBe('ACTIVE')
    expect(vehicle.isPublic).toBe(false)
    expect(vehicle.qrCodeToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('creates a vehicle linked to catalogue machine and auto-resolves platform', async () => {
    const vehicle = await createGarageVehicle(CUSTOMER_ID, {
      name: 'My New X4 Carpet Weapon',
      productId: 'prod-xray-x4-2026',
      colour: 'Factory Team Orange',
      serialNumber: 'X4-2026-9901',
    })

    expect(vehicle.productId).toBe('prod-xray-x4-2026')
    expect(vehicle.platformId).toBe('plat-xray-x4')
    expect(vehicle.product).not.toBeNull()
    expect(vehicle.product!.name).toBe("XRAY X4 '26 1/10 Electric Touring Car Kit")
    expect(vehicle.platform).not.toBeNull()
    expect(vehicle.platform!.name).toBe('X4')
  })

  it('rejects vehicle creation with an invalid catalogue product ID', async () => {
    await expect(
      createGarageVehicle(CUSTOMER_ID, {
        name: 'Fictional Buggy',
        productId: 'prod-non-existent-999',
      })
    ).rejects.toThrow('Invalid catalogue product ID: prod-non-existent-999')
  })

  it('transitions vehicle status through full lifecycle (ACTIVE -> STORED -> SOLD -> ARCHIVED)', async () => {
    // 1. Initially ACTIVE
    const initial = await getGarageVehicleById('veh-x4-customer', CUSTOMER_ID)
    expect(initial!.status).toBe('ACTIVE')

    // 2. Transition to STORED (winter storage)
    const stored = await updateGarageVehicle(CUSTOMER_ID, 'veh-x4-customer', {
      status: 'STORED',
      notes: 'Shocks drained, diffs sealed with storage oil.',
    })
    expect(stored!.status).toBe('STORED')

    // 3. Transition to SOLD
    const sold = await updateGarageVehicle(CUSTOMER_ID, 'veh-x4-customer', {
      status: 'SOLD',
    })
    expect(sold!.status).toBe('SOLD')

    // 4. Transition to ARCHIVED
    const archived = await updateGarageVehicle(CUSTOMER_ID, 'veh-x4-customer', {
      status: 'ARCHIVED',
    })
    expect(archived!.status).toBe('ARCHIVED')

    // 5. Verify persistence
    const finalState = await getGarageVehicleById('veh-x4-customer', CUSTOMER_ID)
    expect(finalState!.status).toBe('ARCHIVED')
  })

  it('updates vehicle metadata fields cleanly', async () => {
    const updated = await updateGarageVehicle(CUSTOMER_ID, 'veh-x4-customer', {
      nickname: 'Thunderbolt II',
      colour: 'Electric Blue & Stealth Carbon',
      serialNumber: 'SN-X4-UPDATE-1',
    })

    expect(updated!.nickname).toBe('Thunderbolt II')
    expect(updated!.colour).toBe('Electric Blue & Stealth Carbon')
    expect(updated!.serialNumber).toBe('SN-X4-UPDATE-1')
  })

  it('returns null when attempting to update a non-existent vehicle', async () => {
    const result = await updateGarageVehicle(CUSTOMER_ID, 'veh-ghost-vehicle', {
      status: 'STORED',
    })
    expect(result).toBeNull()
  })

  it('maintains independent statuses for multiple vehicles in the same garage', async () => {
    const v1 = await getGarageVehicleById('veh-x4-customer', CUSTOMER_ID)
    const v2 = await getGarageVehicleById('veh-xmaxx-customer', CUSTOMER_ID)

    await updateGarageVehicle(CUSTOMER_ID, 'veh-x4-customer', { status: 'STORED' })

    const v1Updated = await getGarageVehicleById('veh-x4-customer', CUSTOMER_ID)
    const v2Intact = await getGarageVehicleById('veh-xmaxx-customer', CUSTOMER_ID)

    expect(v1Updated!.status).toBe('STORED')
    expect(v2Intact!.status).toBe('ACTIVE')
  })
})
