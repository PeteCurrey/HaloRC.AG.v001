// tests/supplier-engine-schema.test.ts
// Verification of Supplier Engine Schema, Feeds, Separate Staging, and Exception Tables

import { describe, it, expect } from 'vitest'
import {
  supplierFeeds,
  supplierProducts,
  supplierImportExceptions,
  supplierProductMappings,
} from '@halo-rc/db'

describe('Supplier Catalogue Engine Schema Architecture', () => {
  it('defines supplier_feeds with multi-feed capabilities', () => {
    expect(supplierFeeds).toBeDefined()
    expect(supplierFeeds.supplierId).toBeDefined()
    expect(supplierFeeds.feedName).toBeDefined()
    expect(supplierFeeds.feedType).toBeDefined()
    expect(supplierFeeds.format).toBeDefined()
    expect(supplierFeeds.authType).toBeDefined()
    expect(supplierFeeds.scheduleCron).toBeDefined()
    expect(supplierFeeds.isActive).toBeDefined()
  })

  it('defines separate supplier_products staging table preserving raw source provenance', () => {
    expect(supplierProducts).toBeDefined()
    expect(supplierProducts.supplierId).toBeDefined()
    expect(supplierProducts.supplierSku).toBeDefined()
    expect(supplierProducts.supplierProductName).toBeDefined()
    expect(supplierProducts.rawCostMinorUnits).toBeDefined()
    expect(supplierProducts.rawStockQuantity).toBeDefined()
    expect(supplierProducts.sourcePayload).toBeDefined()
    expect(supplierProducts.sourceHash).toBeDefined()
    expect(supplierProducts.isDiscontinued).toBeDefined()
    expect(supplierProducts.importStatus).toBeDefined()
  })

  it('defines supplier_import_exceptions for auditable error and review queues', () => {
    expect(supplierImportExceptions).toBeDefined()
    expect(supplierImportExceptions.syncRunId).toBeDefined()
    expect(supplierImportExceptions.supplierId).toBeDefined()
    expect(supplierImportExceptions.exceptionCode).toBeDefined()
    expect(supplierImportExceptions.severity).toBeDefined()
    expect(supplierImportExceptions.resolutionStatus).toBeDefined()
  })

  it('extends supplier_product_mappings with foreign key to supplier_products', () => {
    expect(supplierProductMappings.supplierProductId).toBeDefined()
  })
})
