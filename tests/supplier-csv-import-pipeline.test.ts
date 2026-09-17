import { describe, it, expect, beforeEach } from 'vitest'
import {
  __resetCsvImportStoreForTesting,
  __getCsvImportStoreCounts,
  createImportJob,
  getImportJob,
  getImportJobs,
  processCsvUpload,
  getImportRows,
  getImportFiles,
  getImportPreview,
  commitImportJob,
  rollbackImportJob,
  rejectImportJob,
  saveFieldMap,
  getFieldMap,
  getMediaEnrichmentQueue,
  updateMediaEnrichmentItem,
  getImportAuditTrail,
} from '@halo-rc/db'
import type { CanonicalImportField, SupplierProduct } from '@halo-rc/types'

describe('Supplier CSV Import Pipeline (Integration & Lifecycle)', () => {
  const supplierId = 'sup-mugen-seiki'
  const adminId = 'admin@avorria.com'

  const sampleFieldMap: Record<string, CanonicalImportField> = {
    'ITEM NO': 'supplier_sku',
    'DESCRIPTION': 'product_name',
    'PRICE/ NET': 'net_price',
    'BARCODE': 'ean',
    'STOCK': 'stock_quantity',
  }

  // Hermetic dummy store for commit / rollback testing
  let testProducts: SupplierProduct[] = []

  const onCreate = (p: SupplierProduct) => {
    testProducts.push(p)
  }

  const onUpdate = (id: string, updates: Partial<SupplierProduct>) => {
    const idx = testProducts.findIndex((p) => p.id === id)
    if (idx >= 0) testProducts[idx] = { ...testProducts[idx]!, ...updates }
  }

  const onDelete = (id: string) => {
    const idx = testProducts.findIndex((p) => p.id === id)
    if (idx >= 0) testProducts.splice(idx, 1)
  }

  const onRestore = (id: string, prev: Record<string, unknown>) => {
    const idx = testProducts.findIndex((p) => p.id === id)
    if (idx >= 0) testProducts[idx] = prev as unknown as SupplierProduct
  }

  beforeEach(() => {
    __resetCsvImportStoreForTesting()
    testProducts = []
  })

  it('manages field maps per supplier independently', async () => {
    const saved = await saveFieldMap(supplierId, sampleFieldMap, 'Mugen CSV Standard', adminId)
    expect(saved.supplierId).toBe(supplierId)
    expect(saved.isActive).toBe(true)

    const fetched = await getFieldMap(supplierId)
    expect(fetched?.mapName).toBe('Mugen CSV Standard')
    expect(fetched?.mappings['ITEM NO']).toBe('supplier_sku')

    // Saving another replaces active
    await saveFieldMap(supplierId, { ...sampleFieldMap, 'NEW_COL': 'description' }, 'Mugen v2', adminId)
    const active = await getFieldMap(supplierId)
    expect(active?.mapName).toBe('Mugen v2')
  })

  it('runs complete upload, staging, preview, commit, and rollback cycle', async () => {
    // 1. Prepare multi-file CSV input
    const csv1 = `ITEM NO,DESCRIPTION,PRICE/ NET,BARCODE,STOCK
B0235,Aluminium Shock Tower,25.00,4944925032547,10
B0236,Rear Carbon Plate,32.50,4944925032554,5
INVALID-ROW,,0.00,,` // Missing name, price zero warning

    const csv2 = `ITEM NO,DESCRIPTION,PRICE/ NET,BARCODE,STOCK
B0235,Aluminium Shock Tower Dup,25.00,4944925032547,10
B0237,Diff Outdrive Set,18.00,4944925032561,20`

    const buffers = [
      { filename: 'parts_batch_1.csv', buffer: Buffer.from(csv1, 'utf8') },
      { filename: 'parts_batch_2.csv', buffer: Buffer.from(csv2, 'utf8') },
    ]

    // 2. Process upload
    const uploadResult = await processCsvUpload(
      supplierId,
      adminId,
      buffers,
      sampleFieldMap,
      [],
      []
    )

    expect(uploadResult.job.id).toBeDefined()
    expect(uploadResult.files.length).toBe(2)
    expect(uploadResult.stats.totalRows).toBe(5)
    expect(uploadResult.stats.duplicate).toBe(1) // B0235 in csv2 is cross-file duplicate
    expect(uploadResult.stats.invalid).toBe(1) // INVALID-ROW

    const jobId = uploadResult.job.id

    // 3. Inspect Preview
    const previewData = await getImportPreview(jobId)
    expect(previewData).not.toBeNull()
    expect(previewData?.preview.validRows).toBe(3) // B0235, B0236, B0237
    expect(previewData?.preview.invalidRows).toBe(1)
    expect(previewData?.preview.duplicateRows).toBe(1)

    // 4. Commit valid rows
    const commitResult = await commitImportJob(
      jobId,
      adminId,
      testProducts as any,
      onCreate as any,
      onUpdate as any
    )

    expect(commitResult.committed).toBe(3)
    expect(commitResult.created).toBe(3)
    expect(commitResult.skipped).toBe(0)
    expect(testProducts.length).toBe(3)
    expect(testProducts.map((p) => p.supplierSku).sort()).toEqual(['B0235', 'B0236', 'B0237'])

    // Verify media enrichment queue was populated
    const mediaQueue = await getMediaEnrichmentQueue(supplierId)
    expect(mediaQueue.length).toBe(3)
    expect(mediaQueue[0]?.enrichmentStatus).toBe('PENDING')

    // Verify job status updated
    const committedJob = await getImportJob(jobId)
    expect(committedJob?.status).toBe('COMMITTED')
    expect(committedJob?.rowsCommitted).toBe(3)

    // 5. Media enrichment update check (with strict source enforcement)
    const firstMedia = mediaQueue[0]!
    await expect(
      updateMediaEnrichmentItem(
        firstMedia.id,
        {
          imageUrl: 'https://example.com/img.jpg',
          imageSourceUrl: '', // empty source URL forbidden
          imageSourceDomain: 'example.com',
          imageRightsStatus: 'CLEARED',
          enrichmentStatus: 'MATCHED',
        },
        adminId
      )
    ).rejects.toThrow(/Image source URL and domain are required/)

    const enriched = await updateMediaEnrichmentItem(
      firstMedia.id,
      {
        imageUrl: 'https://mugen.eu/images/b0235.jpg',
        imageSourceUrl: 'https://mugen.eu/parts/b0235',
        imageSourceDomain: 'mugen.eu',
        imageRightsStatus: 'CLEARED',
        enrichmentStatus: 'MATCHED',
      },
      adminId
    )
    expect(enriched?.enrichmentStatus).toBe('MATCHED')

    // 6. Rollback test
    const rollbackRes = await rollbackImportJob(
      jobId,
      adminId,
      'Test Rollback: uploaded in error',
      onDelete,
      onRestore
    )

    expect(rollbackRes.deletedProducts).toBe(3)
    expect(testProducts.length).toBe(0) // completely wiped

    const rolledBackJob = await getImportJob(jobId)
    expect(rolledBackJob?.status).toBe('ROLLED_BACK')
    expect(rolledBackJob?.rollbackReason).toBe('Test Rollback: uploaded in error')

    // Media items cleared for this job
    const queueAfterRollback = await getMediaEnrichmentQueue(supplierId)
    expect(queueAfterRollback.length).toBe(0)

    // Verify audit trail logged all key events
    const audit = await getImportAuditTrail(supplierId, jobId)
    const actions = audit.map((a) => a.action)
    expect(actions).toContain('JOB_CREATED')
    expect(actions).toContain('ROW_COMMITTED')
    expect(actions).toContain('JOB_COMMITTED')
    expect(actions).toContain('JOB_ROLLED_BACK')
  })

  it('rejects an import job without touching product records', async () => {
    const job = await createImportJob(supplierId, adminId, ['test.csv'])
    const rejected = await rejectImportJob(job.id, adminId)
    expect(rejected?.status).toBe('REJECTED')
  })
})
