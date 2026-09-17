// packages/db/src/queries/csv-imports.ts
// In-memory store + CRUD for the reusable supplier CSV import pipeline.
// Follows the same in-memory pattern used throughout the procurement layer.

import type {
  CsvImportJob,
  CsvImportFile,
  CsvImportRow,
  SupplierFieldMap,
  CanonicalImportField,
  ImportJobStatus,
  ImportRowStatus,
  ImportRowAction,
  ImportMatchConfidence,
  MediaEnrichmentItem,
  ImportAuditEntry,
  ImportAuditAction,
  ImportRollbackRecord,
  ParsedCsvResult,
  Currency,
  SupplierProduct,
} from '@halo-rc/types'
import {
  parseCsvBuffer,
  normaliseRow,
  validateRow,
  detectDuplicates,
  matchSku,
  buildPreview,
  buildPreviewRows,
} from '../importers/csv-import-engine'
import { computeSourceHash } from '../utils/hash'

// ── In-Memory Stores ──────────────────────────────────────────────────────────

let CSV_IMPORT_JOBS_STORE: CsvImportJob[] = []
let CSV_IMPORT_FILES_STORE: CsvImportFile[] = []
let CSV_IMPORT_ROWS_STORE: CsvImportRow[] = []
let CSV_IMPORT_FIELD_MAPS_STORE: SupplierFieldMap[] = []
let CSV_IMPORT_ROLLBACK_STORE: ImportRollbackRecord[] = []
let MEDIA_ENRICHMENT_STORE: MediaEnrichmentItem[] = []
let IMPORT_AUDIT_STORE: ImportAuditEntry[] = []

// ── ID Generator ──────────────────────────────────────────────────────────────

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

function now(): string {
  return new Date().toISOString()
}

// ── Test Helpers ──────────────────────────────────────────────────────────────

export function __resetCsvImportStoreForTesting(): void {
  CSV_IMPORT_JOBS_STORE = []
  CSV_IMPORT_FILES_STORE = []
  CSV_IMPORT_ROWS_STORE = []
  CSV_IMPORT_FIELD_MAPS_STORE = []
  CSV_IMPORT_ROLLBACK_STORE = []
  MEDIA_ENRICHMENT_STORE = []
  IMPORT_AUDIT_STORE = []
}

export function __getCsvImportStoreCounts() {
  return {
    jobs: CSV_IMPORT_JOBS_STORE.length,
    files: CSV_IMPORT_FILES_STORE.length,
    rows: CSV_IMPORT_ROWS_STORE.length,
    fieldMaps: CSV_IMPORT_FIELD_MAPS_STORE.length,
    rollbackRecords: CSV_IMPORT_ROLLBACK_STORE.length,
    mediaItems: MEDIA_ENRICHMENT_STORE.length,
    auditEntries: IMPORT_AUDIT_STORE.length,
  }
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

function writeAudit(
  supplierId: string,
  action: ImportAuditAction,
  opts: {
    actor?: string | null | undefined
    importJobId?: string | null | undefined
    entityType?: string | null | undefined
    entityId?: string | null | undefined
    previousValue?: unknown
    newValue?: unknown
    sourceFilename?: string | null | undefined
    sourceRowNumber?: number | null | undefined
    notes?: string | null | undefined
  } = {}
): void {
  IMPORT_AUDIT_STORE.push({
    id: genId('audit'),
    actor: opts.actor ?? null,
    timestamp: now(),
    supplierId,
    importJobId: opts.importJobId ?? null,
    action,
    entityType: opts.entityType ?? null,
    entityId: opts.entityId ?? null,
    previousValue: opts.previousValue ?? null,
    newValue: opts.newValue ?? null,
    sourceFilename: opts.sourceFilename ?? null,
    sourceRowNumber: opts.sourceRowNumber ?? null,
    notes: opts.notes ?? null,
  })
}

// ── Import Job CRUD ───────────────────────────────────────────────────────────

/**
 * Create a new import job for a supplier.
 */
export async function createImportJob(
  supplierId: string,
  uploadedBy: string | null,
  filenames: string[]
): Promise<CsvImportJob> {
  const job: CsvImportJob = {
    id: genId('job'),
    supplierId,
    uploadedBy,
    status: 'UPLOADED',
    currentStage: 'UPLOAD',
    fileCount: filenames.length,
    filenames,
    rowsTotal: 0,
    rowsValid: 0,
    rowsInvalid: 0,
    rowsDuplicate: 0,
    rowsCommitted: 0,
    rowsRejected: 0,
    newProducts: 0,
    updatedProducts: 0,
    priceChanges: 0,
    stockChanges: 0,
    missingImagery: 0,
    missingCommercialData: 0,
    errors: [],
    warnings: [],
    createdAt: now(),
    updatedAt: now(),
    committedAt: null,
    committedBy: null,
    rolledBackAt: null,
    rolledBackBy: null,
    rollbackReason: null,
  }
  CSV_IMPORT_JOBS_STORE.push(job)
  writeAudit(supplierId, 'JOB_CREATED', {
    actor: uploadedBy,
    importJobId: job.id,
    newValue: { filenames, fileCount: filenames.length },
  })
  return job
}

/**
 * Get a single import job by ID.
 */
export async function getImportJob(jobId: string): Promise<CsvImportJob | null> {
  return CSV_IMPORT_JOBS_STORE.find((j) => j.id === jobId) ?? null
}

/**
 * Get all import jobs for a supplier (most recent first).
 */
export async function getImportJobs(supplierId?: string): Promise<CsvImportJob[]> {
  const jobs = supplierId
    ? CSV_IMPORT_JOBS_STORE.filter((j) => j.supplierId === supplierId)
    : [...CSV_IMPORT_JOBS_STORE]
  return jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Update an import job's status and/or stats.
 */
export async function updateImportJobStatus(
  jobId: string,
  status: ImportJobStatus,
  stage?: string,
  stats?: Partial<Pick<CsvImportJob,
    | 'rowsTotal' | 'rowsValid' | 'rowsInvalid' | 'rowsDuplicate'
    | 'newProducts' | 'updatedProducts' | 'priceChanges' | 'stockChanges'
    | 'missingImagery' | 'missingCommercialData' | 'errors' | 'warnings'
  >>
): Promise<CsvImportJob | null> {
  const idx = CSV_IMPORT_JOBS_STORE.findIndex((j) => j.id === jobId)
  if (idx < 0) return null
  const job = { ...CSV_IMPORT_JOBS_STORE[idx]!, status, updatedAt: now() }
  if (stage) job.currentStage = stage
  if (stats) Object.assign(job, stats)
  CSV_IMPORT_JOBS_STORE[idx] = job
  return job
}

// ── File CRUD ─────────────────────────────────────────────────────────────────

/**
 * Store a parsed CSV file record associated with an import job.
 */
export async function createImportFile(
  jobId: string,
  supplierId: string,
  parsed: ParsedCsvResult
): Promise<CsvImportFile> {
  const file: CsvImportFile = {
    id: genId('file'),
    jobId,
    supplierId,
    originalFilename: parsed.filename,
    fileSizeBytes: Buffer.from(parsed.fileHash, 'hex').length, // approximate
    detectedEncoding: parsed.encoding,
    detectedDelimiter: parsed.delimiter,
    sourceFileHash: parsed.fileHash,
    rowCount: parsed.rowCount,
    duplicateCount: 0, // updated after dedup
    columnNames: parsed.columnNames,
    uploadedAt: now(),
  }
  CSV_IMPORT_FILES_STORE.push(file)
  return file
}

/**
 * Get all files associated with an import job.
 */
export async function getImportFiles(jobId: string): Promise<CsvImportFile[]> {
  return CSV_IMPORT_FILES_STORE.filter((f) => f.jobId === jobId)
}

// ── Row CRUD ──────────────────────────────────────────────────────────────────

/**
 * Stage a set of parsed rows from a CSV file.
 * Applies field mapping, normalisation, validation, duplicate detection, and SKU matching.
 */
export async function stageImportRows(
  jobId: string,
  fileId: string,
  supplierId: string,
  parsedResult: ParsedCsvResult,
  fieldMap: Record<string, CanonicalImportField>,
  existingMappings: Array<{
    supplierId: string
    supplierSku: string
    canonicalProductId: string | null
    canonicalVariantId: string | null
    status: string
  }>,
  existingSupplierProducts: Array<{
    supplierId: string
    supplierSku: string
    id: string
    manufacturerSku: string | null
    eanGtin: string | null
  }>
): Promise<{ rows: CsvImportRow[]; stats: { valid: number; invalid: number; duplicate: number } }> {
  const t = now()
  const normalisedRows = parsedResult.rows.map((rawRow) =>
    normaliseRow(rawRow, fieldMap)
  )

  // Duplicate detection across all rows in this file
  const dupResult = detectDuplicates(
    normalisedRows.map((r) => ({ supplierSku: r.supplierSku, eanGtin: r.eanGtin }))
  )

  // Also check against already-staged rows for this job (cross-file dedup)
  const alreadyStagedSkus = new Map<string, string>()
  const alreadyStagedEans = new Map<string, string>()
  CSV_IMPORT_ROWS_STORE
    .filter((r) => r.jobId === jobId)
    .forEach((r) => {
      if (r.supplierSku) alreadyStagedSkus.set(r.supplierSku.toUpperCase(), r.id)
      if (r.eanGtin) alreadyStagedEans.set(r.eanGtin, r.id)
    })

  const stagedRows: CsvImportRow[] = []
  let valid = 0, invalid = 0, duplicate = 0

  parsedResult.rows.forEach((rawRow, idx) => {
    const norm = normalisedRows[idx]!
    const validation = validateRow(norm)
    const match = norm.supplierSku || norm.eanGtin || norm.manufacturerSku
      ? matchSku(supplierId, norm.supplierSku, norm.manufacturerSku, norm.eanGtin, existingMappings, existingSupplierProducts)
      : { matchedProductId: null, matchedVariantId: null, matchMethod: null, confidence: 'UNKNOWN' as ImportMatchConfidence, rowAction: 'CREATE' as ImportRowAction }

    // Determine row status
    let rowStatus: ImportRowStatus = validation.rowStatus
    let isDuplicateOfRowId: string | null = null

    // Check intra-file duplicates
    if (dupResult.duplicates.has(idx)) {
      rowStatus = 'DUPLICATE'
      // Resolve the original row ID
      const originalIdx = dupResult.duplicates.get(idx)!
      const originalRow = stagedRows[originalIdx]
      if (originalRow) isDuplicateOfRowId = originalRow.id
    }

    // Check cross-file duplicates (rows already staged for this job)
    if (rowStatus !== 'DUPLICATE' && norm.supplierSku) {
      const crossFileOriginalId = alreadyStagedSkus.get(norm.supplierSku.toUpperCase())
      if (crossFileOriginalId) {
        rowStatus = 'DUPLICATE'
        isDuplicateOfRowId = crossFileOriginalId
      }
    }

    const row: CsvImportRow = {
      id: genId('row'),
      jobId,
      fileId,
      supplierId,
      sourceFilename: parsedResult.filename,
      sourceRowNumber: idx + 2, // +2: 1-based + skip header
      rawPayload: rawRow,
      supplierSku: norm.supplierSku,
      manufacturerSku: norm.manufacturerSku,
      eanGtin: norm.eanGtin,
      productName: norm.productName,
      description: norm.description,
      brand: norm.brand,
      category: norm.category,
      netPriceMinorUnits: norm.netPriceMinorUnits,
      currency: norm.currency,
      rrpMinorUnits: norm.rrpMinorUnits,
      stockQuantity: norm.stockQuantity,
      rawAvailability: norm.rawAvailability,
      mappedProductId: match.matchedProductId,
      mappedVariantId: match.matchedVariantId,
      matchMethod: match.matchMethod,
      matchConfidence: match.confidence,
      rowStatus,
      rowAction: rowStatus === 'DUPLICATE' ? 'SKIP' : match.rowAction,
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      isDuplicateOfRowId,
      createdAt: t,
      updatedAt: t,
    }

    // Track for cross-file dedup
    if (norm.supplierSku && rowStatus !== 'DUPLICATE') {
      alreadyStagedSkus.set(norm.supplierSku.toUpperCase(), row.id)
    }
    if (norm.eanGtin && rowStatus !== 'DUPLICATE') {
      alreadyStagedEans.set(norm.eanGtin, row.id)
    }

    if (rowStatus === 'DUPLICATE') duplicate++
    else if (rowStatus === 'INVALID') invalid++
    else valid++

    stagedRows.push(row)
  })

  CSV_IMPORT_ROWS_STORE.push(...stagedRows)
  return { rows: stagedRows, stats: { valid, invalid, duplicate } }
}

/**
 * Get all staged rows for an import job, with optional filtering.
 */
export async function getImportRows(
  jobId: string,
  opts?: {
    status?: ImportRowStatus | undefined
    action?: ImportRowAction | undefined
    fileId?: string | undefined
    limit?: number | undefined
    offset?: number | undefined
  }
): Promise<CsvImportRow[]> {
  let rows = CSV_IMPORT_ROWS_STORE.filter((r) => r.jobId === jobId)
  if (opts?.status) rows = rows.filter((r) => r.rowStatus === opts.status)
  if (opts?.action) rows = rows.filter((r) => r.rowAction === opts.action)
  if (opts?.fileId) rows = rows.filter((r) => r.fileId === opts.fileId)
  if (opts?.offset) rows = rows.slice(opts.offset)
  if (opts?.limit) rows = rows.slice(0, opts.limit)
  return rows
}

// ── Field Map CRUD ────────────────────────────────────────────────────────────

/**
 * Get the active field map for a supplier.
 */
export async function getFieldMap(supplierId: string): Promise<SupplierFieldMap | null> {
  return CSV_IMPORT_FIELD_MAPS_STORE.find((m) => m.supplierId === supplierId && m.isActive) ?? null
}

/**
 * Save or replace the active field map for a supplier.
 * Deactivates any previous active map.
 */
export async function saveFieldMap(
  supplierId: string,
  mappings: Record<string, CanonicalImportField>,
  mapName: string,
  actorId: string | null
): Promise<SupplierFieldMap> {
  const t = now()

  // Deactivate existing active maps
  CSV_IMPORT_FIELD_MAPS_STORE = CSV_IMPORT_FIELD_MAPS_STORE.map((m) =>
    m.supplierId === supplierId && m.isActive ? { ...m, isActive: false, updatedAt: t } : m
  )

  const fieldMap: SupplierFieldMap = {
    id: genId('fmap'),
    supplierId,
    mapName,
    isActive: true,
    mappings,
    createdAt: t,
    updatedAt: t,
    createdBy: actorId,
  }

  CSV_IMPORT_FIELD_MAPS_STORE.push(fieldMap)

  writeAudit(supplierId, 'FIELD_MAP_SAVED', {
    actor: actorId,
    newValue: { mapName, mappings },
    notes: `Field map "${mapName}" saved`,
  })

  return fieldMap
}

// ── Commit ────────────────────────────────────────────────────────────────────

/**
 * Commit an import job: apply all valid/warning rows to the supplier product store.
 *
 * This function:
 * - Only processes rows with status VALID or WARNING
 * - Skips INVALID, DUPLICATE, REJECTED rows
 * - Records rollback snapshots for every change
 * - Creates media enrichment queue items for products lacking imagery
 * - Updates the job status to COMMITTED
 * - Writes audit entries
 *
 * The supplier_products and supplier_offers stores are imported from procurement.ts
 * at call time to avoid circular imports.
 */
export async function commitImportJob(
  jobId: string,
  actorId: string | null,
  supplierProductsStore: SupplierProduct[],
  onCreateProduct: (product: SupplierProduct) => void,
  onUpdateProduct: (id: string, updates: Partial<SupplierProduct>) => void
): Promise<{
  committed: number
  created: number
  updated: number
  priceChanges: number
  stockChanges: number
  skipped: number
  rollbackRecords: ImportRollbackRecord[]
}> {
  const job = await getImportJob(jobId)
  if (!job) throw new Error(`Import job ${jobId} not found`)
  if (job.status === 'COMMITTED') throw new Error(`Import job ${jobId} is already committed`)
  if (job.status === 'ROLLED_BACK') throw new Error(`Import job ${jobId} has been rolled back`)

  const t = now()
  const rows = await getImportRows(jobId, { status: 'VALID' })
  const warningRows = await getImportRows(jobId, { status: 'WARNING' })
  const commitableRows = [...rows, ...warningRows]

  const rollbackRecords: ImportRollbackRecord[] = []
  let created = 0, updated = 0, priceChanges = 0, stockChanges = 0, skipped = 0

  for (const row of commitableRows) {
    if (!row.supplierSku || !row.productName) {
      skipped++
      continue
    }

    const currency = row.currency ?? 'GBP'
    const newHash = computeSourceHash({
      sku: row.supplierSku,
      price: row.netPriceMinorUnits,
      stock: row.stockQuantity,
    })

    const existingProduct = supplierProductsStore.find(
      (p) => p.supplierId === row.supplierId && p.supplierSku.toUpperCase() === row.supplierSku!.toUpperCase()
    )

    if (existingProduct) {
      // Update existing
      const prevSnapshot = { ...existingProduct }
      const updates: Partial<typeof supplierProductsStore[0]> = {
        lastSeenAt: t,
        updatedAt: t,
        sourceHash: newHash,
        sourcePayload: row.rawPayload,
      }

      if (row.productName) updates.supplierProductName = row.productName
      if (row.description !== null) updates.supplierDescription = row.description
      if (row.brand !== null) updates.supplierBrand = row.brand
      if (row.category !== null) updates.supplierCategory = row.category
      if (row.netPriceMinorUnits !== null && row.netPriceMinorUnits !== existingProduct.rawCostMinorUnits) {
        updates.rawCostMinorUnits = row.netPriceMinorUnits
        priceChanges++
      }
      if (row.rrpMinorUnits !== null) updates.rawRrpMinorUnits = row.rrpMinorUnits
      if (row.stockQuantity !== null && row.stockQuantity !== existingProduct.rawStockQuantity) {
        updates.rawStockQuantity = row.stockQuantity
        stockChanges++
      }
      if (row.rawAvailability !== null) updates.rawAvailability = row.rawAvailability ?? 'UNKNOWN'

      onUpdateProduct(existingProduct.id, updates)

      // Record rollback snapshot
      rollbackRecords.push({
        id: genId('rb'),
        jobId,
        entityType: 'supplier_product',
        entityId: existingProduct.id,
        actionTaken: 'UPDATED',
        previousState: prevSnapshot as unknown as Record<string, unknown>,
        newState: { ...existingProduct, ...updates } as unknown as Record<string, unknown>,
        rolledBackAt: null,
      })

      // Update row status
      const rowIdx = CSV_IMPORT_ROWS_STORE.findIndex((r) => r.id === row.id)
      if (rowIdx >= 0) {
        CSV_IMPORT_ROWS_STORE[rowIdx] = { ...CSV_IMPORT_ROWS_STORE[rowIdx]!, rowStatus: 'COMMITTED', updatedAt: t }
      }

      updated++
    } else {
      // Create new supplier product
      const newProduct: SupplierProduct = {
        id: genId('sp'),
        supplierId: row.supplierId,
        supplierFeedId: null,
        supplierSku: row.supplierSku!,
        manufacturerSku: row.manufacturerSku ?? null,
        eanGtin: row.eanGtin ?? null,
        supplierProductName: row.productName!,
        supplierDescription: row.description ?? null,
        supplierBrand: row.brand ?? null,
        supplierCategory: row.category ?? null,
        supplierProductUrl: null,
        rawCostMinorUnits: row.netPriceMinorUnits ?? 0,
        rawRrpMinorUnits: row.rrpMinorUnits ?? null,
        currency,
        rawStockQuantity: row.stockQuantity ?? null,
        rawAvailability: row.rawAvailability ?? 'UNKNOWN',
        isDiscontinued: false,
        sourcePayload: row.rawPayload as Record<string, unknown>,
        sourceHash: newHash,
        firstSeenAt: t,
        lastSeenAt: t,
        importStatus: 'VALID',
        createdAt: t,
        updatedAt: t,
      }

      onCreateProduct(newProduct)

      rollbackRecords.push({
        id: genId('rb'),
        jobId,
        entityType: 'supplier_product',
        entityId: newProduct.id,
        actionTaken: 'CREATED',
        previousState: null,
        newState: newProduct as unknown as Record<string, unknown>,
        rolledBackAt: null,
      })

      // Update row status
      const rowIdx = CSV_IMPORT_ROWS_STORE.findIndex((r) => r.id === row.id)
      if (rowIdx >= 0) {
        CSV_IMPORT_ROWS_STORE[rowIdx] = { ...CSV_IMPORT_ROWS_STORE[rowIdx]!, rowStatus: 'COMMITTED', updatedAt: t }
      }

      // Add to media enrichment queue (new products have no imagery yet)
      MEDIA_ENRICHMENT_STORE.push({
        id: genId('mq'),
        jobId,
        supplierId: row.supplierId,
        supplierSku: row.supplierSku!,
        manufacturerSku: row.manufacturerSku ?? null,
        eanGtin: row.eanGtin ?? null,
        productName: row.productName!,
        brand: row.brand ?? null,
        enrichmentStatus: 'PENDING',
        imageUrl: null,
        imageSourceUrl: null,
        imageSourceDomain: null,
        imageRightsStatus: 'RIGHTS_REVIEW_REQUIRED',
        enrichedBy: null,
        enrichedAt: null,
        createdAt: t,
      })

      created++
    }

    writeAudit(row.supplierId, 'ROW_COMMITTED', {
      actor: actorId,
      importJobId: jobId,
      entityType: 'supplier_product',
      entityId: row.mappedProductId ?? undefined,
      sourceFilename: row.sourceFilename,
      sourceRowNumber: row.sourceRowNumber,
      newValue: { supplierSku: row.supplierSku, action: existingProduct ? 'UPDATE' : 'CREATE' },
    })
  }

  // Store rollback records
  CSV_IMPORT_ROLLBACK_STORE.push(...rollbackRecords)

  // Update job to COMMITTED
  const jobIdx = CSV_IMPORT_JOBS_STORE.findIndex((j) => j.id === jobId)
  if (jobIdx >= 0) {
    CSV_IMPORT_JOBS_STORE[jobIdx] = {
      ...CSV_IMPORT_JOBS_STORE[jobIdx]!,
      status: 'COMMITTED',
      currentStage: 'COMMITTED',
      rowsCommitted: created + updated,
      newProducts: created,
      updatedProducts: updated,
      priceChanges,
      stockChanges,
      missingImagery: created, // newly created products have no imagery
      committedAt: t,
      committedBy: actorId,
      updatedAt: t,
    }
  }

  writeAudit(job.supplierId, 'JOB_COMMITTED', {
    actor: actorId,
    importJobId: jobId,
    newValue: { committed: created + updated, created, updated, priceChanges, stockChanges },
  })

  return {
    committed: created + updated,
    created,
    updated,
    priceChanges,
    stockChanges,
    skipped,
    rollbackRecords,
  }
}

// ── Rollback ──────────────────────────────────────────────────────────────────

/**
 * Roll back a committed import.
 *
 * Only affects records introduced or changed by that specific import job.
 * Does not touch any other supplier data.
 * Records who rolled it back and when.
 */
export async function rollbackImportJob(
  jobId: string,
  actorId: string | null,
  reason: string,
  onDeleteProduct: (id: string) => void,
  onRestoreProduct: (id: string, previousState: Record<string, unknown>) => void
): Promise<{ rolledBack: number; deletedProducts: number; restoredProducts: number }> {
  const job = await getImportJob(jobId)
  if (!job) throw new Error(`Import job ${jobId} not found`)
  if (job.status !== 'COMMITTED') throw new Error(`Job ${jobId} is not in COMMITTED state — cannot roll back`)

  const t = now()
  const rollbackRecords = CSV_IMPORT_ROLLBACK_STORE.filter((r) => r.jobId === jobId && !r.rolledBackAt)

  let deletedProducts = 0
  let restoredProducts = 0

  for (const record of rollbackRecords) {
    if (record.entityType === 'supplier_product') {
      if (record.actionTaken === 'CREATED') {
        // Delete the product we created
        onDeleteProduct(record.entityId)
        deletedProducts++
      } else if (record.actionTaken === 'UPDATED' && record.previousState) {
        // Restore the product to its previous state
        onRestoreProduct(record.entityId, record.previousState)
        restoredProducts++
      }
    }

    // Mark rollback record as rolled back
    const rbIdx = CSV_IMPORT_ROLLBACK_STORE.findIndex((r) => r.id === record.id)
    if (rbIdx >= 0) {
      CSV_IMPORT_ROLLBACK_STORE[rbIdx] = { ...CSV_IMPORT_ROLLBACK_STORE[rbIdx]!, rolledBackAt: t }
    }
  }

  // Remove media enrichment queue items created by this job
  MEDIA_ENRICHMENT_STORE = MEDIA_ENRICHMENT_STORE.filter((m) => m.jobId !== jobId)

  // Revert row statuses to REJECTED
  CSV_IMPORT_ROWS_STORE = CSV_IMPORT_ROWS_STORE.map((r) =>
    r.jobId === jobId && r.rowStatus === 'COMMITTED'
      ? { ...r, rowStatus: 'REJECTED' as ImportRowStatus, updatedAt: t }
      : r
  )

  // Update job status
  const jobIdx = CSV_IMPORT_JOBS_STORE.findIndex((j) => j.id === jobId)
  if (jobIdx >= 0) {
    CSV_IMPORT_JOBS_STORE[jobIdx] = {
      ...CSV_IMPORT_JOBS_STORE[jobIdx]!,
      status: 'ROLLED_BACK',
      currentStage: 'ROLLED_BACK',
      rolledBackAt: t,
      rolledBackBy: actorId,
      rollbackReason: reason,
      updatedAt: t,
    }
  }

  writeAudit(job.supplierId, 'JOB_ROLLED_BACK', {
    actor: actorId,
    importJobId: jobId,
    newValue: { reason, deletedProducts, restoredProducts },
    notes: reason,
  })

  return { rolledBack: rollbackRecords.length, deletedProducts, restoredProducts }
}

// ── Reject Import ─────────────────────────────────────────────────────────────

/**
 * Reject an import job (before commit). Marks it as REJECTED.
 * No supplier data is modified. Staged rows are preserved for audit.
 */
export async function rejectImportJob(
  jobId: string,
  actorId: string | null
): Promise<CsvImportJob | null> {
  const t = now()
  const jobIdx = CSV_IMPORT_JOBS_STORE.findIndex((j) => j.id === jobId)
  if (jobIdx < 0) return null

  const job = CSV_IMPORT_JOBS_STORE[jobIdx]!
  if (job.status === 'COMMITTED') throw new Error(`Cannot reject a committed import`)

  CSV_IMPORT_JOBS_STORE[jobIdx] = {
    ...job,
    status: 'REJECTED',
    currentStage: 'REJECTED',
    updatedAt: t,
  }

  // Mark all rows as rejected
  CSV_IMPORT_ROWS_STORE = CSV_IMPORT_ROWS_STORE.map((r) =>
    r.jobId === jobId ? { ...r, rowStatus: 'REJECTED' as ImportRowStatus, updatedAt: t } : r
  )

  writeAudit(job.supplierId, 'JOB_REJECTED', {
    actor: actorId,
    importJobId: jobId,
  })

  return CSV_IMPORT_JOBS_STORE[jobIdx]!
}

// ── Preview ───────────────────────────────────────────────────────────────────

/**
 * Build the import preview summary for an administrator to review before commit.
 */
export async function getImportPreview(jobId: string) {
  const job = await getImportJob(jobId)
  if (!job) return null

  const files = await getImportFiles(jobId)
  const rows = await getImportRows(jobId)

  const preview = buildPreview(job, files, rows)
  const previewRows = buildPreviewRows(rows)

  return { preview, previewRows }
}

// ── Media Enrichment Queue ────────────────────────────────────────────────────

/**
 * Get media enrichment queue items for a supplier.
 */
export async function getMediaEnrichmentQueue(
  supplierId?: string | undefined,
  status?: MediaEnrichmentItem['enrichmentStatus'] | undefined
): Promise<MediaEnrichmentItem[]> {
  let items = supplierId
    ? MEDIA_ENRICHMENT_STORE.filter((m) => m.supplierId === supplierId)
    : [...MEDIA_ENRICHMENT_STORE]
  if (status) items = items.filter((m) => m.enrichmentStatus === status)
  return items
}

/**
 * Update a media enrichment item with sourced image data.
 *
 * Enforces: image source URL must be provided (no fabricated or AI-generated images).
 * AI-generated or suspiciously absent source URLs are rejected.
 */
export async function updateMediaEnrichmentItem(
  itemId: string,
  update: {
    imageUrl: string
    imageSourceUrl: string
    imageSourceDomain: string
    imageRightsStatus: MediaEnrichmentItem['imageRightsStatus']
    enrichmentStatus: MediaEnrichmentItem['enrichmentStatus']
  },
  actorId: string | null
): Promise<MediaEnrichmentItem | null> {
  // Enforce: image source URL is required — no fabricated or AI imagery
  if (!update.imageSourceUrl || !update.imageSourceDomain) {
    throw new Error('Image source URL and domain are required. AI-generated or unsourced images are not permitted.')
  }

  const t = now()
  const idx = MEDIA_ENRICHMENT_STORE.findIndex((m) => m.id === itemId)
  if (idx < 0) return null

  const item = MEDIA_ENRICHMENT_STORE[idx]!
  const updated: MediaEnrichmentItem = {
    ...item,
    ...update,
    enrichedBy: actorId,
    enrichedAt: t,
  }
  MEDIA_ENRICHMENT_STORE[idx] = updated

  writeAudit(item.supplierId, 'MEDIA_ENRICHED', {
    actor: actorId,
    entityType: 'media_enrichment_item',
    entityId: itemId,
    previousValue: { enrichmentStatus: item.enrichmentStatus, imageUrl: item.imageUrl },
    newValue: update,
  })

  return updated
}

// ── Audit Query ───────────────────────────────────────────────────────────────

/**
 * Get audit trail entries for a supplier or specific import job.
 */
export async function getImportAuditTrail(
  supplierId: string,
  importJobId?: string
): Promise<ImportAuditEntry[]> {
  let entries = IMPORT_AUDIT_STORE.filter((e) => e.supplierId === supplierId)
  if (importJobId) entries = entries.filter((e) => e.importJobId === importJobId)
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

// ── Full Pipeline Entry Point ─────────────────────────────────────────────────

/**
 * Process a set of raw CSV buffers through the full import pipeline for a supplier.
 * Creates an import job, parses all files, stages all rows, runs validation.
 * Does NOT commit — returns the job for administrator review.
 *
 * @param supplierId - The authenticated supplier ID (server-validated)
 * @param uploadedBy - The admin user ID (server-validated)
 * @param csvBuffers - Array of { filename, buffer } for each uploaded file
 * @param fieldMap - The supplier's field mapping configuration
 * @param existingMappings - Current supplier_product_mappings for SKU matching
 * @param existingSupplierProducts - Current supplier_products for matching
 */
export async function processCsvUpload(
  supplierId: string,
  uploadedBy: string | null,
  csvBuffers: Array<{ filename: string; buffer: Buffer }>,
  fieldMap: Record<string, CanonicalImportField>,
  existingMappings: Array<{
    supplierId: string
    supplierSku: string
    canonicalProductId: string | null
    canonicalVariantId: string | null
    status: string
  }>,
  existingSupplierProducts: Array<{
    supplierId: string
    supplierSku: string
    id: string
    manufacturerSku: string | null
    eanGtin: string | null
  }>
): Promise<{
  job: CsvImportJob
  files: CsvImportFile[]
  stats: { totalRows: number; valid: number; invalid: number; duplicate: number }
  malformedRows: Array<{ filename: string; rowNumber: number; rawLine: string; reason: string }>
}> {
  const filenames = csvBuffers.map((b) => b.filename)
  const job = await createImportJob(supplierId, uploadedBy, filenames)

  await updateImportJobStatus(job.id, 'PROCESSING', 'FILE_VALIDATION')

  const allFiles: CsvImportFile[] = []
  const allMalformed: Array<{ filename: string; rowNumber: number; rawLine: string; reason: string }> = []
  let totalRows = 0, totalValid = 0, totalInvalid = 0, totalDuplicate = 0

  for (const { filename, buffer } of csvBuffers) {
    const parsed = parseCsvBuffer(buffer, filename)
    const file = await createImportFile(job.id, supplierId, parsed)
    allFiles.push(file)

    // Collect malformed rows from parsing
    for (const m of parsed.malformedRows) {
      allMalformed.push({ filename, ...m })
    }

    // Stage rows
    await updateImportJobStatus(job.id, 'NORMALISING', 'NORMALISING')
    const { stats } = await stageImportRows(
      job.id,
      file.id,
      supplierId,
      parsed,
      fieldMap,
      existingMappings,
      existingSupplierProducts
    )

    totalRows += parsed.rowCount
    totalValid += stats.valid
    totalInvalid += stats.invalid
    totalDuplicate += stats.duplicate
  }

  // Update job with final stats
  await updateImportJobStatus(
    job.id,
    totalInvalid > 0 ? 'REVIEW_REQUIRED' : 'READY',
    'REVIEW',
    {
      rowsTotal: totalRows,
      rowsValid: totalValid,
      rowsInvalid: totalInvalid,
      rowsDuplicate: totalDuplicate,
    }
  )

  const finalJob = (await getImportJob(job.id))!

  return {
    job: finalJob,
    files: allFiles,
    stats: { totalRows, valid: totalValid, invalid: totalInvalid, duplicate: totalDuplicate },
    malformedRows: allMalformed,
  }
}
