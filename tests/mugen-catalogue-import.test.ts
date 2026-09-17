// tests/mugen-catalogue-import.test.ts
// Comprehensive verification suite for MUGEN Seiki / Mugen Seiki Europe Catalogue Implementation

import { describe, it, expect, beforeEach } from 'vitest'
import {
  MugenCatalogueImporter,
  classifyMugenItem,
  resolveMugenProductMedia,
  getSuppliers,
  getSupplierProducts,
  getSupplierSyncRuns,
  STORE_PRODUCTS,
  STORE_VARIANTS,
  STORE_OFFERS,
  __resetProcurementStoreForTesting,
  __resetCatalogueStoreForTesting,
} from '@halo-rc/db'

describe('MUGEN Seiki Production Catalogue Import Engine', () => {
  let importer: MugenCatalogueImporter

  beforeEach(() => {
    __resetProcurementStoreForTesting()
    __resetCatalogueStoreForTesting()
    importer = new MugenCatalogueImporter()
  })

  // ── 1. File Inspection & Manifest ──────────────────────────────────────────
  describe('1. File Location, Inspection & Manifest', () => {
    it('accurately identifies and extracts manifest metadata for all three MUGEN files', () => {
      const manifest = importer.getImportManifest()

      expect(manifest.length).toBe(3)

      const kits = manifest.find((m) => m.filename.includes('kits'))
      expect(kits).toBeDefined()
      expect(kits?.fileSize).toBeGreaterThan(0)
      expect(kits?.detectedEncoding).toBe('UTF-8')
      expect(kits?.delimiter).toBe(',')
      expect(kits?.columnNames).toContain('ITEM')
      expect(kits?.columnNames).toContain('DESCRIPTION')
      expect(kits?.columnNames).toContain('PRICE/ NET')
      expect(kits?.rowCount).toBe(12) // 10 kits rows + 1 spacer + 1 validity note row
      expect(kits?.duplicateCount).toBe(2) // E2027 and E2028 multi-editions

      const mrx = manifest.find((m) => m.filename.includes('MRX'))
      expect(mrx).toBeDefined()
      expect(mrx?.columnNames).toContain('part no')
      expect(mrx?.columnNames).toContain('descr.')
      expect(mrx?.columnNames).toContain('Net price')
      expect(mrx?.rowCount).toBe(224)
      expect(mrx?.duplicateCount).toBe(0)

      const shop = manifest.find((m) => m.filename.startsWith('Shop INT'))
      expect(shop).toBeDefined()
      expect(shop?.columnNames).toContain('Item Code')
      expect(shop?.columnNames).toContain('Item Name')
      expect(shop?.columnNames).toContain('Artikelbeschreibung')
      expect(shop?.columnNames).toContain('Listenpreis')
      expect(shop?.columnNames).toContain('EAN Code')
      expect(shop?.rowCount).toBe(2629)
      expect(shop?.duplicateCount).toBe(24) // 24 EN/DE translation duplicate rows
    })
  })

  // ── 2. Deduplication & 181 Overlaps ─────────────────────────────────────────
  describe('2. Deduplication & Investigation of the 181 Overlaps', () => {
    it('detects exactly 181 overlapping SKUs between MRX Shop (Nov 2025) and Shop INT (June 2025)', () => {
      const { overlaps181Count, overlapConflicts } = importer.analyzeOverlapsAndDeduplicate()

      expect(overlaps181Count).toBe(181)

      // 8 price discrepancy conflicts detected: 6 between June 2025 and Nov 2025, plus 2 multi-editions in kits
      expect(overlapConflicts.length).toBe(8)

      const conflictedSkus = overlapConflicts.map((c) => c.sku)
      expect(conflictedSkus).toContain('H0142-B')
      expect(conflictedSkus).toContain('H0187')
      expect(conflictedSkus).toContain('H2220')
      expect(conflictedSkus).toContain('H2313')
      expect(conflictedSkus).toContain('H2315')
      expect(conflictedSkus).toContain('H2902A')
      expect(conflictedSkus).toContain('E2027')
      expect(conflictedSkus).toContain('E2028')
    })

    it('produces exactly 2,655 unique canonical products without duplicate identities', () => {
      const { canonicalProducts } = importer.analyzeOverlapsAndDeduplicate()

      expect(canonicalProducts.length).toBe(2655)

      // Ensure every SKU is uniquely represented
      const skus = new Set(canonicalProducts.map((p) => p.sku))
      expect(skus.size).toBe(2655)
    })

    it('retains source provenance for multi-file overlaps', () => {
      const { canonicalProducts } = importer.analyzeOverlapsAndDeduplicate()

      // H2009 (MRX-7 chassis kit) appears in Kits and MRX
      const h2009 = canonicalProducts.find((p) => p.sku === 'H2009')
      expect(h2009).toBeDefined()
      expect(h2009?.sourceFiles.length).toBeGreaterThanOrEqual(2)
      expect(h2009?.netCostMinorUnits).toBe(64900) // €649.00 in minor units
      expect(h2009?.currency).toBe('EUR')

      // H0142-B (radio plate mount) appears in MRX and Shop INT with price update
      const h0142 = canonicalProducts.find((p) => p.sku === 'H0142-B')
      expect(h0142).toBeDefined()
      expect(h0142?.sourceFiles.length).toBe(2)
      // Authoritative cost resolved from newer Nov 2025 file (€3.7511 -> 375 cents)
      expect(h0142?.netCostMinorUnits).toBe(375)
    })
  })

  // ── 3. Product Classification ──────────────────────────────────────────────
  describe('3. Product Classification & Taxonomy', () => {
    it('correctly classifies complete kits into appropriate racing categories', () => {
      const mtc3 = classifyMugenItem('A2006', 'MTC-3 1/10 EP TOURING KIT OHNE RÄDER / ALU. CHASSIS')
      expect(mtc3.productType).toBe('KIT')
      expect(mtc3.categoryId).toBe('cat-110-touring')
      expect(mtc3.discipline).toBe('RACE')

      const msb1 = classifyMugenItem('B2001', 'MSB1 1/10 2WD EP BUGGY KIT')
      expect(msb1.productType).toBe('KIT')
      expect(msb1.categoryId).toBe('cat-18-buggy')

      const mbx8r = classifyMugenItem('E2027', 'MBX-8 "R" NITRO 1/8 4WD OFF-ROAD BUGGY')
      expect(mbx8r.productType).toBe('KIT')
      expect(mbx8r.categoryId).toBe('cat-18-buggy')

      const mrx7 = classifyMugenItem('H2009', 'MRX-7 1/8 ON-ROAD FAHRZEUG')
      expect(mrx7.productType).toBe('KIT')
      expect(mrx7.categoryId).toBe('cat-15-onroad')
    })

    it('distinguishes option parts, accessories, tools, and replacement spares', () => {
      const carbonShockTower = classifyMugenItem('B2504-B', 'Rear Shock Tower (+2m) CFRP MSB1')
      expect(carbonShockTower.productType).toBe('OPTION_PART')
      expect(carbonShockTower.categoryId).toBe('cat-parts')

      const siliconeOil = classifyMugenItem('B0321', 'SUPER SILICONE FOR DIFF.#3000')
      expect(siliconeOil.productType).toBe('ACCESSORY')
      expect(siliconeOil.categoryId).toBe('cat-garage-culture')

      const pinionTool = classifyMugenItem('B0542', 'PINION GEAR TOOL FOR MTX-5')
      expect(pinionTool.productType).toBe('TOOLS')
      expect(pinionTool.categoryId).toBe('cat-garage-culture')

      const spareBulkhead = classifyMugenItem('A2101L', 'FRONT UPPER BULKHEAD LEFT')
      expect(spareBulkhead.productType).toBe('REPLACEMENT_PART')
      expect(spareBulkhead.categoryId).toBe('cat-parts')
    })
  })

  // ── 4. Commercial Data & Supplier Pricing ───────────────────────────────────
  describe('4. Commercial Data & Pricing Integrity', () => {
    it('preserves supplier net ex-VAT pricing in EUR without exposure of wholesale margins', async () => {
      const { canonicalProducts } = importer.analyzeOverlapsAndDeduplicate()

      const a2006 = canonicalProducts.find((p) => p.sku === 'A2006')
      expect(a2006).toBeDefined()
      expect(a2006?.netCostMinorUnits).toBe(52900) // €529.00 net
      expect(a2006?.currency).toBe('EUR')

      // Check Summer Offensive promotional campaign notes are retained
      expect(a2006?.promoInfo).toBe('*449,00€')
    })
  })

  // ── 5. Official MUGEN Website Image Enrichment ─────────────────────────────
  describe('5. Official MUGEN Website Image Enrichment', () => {
    it('attaches exact high-resolution images for verified MUGEN kits and items', () => {
      const media = resolveMugenProductMedia('A2006', 'MTC-3 1/10 EP TOURING KIT', 'KIT')

      expect(media.reviewCategory).toBe('IMAGE_MATCHED')
      expect(media.mediaConfidence).toBe('EXACT_SKU_MATCH')
      expect(media.matchingMethod).toBe('EXACT_MUGEN_PRODUCT_PAGE')
      expect(media.sourceDomain).toBe('www.mugenshop.eu')
      expect(media.imageUrl).toContain('https://www.mugenshop.eu/media/')
      expect(media.imageUrl).toContain('mtc3.jpeg')
      expect(media.rightsReviewStatus).toBe('RIGHTS_REVIEW_REQUIRED')
    })

    it('flags unmatched products as IMAGE_NOT_FOUND and does NOT attach fake or competitor images', () => {
      const media = resolveMugenProductMedia('UNKNOWN-999', 'Unknown Spec Part', 'PART')

      expect(media.reviewCategory).toBe('IMAGE_NOT_FOUND')
      expect(media.mediaConfidence).toBe('UNMATCHED')
      expect(media.imageUrl).toBeNull()
      expect(media.sourceUrl).toBeNull()
      expect(media.rightsReviewStatus).toBe('RIGHTS_REVIEW_REQUIRED')
    })
  })

  // ── 6. End-to-End Ingestion, Deduplication & Quality Report ────────────────
  describe('6. End-to-End Procurement Engine Execution', () => {
    it('completes the full ingestion run across all 3 files without errors', async () => {
      const result = await importer.executeImport('user-test-admin')

      expect(result.syncRunIds.length).toBe(3)
      expect(result.canonicalCount).toBe(2655)

      // Verify sync runs in procurement store
      const syncRuns = await getSupplierSyncRuns('sup-mugen-europe')
      expect(syncRuns.length).toBe(3)

      // Verify staged supplier products in procurement staging (2,646 valid items; 9 zero-price items rejected)
      const supplierProducts = await getSupplierProducts('sup-mugen-europe')
      expect(supplierProducts.length).toBe(2646)

      // Verify canonical products created in catalogue store
      const mugenKits = STORE_PRODUCTS.filter(
        (p) => p.brandId === 'brand-mugen-seiki' && p.productType === 'KIT'
      )
      expect(mugenKits.length).toBeGreaterThanOrEqual(8)

      // Verify publication safety: products are kept in REVIEW / DRAFT in admin
      const publishedMugen = STORE_PRODUCTS.filter(
        (p) => p.brandId === 'brand-mugen-seiki' && p.published === true
      )
      expect(publishedMugen.length).toBe(0) // None automatically published without manual clearance

      // Verify quality report metrics
      const report = result.report
      expect(report.filesProcessed).toBe(3)
      expect(report.rowsProcessed).toBe(2863) // 10 kits + 224 MRX + 2629 shop
      expect(report.uniqueSupplierSkus).toBe(2655)
      expect(report.conflictsDetected).toBe(8)
      expect(report.rejectedRows).toBe(9)
      expect(report.validPrices).toBe(2646)
      expect(report.invalidPrices).toBe(9)
      expect(report.imagesMatched).toBeGreaterThanOrEqual(10)
      expect(report.rightsReviewItems).toBe(2655)
      expect(report.confidenceBreakdown.VERIFIED).toBe(2646)
      expect(report.confidenceBreakdown.KNOWN).toBe(9)
    })
  })
})
