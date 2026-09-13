import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCustomerGarage,
  getGarageVehicles,
  getGarageVehicleById,
  updateGarageVehicle,
  createGarageVehicle,
  __resetGarageStoreForTesting,
} from '@halo-rc/db'

describe('Phase 4: Garage Tenant Isolation & Authorization Boundary', () => {
  const CUSTOMER_ID = 'usr-customer'
  const ADVERSARY_ID = 'usr-adversary'
  const UNKNOWN_USER = 'usr-stranger-999'

  beforeEach(() => {
    __resetGarageStoreForTesting()
  })

  it('provides a private garage for each customer with tenant isolation', async () => {
    const customerGarage = await getCustomerGarage(CUSTOMER_ID)
    const adversaryGarage = await getCustomerGarage(ADVERSARY_ID)

    expect(customerGarage.id).toBe('garage-customer-1')
    expect(customerGarage.userId).toBe(CUSTOMER_ID)

    expect(adversaryGarage.id).toBe('garage-other-1')
    expect(adversaryGarage.userId).toBe(ADVERSARY_ID)

    expect(customerGarage.id).not.toBe(adversaryGarage.id)
  })

  it('creates a fresh garage on demand for new authenticated users', async () => {
    const newGarage = await getCustomerGarage(UNKNOWN_USER)

    expect(newGarage.userId).toBe(UNKNOWN_USER)
    expect(newGarage.name).toBe('My Garage')
    expect(newGarage.id).toMatch(/^garage-/)
  })

  it('rejects unauthenticated garage access', async () => {
    await expect(getCustomerGarage('')).rejects.toThrow('Unauthorized: User ID required')
  })

  it('strictly prevents adversary from listing customer vehicles', async () => {
    const customerGarage = await getCustomerGarage(CUSTOMER_ID)

    // Adversary attempts to query customer's garage ID
    const stolenVehicles = await getGarageVehicles(customerGarage.id, ADVERSARY_ID)
    expect(stolenVehicles).toHaveLength(0)
  })

  it('strictly prevents customer from reading adversary private vehicle', async () => {
    // Adversary's vehicle veh-other-private
    const vehicle = await getGarageVehicleById('veh-other-private', CUSTOMER_ID)
    expect(vehicle).toBeNull()
  })

  it('strictly prevents adversary from updating customer vehicle status', async () => {
    // Adversary attempts to set customer vehicle to SOLD
    const result = await updateGarageVehicle(ADVERSARY_ID, 'veh-x4-customer', {
      status: 'SOLD',
    })
    expect(result).toBeNull()

    // Verify customer's vehicle remains unchanged
    const intact = await getGarageVehicleById('veh-x4-customer', CUSTOMER_ID)
    expect(intact).not.toBeNull()
    expect(intact!.status).toBe('ACTIVE')
  })

  it('excludes archived vehicles by default but includes them on explicit request', async () => {
    const customerGarage = await getCustomerGarage(CUSTOMER_ID)

    const defaultListing = await getGarageVehicles(customerGarage.id, CUSTOMER_ID)
    const vehicleIds = defaultListing.map((v) => v.id)

    expect(vehicleIds).toContain('veh-x4-customer')
    expect(vehicleIds).toContain('veh-xmaxx-customer')
    expect(vehicleIds).not.toContain('veh-archived-customer')

    // Request including archived
    const fullListing = await getGarageVehicles(customerGarage.id, CUSTOMER_ID, {
      includeArchived: true,
    })
    const fullIds = fullListing.map((v) => v.id)
    expect(fullIds).toContain('veh-archived-customer')
  })

  it('ensures newly created vehicles are strictly bound to creator garage only', async () => {
    const newVehicle = await createGarageVehicle(CUSTOMER_ID, {
      name: 'Private Racer Chassis',
    })

    // Adversary cannot read it
    const adversaryRead = await getGarageVehicleById(newVehicle.id, ADVERSARY_ID)
    expect(adversaryRead).toBeNull()

    // Customer can read it
    const customerRead = await getGarageVehicleById(newVehicle.id, CUSTOMER_ID)
    expect(customerRead).not.toBeNull()
    expect(customerRead!.name).toBe('Private Racer Chassis')
  })

  it('returns null when querying non-existent vehicle ID', async () => {
    const nonExistent = await getGarageVehicleById('veh-non-existent-999', CUSTOMER_ID)
    expect(nonExistent).toBeNull()
  })
})
