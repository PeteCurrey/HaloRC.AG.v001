// tests/supplier-engine-ingestion.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  ingestSupplierFeed,
  getSupplierProducts,
  getSupplierImportExceptions,
  __resetProcurementStoreForTesting,
  DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
} from '@halo-rc/db'

describe('Supplier Catalogue Engine - Ingestion and Exceptions', () => {
  beforeEach(() => {
    __resetProcurementStoreForTesting()
  })

  it('ingests deterministic fixture into supplier products staging and identifies issues', async () => {
    const syncRun = await ingestSupplierFeed(
      'sup-cml',
      DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
      'user-admin',
      'feed-cml-cat'
    )

    expect(syncRun).toBeDefined()
    expect(syncRun.recordsProcessed).toBe(DETERMINISTIC_SUPPLIER_FEED_FIXTURE.length)
    expect(syncRun.recordsRejected).toBeGreaterThan(0) // Corrupt items rejected from valid offers

    // Check supplier products stored in staging
    const products = await getSupplierProducts('sup-cml')
    expect(products.length).toBeGreaterThan(0)

    // Verify valid items are present
    const chassis = products.find((p) => p.supplierSku === 'XRAY-300040')
    expect(chassis).toBeDefined()
    expect(chassis?.rawCostMinorUnits).toBe(49000) // The duplicate line item in fixture updated it to 49000
    expect(chassis?.currency).toBe('GBP')

    // Verify discontinued product status
    const discontinued = products.find((p) => p.supplierSku === 'XRAY-300030-DISC')
    expect(discontinued).toBeDefined()
    expect(discontinued?.isDiscontinued).toBe(true)
    expect(discontinued?.importStatus).toBe('DISCONTINUED')

    // Verify exceptions logged
    const exceptions = await getSupplierImportExceptions('sup-cml')
    expect(exceptions.length).toBeGreaterThan(0)

    // Missing SKU exception
    const missingSkuEx = exceptions.find((e) => e.exceptionCode === 'MISSING_SKU')
    expect(missingSkuEx).toBeDefined()

    // Invalid cost exception (INV-PRICE-001 has 0 cost)
    const invalidCostEx = exceptions.find((e) => e.exceptionCode === 'INVALID_PRICE')
    expect(invalidCostEx).toBeDefined()

    // Duplicate SKU exception
    const duplicateEx = exceptions.find((e) => e.exceptionCode === 'DUPLICATE_SKU')
    expect(duplicateEx).toBeDefined()
  })

  it('is idempotent when re-importing identical feed payload without internal changes', async () => {
    // A clean sub-batch without intra-batch conflicting duplicates
    const cleanItems = DETERMINISTIC_SUPPLIER_FEED_FIXTURE.filter(
      (item) => item.supplierSku && item.cost > 0 && item.title !== "XRAY X4 '26 Duplicate Line Item"
    )

    // First import
    await ingestSupplierFeed('sup-cml', cleanItems, 'user-admin', 'feed-cml-cat')

    // Second import with exact same clean data
    const secondRun = await ingestSupplierFeed('sup-cml', cleanItems, 'user-admin', 'feed-cml-cat')

    expect(secondRun.recordsProcessed).toBe(cleanItems.length)
    // No cost or availability changes occur when re-ingesting identical data
    expect(secondRun.recordsChanged).toBe(0)
  })
})
