import { describe, it, expect, beforeEach } from 'vitest'
import {
  createServiceRecord,
  getVehicleServiceHistory,
  __resetGarageStoreForTesting,
} from '@halo-rc/db'

describe('Phase 4: Garage Service History & Maintenance Logging', () => {
  const CUSTOMER_ID = 'usr-customer'
  const ADVERSARY_ID = 'usr-adversary'

  beforeEach(() => {
    __resetGarageStoreForTesting()
  })

  it('retrieves initial seeded service records sorted by date descending', async () => {
    const history = await getVehicleServiceHistory('veh-x4-customer', CUSTOMER_ID)

    expect(history).toHaveLength(2)
    // Most recent first: 2026-02-05 before 2026-01-20
    expect(history[0]!.date).toBe('2026-02-05')
    expect(history[0]!.serviceType).toBe('REPAIR')
    expect(history[0]!.title).toBe('Front Left Lower Arm Replacement')

    expect(history[1]!.date).toBe('2026-01-20')
    expect(history[1]!.serviceType).toBe('SETUP')
  })

  it('records a new service entry with valid catalogue product references', async () => {
    const newEntry = await createServiceRecord(CUSTOMER_ID, 'veh-x4-customer', {
      title: 'Trackside Pinion & Spur Gear Ratio Change',
      description: 'Swapped from 26T to 28T pinion gear. Checked mesh and motor temperatures.',
      serviceType: 'SETUP',
      date: '2026-03-01',
      partsUsed: [
        {
          productId: 'prod-hw-v10-g4-135t',
        },
      ],
      notes: 'Motor peaked at 62 deg C after 5 min heat.',
    })

    expect(newEntry.id).toMatch(/^srv-/)
    expect(newEntry.serviceType).toBe('SETUP')
    expect(newEntry.title).toBe('Trackside Pinion & Spur Gear Ratio Change')
    expect(newEntry.partsUsed).toHaveLength(1)
    expect(newEntry.partsUsed![0]!.sku).toBe('HW-30401140')

    // Verify it is now first in history
    const history = await getVehicleServiceHistory('veh-x4-customer', CUSTOMER_ID)
    expect(history[0]!.id).toBe(newEntry.id)
    expect(history[0]!.date).toBe('2026-03-01')
  })

  it('rejects service records referencing non-existent catalogue parts', async () => {
    await expect(
      createServiceRecord(CUSTOMER_ID, 'veh-x4-customer', {
        title: 'Faulty Part Test',
        description: 'Using invalid part ID',
        serviceType: 'REPAIR',
        date: '2026-03-01',
        partsUsed: [
          {
            productId: 'prod-fake-component-999',
          },
        ],
      })
    ).rejects.toThrow('Referenced service part "prod-fake-component-999" not found in catalogue')
  })

  it('supports generic non-catalogue parts used (custom bolts, zip ties, grease)', async () => {
    const entry = await createServiceRecord(CUSTOMER_ID, 'veh-x4-customer', {
      title: 'Full Differential Teardown',
      description: 'Cleaned gears with brake cleaner, relubed with Mobil 1 synthetic grease.',
      serviceType: 'MAINTENANCE',
      date: '2026-03-02',
      partsUsed: [
        {
          name: 'Mobil 1 Synthetic Chassis Grease',
        },
      ],
    })

    expect(entry.partsUsed).toHaveLength(1)
    expect(entry.partsUsed![0]!.name).toBe('Mobil 1 Synthetic Chassis Grease')
  })

  it('strictly prevents adversary from logging service entries on customer vehicle', async () => {
    await expect(
      createServiceRecord(ADVERSARY_ID, 'veh-x4-customer', {
        title: 'Vandalism Log Entry',
        description: 'Trying to inject service record into someone else car',
        serviceType: 'REPAIR',
        date: '2026-03-01',
      })
    ).rejects.toThrow('Unauthorized or vehicle not found')
  })

  it('strictly prevents adversary from viewing customer service history', async () => {
    const history = await getVehicleServiceHistory('veh-x4-customer', ADVERSARY_ID)
    expect(history).toHaveLength(0)
  })

  it('returns empty list for vehicle with no logged service history', async () => {
    const history = await getVehicleServiceHistory('veh-xmaxx-customer', CUSTOMER_ID)
    expect(history).toHaveLength(0)
  })

  it('supports logging all valid service types from the ServiceType enum', async () => {
    const types = ['MAINTENANCE', 'SETUP', 'REPAIR', 'UPGRADE', 'INSPECTION', 'OTHER'] as const

    for (const serviceType of types) {
      const record = await createServiceRecord(CUSTOMER_ID, 'veh-xmaxx-customer', {
        title: `Test ${serviceType} Service`,
        description: `Performing ${serviceType.toLowerCase()} verification`,
        serviceType,
        date: '2026-03-10',
      })
      expect(record.serviceType).toBe(serviceType)
    }

    const history = await getVehicleServiceHistory('veh-xmaxx-customer', CUSTOMER_ID)
    expect(history).toHaveLength(6)
  })
})
