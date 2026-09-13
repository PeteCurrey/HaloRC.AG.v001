// tests/supplier-unmatched-queue.test.ts
// Phase 8 — Unmatched product queue, manual mapping, and rejection audit trail

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getUnmatchedSupplierProducts,
  manuallyMapSupplierProduct,
  rejectSupplierMapping,
  ingestSupplierFeed,
  __resetProcurementStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetProcurementStoreForTesting()
})

describe('Unmatched supplier product queue', () => {
  it('retrieves unmatched supplier items from the queue', async () => {
    // Seed has 1 unmatched sample: map-unmatched-sample
    const queue = await getUnmatchedSupplierProducts()
    expect(queue.length).toBeGreaterThanOrEqual(1)
    expect(queue.some((m) => m.supplierSku === 'RCM-TI-SCREW-M3X8')).toBe(true)
  })

  it('adds new unmatched feed items to the queue during sync', async () => {
    await ingestSupplierFeed('sup-cml', [
      {
        supplierSku: 'CML-NEW-UNKNOWN-01',
        title: 'Unknown Carbon Fibre Battery Retainer Strap',
        cost: 1500,
        currency: 'GBP',
        availability: 'in stock',
      },
    ])

    const queue = await getUnmatchedSupplierProducts('sup-cml')
    expect(queue.some((m) => m.supplierSku === 'CML-NEW-UNKNOWN-01')).toBe(true)
  })

  it('allows an admin to manually map an unmatched item to a canonical product', async () => {
    const queueBefore = await getUnmatchedSupplierProducts()
    const targetItem = queueBefore.find((m) => m.supplierSku === 'RCM-TI-SCREW-M3X8')!

    const mapped = await manuallyMapSupplierProduct(
      targetItem.id,
      'prod-xray-x4-2026',
      'var-xray-x4-2026-kit',
      'usr-admin-reviewer',
      'Verified as compatible screw kit with XRAY X4'
    )

    expect(mapped.status).toBe('MATCHED')
    expect(mapped.canonicalProductId).toBe('prod-xray-x4-2026')
    expect(mapped.matchMethod).toBe('MANUAL_REVIEW')
    expect(mapped.matchConfidenceCategory).toBe('MANUALLY_VERIFIED')
    expect(mapped.reviewedBy).toBe('usr-admin-reviewer')

    // Item should no longer appear in the unmatched queue
    const queueAfter = await getUnmatchedSupplierProducts()
    expect(queueAfter.some((m) => m.id === targetItem.id)).toBe(false)
  })

  it('rejects invalid canonical product ID during manual mapping', async () => {
    const queue = await getUnmatchedSupplierProducts()
    const targetItem = queue[0]!

    await expect(
      manuallyMapSupplierProduct(
        targetItem.id,
        'prod-non-existent-product',
        null,
        'usr-admin-reviewer'
      )
    ).rejects.toThrow(/does not exist/i)
  })

  it('records rejection reason and reviewer when an item is rejected', async () => {
    const queueBefore = await getUnmatchedSupplierProducts()
    const targetItem = queueBefore[0]!

    const rejected = await rejectSupplierMapping(
      targetItem.id,
      'usr-admin-reviewer',
      'Irrelevant accessory: not suitable for competition platform catalogue.'
    )

    expect(rejected.status).toBe('REJECTED')
    expect(rejected.rejectionReason).toContain('Irrelevant accessory')
    expect(rejected.reviewedBy).toBe('usr-admin-reviewer')

    // Should no longer appear in active unmatched queue
    const queueAfter = await getUnmatchedSupplierProducts()
    expect(queueAfter.some((m) => m.id === targetItem.id)).toBe(false)
  })
})
