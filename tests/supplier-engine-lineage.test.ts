// tests/supplier-engine-lineage.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import {
  ingestSupplierFeed,
  getProductDataLineage,
  __resetProcurementStoreForTesting,
  DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
} from '@halo-rc/db'

describe('Supplier Catalogue Engine - Data Lineage & Provenance', () => {
  beforeEach(() => {
    __resetProcurementStoreForTesting()
  })

  it('traces canonical product back to external supplier, feed, mapping and raw payload', async () => {
    // Run ingestion
    await ingestSupplierFeed(
      'sup-cml',
      DETERMINISTIC_SUPPLIER_FEED_FIXTURE,
      'user-admin',
      'feed-cml-cat'
    )

    // Query lineage for XRAY X4 2026
    const lineages = await getProductDataLineage('prod-xray-x4-2026')

    expect(lineages).toBeDefined()
    expect(lineages.length).toBeGreaterThan(0)

    const cmlLineage = lineages.find((l) => l.supplierId === 'sup-cml')
    expect(cmlLineage).toBeDefined()
    expect(cmlLineage?.supplierName).toBe('CML Distribution')
    expect(cmlLineage?.supplierSku).toBe('XRAY-300040')
    expect(cmlLineage?.canonicalProductSku).toBe('XRAY-300040')
    expect(cmlLineage?.feedId).toBe('feed-cml-cat')
    expect(cmlLineage?.mappingId).toBeDefined()
    expect(cmlLineage?.supplierProductId).toBeDefined()
    expect(cmlLineage?.sourcePayload).toBeDefined()
  })
})
