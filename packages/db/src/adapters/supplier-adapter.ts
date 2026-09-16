// packages/db/src/adapters/supplier-adapter.ts
// Reusable Multi-Supplier Adapter Architecture & Contract

import crypto from 'node:crypto'
import type {
  AvailabilityStatus,
  SupplierFeedFormat,
  RawSupplierFeedItem,
  NormalizedSupplierItem,
  ValidationResult,
  ValidationIssue,
  SupplierExceptionCode,
  SupplierProductMapping,
  SupplierSyncRun,
} from '@halo-rc/types'
import { SEED_BRANDS } from '../seed/catalogue-data'
import { matchSupplierProduct } from '../queries/procurement'

export interface SupplierAdapterOptions {
  supplierId: string
  feedId?: string | null
  format: SupplierFeedFormat
  defaultCurrency?: 'GBP' | 'USD'
  defaultVatTreatment?: string
}

export interface AdapterParseResult {
  items: RawSupplierFeedItem[]
  errors: string[]
  warnings: string[]
}

export interface SupplierAdapter<TRaw = unknown> {
  readonly supplierId: string
  readonly feedId?: string | null
  readonly format: SupplierFeedFormat

  /**
   * Fetch raw payload from source (remote HTTP/SFTP or local payload)
   */
  fetch(source?: unknown): Promise<TRaw>

  /**
   * Parse raw source payload into structured RawSupplierFeedItem array
   */
  parse(rawPayload: TRaw): Promise<AdapterParseResult>

  /**
   * Normalise a raw supplier item into deterministic internal representation
   */
  normalise(item: RawSupplierFeedItem): NormalizedSupplierItem

  /**
   * Validate a normalised supplier item against catalogue data-quality rules
   */
  validate(item: NormalizedSupplierItem): ValidationResult

  /**
   * Map normalised item to canonical Avorria product or variant
   */
  map(item: NormalizedSupplierItem): Promise<SupplierProductMapping>
}

/**
 * Compute SHA-256 hash of raw item content for idempotency and diff detection.
 */
export function computeSourceHash(payload: Record<string, unknown> | RawSupplierFeedItem): string {
  const normalizedString = JSON.stringify(payload, Object.keys(payload).sort())
  return crypto.createHash('sha256').update(normalizedString).digest('hex')
}

/**
 * Abstract Base Supplier Adapter providing standard normalisation, validation, and mapping.
 */
export abstract class BaseSupplierAdapter<TRaw = unknown> implements SupplierAdapter<TRaw> {
  readonly supplierId: string
  readonly feedId?: string | null
  readonly format: SupplierFeedFormat
  protected readonly defaultCurrency: 'GBP' | 'USD'

  constructor(options: SupplierAdapterOptions) {
    this.supplierId = options.supplierId
    this.feedId = options.feedId ?? null
    this.format = options.format
    this.defaultCurrency = options.defaultCurrency ?? 'GBP'
  }

  abstract fetch(source?: unknown): Promise<TRaw>
  abstract parse(rawPayload: TRaw): Promise<AdapterParseResult>

  /**
   * Standard deterministic normalization.
   * Strips harmful characters, enforces SKU invariants, cleans GTIN, normalizes availability.
   */
  normalise(raw: RawSupplierFeedItem): NormalizedSupplierItem {
    const rawSku = raw.supplierSku ? String(raw.supplierSku).trim() : ''
    const normalizedSku = rawSku.toUpperCase()

    const rawMfrSku = raw.manufacturerSku ? String(raw.manufacturerSku).trim() : null
    const normalizedManufacturerSku = rawMfrSku ? rawMfrSku.toUpperCase() : null

    const partNumber = raw.partNumber ? String(raw.partNumber).trim().toUpperCase() : null

    // GTIN/EAN: 8, 12, 13, or 14 digits only
    let eanGtin: string | null = null
    if (raw.eanGtin) {
      const digitsOnly = String(raw.eanGtin).replace(/\D/g, '')
      if ([8, 12, 13, 14].includes(digitsOnly.length)) {
        eanGtin = digitsOnly
      }
    }

    // Brand matching
    let brandId: string | null = null
    let brandName: string | null = null
    if (raw.brandName) {
      const needle = raw.brandName.trim().toLowerCase()
      const matchedBrand = SEED_BRANDS.find(
        (b) => b.name.toLowerCase() === needle || b.slug.toLowerCase() === needle
      )
      if (matchedBrand) {
        brandId = matchedBrand.id
        brandName = matchedBrand.name
      } else {
        brandName = raw.brandName.trim()
      }
    }

    // Cost minor units
    const costNum = Number(raw.cost)
    const costMinorUnits = isNaN(costNum) ? 0 : Math.max(0, Math.round(costNum))

    // RRP minor units
    let rrpMinorUnits: number | null = null
    if (raw.rrp !== undefined && raw.rrp !== null) {
      const rrpNum = Number(raw.rrp)
      if (!isNaN(rrpNum)) {
        rrpMinorUnits = Math.max(0, Math.round(rrpNum))
      }
    }

    // Availability mapping
    let availability: AvailabilityStatus = 'NOT_AVAILABLE'
    const rawAvail = String(raw.availability || '').toLowerCase()
    if (rawAvail.includes('in stock') || rawAvail.includes('available') || rawAvail === 'yes' || rawAvail === 'true') {
      availability = 'IN_STOCK'
    } else if (rawAvail.includes('low stock') || rawAvail.includes('limited')) {
      availability = 'LOW_STOCK'
    } else if (rawAvail.includes('preorder') || rawAvail.includes('pre-order')) {
      availability = 'PRE_ORDER'
    } else if (rawAvail.includes('special order')) {
      availability = 'SPECIAL_ORDER'
    } else if (rawAvail.includes('out of stock') || rawAvail === 'no' || rawAvail === '0' || rawAvail === 'false') {
      availability = 'OUT_OF_STOCK'
    } else if (rawAvail.includes('discontinued')) {
      availability = 'NOT_AVAILABLE'
    }

    // Quantity
    let qty: number | null = null
    if (raw.quantity !== undefined && raw.quantity !== null) {
      const q = Number(raw.quantity)
      if (!isNaN(q)) qty = Math.max(0, Math.floor(q))
    }

    // Lead time
    let leadTimeDays: number | null = null
    if (raw.leadTimeDays !== undefined && raw.leadTimeDays !== null) {
      const l = Number(raw.leadTimeDays)
      if (!isNaN(l)) leadTimeDays = Math.max(0, Math.floor(l))
    }

    const currency = raw.currency === 'USD' ? 'USD' : this.defaultCurrency

    return {
      supplierSku: rawSku,
      normalizedSku,
      manufacturerSku: rawMfrSku,
      normalizedManufacturerSku,
      partNumber,
      eanGtin,
      title: raw.title ? String(raw.title).trim() : 'Untitled Supplier Item',
      brandId,
      brandName,
      costMinorUnits,
      rrpMinorUnits,
      currency,
      availability,
      quantity: qty,
      leadTimeDays,
      leadTimeText: raw.leadTimeText ? String(raw.leadTimeText).trim() : null,
      inventoryAuthority: 'SUPPLIER_STOCK',
      freshnessState: 'FRESH',
      rawPayload: { ...raw },
      sourceTimestamp: raw.sourceTimestamp ?? new Date().toISOString(),
    }
  }

  /**
   * Rigorous validation before mapping or persistence.
   * Catches missing SKUs, negative/zero prices, malformed GTINs, invalid stock, and discontinued flags.
   */
  validate(item: NormalizedSupplierItem): ValidationResult {
    const issues: ValidationIssue[] = []

    // 1. SKU validation
    if (!item.normalizedSku) {
      issues.push({
        field: 'supplierSku',
        code: 'MISSING_SKU',
        severity: 'CRITICAL',
        message: 'Supplier record is missing a mandatory supplier SKU identifier.',
      })
    }

    // 2. Price validation
    if (item.costMinorUnits <= 0) {
      issues.push({
        field: 'cost',
        code: 'INVALID_PRICE',
        severity: 'ERROR',
        message: `Invalid wholesale cost (${item.costMinorUnits} minor units). Cost must be a positive integer.`,
      })
    }

    if (item.rrpMinorUnits != null && item.rrpMinorUnits <= 0) {
      issues.push({
        field: 'rrp',
        code: 'INVALID_PRICE',
        severity: 'WARNING',
        message: `Supplier RRP is zero or negative (${item.rrpMinorUnits}).`,
      })
    }

    // 3. Currency validation
    if (!['GBP', 'USD', 'EUR', 'AUD'].includes(item.currency)) {
      issues.push({
        field: 'currency',
        code: 'INVALID_CURRENCY',
        severity: 'ERROR',
        message: `Unsupported currency code "${item.currency}".`,
      })
    }

    // 4. Stock validation
    if (item.quantity != null && item.quantity < 0) {
      issues.push({
        field: 'quantity',
        code: 'INVALID_STOCK',
        severity: 'ERROR',
        message: `Supplier stock quantity cannot be negative (${item.quantity}).`,
      })
    }

    // 5. Title validation
    if (!item.title || item.title.length < 2) {
      issues.push({
        field: 'title',
        code: 'MISSING_REQUIRED_FIELD',
        severity: 'WARNING',
        message: 'Product title is missing or suspiciously short.',
      })
    }

    // 6. GTIN format
    if (item.rawPayload.eanGtin && !item.eanGtin) {
      issues.push({
        field: 'eanGtin',
        code: 'CONFLICTING_EAN',
        severity: 'WARNING',
        message: `EAN/GTIN "${item.rawPayload.eanGtin}" is not a valid 8, 12, 13, or 14-digit GTIN.`,
      })
    }

    // 7. Discontinued status
    const rawAvail = String(item.rawPayload.availability || '').toLowerCase()
    if (rawAvail.includes('discontinued') || item.rawPayload.isDiscontinued === true) {
      issues.push({
        field: 'availability',
        code: 'DISCONTINUED_PRODUCT',
        severity: 'WARNING',
        message: 'Product is flagged as discontinued by supplier.',
      })
    }

    const hasCritical = issues.some((i) => i.severity === 'CRITICAL')
    const hasError = issues.some((i) => i.severity === 'ERROR')

    return {
      isValid: !hasCritical && !hasError,
      issues,
    }
  }

  /**
   * Deterministic mapping to canonical product.
   */
  async map(item: NormalizedSupplierItem): Promise<SupplierProductMapping> {
    return matchSupplierProduct(this.supplierId, item)
  }
}
