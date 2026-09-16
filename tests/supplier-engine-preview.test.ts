// tests/supplier-engine-preview.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  previewFeedImport,
  getSupplierProducts,
  getSupplierImportExceptions,
  __resetProcurementStoreForTesting,
  DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
} from '@halo-rc/db'

describe('Supplier Catalogue Engine - Dry Run Preview', () => {
  beforeEach(() => {
    __resetProcurementStoreForTesting()
  })

  it('generates accurate preview summary without mutating staging or exception stores', async () => {
    const preview = await previewFeedImport(
      'sup-cml',
      DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
      'feed-cml-cat-csv'
    )

    expect(preview).toBeDefined()
    expect(preview.totalDiscovered).toBe(DETERMINISTIC_SUPPLIER_FEED_FIXTURE.length)
    expect(preview.validRecords).toBeGreaterThan(0)
    expect(preview.exceptionsCount).toBeGreaterThan(0)
    expect(preview.exceptions.length).toBe(preview.exceptionsCount)

    // Dry run invariant: neither staging products nor exceptions store must be mutated
    const products = await getSupplierProducts('sup-cml')
    // Should only contain seed records (INITIAL_SUPPLIER_PRODUCTS has 1 for sup-cml: XRAY-300040)
    expect(products.length).toBe(1)

    const exceptions = await getSupplierImportExceptions('sup-cml')
    expect(exceptions.length).toBe(0)
  })
})
