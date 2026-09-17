// packages/db/src/importers/csv-import-engine.ts
// Generic, reusable supplier CSV ingestion engine.
// MUGEN-agnostic. Designed to handle any supplier CSV format via configurable field maps.

import { createHash } from 'crypto'
import type {
  Currency,
  AvailabilityStatus,
  ParsedCsvResult,
  CsvImportRow,
  CsvImportJob,
  CsvImportFile,
  CanonicalImportField,
  ImportMatchConfidence,
  ImportRowStatus,
  ImportRowAction,
  ImportPreview,
  ImportPreviewRow,
} from '@halo-rc/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_CURRENCIES = new Set(['GBP', 'USD', 'EUR', 'AUD'])
const VALID_EAN_LENGTHS = new Set([8, 12, 13, 14])

// ── Encoding & Delimiter Detection ───────────────────────────────────────────

/**
 * Detect file encoding from raw bytes.
 * Checks for UTF-8 BOM (EF BB BF) first, then validates UTF-8.
 */
export function detectEncoding(
  buffer: Buffer
): 'UTF-8' | 'UTF-8-BOM' | 'LATIN-1' | 'UNKNOWN' {
  // UTF-8 BOM: EF BB BF
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'UTF-8-BOM'
  }

  // Validate UTF-8 by checking for invalid sequences (simplified heuristic)
  let isValidUtf8 = true
  for (let i = 0; i < Math.min(buffer.length, 4096); i++) {
    const byte = buffer[i]!
    if (byte > 0x7f) {
      // Multibyte sequence start
      if (byte >= 0xc0 && byte <= 0xdf) {
        // 2-byte sequence
        if (i + 1 >= buffer.length || (buffer[i + 1]! & 0xc0) !== 0x80) {
          isValidUtf8 = false
          break
        }
        i += 1
      } else if (byte >= 0xe0 && byte <= 0xef) {
        // 3-byte sequence
        if (
          i + 2 >= buffer.length ||
          (buffer[i + 1]! & 0xc0) !== 0x80 ||
          (buffer[i + 2]! & 0xc0) !== 0x80
        ) {
          isValidUtf8 = false
          break
        }
        i += 2
      } else if (byte >= 0xf0 && byte <= 0xf7) {
        // 4-byte sequence
        if (
          i + 3 >= buffer.length ||
          (buffer[i + 1]! & 0xc0) !== 0x80 ||
          (buffer[i + 2]! & 0xc0) !== 0x80 ||
          (buffer[i + 3]! & 0xc0) !== 0x80
        ) {
          isValidUtf8 = false
          break
        }
        i += 3
      } else {
        isValidUtf8 = false
        break
      }
    }
  }

  return isValidUtf8 ? 'UTF-8' : 'LATIN-1'
}

/**
 * Strip UTF-8 BOM from string content if present.
 */
export function stripBom(content: string): string {
  if (content.charCodeAt(0) === 0xfeff) {
    return content.slice(1)
  }
  return content
}

/**
 * Detect delimiter by sampling the first few lines.
 * Counts unquoted occurrences of each candidate delimiter.
 */
export function detectDelimiter(sample: string): ',' | ';' | '\t' | 'UNKNOWN' {
  const lines = sample.split('\n').slice(0, 5).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return 'UNKNOWN'

  const candidates = [',', ';', '\t'] as const
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 }

  for (const line of lines) {
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes
        continue
      }
      if (!inQuotes && (candidates as readonly string[]).includes(ch)) {
        counts[ch] = (counts[ch] || 0) + 1
      }
    }
  }

  let best: ',' | ';' | '\t' = ','
  let bestCount = 0
  for (const c of candidates) {
    if ((counts[c] || 0) > bestCount) {
      bestCount = counts[c] || 0
      best = c
    }
  }

  if (bestCount === 0) return 'UNKNOWN'
  return best
}

// ── CSV Parsing ───────────────────────────────────────────────────────────────

/**
 * Parse a single CSV line respecting quoted fields and RFC-4180 escaped double-quotes.
 */
export function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++ // skip escaped quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Compute a stable SHA-256 hash of file content for provenance tracking.
 */
export function computeFileHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

/**
 * Parse a CSV buffer into a structured ParsedCsvResult.
 *
 * - Handles UTF-8 and UTF-8-BOM encoding
 * - Auto-detects delimiter (comma or semicolon)
 * - Never silently discards malformed rows — captures them with reason
 * - Preserves raw payload for every row
 */
export function parseCsvBuffer(
  buffer: Buffer,
  filename: string
): ParsedCsvResult {
  const encoding = detectEncoding(buffer)

  let content: string
  if (encoding === 'LATIN-1') {
    // Decode Latin-1: each byte maps directly to its unicode code point
    const chars: string[] = []
    for (let i = 0; i < buffer.length; i++) {
      chars.push(String.fromCharCode(buffer[i]!))
    }
    content = chars.join('')
  } else {
    content = buffer.toString('utf8')
  }

  content = stripBom(content)
  const fileHash = computeFileHash(content)

  // Normalise line endings
  const rawLines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const sampleLines = rawLines.filter((l) => l.trim().length > 0).slice(0, 5).join('\n')
  const delimiter = detectDelimiter(sampleLines)
  const delim = delimiter === 'UNKNOWN' ? ',' : delimiter

  const nonEmptyLines = rawLines.filter((l) => l.trim().length > 0)
  if (nonEmptyLines.length === 0) {
    return {
      filename,
      encoding,
      delimiter,
      columnNames: [],
      rows: [],
      rowCount: 0,
      malformedRows: [],
      fileHash,
    }
  }

  // First non-empty line = headers
  const headerLine = nonEmptyLines[0]!
  const columnNames = parseCsvLine(headerLine, delim).map((c) => c.trim())

  const rows: Array<Record<string, string>> = []
  const malformedRows: Array<{ rowNumber: number; rawLine: string; reason: string }> = []

  for (let i = 1; i < nonEmptyLines.length; i++) {
    const rawLine = nonEmptyLines[i]!
    const lineNumber = i + 1 // 1-based

    if (!rawLine.trim()) continue

    const cells = parseCsvLine(rawLine, delim)

    if (cells.length !== columnNames.length) {
      malformedRows.push({
        rowNumber: lineNumber,
        rawLine,
        reason: `Column count mismatch: expected ${columnNames.length}, got ${cells.length}`,
      })
      // Still capture a partial record so nothing is silently dropped
      const partialRow: Record<string, string> = {}
      columnNames.forEach((col, idx) => {
        partialRow[col] = cells[idx] ?? ''
      })
      partialRow['__malformed__'] = 'true'
      rows.push(partialRow)
      continue
    }

    const row: Record<string, string> = {}
    columnNames.forEach((col, idx) => {
      row[col] = cells[idx] ?? ''
    })
    rows.push(row)
  }

  return {
    filename,
    encoding,
    delimiter,
    columnNames,
    rows,
    rowCount: rows.length,
    malformedRows,
    fileHash,
  }
}

// ── Field Mapping ─────────────────────────────────────────────────────────────

/**
 * Apply a supplier field map to a raw CSV row.
 * Unmapped columns are silently ignored (not errors — they stay in rawPayload).
 */
export function applyFieldMap(
  rawRow: Record<string, string>,
  fieldMap: Record<string, CanonicalImportField>
): Partial<Record<CanonicalImportField, string>> {
  const result: Partial<Record<CanonicalImportField, string>> = {}

  for (const [supplierColumn, canonicalField] of Object.entries(fieldMap)) {
    if (canonicalField === 'IGNORE') continue
    const value = rawRow[supplierColumn]
    if (value !== undefined) {
      result[canonicalField] = value
    }
  }

  return result
}

// ── Row Normalisation ─────────────────────────────────────────────────────────

/**
 * Parse a price string into integer minor units (pence/cents).
 * Handles: EUR/USD/GBP symbols, decimal commas, thousand-separator commas.
 * Returns null if the value cannot be parsed as a valid price.
 */
export function parsePriceToMinorUnits(raw: string): number | null {
  if (!raw || !raw.trim()) return null

  // Strip currency symbols and whitespace
  const cleaned = raw.replace(/[€$£¥\s]/g, '').trim()
  if (!cleaned) return null

  // Determine decimal format
  let normalised = cleaned
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    // European: "529,00" → "529.00"
    normalised = cleaned.replace(',', '.')
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    // US thousands: "1,529.00" → "1529.00"
    normalised = cleaned.replace(/,/g, '')
  }

  const num = parseFloat(normalised)
  if (isNaN(num) || num < 0) return null
  return Math.round(num * 100)
}

/**
 * Normalise availability text to canonical AvailabilityStatus.
 */
export function normaliseAvailability(raw: string): AvailabilityStatus {
  const lower = raw.toLowerCase().trim()
  if (lower.includes('in stock') || lower === 'yes' || lower === '1' || lower === 'available') return 'IN_STOCK'
  if (lower.includes('low stock') || lower.includes('limited')) return 'LOW_STOCK'
  if (lower.includes('pre-order') || lower.includes('preorder')) return 'PRE_ORDER'
  if (lower.includes('special order')) return 'SPECIAL_ORDER'
  if (lower.includes('out of stock') || lower === 'no' || lower === '0') return 'OUT_OF_STOCK'
  return 'NOT_AVAILABLE'
}

/**
 * Validate and normalise an EAN/GTIN string.
 * Must be exactly 8, 12, 13, or 14 digits.
 */
export function normaliseEan(raw: string): string | null {
  if (!raw || !raw.trim()) return null
  const digits = raw.replace(/\D/g, '')
  if (!VALID_EAN_LENGTHS.has(digits.length)) return null
  return digits
}

/**
 * Normalise a currency code.
 */
export function normaliseCurrency(raw: string): Currency | null {
  const upper = raw.trim().toUpperCase()
  if (VALID_CURRENCIES.has(upper)) return upper as Currency
  return null
}

/**
 * Normalise a mapped row from a supplier CSV.
 * Returns structured normalised values — does not write to any store.
 */
export function normaliseRow(
  rawRow: Record<string, string>,
  fieldMap: Record<string, CanonicalImportField>
): {
  supplierSku: string | null
  manufacturerSku: string | null
  eanGtin: string | null
  productName: string | null
  description: string | null
  brand: string | null
  category: string | null
  netPriceMinorUnits: number | null
  currency: Currency | null
  rrpMinorUnits: number | null
  stockQuantity: number | null
  rawAvailability: string | null
  isMalformed: boolean
} {
  const mapped = applyFieldMap(rawRow, fieldMap)

  const supplierSku = mapped['supplier_sku']?.trim().toUpperCase() || null
  const manufacturerSku = mapped['manufacturer_sku']?.trim().toUpperCase() || null
  const eanGtin = mapped['ean'] ? normaliseEan(mapped['ean']) : null
  // Normalise Unicode whitespace in product name
  const productName = mapped['product_name']
    ? mapped['product_name'].trim().replace(/\s+/g, ' ') || null
    : null
  const description = mapped['description']?.trim() || null
  const brand = mapped['brand']?.trim() || null
  const category = mapped['category']?.trim() || null

  const netPriceMinorUnits = mapped['net_price'] ? parsePriceToMinorUnits(mapped['net_price']) : null
  const currency = mapped['currency'] ? normaliseCurrency(mapped['currency']) : null
  const rrpMinorUnits = mapped['rrp'] ? parsePriceToMinorUnits(mapped['rrp']) : null

  let stockQuantity: number | null = null
  if (mapped['stock_quantity']?.trim()) {
    const parsed = parseInt(mapped['stock_quantity'].replace(/[^0-9-]/g, ''), 10)
    if (!isNaN(parsed)) stockQuantity = Math.max(0, parsed)
  }

  const rawAvailability = mapped['availability']?.trim() || null
  const isMalformed = rawRow['__malformed__'] === 'true'

  return {
    supplierSku,
    manufacturerSku,
    eanGtin,
    productName,
    description,
    brand,
    category,
    netPriceMinorUnits,
    currency,
    rrpMinorUnits,
    stockQuantity,
    rawAvailability,
    isMalformed,
  }
}

// ── Row Validation ────────────────────────────────────────────────────────────

export interface RowValidationResult {
  errors: string[]
  warnings: string[]
  rowStatus: ImportRowStatus
}

/**
 * Validate a normalised row against commercial and identity rules.
 * Errors block commit. Warnings are flagged but allow commit.
 */
export function validateRow(row: {
  supplierSku: string | null
  manufacturerSku: string | null
  eanGtin: string | null
  productName: string | null
  netPriceMinorUnits: number | null
  currency: Currency | null
  stockQuantity: number | null
  rawAvailability: string | null
  isMalformed: boolean
}): RowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!row.supplierSku) errors.push('MISSING_SKU: Supplier SKU is required')
  if (!row.productName) errors.push('MISSING_PRODUCT_NAME: Product name is required')

  if (row.netPriceMinorUnits === null) {
    errors.push('MISSING_PRICE: Net price is required and must be a valid number')
  } else if (row.netPriceMinorUnits < 0) {
    errors.push('INVALID_PRICE: Net price cannot be negative')
  } else if (row.netPriceMinorUnits === 0) {
    warnings.push('ZERO_PRICE: Net price is zero — verify this is correct')
  }

  if (!row.currency) warnings.push('MISSING_CURRENCY: Currency not detected; will default to GBP if committed')
  if (!row.manufacturerSku && !row.eanGtin) {
    warnings.push('NO_SECONDARY_IDENTIFIER: No manufacturer SKU or EAN — match confidence will be lower')
  }
  if (row.stockQuantity === null) warnings.push('MISSING_STOCK: Stock quantity not provided')
  if (row.isMalformed) errors.push('MALFORMED_ROW: Row could not be fully parsed — column count mismatch')

  let rowStatus: ImportRowStatus = 'VALID'
  if (errors.length > 0) rowStatus = 'INVALID'
  else if (warnings.length > 0) rowStatus = 'WARNING'

  return { errors, warnings, rowStatus }
}

// ── Duplicate Detection ───────────────────────────────────────────────────────

export interface DuplicateDetectionResult {
  firstSeenBySku: Map<string, number>
  firstSeenByEan: Map<string, number>
  duplicates: Map<number, number>
}

/**
 * Detect duplicate rows within a set of normalised rows.
 * - Exact: same supplier + same SKU (within or across files in same job)
 * - EAN-based: same EAN on a different row
 */
export function detectDuplicates(
  rows: Array<{ supplierSku: string | null; eanGtin: string | null }>
): DuplicateDetectionResult {
  const firstSeenBySku = new Map<string, number>()
  const firstSeenByEan = new Map<string, number>()
  const duplicates = new Map<number, number>()

  rows.forEach((row, idx) => {
    const sku = row.supplierSku?.toUpperCase()
    const ean = row.eanGtin

    if (sku) {
      if (firstSeenBySku.has(sku)) {
        duplicates.set(idx, firstSeenBySku.get(sku)!)
      } else {
        firstSeenBySku.set(sku, idx)
      }
    }

    if (ean && !duplicates.has(idx)) {
      if (firstSeenByEan.has(ean)) {
        duplicates.set(idx, firstSeenByEan.get(ean)!)
      } else {
        firstSeenByEan.set(ean, idx)
      }
    }
  })

  return { firstSeenBySku, firstSeenByEan, duplicates }
}

// ── SKU Matching ──────────────────────────────────────────────────────────────

export interface SkuMatchResult {
  matchedProductId: string | null
  matchedVariantId: string | null
  matchMethod: string | null
  confidence: ImportMatchConfidence
  rowAction: ImportRowAction
}

/**
 * Attempt to match a normalised row against existing supplier data.
 * Priority: verified mapping → exact SKU → EAN → manufacturer SKU → new product
 */
export function matchSku(
  supplierId: string,
  supplierSku: string | null,
  manufacturerSku: string | null,
  eanGtin: string | null,
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
): SkuMatchResult {
  if (supplierSku) {
    // 1. Verified deterministic mapping
    const verifiedMapping = existingMappings.find(
      (m) =>
        m.supplierId === supplierId &&
        m.supplierSku.toUpperCase() === supplierSku.toUpperCase() &&
        m.status === 'MATCHED' &&
        m.canonicalProductId !== null
    )
    if (verifiedMapping) {
      return {
        matchedProductId: verifiedMapping.canonicalProductId,
        matchedVariantId: verifiedMapping.canonicalVariantId ?? null,
        matchMethod: 'EXACT_SKU',
        confidence: 'VERIFIED',
        rowAction: 'UPDATE',
      }
    }

    // 2. Exact SKU in supplier_products
    const existingProduct = existingSupplierProducts.find(
      (p) =>
        p.supplierId === supplierId &&
        p.supplierSku.toUpperCase() === supplierSku.toUpperCase()
    )
    if (existingProduct) {
      return {
        matchedProductId: existingProduct.id,
        matchedVariantId: null,
        matchMethod: 'EXACT_SKU',
        confidence: 'KNOWN',
        rowAction: 'UPDATE',
      }
    }
  }

  // 3. EAN match
  if (eanGtin) {
    const eanProduct = existingSupplierProducts.find((p) => p.eanGtin === eanGtin)
    if (eanProduct) {
      return {
        matchedProductId: eanProduct.id,
        matchedVariantId: null,
        matchMethod: 'EXACT_GTIN',
        confidence: 'INFERRED',
        rowAction: 'UPDATE',
      }
    }
  }

  // 4. Manufacturer SKU match
  if (manufacturerSku) {
    const mpnProduct = existingSupplierProducts.find(
      (p) => p.manufacturerSku?.toUpperCase() === manufacturerSku.toUpperCase()
    )
    if (mpnProduct) {
      return {
        matchedProductId: mpnProduct.id,
        matchedVariantId: null,
        matchMethod: 'EXACT_PART_NUMBER',
        confidence: 'INFERRED',
        rowAction: 'UPDATE',
      }
    }
  }

  // 5. No match — new product
  return {
    matchedProductId: null,
    matchedVariantId: null,
    matchMethod: null,
    confidence: 'UNKNOWN',
    rowAction: 'CREATE',
  }
}

// ── Preview Builder ───────────────────────────────────────────────────────────

/**
 * Build an ImportPreview summary from a set of staged CsvImportRows.
 */
export function buildPreview(
  job: CsvImportJob,
  files: CsvImportFile[],
  rows: CsvImportRow[]
): ImportPreview {
  const validRows = rows.filter((r) => r.rowStatus === 'VALID' || r.rowStatus === 'WARNING')
  const invalidRows = rows.filter((r) => r.rowStatus === 'INVALID')
  const duplicateRows = rows.filter((r) => r.rowStatus === 'DUPLICATE')
  const newProducts = rows.filter((r) => r.rowAction === 'CREATE' && r.rowStatus !== 'INVALID')
  const existingProducts = rows.filter((r) => r.rowAction === 'UPDATE' && r.rowStatus !== 'INVALID')
  const priceUpdates = rows.filter((r) => r.rowAction === 'PRICE_UPDATE')
  const stockUpdates = rows.filter((r) => r.rowAction === 'STOCK_UPDATE')
  const potentialMatches = rows.filter((r) => r.matchConfidence === 'INFERRED')
  const missingRequired = rows.filter((r) =>
    r.validationErrors.some(
      (e) => e.startsWith('MISSING_SKU') || e.startsWith('MISSING_PRODUCT_NAME') || e.startsWith('MISSING_PRICE')
    )
  )

  return {
    jobId: job.id,
    supplierId: job.supplierId,
    filesUploaded: files.length,
    filenames: files.map((f) => f.originalFilename),
    rowsDetected: rows.length,
    validRows: validRows.length,
    invalidRows: invalidRows.length,
    newProducts: newProducts.length,
    existingProducts: existingProducts.length,
    duplicateRows: duplicateRows.length,
    potentialMatches: potentialMatches.length,
    missingRequiredFields: missingRequired.length,
    missingImagery: newProducts.length + existingProducts.length,
    priceChanges: priceUpdates.length,
    stockChanges: stockUpdates.length,
    errors: [...new Set(rows.flatMap((r) => r.validationErrors))],
    warnings: [...new Set(rows.flatMap((r) => r.validationWarnings))],
  }
}

/**
 * Build per-row preview records for the administrator review table.
 */
export function buildPreviewRows(rows: CsvImportRow[]): ImportPreviewRow[] {
  return rows.map((row) => ({
    rowId: row.id,
    sourceFilename: row.sourceFilename,
    sourceRowNumber: row.sourceRowNumber,
    supplierSku: row.supplierSku,
    productName: row.productName,
    rowAction: row.rowAction,
    matchConfidence: row.matchConfidence,
    rowStatus: row.rowStatus,
    errors: row.validationErrors,
    warnings: row.validationWarnings,
  }))
}
