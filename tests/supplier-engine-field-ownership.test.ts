// tests/supplier-engine-field-ownership.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  ingestSupplierFeed,
  __resetProcurementStoreForTesting,
  DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
  SEED_PRODUCTS,
} from '@halo-rc/db'

describe('Supplier Catalogue Engine - Field Ownership Invariant', () => {
  beforeEach(() => {
    __resetProcurementStoreForTesting()
  })

  it('never mutates canonical storefront products, editorial summaries, or titles during ingestion', async () => {
    // Snapshot original canonical products
    const originalSnapshot = JSON.stringify(SEED_PRODUCTS)

    // Perform ingestion of external supplier data
    await ingestSupplierFeed(
      'sup-cml',
      DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
      'user-admin',
      'feed-cml-cat-csv'
    )

    // Snapshot after ingestion
    const afterSnapshot = JSON.stringify(SEED_PRODUCTS)

    // The canonical products catalog must remain strictly untouched
    expect(afterSnapshot).toBe(originalSnapshot)

    // Specifically inspect XRAY X4 2026 canonical product
    const canonicalXray = SEED_PRODUCTS.find((p) => p.id === 'prod-xray-x4-2026')
    expect(canonicalXray).toBeDefined()
    expect(canonicalXray?.name).toBe("XRAY X4 '26 1/10 Electric Touring Car Kit")
    expect(canonicalXray?.sku).toBe('XRAY-300040')
    expect(canonicalXray?.editorialSummary).toBeDefined()
  })
})
