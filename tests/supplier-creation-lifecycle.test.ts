// tests/supplier-creation-lifecycle.test.ts
// Phase 8 — Supplier entity management, relationship status transitions, and integration types

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Supplier creation & profile', () => {
  it('retrieves pre-seeded suppliers', async () => {
    const suppliers = await getSuppliers()
    expect(suppliers.length).toBeGreaterThanOrEqual(4)
    expect(suppliers.some((s) => s.slug === 'cml-distribution')).toBe(true)
    expect(suppliers.some((s) => s.slug === 'horizon-hobby-us')).toBe(true)
  })

  it('creates a new supplier with comprehensive commercial metadata', async () => {
    const supplier = await createSupplier(
      {
        slug: 'tamiya-uk-distributor',
        name: 'The Hobby Company (Tamiya UK)',
        legalName: 'The Hobby Company Ltd',
        supplierType: 'UK_DISTRIBUTOR',
        country: 'GB',
        currency: 'GBP',
        relationshipStatus: 'ACTIVE',
        integrationType: 'CSV',
        accountReference: 'THC-HALO-2026',
        website: 'https://hobbyco.net',
        contactEmail: 'trade@hobbyco.net',
        contactPhone: '+44 1908 605686',
        notes: 'Official UK distributor for Tamiya racing kits and spares.',
      },
      'usr-admin-01'
    )

    expect(supplier.id).toBeTruthy()
    expect(supplier.slug).toBe('tamiya-uk-distributor')
    expect(supplier.supplierType).toBe('UK_DISTRIBUTOR')
    expect(supplier.currency).toBe('GBP')

    const fetched = await getSupplierById(supplier.id)
    expect(fetched).not.toBeNull()
    expect(fetched?.name).toBe('The Hobby Company (Tamiya UK)')
  })

  it('rejects duplicate supplier slug to preserve identity integrity', async () => {
    await expect(
      createSupplier(
        {
          slug: 'cml-distribution', // already exists in seed
          name: 'Duplicate CML Entry',
          supplierType: 'UK_DISTRIBUTOR',
          country: 'GB',
          currency: 'GBP',
          relationshipStatus: 'ACTIVE',
          integrationType: 'MANUAL',
        },
        'usr-admin-01'
      )
    ).rejects.toThrow(/already exists/i)
  })

  it('retrieves supplier by slug or ID', async () => {
    const byId = await getSupplierById('sup-cml')
    const bySlug = await getSupplierById('cml-distribution')

    expect(byId).not.toBeNull()
    expect(bySlug).not.toBeNull()
    expect(byId?.id).toBe(bySlug?.id)
  })

  it('updates supplier relationship status and contact details', async () => {
    const updated = await updateSupplier(
      'sup-cml',
      {
        relationshipStatus: 'SUSPENDED',
        notes: 'Temporarily suspended during annual stocktake audit.',
      },
      'usr-admin-01'
    )

    expect(updated.relationshipStatus).toBe('SUSPENDED')
    expect(updated.notes).toContain('annual stocktake audit')

    const fetched = await getSupplierById('sup-cml')
    expect(fetched?.relationshipStatus).toBe('SUSPENDED')
  })

  it('filters suppliers by relationship status and supplier type', async () => {
    const activeOnly = await getSuppliers({ relationshipStatus: 'ACTIVE' })
    expect(activeOnly.every((s) => s.relationshipStatus === 'ACTIVE')).toBe(true)

    const ukDistributors = await getSuppliers({ supplierType: 'UK_DISTRIBUTOR' })
    expect(ukDistributors.every((s) => s.supplierType === 'UK_DISTRIBUTOR')).toBe(true)
  })
})
