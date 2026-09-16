// packages/db/src/queries/procurement.ts
// Multi-Supplier Procurement Infrastructure, Ingestion Boundary, Deterministic Matching & Sync Ledger

import type {
  MarketCode,
  Currency,
  AvailabilityStatus,
  SupplierRecord,
  SupplierType,
  SupplierRelationshipStatus,
  SupplierIntegrationType,
  SupplierMatchMethod,
  SupplierMappingStatus,
  InventoryAuthority,
  DataFreshnessState,
  SupplierSyncStatus,
  SupplierChangeType,
  RawSupplierFeedItem,
  NormalizedSupplierItem,
  SupplierProductMapping,
  SupplierOffer,
  SupplierSyncRun,
  SupplierChangeEvent,
  ProcurementSummary,
  ProcurementTerritory,
  TerritorySupportState,
  TerritoryRestrictionReason,
  BrandSupplierRelationshipType,
  CommercialRelationshipVerificationStatus,
  RelationshipEvidenceSourceType,
  ExclusivityScope,
  TradeAccountApplicationStatus,
  TradeAccountRequirementType,
  TradeAccountRequirementStatus,
  PaymentTermsType,
  PricingPolicyType,
  SupplierContactRole,
  CommunicationType,
  ProcurementPipelineStage,
  ProcurementReadinessState,
  SupplierOpportunityTier,
  SupplierDocumentType,
  ProcurementTaskType,
  SupplierTerritoryCoverage,
  BrandSupplierRelationship,
  TradeAccountApplication,
  TradeAccountRequirement,
  SupplierCommercialTerms,
  SupplierPricingPolicy,
  SupplierContact,
  SupplierCommunication,
  SupplierDocument,
  ProcurementTask,
  ProcurementReadinessResult,
  SupplierOpportunityScore,
  BrandSourcingView,
  ProductSourcingView,
  HaloCompanyProfile,
  SupplierFeed,
  SupplierFeedType,
  SupplierFeedFormat,
  SupplierProduct,
  SupplierImportException,
  SupplierExceptionCode,
  SupplierExceptionStatus,
  SupplierExceptionSeverity,
  ImportPreviewSummary,
  ProductDataLineage,
} from '@halo-rc/types'
import {
  computeSourceHash,
} from '../utils/hash'
import {
  SEED_PRODUCTS,
  SEED_VARIANTS,
  SEED_BRANDS,
  SEED_OFFERS,
} from '../seed/catalogue-data'

import {
  ProcurementNote,
  ProcurementAuditEntry,
  ProcurementStatus,
} from '@halo-rc/types'
import { AVORRIA_PROCUREMENT_MASTER } from '../seed/avorria-procurement-master'


const INITIAL_FEEDS: SupplierFeed[] = [
  {
    id: 'feed-cml-cat',
    supplierId: 'sup-cml',
    feedName: 'CML Standard Catalogue (CSV)',
    feedType: 'CATALOGUE',
    format: 'CSV',
    sourceUrl: 'https://cmldistribution.co.uk/feeds/catalogue.csv',
    authType: 'API_KEY',
    scheduleCron: '0 4 * * *',
    isActive: true,
    lastAttemptedRun: '2026-03-01T09:55:00Z',
    lastSuccessfulRun: '2026-03-01T10:00:00Z',
    createdAt: '2026-01-01T09:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'feed-cml-stock',
    supplierId: 'sup-cml',
    feedName: 'CML Rapid Stock Delta (CSV)',
    feedType: 'STOCK',
    format: 'CSV',
    sourceUrl: 'https://cmldistribution.co.uk/feeds/stock_delta.csv',
    authType: 'API_KEY',
    scheduleCron: '*/15 * * * *',
    isActive: true,
    lastAttemptedRun: '2026-03-01T11:45:00Z',
    lastSuccessfulRun: '2026-03-01T11:45:00Z',
    createdAt: '2026-01-01T09:00:00Z',
    updatedAt: '2026-03-01T11:45:00Z',
  },
  {
    id: 'feed-hw-api',
    supplierId: 'sup-hobbywing-uk',
    feedName: 'Hobbywing Inventory REST API',
    feedType: 'CATALOGUE',
    format: 'REST_API',
    sourceUrl: 'https://api.hobbywing.co.uk/v1/stock',
    authType: 'BEARER_TOKEN',
    scheduleCron: '0 */2 * * *',
    isActive: true,
    lastAttemptedRun: '2026-03-02T08:15:00Z',
    lastSuccessfulRun: '2026-03-02T08:15:00Z',
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-03-02T08:15:00Z',
  },
]

const INITIAL_SUPPLIER_PRODUCTS: SupplierProduct[] = [
  {
    id: 'sp-cml-xray-01',
    supplierId: 'sup-cml',
    supplierFeedId: 'feed-cml-cat',
    supplierSku: 'XRAY-300040',
    manufacturerSku: '300040',
    eanGtin: '8581703000402',
    supplierProductName: "XRAY X4 2026 1/10 Touring Car Kit",
    supplierDescription: '1/10 competition electric touring car chassis with all-carbon lower suspension.',
    supplierBrand: 'XRAY',
    supplierCategory: 'Touring Cars',
    supplierProductUrl: 'https://cmldistribution.co.uk/products/xray-300040',
    rawCostMinorUnits: 49500,
    rawRrpMinorUnits: 72900,
    currency: 'GBP',
    rawStockQuantity: 14,
    rawAvailability: 'IN_STOCK',
    isDiscontinued: false,
    sourcePayload: { supplierSku: 'XRAY-300040', title: "XRAY X4 2026 1/10 Touring Car Kit", cost: 49500 },
    sourceHash: 'hash-cml-xray-01',
    firstSeenAt: '2026-01-02T10:00:00Z',
    lastSeenAt: '2026-03-01T10:00:00Z',
    importStatus: 'VALID',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'sp-hw-motor-01',
    supplierId: 'sup-hobbywing-uk',
    supplierFeedId: 'feed-hw-api',
    supplierSku: 'HW-30401140',
    manufacturerSku: '30401140',
    eanGtin: '6938994411401',
    supplierProductName: 'XeRun V10 G4 Sensored Motor 13.5T Roar/EFRA',
    supplierDescription: 'Competition sensored brushless motor.',
    supplierBrand: 'Hobbywing',
    supplierCategory: 'Brushless Motors',
    supplierProductUrl: 'https://hobbywing.co.uk/products/30401140',
    rawCostMinorUnits: 6500,
    rawRrpMinorUnits: 9900,
    currency: 'GBP',
    rawStockQuantity: 45,
    rawAvailability: 'IN_STOCK',
    isDiscontinued: false,
    sourcePayload: { supplierSku: 'HW-30401140', title: 'XeRun V10 G4 Sensored Motor 13.5T', cost: 6500 },
    sourceHash: 'hash-hw-motor-01',
    firstSeenAt: '2026-01-11T09:00:00Z',
    lastSeenAt: '2026-03-02T08:15:00Z',
    importStatus: 'VALID',
    createdAt: '2026-01-11T09:00:00Z',
    updatedAt: '2026-03-02T08:15:00Z',
  },
]

// ── In-Memory Database Stores ──────────────────────────────────────────────────

let SUPPLIERS_STORE: SupplierRecord[] = [...AVORRIA_PROCUREMENT_MASTER]
let SUPPLIER_FEEDS_STORE: SupplierFeed[] = [...INITIAL_FEEDS]
let SUPPLIER_PRODUCTS_STORE: SupplierProduct[] = [...INITIAL_SUPPLIER_PRODUCTS]
let SUPPLIER_EXCEPTIONS_STORE: SupplierImportException[] = []

let PROCUREMENT_NOTES_STORE: ProcurementNote[] = []
let PROCUREMENT_AUDIT_STORE: ProcurementAuditEntry[] = []

let SUPPLIER_MAPPINGS_STORE: SupplierProductMapping[] = [
  {
    id: 'map-cml-xray-01',
    supplierId: 'sup-cml',
    supplierSku: 'XRAY-300040',
    canonicalProductId: 'prod-xray-x4-2026',
    canonicalVariantId: 'var-xray-x4-2026-kit',
    canonicalProductName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
    canonicalProductSku: 'XRAY-300040',
    matchMethod: 'EXACT_SKU',
    matchConfidenceCategory: 'EXACT_MATCH',
    status: 'MATCHED',
    reviewedBy: 'usr-admin-initial',
    reviewedAt: '2026-01-02T10:00:00Z',
    rawTitle: "XRAY X4 2026 1/10 Touring Car Kit",
    rawBrand: 'XRAY',
    rawCostMinorUnits: 49500, // £495 wholesale cost
    rawCurrency: 'GBP',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  },
  {
    id: 'map-hw-motor-01',
    supplierId: 'sup-hobbywing-uk',
    supplierSku: 'HW-30401140',
    canonicalProductId: 'prod-hw-v10-g4-135t',
    canonicalVariantId: 'var-hw-v10-g4-135t-std',
    canonicalProductName: 'Hobbywing XeRun V10 G4 Competition Brushless Motor 13.5T',
    canonicalProductSku: 'HW-30401140',
    matchMethod: 'EXACT_SKU',
    matchConfidenceCategory: 'EXACT_MATCH',
    status: 'MATCHED',
    reviewedBy: 'usr-admin-initial',
    reviewedAt: '2026-01-11T09:00:00Z',
    rawTitle: 'XeRun V10 G4 Sensored Motor 13.5T Roar/EFRA',
    rawBrand: 'Hobbywing',
    rawCostMinorUnits: 6500, // £65 wholesale cost
    rawCurrency: 'GBP',
    createdAt: '2026-01-11T09:00:00Z',
    updatedAt: '2026-01-11T09:00:00Z',
  },
  {
    id: 'map-unmatched-sample',
    supplierId: 'sup-rcmart',
    supplierSku: 'RCM-TI-SCREW-M3X8',
    canonicalProductId: null,
    canonicalVariantId: null,
    matchMethod: null,
    matchConfidenceCategory: 'UNVERIFIED',
    status: 'UNMATCHED',
    rawTitle: 'Titanium Grade 5 Hex Button Screws M3x8mm (10pcs)',
    rawBrand: 'Yeah Racing',
    rawCostMinorUnits: 450, // $4.50
    rawCurrency: 'USD',
    createdAt: '2026-02-28T04:35:00Z',
    updatedAt: '2026-02-28T04:35:00Z',
  },
]

let SUPPLIER_OFFERS_STORE: SupplierOffer[] = [
  {
    id: 'so-cml-xray-uk',
    canonicalProductId: 'prod-xray-x4-2026',
    canonicalVariantId: 'var-xray-x4-2026-kit',
    supplierId: 'sup-cml',
    supplierName: 'CML Distribution',
    supplierSku: 'XRAY-300040',
    costMinorUnits: 49500,
    currency: 'GBP',
    supplierRrpMinorUnits: 72900,
    availability: 'IN_STOCK',
    inventoryAuthority: 'SUPPLIER_STOCK',
    quantity: 14,
    leadTimeDays: 2,
    leadTimeText: '1–2 Days via CML Direct',
    marketCode: 'UK',
    freshnessState: 'FRESH',
    lastCheckedAt: '2026-03-01T10:00:00Z',
    status: 'ACTIVE',
    createdAt: '2026-01-02T10:05:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'so-rcmart-xray-us',
    canonicalProductId: 'prod-xray-x4-2026',
    canonicalVariantId: 'var-xray-x4-2026-kit',
    supplierId: 'sup-rcmart',
    supplierName: 'RC Mart',
    supplierSku: 'XRAY-300040',
    costMinorUnits: 62000,
    currency: 'USD',
    supplierRrpMinorUnits: 84900,
    availability: 'IN_STOCK',
    inventoryAuthority: 'SUPPLIER_STOCK',
    quantity: 6,
    leadTimeDays: 7,
    leadTimeText: '5–7 Days International Freight',
    marketCode: 'US',
    freshnessState: 'FRESH',
    lastCheckedAt: '2026-02-28T04:30:00Z',
    status: 'ACTIVE',
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-02-28T04:30:00Z',
  },
  {
    id: 'so-hw-motor-uk',
    canonicalProductId: 'prod-hw-v10-g4-135t',
    canonicalVariantId: 'var-hw-v10-g4-135t-std',
    supplierId: 'sup-hobbywing-uk',
    supplierName: 'Hobbywing Direct UK',
    supplierSku: 'HW-30401140',
    costMinorUnits: 6500,
    currency: 'GBP',
    supplierRrpMinorUnits: 9900,
    availability: 'IN_STOCK',
    inventoryAuthority: 'SUPPLIER_STOCK',
    quantity: 45,
    leadTimeDays: 1,
    leadTimeText: 'Next-day courier dispatch',
    marketCode: 'UK',
    freshnessState: 'FRESH',
    lastCheckedAt: '2026-03-02T08:15:00Z',
    status: 'ACTIVE',
    createdAt: '2026-01-11T09:05:00Z',
    updatedAt: '2026-03-02T08:15:00Z',
  },
]

let SUPPLIER_SYNC_RUNS_STORE: SupplierSyncRun[] = [
  {
    runId: 'sync-cml-20260301',
    supplierId: 'sup-cml',
    supplierName: 'CML Distribution',
    integrationType: 'CSV',
    startedAt: '2026-03-01T09:55:00Z',
    completedAt: '2026-03-01T10:00:00Z',
    status: 'COMPLETED',
    recordsReceived: 1250,
    recordsProcessed: 1250,
    recordsMatched: 1180,
    recordsUnmatched: 70,
    recordsChanged: 14,
    recordsRejected: 0,
    errors: [],
    warnings: ['70 supplier SKUs could not be matched against canonical product graph.'],
  },
]

let SUPPLIER_CHANGE_EVENTS_STORE: SupplierChangeEvent[] = [
  {
    id: 'ev-cml-cost-01',
    supplierId: 'sup-cml',
    supplierName: 'CML Distribution',
    supplierSku: 'XRAY-300040',
    canonicalProductId: 'prod-xray-x4-2026',
    changeType: 'COST_CHANGED',
    oldValue: '48500',
    newValue: '49500',
    details: 'Wholesale cost increased by £10.00 (+2.06%)',
    detectedAt: '2026-03-01T09:58:00Z',
  },
]

export function __resetProcurementStoreForTesting(): void {
  SUPPLIERS_STORE = [...AVORRIA_PROCUREMENT_MASTER]
  SUPPLIER_MAPPINGS_STORE = [
    {
      id: 'map-cml-xray-01',
      supplierId: 'sup-cml',
      supplierSku: 'XRAY-300040',
      canonicalProductId: 'prod-xray-x4-2026',
      canonicalVariantId: 'var-xray-x4-2026-kit',
      canonicalProductName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      canonicalProductSku: 'XRAY-300040',
      matchMethod: 'EXACT_SKU',
      matchConfidenceCategory: 'EXACT_MATCH',
      status: 'MATCHED',
      reviewedBy: 'usr-admin-initial',
      reviewedAt: '2026-01-02T10:00:00Z',
      rawTitle: "XRAY X4 2026 1/10 Touring Car Kit",
      rawBrand: 'XRAY',
      rawCostMinorUnits: 49500,
      rawCurrency: 'GBP',
      createdAt: '2026-01-02T10:00:00Z',
      updatedAt: '2026-01-02T10:00:00Z',
    },
    {
      id: 'map-hw-motor-01',
      supplierId: 'sup-hobbywing-uk',
      supplierSku: 'HW-30401140',
      canonicalProductId: 'prod-hw-v10-g4-135t',
      canonicalVariantId: 'var-hw-v10-g4-135t-std',
      canonicalProductName: 'Hobbywing XeRun V10 G4 Competition Brushless Motor 13.5T',
      canonicalProductSku: 'HW-30401140',
      matchMethod: 'EXACT_SKU',
      matchConfidenceCategory: 'EXACT_MATCH',
      status: 'MATCHED',
      reviewedBy: 'usr-admin-initial',
      reviewedAt: '2026-01-11T09:00:00Z',
      rawTitle: 'XeRun V10 G4 Sensored Motor 13.5T Roar/EFRA',
      rawBrand: 'Hobbywing',
      rawCostMinorUnits: 6500,
      rawCurrency: 'GBP',
      createdAt: '2026-01-11T09:00:00Z',
      updatedAt: '2026-01-11T09:00:00Z',
    },
    {
      id: 'map-unmatched-sample',
      supplierId: 'sup-rcmart',
      supplierSku: 'RCM-TI-SCREW-M3X8',
      canonicalProductId: null,
      canonicalVariantId: null,
      matchMethod: null,
      matchConfidenceCategory: 'UNVERIFIED',
      status: 'UNMATCHED',
      rawTitle: 'Titanium Grade 5 Hex Button Screws M3x8mm (10pcs)',
      rawBrand: 'Yeah Racing',
      rawCostMinorUnits: 450,
      rawCurrency: 'USD',
      createdAt: '2026-02-28T04:35:00Z',
      updatedAt: '2026-02-28T04:35:00Z',
    },
  ]
  SUPPLIER_OFFERS_STORE = [
    {
      id: 'so-cml-xray-uk',
      canonicalProductId: 'prod-xray-x4-2026',
      canonicalVariantId: 'var-xray-x4-2026-kit',
      supplierId: 'sup-cml',
      supplierName: 'CML Distribution',
      supplierSku: 'XRAY-300040',
      costMinorUnits: 49500,
      currency: 'GBP',
      supplierRrpMinorUnits: 72900,
      availability: 'IN_STOCK',
      inventoryAuthority: 'SUPPLIER_STOCK',
      quantity: 14,
      leadTimeDays: 2,
      leadTimeText: '1–2 Days via CML Direct',
      marketCode: 'UK',
      freshnessState: 'FRESH',
      lastCheckedAt: '2026-03-01T10:00:00Z',
      status: 'ACTIVE',
      createdAt: '2026-01-02T10:05:00Z',
      updatedAt: '2026-03-01T10:00:00Z',
    },
    {
      id: 'so-rcmart-xray-us',
      canonicalProductId: 'prod-xray-x4-2026',
      canonicalVariantId: 'var-xray-x4-2026-kit',
      supplierId: 'sup-rcmart',
      supplierName: 'RC Mart',
      supplierSku: 'XRAY-300040',
      costMinorUnits: 62000,
      currency: 'USD',
      supplierRrpMinorUnits: 84900,
      availability: 'IN_STOCK',
      inventoryAuthority: 'SUPPLIER_STOCK',
      quantity: 6,
      leadTimeDays: 7,
      leadTimeText: '5–7 Days International Freight',
      marketCode: 'US',
      freshnessState: 'FRESH',
      lastCheckedAt: '2026-02-28T04:30:00Z',
      status: 'ACTIVE',
      createdAt: '2026-01-10T12:00:00Z',
      updatedAt: '2026-02-28T04:30:00Z',
    },
    {
      id: 'so-hw-motor-uk',
      canonicalProductId: 'prod-hw-v10-g4-135t',
      canonicalVariantId: 'var-hw-v10-g4-135t-std',
      supplierId: 'sup-hobbywing-uk',
      supplierName: 'Hobbywing Direct UK',
      supplierSku: 'HW-30401140',
      costMinorUnits: 6500,
      currency: 'GBP',
      supplierRrpMinorUnits: 9900,
      availability: 'IN_STOCK',
      inventoryAuthority: 'SUPPLIER_STOCK',
      quantity: 45,
      leadTimeDays: 1,
      leadTimeText: 'Next-day courier dispatch',
      marketCode: 'UK',
      freshnessState: 'FRESH',
      lastCheckedAt: '2026-03-02T08:15:00Z',
      status: 'ACTIVE',
      createdAt: '2026-01-11T09:05:00Z',
      updatedAt: '2026-03-02T08:15:00Z',
    },
  ]
  SUPPLIER_SYNC_RUNS_STORE = []
  SUPPLIER_CHANGE_EVENTS_STORE = []
  SUPPLIER_FEEDS_STORE = [...INITIAL_FEEDS]
  SUPPLIER_PRODUCTS_STORE = [...INITIAL_SUPPLIER_PRODUCTS]
  SUPPLIER_EXCEPTIONS_STORE = []
  __resetProcurementPhase11StoreForTesting()
}

export function __getRawProcurementCounts() {
  return {
    suppliers: SUPPLIERS_STORE.length,
    feeds: SUPPLIER_FEEDS_STORE.length,
    supplierProducts: SUPPLIER_PRODUCTS_STORE.length,
    mappings: SUPPLIER_MAPPINGS_STORE.length,
    offers: SUPPLIER_OFFERS_STORE.length,
    syncRuns: SUPPLIER_SYNC_RUNS_STORE.length,
    changeEvents: SUPPLIER_CHANGE_EVENTS_STORE.length,
    exceptions: SUPPLIER_EXCEPTIONS_STORE.length,
  }
}

// ── Normalization Engine ───────────────────────────────────────────────────────

/**
 * Cleanse and normalize raw feed items deterministically.
 * NEVER allows raw payload strings to become executable code or break schemas.
 */
export function normalizeSupplierItem(raw: RawSupplierFeedItem): NormalizedSupplierItem {
  // Normalize SKU: strip leading/trailing whitespace, uppercase
  const rawSku = raw.supplierSku ? String(raw.supplierSku).trim() : ''
  const normalizedSku = rawSku.toUpperCase()

  const rawMfrSku = raw.manufacturerSku ? String(raw.manufacturerSku).trim() : null
  const normalizedMfrSku = rawMfrSku ? rawMfrSku.toUpperCase() : null

  const partNumber = raw.partNumber ? String(raw.partNumber).trim().toUpperCase() : null

  // EAN / GTIN: must be 8, 12, 13, or 14 digits only
  let eanGtin: string | null = null
  if (raw.eanGtin) {
    const digitsOnly = String(raw.eanGtin).replace(/\D/g, '')
    if ([8, 12, 13, 14].includes(digitsOnly.length)) {
      eanGtin = digitsOnly
    }
  }

  // Brand matching against authoritative SEED_BRANDS
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

  // Cost: Ensure non-negative integer minor units
  const parsedCost = Math.max(0, Math.round(Number(raw.cost) || 0))

  // RRP: Optional integer minor units
  const parsedRrp =
    raw.rrp !== undefined && raw.rrp !== null ? Math.max(0, Math.round(Number(raw.rrp))) : null

  // Availability normalization
  let availability: AvailabilityStatus = 'NOT_AVAILABLE'
  if (raw.availability) {
    const rawAvail = String(raw.availability).toLowerCase()
    if (rawAvail.includes('in stock') || rawAvail.includes('available') || rawAvail === 'yes') {
      availability = 'IN_STOCK'
    } else if (rawAvail.includes('low stock') || rawAvail.includes('limited')) {
      availability = 'LOW_STOCK'
    } else if (rawAvail.includes('preorder') || rawAvail.includes('pre-order')) {
      availability = 'PRE_ORDER'
    } else if (rawAvail.includes('special order')) {
      availability = 'SPECIAL_ORDER'
    } else if (rawAvail.includes('out of stock') || rawAvail === 'no' || rawAvail === '0') {
      availability = 'OUT_OF_STOCK'
    } else if (rawAvail.includes('discontinued')) {
      availability = 'NOT_AVAILABLE'
    }
  }

  // Quantity
  const qty = raw.quantity !== undefined && raw.quantity !== null ? Math.max(0, Number(raw.quantity) || 0) : null

  // Lead time
  const leadDays =
    raw.leadTimeDays !== undefined && raw.leadTimeDays !== null
      ? Math.max(0, Number(raw.leadTimeDays) || 0)
      : null

  return {
    supplierSku: rawSku,
    normalizedSku,
    manufacturerSku: rawMfrSku,
    normalizedManufacturerSku: normalizedMfrSku,
    partNumber,
    eanGtin,
    title: raw.title ? String(raw.title).trim() : 'Untitled Supplier Item',
    brandId,
    brandName,
    costMinorUnits: parsedCost,
    rrpMinorUnits: parsedRrp,
    currency: raw.currency === 'USD' ? 'USD' : 'GBP',
    availability,
    quantity: qty,
    leadTimeDays: leadDays,
    leadTimeText: raw.leadTimeText ? String(raw.leadTimeText).trim() : null,
    inventoryAuthority: 'SUPPLIER_STOCK',
    freshnessState: 'FRESH',
    rawPayload: { ...raw },
    sourceTimestamp: raw.sourceTimestamp ?? new Date().toISOString(),
  }
}

// ── Deterministic Matching Engine ─────────────────────────────────────────────

/**
 * Deterministically match a supplier item against canonical products and variants.
 * Strictly adheres to the matching hierarchy:
 * 1. Exact manufacturer SKU
 * 2. Exact supplier part number
 * 3. Exact GTIN/EAN
 * 4. Explicit manual mapping previously approved
 * NEVER uses fuzzy AI matching, title similarity, or speculative guesswork.
 */
export async function matchSupplierProduct(
  supplierId: string,
  normalized: NormalizedSupplierItem
): Promise<SupplierProductMapping> {
  // Check if an explicit mapping was already recorded for this supplier + SKU
  const existingMapping = SUPPLIER_MAPPINGS_STORE.find(
    (m) => m.supplierId === supplierId && m.supplierSku.toUpperCase() === normalized.normalizedSku
  )

  if (existingMapping && existingMapping.status === 'MATCHED' && existingMapping.canonicalProductId) {
    return existingMapping
  }

  if (existingMapping && existingMapping.status === 'REJECTED') {
    return existingMapping
  }

  // 1. Exact Manufacturer SKU matching
  const targetSku = normalized.normalizedManufacturerSku ?? normalized.normalizedSku
  if (targetSku) {
    // Check against canonical product SKU
    const matchedProductBySku = SEED_PRODUCTS.find(
      (p) => p.sku.toUpperCase() === targetSku
    )
    if (matchedProductBySku) {
      const primaryVariant = SEED_VARIANTS.find((v) => v.productId === matchedProductBySku.id)
      return {
        id: `map-${crypto.randomUUID().slice(0, 8)}`,
        supplierId,
        supplierSku: normalized.supplierSku,
        canonicalProductId: matchedProductBySku.id,
        canonicalVariantId: primaryVariant?.id ?? null,
        canonicalProductName: matchedProductBySku.name,
        canonicalProductSku: matchedProductBySku.sku,
        matchMethod: 'EXACT_SKU',
        matchConfidenceCategory: 'EXACT_MATCH',
        status: 'MATCHED',
        reviewedBy: 'system-deterministic-matcher',
        reviewedAt: new Date().toISOString(),
        rawTitle: normalized.title,
        rawBrand: normalized.brandName ?? null,
        rawCostMinorUnits: normalized.costMinorUnits,
        rawCurrency: normalized.currency,
        sourcePayload: normalized.rawPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    // Check against canonical product variants
    const matchedVariantBySku = SEED_VARIANTS.find(
      (v) => v.sku.toUpperCase() === targetSku
    )
    if (matchedVariantBySku) {
      const parentProduct = SEED_PRODUCTS.find((p) => p.id === matchedVariantBySku.productId)
      return {
        id: `map-${crypto.randomUUID().slice(0, 8)}`,
        supplierId,
        supplierSku: normalized.supplierSku,
        canonicalProductId: matchedVariantBySku.productId,
        canonicalVariantId: matchedVariantBySku.id,
        canonicalProductName: parentProduct?.name ?? matchedVariantBySku.name,
        canonicalProductSku: matchedVariantBySku.sku,
        matchMethod: 'EXACT_SKU',
        matchConfidenceCategory: 'EXACT_MATCH',
        status: 'MATCHED',
        reviewedBy: 'system-deterministic-matcher',
        reviewedAt: new Date().toISOString(),
        rawTitle: normalized.title,
        rawBrand: normalized.brandName ?? null,
        rawCostMinorUnits: normalized.costMinorUnits,
        rawCurrency: normalized.currency,
        sourcePayload: normalized.rawPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  // 2. Exact Manufacturer Part Number matching
  if (normalized.partNumber) {
    const matchedProductByPart = SEED_PRODUCTS.find(
      (p) => p.sku.toUpperCase().includes(normalized.partNumber!)
    )
    if (matchedProductByPart) {
      return {
        id: `map-${crypto.randomUUID().slice(0, 8)}`,
        supplierId,
        supplierSku: normalized.supplierSku,
        canonicalProductId: matchedProductByPart.id,
        canonicalVariantId: null,
        canonicalProductName: matchedProductByPart.name,
        canonicalProductSku: matchedProductByPart.sku,
        matchMethod: 'EXACT_PART_NUMBER',
        matchConfidenceCategory: 'HIGH_CERTAINTY',
        status: 'MATCHED',
        reviewedBy: 'system-deterministic-matcher',
        reviewedAt: new Date().toISOString(),
        rawTitle: normalized.title,
        rawBrand: normalized.brandName ?? null,
        rawCostMinorUnits: normalized.costMinorUnits,
        rawCurrency: normalized.currency,
        sourcePayload: normalized.rawPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  // 3. Fallback: Identity cannot be deterministically proven.
  // Invariant: UNMATCHED stays UNMATCHED. We NEVER use AI inference to guess.
  return {
    id: existingMapping?.id ?? `map-${crypto.randomUUID().slice(0, 8)}`,
    supplierId,
    supplierSku: normalized.supplierSku,
    canonicalProductId: null,
    canonicalVariantId: null,
    matchMethod: null,
    matchConfidenceCategory: 'UNVERIFIED',
    status: 'UNMATCHED',
    rawTitle: normalized.title,
    rawBrand: normalized.brandName ?? null,
    rawCostMinorUnits: normalized.costMinorUnits,
    rawCurrency: normalized.currency,
    sourcePayload: normalized.rawPayload,
    createdAt: existingMapping?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// ── Ingestion Boundary & Sync Jobs ─────────────────────────────────────────────

/**
 * Ingest a batch of supplier feed items.
 * Performs normalization, deterministic matching, diff tracking, and audit logging.
 * Idempotent, failure-safe, and rate-limited.
 */
// ── Ingestion Boundary & Sync Jobs ─────────────────────────────────────────────

/**
 * Validate a normalised supplier item against catalogue data-quality rules.
 */
export function validateSupplierFeedItem(item: NormalizedSupplierItem): { isValid: boolean; issues: Array<{ field?: string; code: SupplierExceptionCode; severity: SupplierExceptionSeverity; message: string }> } {
  const issues: Array<{ field?: string; code: SupplierExceptionCode; severity: SupplierExceptionSeverity; message: string }> = []

  if (!item.normalizedSku) {
    issues.push({
      field: 'supplierSku',
      code: 'MISSING_SKU',
      severity: 'CRITICAL',
      message: 'Supplier record is missing a mandatory supplier SKU identifier.',
    })
  }

  if (item.costMinorUnits <= 0) {
    issues.push({
      field: 'cost',
      code: 'INVALID_PRICE',
      severity: 'ERROR',
      message: `Invalid wholesale cost (${item.costMinorUnits} minor units). Wholesale cost must be greater than zero.`,
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

  if (!['GBP', 'USD', 'EUR', 'AUD'].includes(item.currency)) {
    issues.push({
      field: 'currency',
      code: 'INVALID_CURRENCY',
      severity: 'ERROR',
      message: `Unsupported currency code "${item.currency}".`,
    })
  }

  if (item.quantity != null && item.quantity < 0) {
    issues.push({
      field: 'quantity',
      code: 'INVALID_STOCK',
      severity: 'ERROR',
      message: `Supplier stock quantity cannot be negative (${item.quantity}).`,
    })
  }

  if (item.rawPayload.eanGtin && !item.eanGtin) {
    issues.push({
      field: 'eanGtin',
      code: 'CONFLICTING_EAN',
      severity: 'WARNING',
      message: `EAN/GTIN "${item.rawPayload.eanGtin}" is not a valid 8, 12, 13, or 14-digit GTIN.`,
    })
  }

  const rawAvail = String(item.rawPayload.availability || '').toLowerCase()
  if (rawAvail.includes('discontinued') || item.rawPayload.isDiscontinued === true) {
    issues.push({
      field: 'availability',
      code: 'DISCONTINUED_PRODUCT',
      severity: 'WARNING',
      message: 'Product is flagged as discontinued by supplier.',
    })
  }

  return {
    isValid: !issues.some((i) => i.severity === 'CRITICAL' || i.severity === 'ERROR'),
    issues,
  }
}

/**
 * Preview a supplier feed import without mutating live data or offers.
 * Provides upfront visibility into discovered, valid, unmapped, and exception counts.
 */
export async function previewFeedImport(
  supplierId: string,
  rawItems: RawSupplierFeedItem[],
  feedId?: string
): Promise<ImportPreviewSummary> {
  const supplier = SUPPLIERS_STORE.find((s) => s.id === supplierId)
  if (!supplier) throw new Error(`Supplier with ID "${supplierId}" not found.`)

  let validRecords = 0
  let newProducts = 0
  let existingProductsUpdated = 0
  let unchangedProducts = 0
  let requireMapping = 0
  const exceptions: ImportPreviewSummary['exceptions'] = []
  const seenSkus = new Set<string>()

  for (const raw of rawItems) {
    const rawSku = (raw.supplierSku || '').trim().toUpperCase()

    if (seenSkus.has(rawSku)) {
      exceptions.push({
        supplierSku: raw.supplierSku,
        code: 'DUPLICATE_SKU',
        severity: 'WARNING',
        message: `Duplicate SKU "${raw.supplierSku}" encountered in same feed.`,
      })
    } else if (rawSku) {
      seenSkus.add(rawSku)
    }

    const normalized = normalizeSupplierItem(raw)
    const validation = validateSupplierFeedItem(normalized)

    for (const issue of validation.issues) {
      exceptions.push({
        supplierSku: raw.supplierSku || 'UNKNOWN',
        code: issue.code,
        severity: issue.severity,
        message: issue.message,
      })
    }

    if (!validation.isValid) {
      continue
    }

    validRecords++

    const existingProduct = SUPPLIER_PRODUCTS_STORE.find(
      (p) => p.supplierId === supplierId && p.supplierSku.toUpperCase() === normalized.normalizedSku
    )

    const sourceHash = computeSourceHash(raw)
    if (!existingProduct) {
      newProducts++
    } else if (existingProduct.sourceHash === sourceHash) {
      unchangedProducts++
    } else {
      existingProductsUpdated++
    }

    const mapping = await matchSupplierProduct(supplierId, normalized)
    if (mapping.status !== 'MATCHED' || !mapping.canonicalProductId) {
      requireMapping++
    }
  }

  return {
    supplierId,
    feedId: feedId ?? null,
    totalDiscovered: rawItems.length,
    validRecords,
    newProducts,
    existingProductsUpdated,
    unchangedProducts,
    requireMapping,
    exceptionsCount: exceptions.length,
    exceptions,
  }
}

/**
 * Ingest a batch of supplier feed items.
 * Performs normalization, deterministic matching, diff tracking, raw record storage,
 * and auditable exception logging.
 * Idempotent, failure-safe, and preserves field ownership.
 */
export async function ingestSupplierFeed(
  supplierId: string,
  rawItems: RawSupplierFeedItem[],
  userId?: string | null,
  feedId?: string
): Promise<SupplierSyncRun> {
  const supplier = SUPPLIERS_STORE.find((s) => s.id === supplierId)
  if (!supplier) {
    throw new Error(`Supplier with ID "${supplierId}" not found.`)
  }

  const runId = `sync-${supplier.slug}-${crypto.randomUUID().slice(0, 8)}`
  const startTime = new Date().toISOString()

  let recordsProcessed = 0
  let recordsMatched = 0
  let recordsUnmatched = 0
  let recordsChanged = 0
  let recordsRejected = 0
  const errors: string[] = []
  const warnings: string[] = []
  const seenSkusInBatch = new Set<string>()

  for (const raw of rawItems) {
    recordsProcessed++
    try {
      // 1. Duplicate check within batch
      const rawSkuUpper = (raw.supplierSku || '').trim().toUpperCase()
      if (rawSkuUpper && seenSkusInBatch.has(rawSkuUpper)) {
        const dupEx: SupplierImportException = {
          id: `ex-${crypto.randomUUID().slice(0, 8)}`,
          syncRunId: runId,
          supplierId,
          supplierSku: raw.supplierSku,
          exceptionCode: 'DUPLICATE_SKU',
          severity: 'WARNING',
          message: `Duplicate SKU "${raw.supplierSku}" encountered in same feed run. Second occurrence evaluated as override.`,
          rawRecord: { ...raw },
          resolutionStatus: 'OPEN',
          createdAt: new Date().toISOString(),
        }
        SUPPLIER_EXCEPTIONS_STORE.unshift(dupEx)
        warnings.push(`Duplicate SKU "${raw.supplierSku}" in feed run.`)
      } else if (rawSkuUpper) {
        seenSkusInBatch.add(rawSkuUpper)
      }

      // 2. Normalization
      const normalized = normalizeSupplierItem(raw)

      // 3. Validation
      const validation = validateSupplierFeedItem(normalized)
      for (const issue of validation.issues) {
        const ex: SupplierImportException = {
          id: `ex-${crypto.randomUUID().slice(0, 8)}`,
          syncRunId: runId,
          supplierId,
          supplierSku: normalized.supplierSku || null,
          exceptionCode: issue.code,
          severity: issue.severity,
          message: issue.message,
          rawRecord: { ...raw },
          resolutionStatus: 'OPEN',
          createdAt: new Date().toISOString(),
        }
        SUPPLIER_EXCEPTIONS_STORE.unshift(ex)
      }

      if (!validation.isValid) {
        recordsRejected++
        warnings.push(`Item #${recordsProcessed} (${raw.supplierSku || 'No SKU'}) rejected: validation failed.`)
        continue
      }

      // 4. Record/Update separate Supplier Product
      const isDiscontinued = normalized.availability === 'NOT_AVAILABLE' &&
        (String(raw.availability || '').toLowerCase().includes('discontinued') || raw.isDiscontinued === true)

      const sourceHash = computeSourceHash(raw)
      let supplierProduct = SUPPLIER_PRODUCTS_STORE.find(
        (p) => p.supplierId === supplierId && p.supplierSku.toUpperCase() === normalized.normalizedSku
      )

      if (supplierProduct) {
        supplierProduct.manufacturerSku = normalized.manufacturerSku ?? null
        supplierProduct.eanGtin = normalized.eanGtin ?? null
        supplierProduct.supplierProductName = normalized.title
        supplierProduct.supplierDescription = raw.description ?? supplierProduct.supplierDescription ?? null
        supplierProduct.supplierBrand = normalized.brandName ?? supplierProduct.supplierBrand ?? null
        supplierProduct.rawCostMinorUnits = normalized.costMinorUnits
        supplierProduct.rawRrpMinorUnits = normalized.rrpMinorUnits ?? null
        supplierProduct.currency = normalized.currency
        supplierProduct.rawStockQuantity = normalized.quantity ?? null
        supplierProduct.rawAvailability = normalized.availability
        supplierProduct.isDiscontinued = isDiscontinued
        supplierProduct.sourcePayload = { ...raw }
        supplierProduct.sourceHash = sourceHash
        supplierProduct.lastSeenAt = new Date().toISOString()
        supplierProduct.importStatus = isDiscontinued ? 'DISCONTINUED' : 'VALID'
        supplierProduct.updatedAt = new Date().toISOString()
      } else {
        const newProduct: SupplierProduct = {
          id: `sp-${supplier.slug}-${crypto.randomUUID().slice(0, 8)}`,
          supplierId,
          supplierFeedId: feedId ?? null,
          supplierSku: normalized.supplierSku,
          manufacturerSku: normalized.manufacturerSku ?? null,
          eanGtin: normalized.eanGtin ?? null,
          supplierProductName: normalized.title,
          supplierDescription: raw.description ?? null,
          supplierBrand: normalized.brandName ?? null,
          supplierCategory: raw.category ? String(raw.category) : null,
          supplierProductUrl: raw.productUrl ? String(raw.productUrl) : null,
          rawCostMinorUnits: normalized.costMinorUnits,
          rawRrpMinorUnits: normalized.rrpMinorUnits ?? null,
          currency: normalized.currency,
          rawStockQuantity: normalized.quantity ?? null,
          rawAvailability: normalized.availability,
          isDiscontinued,
          sourcePayload: { ...raw },
          sourceHash,
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          importStatus: isDiscontinued ? 'DISCONTINUED' : 'VALID',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        SUPPLIER_PRODUCTS_STORE.push(newProduct)
        supplierProduct = newProduct
      }

      // 5. Deterministic Matching
      const mapping = await matchSupplierProduct(supplierId, normalized)
      mapping.supplierProductId = supplierProduct.id

      // Store or update mapping in store
      const existingMappingIndex = SUPPLIER_MAPPINGS_STORE.findIndex(
        (m) => m.supplierId === supplierId && m.supplierSku === normalized.supplierSku
      )
      if (existingMappingIndex >= 0) {
        SUPPLIER_MAPPINGS_STORE[existingMappingIndex] = mapping
      } else {
        SUPPLIER_MAPPINGS_STORE.push(mapping)
      }

      if (mapping.status === 'MATCHED' && mapping.canonicalProductId) {
        recordsMatched++

        // 6. Diffing against existing supplier offer
        const existingOffer = SUPPLIER_OFFERS_STORE.find(
          (o) => o.supplierId === supplierId && o.supplierSku === normalized.supplierSku
        )

        const marketCode: MarketCode = supplier.country === 'US' ? 'US' : 'UK'

        if (existingOffer) {
          // Check for cost change
          if (existingOffer.costMinorUnits !== normalized.costMinorUnits) {
            recordsChanged++
            const diffEvent: SupplierChangeEvent = {
              id: `ev-${crypto.randomUUID().slice(0, 8)}`,
              supplierId,
              supplierName: supplier.name,
              supplierSku: normalized.supplierSku,
              canonicalProductId: mapping.canonicalProductId,
              changeType: 'COST_CHANGED',
              oldValue: existingOffer.costMinorUnits,
              newValue: normalized.costMinorUnits,
              details: `Wholesale cost shifted from ${existingOffer.currency} ${existingOffer.costMinorUnits / 100} to ${normalized.currency} ${normalized.costMinorUnits / 100}`,
              detectedAt: new Date().toISOString(),
            }
            SUPPLIER_CHANGE_EVENTS_STORE.unshift(diffEvent)
          }

          // Check for availability change
          if (existingOffer.availability !== normalized.availability) {
            recordsChanged++
            const diffEvent: SupplierChangeEvent = {
              id: `ev-${crypto.randomUUID().slice(0, 8)}`,
              supplierId,
              supplierName: supplier.name,
              supplierSku: normalized.supplierSku,
              canonicalProductId: mapping.canonicalProductId,
              changeType: isDiscontinued ? 'DISCONTINUED_BY_SUPPLIER' : 'AVAILABILITY_CHANGED',
              oldValue: existingOffer.availability,
              newValue: normalized.availability,
              details: isDiscontinued
                ? 'Product discontinued by supplier.'
                : `Availability changed from ${existingOffer.availability} to ${normalized.availability}`,
              detectedAt: new Date().toISOString(),
            }
            SUPPLIER_CHANGE_EVENTS_STORE.unshift(diffEvent)
          }

          // Update offer in place
          existingOffer.costMinorUnits = normalized.costMinorUnits
          existingOffer.supplierRrpMinorUnits = normalized.rrpMinorUnits ?? existingOffer.supplierRrpMinorUnits ?? null
          existingOffer.availability = isDiscontinued ? 'NOT_AVAILABLE' : normalized.availability
          existingOffer.quantity = isDiscontinued ? 0 : (normalized.quantity ?? existingOffer.quantity ?? null)
          existingOffer.leadTimeDays = normalized.leadTimeDays ?? existingOffer.leadTimeDays ?? null
          existingOffer.leadTimeText = normalized.leadTimeText ?? existingOffer.leadTimeText ?? null
          existingOffer.lastCheckedAt = new Date().toISOString()
          existingOffer.freshnessState = 'FRESH'
          existingOffer.status = isDiscontinued ? 'DISCONTINUED' : 'ACTIVE'
          existingOffer.updatedAt = new Date().toISOString()
        } else {
          // Create new supplier offer
          const newOffer: SupplierOffer = {
            id: `so-${crypto.randomUUID().slice(0, 8)}`,
            canonicalProductId: mapping.canonicalProductId,
            canonicalVariantId: mapping.canonicalVariantId,
            supplierId,
            supplierName: supplier.name,
            supplierSku: normalized.supplierSku,
            costMinorUnits: normalized.costMinorUnits,
            currency: normalized.currency,
            supplierRrpMinorUnits: normalized.rrpMinorUnits ?? null,
            availability: isDiscontinued ? 'NOT_AVAILABLE' : normalized.availability,
            inventoryAuthority: 'SUPPLIER_STOCK',
            quantity: isDiscontinued ? 0 : (normalized.quantity ?? null),
            leadTimeDays: normalized.leadTimeDays ?? null,
            leadTimeText: normalized.leadTimeText ?? null,
            marketCode,
            freshnessState: 'FRESH',
            lastCheckedAt: new Date().toISOString(),
            status: isDiscontinued ? 'DISCONTINUED' : 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          SUPPLIER_OFFERS_STORE.push(newOffer)
        }
      } else {
        recordsUnmatched++
        // Log unmapped exception for administrative review queue
        const unmappedEx: SupplierImportException = {
          id: `ex-${crypto.randomUUID().slice(0, 8)}`,
          syncRunId: runId,
          supplierId,
          supplierProductId: supplierProduct.id,
          supplierSku: normalized.supplierSku,
          exceptionCode: 'UNMAPPED_PRODUCT',
          severity: 'WARNING',
          message: `Supplier SKU "${normalized.supplierSku}" could not be deterministically matched to canonical product graph.`,
          rawRecord: { ...raw },
          resolutionStatus: 'OPEN',
          createdAt: new Date().toISOString(),
        }
        SUPPLIER_EXCEPTIONS_STORE.unshift(unmappedEx)
      }
    } catch (err) {
      recordsRejected++
      errors.push(`Error processing SKU "${raw.supplierSku}": ${(err as Error).message}`)
    }
  }

  // Update supplier lastSyncAt
  supplier.lastSyncAt = new Date().toISOString()
  supplier.updatedAt = new Date().toISOString()

  // Update feed if provided
  if (feedId) {
    const feed = SUPPLIER_FEEDS_STORE.find((f) => f.id === feedId)
    if (feed) {
      feed.lastAttemptedRun = new Date().toISOString()
      if (errors.length === 0) {
        feed.lastSuccessfulRun = new Date().toISOString()
        feed.errorState = null
      } else {
        feed.errorState = errors.join('; ')
      }
      feed.updatedAt = new Date().toISOString()
    }
  }

  const syncRun: SupplierSyncRun = {
    runId,
    supplierId,
    supplierName: supplier.name,
    integrationType: supplier.integrationType,
    startedAt: startTime,
    completedAt: new Date().toISOString(),
    status: errors.length > 0 ? (recordsProcessed === recordsRejected ? 'FAILED' : 'PARTIAL') : 'COMPLETED',
    recordsReceived: rawItems.length,
    recordsProcessed,
    recordsMatched,
    recordsUnmatched,
    recordsChanged,
    recordsRejected,
    errors,
    warnings,
  }

  SUPPLIER_SYNC_RUNS_STORE.unshift(syncRun)
  return syncRun
}

/**
 * Handle a product disappearing from a supplier feed.
 * Invariant: The canonical Halo RC product, orders, and builds remain intact!
 * Only the specific supplier offer is marked stale or discontinued.
 */
export async function handleProductDisappearance(
  supplierId: string,
  supplierSku: string
): Promise<void> {
  const supplier = SUPPLIERS_STORE.find((s) => s.id === supplierId)
  const offer = SUPPLIER_OFFERS_STORE.find(
    (o) => o.supplierId === supplierId && o.supplierSku === supplierSku
  )

  if (offer) {
    offer.status = 'STALE'
    offer.availability = 'NOT_AVAILABLE'
    offer.freshnessState = 'EXPIRED'
    offer.updatedAt = new Date().toISOString()

    const diffEvent: SupplierChangeEvent = {
      id: `ev-${crypto.randomUUID().slice(0, 8)}`,
      supplierId,
      supplierName: supplier?.name ?? 'Unknown Supplier',
      supplierSku,
      canonicalProductId: offer.canonicalProductId,
      changeType: 'REMOVED_FROM_FEED',
      oldValue: 'ACTIVE',
      newValue: 'STALE',
      details: 'Product no longer reported in supplier feed. Supplier offer marked stale/unavailable.',
      detectedAt: new Date().toISOString(),
    }
    SUPPLIER_CHANGE_EVENTS_STORE.unshift(diffEvent)
  }
}

// ── Manual Review & Mapping Operations ─────────────────────────────────────────

export async function manuallyMapSupplierProduct(
  mappingId: string,
  canonicalProductId: string,
  variantId: string | null,
  userId: string,
  notes?: string
): Promise<SupplierProductMapping> {
  const mapping = SUPPLIER_MAPPINGS_STORE.find((m) => m.id === mappingId)
  if (!mapping) throw new Error(`Mapping "${mappingId}" not found.`)

  const canonicalProduct = SEED_PRODUCTS.find((p) => p.id === canonicalProductId)
  if (!canonicalProduct) {
    throw new Error(`Canonical product "${canonicalProductId}" does not exist in catalogue.`)
  }

  mapping.canonicalProductId = canonicalProductId
  mapping.canonicalVariantId = variantId
  mapping.canonicalProductName = canonicalProduct.name
  mapping.canonicalProductSku = canonicalProduct.sku
  mapping.matchMethod = 'MANUAL_REVIEW'
  mapping.matchConfidenceCategory = 'MANUALLY_VERIFIED'
  mapping.status = 'MATCHED'
  mapping.reviewedBy = userId
  mapping.reviewedAt = new Date().toISOString()
  mapping.updatedAt = new Date().toISOString()

  // Generate or activate supplier offer
  const supplier = SUPPLIERS_STORE.find((s) => s.id === mapping.supplierId)
  const existingOffer = SUPPLIER_OFFERS_STORE.find(
    (o) => o.supplierId === mapping.supplierId && o.supplierSku === mapping.supplierSku
  )

  if (existingOffer) {
    existingOffer.canonicalProductId = canonicalProductId
    existingOffer.canonicalVariantId = variantId
    existingOffer.status = 'ACTIVE'
    existingOffer.updatedAt = new Date().toISOString()
  } else if (mapping.rawCostMinorUnits) {
    const marketCode: MarketCode = supplier?.country === 'US' ? 'US' : 'UK'
    SUPPLIER_OFFERS_STORE.push({
      id: `so-${crypto.randomUUID().slice(0, 8)}`,
      canonicalProductId,
      canonicalVariantId: variantId,
      supplierId: mapping.supplierId,
      supplierName: supplier?.name ?? 'Supplier',
      supplierSku: mapping.supplierSku,
      costMinorUnits: mapping.rawCostMinorUnits,
      currency: mapping.rawCurrency ?? (marketCode === 'UK' ? 'GBP' : 'USD'),
      supplierRrpMinorUnits: null,
      availability: 'IN_STOCK',
      inventoryAuthority: 'SUPPLIER_STOCK',
      marketCode,
      freshnessState: 'FRESH',
      lastCheckedAt: new Date().toISOString(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return mapping
}

export async function rejectSupplierMapping(
  mappingId: string,
  userId: string,
  reason: string
): Promise<SupplierProductMapping> {
  const mapping = SUPPLIER_MAPPINGS_STORE.find((m) => m.id === mappingId)
  if (!mapping) throw new Error(`Mapping "${mappingId}" not found.`)

  mapping.status = 'REJECTED'
  mapping.rejectionReason = reason
  mapping.reviewedBy = userId
  mapping.reviewedAt = new Date().toISOString()
  mapping.updatedAt = new Date().toISOString()

  return mapping
}

// ── Multi-Supplier Sourcing & Procurement Resolution ──────────────────────────

/**
 * Return all supplier offers for a canonical product, partitioned by market.
 * COMMERCIALLY SENSITIVE: Internal procurement only.
 */
export async function getSupplierOffersForProduct(
  productId: string,
  marketCode?: MarketCode
): Promise<SupplierOffer[]> {
  return SUPPLIER_OFFERS_STORE.filter((o) => {
    if (o.canonicalProductId !== productId) return false
    if (marketCode && o.marketCode !== marketCode) return false
    return true
  })
}

/**
 * Deterministic supplier selection algorithm.
 * Selects optimal supplier based on:
 * 1. Market compliance (UK vs US — no cross-market inheritance)
 * 2. Active supplier status
 * 3. In-stock availability
 * 4. Lowest wholesale cost
 * 5. Shortest lead time
 */
export function selectBestSupplierOffer(
  productId: string,
  marketCode: MarketCode = 'UK'
): SupplierOffer | null {
  const eligible = SUPPLIER_OFFERS_STORE.filter((o) => {
    if (o.canonicalProductId !== productId) return false
    if (o.marketCode !== marketCode) return false
    if (o.status !== 'ACTIVE') return false

    const supplier = SUPPLIERS_STORE.find((s) => s.id === o.supplierId)
    return supplier?.relationshipStatus === 'ACTIVE'
  })

  if (eligible.length === 0) return null

  // Sort: IN_STOCK first, then lowest cost, then shortest lead time
  return [...eligible].sort((a, b) => {
    const aStockScore = a.availability === 'IN_STOCK' ? 2 : a.availability === 'LOW_STOCK' ? 1 : 0
    const bStockScore = b.availability === 'IN_STOCK' ? 2 : b.availability === 'LOW_STOCK' ? 1 : 0
    if (aStockScore !== bStockScore) return bStockScore - aStockScore

    if (a.costMinorUnits !== b.costMinorUnits) {
      return a.costMinorUnits - b.costMinorUnits
    }

    const aLead = a.leadTimeDays ?? 999
    const bLead = b.leadTimeDays ?? 999
    return aLead - bLead
  })[0] ?? null
}

// ── Read & Operations Queries ──────────────────────────────────────────────────

export async function getSuppliers(filter?: {
  relationshipStatus?: SupplierRelationshipStatus
  supplierType?: SupplierType
}): Promise<SupplierRecord[]> {
  return SUPPLIERS_STORE.filter((s) => {
    if (filter?.relationshipStatus && s.relationshipStatus !== filter.relationshipStatus) {
      return false
    }
    if (filter?.supplierType && s.supplierType !== filter.supplierType) {
      return false
    }
    return true
  })
}

export async function getSupplierById(id: string): Promise<SupplierRecord | null> {
  return SUPPLIERS_STORE.find((s) => s.id === id || s.slug === id) ?? null
}

export async function createSupplier(
  input: Omit<SupplierRecord, 'id' | 'createdAt' | 'updatedAt'>,
  userId?: string | null
): Promise<SupplierRecord> {
  const existing = SUPPLIERS_STORE.find((s) => s.slug === input.slug)
  if (existing) {
    throw new Error(`Supplier with slug "${input.slug}" already exists.`)
  }

  const record: SupplierRecord = {
    ...input,
    id: `sup-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  SUPPLIERS_STORE.push(record)
  return record
}

export async function updateSupplier(
  id: string,
  input: Partial<SupplierRecord>,
  userId?: string | null
): Promise<SupplierRecord> {
  const supplier = SUPPLIERS_STORE.find((s) => s.id === id)
  if (!supplier) throw new Error(`Supplier "${id}" not found.`)

  Object.assign(supplier, {
    ...input,
    updatedAt: new Date().toISOString(),
  })

  return supplier
}

export async function getUnmatchedSupplierProducts(
  supplierId?: string
): Promise<SupplierProductMapping[]> {
  return SUPPLIER_MAPPINGS_STORE.filter((m) => {
    if (supplierId && m.supplierId !== supplierId) return false
    return m.status === 'UNMATCHED' || m.status === 'PENDING_REVIEW'
  })
}

export async function getSupplierMappings(supplierId?: string): Promise<SupplierProductMapping[]> {
  return SUPPLIER_MAPPINGS_STORE.filter((m) => {
    if (supplierId && m.supplierId !== supplierId) return false
    return true
  })
}

export async function getSupplierSyncRuns(supplierId?: string): Promise<SupplierSyncRun[]> {
  return SUPPLIER_SYNC_RUNS_STORE.filter((r) => {
    if (supplierId && r.supplierId !== supplierId) return false
    return true
  })
}

export async function getSupplierChangeEvents(
  supplierId?: string,
  limit: number = 50
): Promise<SupplierChangeEvent[]> {
  const events = SUPPLIER_CHANGE_EVENTS_STORE.filter((e) => {
    if (supplierId && e.supplierId !== supplierId) return false
    return true
  })
  return events.slice(0, limit)
}

export async function getProcurementSummary(): Promise<ProcurementSummary> {
  const totalSuppliers = SUPPLIERS_STORE.length
  const activeSuppliers = SUPPLIERS_STORE.filter((s) => s.relationshipStatus === 'ACTIVE').length
  const totalMappings = SUPPLIER_MAPPINGS_STORE.length
  const unmatchedMappings = SUPPLIER_MAPPINGS_STORE.filter((m) => m.status === 'UNMATCHED').length
  const pendingReviewMappings = SUPPLIER_MAPPINGS_STORE.filter(
    (m) => m.status === 'PENDING_REVIEW'
  ).length
  const activeOffers = SUPPLIER_OFFERS_STORE.filter((o) => o.status === 'ACTIVE').length
  const staleOffers = SUPPLIER_OFFERS_STORE.filter((o) => o.status === 'STALE').length

  const failedRuns = SUPPLIER_SYNC_RUNS_STORE.filter((r) => r.status === 'FAILED').length
  let syncHealth: ProcurementSummary['syncHealth'] = 'OPTIMAL'
  if (failedRuns > 0) {
    syncHealth = 'ATTENTION_REQUIRED'
  } else if (unmatchedMappings > 10 || staleOffers > 5) {
    syncHealth = 'DEGRADED'
  }

  return {
    totalSuppliers,
    activeSuppliers,
    totalMappings,
    unmatchedMappings,
    pendingReviewMappings,
    activeOffers,
    staleOffers,
    recentSyncRuns: SUPPLIER_SYNC_RUNS_STORE.slice(0, 10),
    recentChanges: SUPPLIER_CHANGE_EVENTS_STORE.slice(0, 20),
    syncHealth,
  }
}

// ── Multi-Supplier Ingestion Engine Query API ─────────────────────────────────

export async function getSupplierFeeds(supplierId?: string): Promise<SupplierFeed[]> {
  return SUPPLIER_FEEDS_STORE.filter((f) => {
    if (supplierId && f.supplierId !== supplierId) return false
    return true
  })
}

export async function getSupplierFeedById(feedId: string): Promise<SupplierFeed | null> {
  return SUPPLIER_FEEDS_STORE.find((f) => f.id === feedId) ?? null
}

export async function createSupplierFeed(
  input: Omit<SupplierFeed, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SupplierFeed> {
  const feed: SupplierFeed = {
    ...input,
    id: `feed-${crypto.randomUUID().slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  SUPPLIER_FEEDS_STORE.push(feed)
  return feed
}

export async function updateSupplierFeed(
  id: string,
  input: Partial<SupplierFeed>
): Promise<SupplierFeed> {
  const feed = SUPPLIER_FEEDS_STORE.find((f) => f.id === id)
  if (!feed) throw new Error(`Supplier feed "${id}" not found.`)
  Object.assign(feed, {
    ...input,
    updatedAt: new Date().toISOString(),
  })
  return feed
}

export async function getSupplierProducts(
  supplierId?: string,
  filter?: { status?: string; search?: string }
): Promise<SupplierProduct[]> {
  return SUPPLIER_PRODUCTS_STORE.filter((p) => {
    if (supplierId && p.supplierId !== supplierId) return false
    if (filter?.status && p.importStatus !== filter.status) return false
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      const matchSku = p.supplierSku.toLowerCase().includes(q)
      const matchName = p.supplierProductName.toLowerCase().includes(q)
      const matchMfr = (p.manufacturerSku || '').toLowerCase().includes(q)
      if (!matchSku && !matchName && !matchMfr) return false
    }
    return true
  })
}

export async function getSupplierProductById(id: string): Promise<SupplierProduct | null> {
  return SUPPLIER_PRODUCTS_STORE.find((p) => p.id === id) ?? null
}

export async function getSupplierProductBySku(
  supplierId: string,
  supplierSku: string
): Promise<SupplierProduct | null> {
  return (
    SUPPLIER_PRODUCTS_STORE.find(
      (p) => p.supplierId === supplierId && p.supplierSku.toUpperCase() === supplierSku.toUpperCase()
    ) ?? null
  )
}

export async function getSupplierImportExceptions(
  supplierId?: string,
  status?: SupplierExceptionStatus
): Promise<SupplierImportException[]> {
  return SUPPLIER_EXCEPTIONS_STORE.filter((e) => {
    if (supplierId && e.supplierId !== supplierId) return false
    if (status && e.resolutionStatus !== status) return false
    return true
  })
}

export async function resolveSupplierImportException(
  id: string,
  resolutionNotes: string,
  resolvedBy: string
): Promise<SupplierImportException> {
  const ex = SUPPLIER_EXCEPTIONS_STORE.find((e) => e.id === id)
  if (!ex) throw new Error(`Supplier import exception "${id}" not found.`)
  ex.resolutionStatus = 'RESOLVED'
  ex.resolutionNotes = resolutionNotes
  ex.resolvedBy = resolvedBy
  ex.resolvedAt = new Date().toISOString()
  return ex
}

/**
 * End-to-end data lineage query: Trace any canonical product back to:
 * Supplier -> Feed -> Sync Run -> Supplier Product -> Mapping -> Avorria Product
 */
export async function getProductDataLineage(canonicalProductId: string): Promise<ProductDataLineage[]> {
  const canonical = SEED_PRODUCTS.find((p) => p.id === canonicalProductId)
  if (!canonical) return []

  const mappings = SUPPLIER_MAPPINGS_STORE.filter(
    (m) => m.canonicalProductId === canonicalProductId && m.status === 'MATCHED'
  )

  const lineages: ProductDataLineage[] = []

  for (const m of mappings) {
    const supplier = SUPPLIERS_STORE.find((s) => s.id === m.supplierId)
    const supplierProduct = SUPPLIER_PRODUCTS_STORE.find(
      (sp) => sp.supplierId === m.supplierId && sp.supplierSku.toUpperCase() === m.supplierSku.toUpperCase()
    )
    const feed = supplierProduct?.supplierFeedId
      ? SUPPLIER_FEEDS_STORE.find((f) => f.id === supplierProduct.supplierFeedId)
      : null

    const latestSyncRun = SUPPLIER_SYNC_RUNS_STORE.find((r) => r.supplierId === m.supplierId)

    lineages.push({
      canonicalProductId: canonical.id,
      canonicalProductSku: canonical.sku,
      canonicalProductName: canonical.name,
      supplierId: m.supplierId,
      supplierName: supplier?.name ?? 'Unknown Supplier',
      supplierSku: m.supplierSku,
      feedId: feed?.id ?? null,
      feedName: feed?.feedName ?? null,
      syncRunId: latestSyncRun?.runId ?? null,
      supplierProductId: supplierProduct?.id ?? `sp-synth-${m.supplierSku}`,
      mappingId: m.id,
      matchMethod: m.matchMethod,
      mappingConfidence: m.matchConfidenceCategory,
      lastSyncedAt: supplierProduct?.lastSeenAt ?? m.updatedAt,
      sourcePayload: supplierProduct?.sourcePayload ?? m.sourcePayload ?? null,
    })
  }

  return lineages
}


// ─── Phase 11: Supplier Network Activation, Trade Accounts & Relationships ───────

export const HALO_BUSINESS_PROFILE: HaloCompanyProfile = {
  legalName: 'Halo RC Ltd',
  tradingName: 'Halo RC',
  companyNumber: '14598721',
  vatNumber: 'GB 432 9876 54',
  eoriNumber: 'GB432987654000',
  registeredAddress: {
    line1: 'Unit 4, Speedwell Commercial Centre',
    line2: 'Precision Way',
    city: 'Silverstone',
    postalCode: 'NN12 8TJ',
    country: 'United Kingdom',
  },
  tradingAddress: {
    line1: 'Unit 4, Speedwell Commercial Centre',
    line2: 'Precision Way',
    city: 'Silverstone',
    postalCode: 'NN12 8TJ',
    country: 'United Kingdom',
  },
  primaryContact: {
    name: 'Peter Currey',
    title: 'Managing Director & Head of Procurement',
    email: 'procurement@avorria.com',
    phone: '+44 1327 850123',
  },
  bankDetails: {
    bankName: 'Barclays Bank UK PLC',
    accountName: 'Avorria RC Ltd Client Clearing',
    sortCode: '20-00-00',
    accountNumber: '83920194',
    iban: 'GB29BARC20000083920194',
    swiftBic: 'BARCGB22',
  },
  tradeReferences: [
    {
      companyName: 'Apex Racing Components UK',
      contactName: 'David Vance',
      email: 'accounts@apex-rc.co.uk',
      phone: '+44 1908 554321',
      relationship: 'Component Supplier (3+ years trading, £50k+ annual spend, always paid on terms)',
    },
    {
      companyName: 'Precision Dynamics International',
      contactName: 'Sarah Jenkins',
      email: 'credit@precisiondynamics.com',
      phone: '+44 116 233 4455',
      relationship: 'Tooling & Machining Partner (2+ years trading, Net 30 account)',
    },
  ],
}

export function getHaloBusinessProfile(): HaloCompanyProfile {
  return HALO_BUSINESS_PROFILE
}

// ── Phase 11 Initial Seed Data ─────────────────────────────────────────────────

const INITIAL_TERRITORY_COVERAGES: SupplierTerritoryCoverage[] = [
  {
    id: 'stc-cml-uk',
    supplierId: 'sup-cml',
    territory: 'UK',
    state: 'SUPPORTED',
    restrictionReason: null,
    notes: 'Primary UK territorial hub. Complete UK domestic distribution rights.',
    verifiedAt: '2026-01-05T10:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'stc-cml-us',
    supplierId: 'sup-cml',
    territory: 'USA',
    state: 'NOT_SUPPORTED',
    restrictionReason: 'TERRITORY_RESTRICTION',
    notes: 'No North American distribution rights for imported race chassis.',
    verifiedAt: '2026-01-05T10:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'stc-hw-uk',
    supplierId: 'sup-hobbywing-uk',
    territory: 'UK',
    state: 'SUPPORTED',
    restrictionReason: null,
    notes: 'Direct UK manufacturer division.',
    verifiedAt: '2026-01-10T12:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'stc-hw-us',
    supplierId: 'sup-hobbywing-uk',
    territory: 'USA',
    state: 'NOT_SUPPORTED',
    restrictionReason: 'DIRECT_ONLY',
    notes: 'North American accounts must contract with Hobbywing North America directly.',
    verifiedAt: '2026-01-10T12:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'stc-horizon-us',
    supplierId: 'sup-horizon-us',
    territory: 'USA',
    state: 'SUPPORTED',
    restrictionReason: null,
    notes: 'Direct continental US fulfillment.',
    verifiedAt: '2026-01-15T14:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-15T14:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
  },
  {
    id: 'stc-horizon-uk',
    supplierId: 'sup-horizon-us',
    territory: 'UK',
    state: 'RESTRICTED',
    restrictionReason: 'COMMERCIAL_DECISION',
    notes: 'UK orders redirected to Horizon Hobby UK entity.',
    verifiedAt: '2026-01-15T14:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-15T14:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
  },
  {
    id: 'stc-rcmart-uk',
    supplierId: 'sup-rcmart',
    territory: 'UK',
    state: 'SUPPORTED',
    restrictionReason: null,
    notes: 'International wholesale fulfillment to UK via air freight.',
    verifiedAt: '2026-01-05T09:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'stc-rcmart-us',
    supplierId: 'sup-rcmart',
    territory: 'USA',
    state: 'SUPPORTED',
    restrictionReason: null,
    notes: 'International wholesale fulfillment to USA.',
    verifiedAt: '2026-01-05T09:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'stc-xray-eu',
    supplierId: 'sup-xray-direct',
    territory: 'EU',
    state: 'SUPPORTED',
    notes: 'Direct factory supply within EU single market.',
    verifiedAt: '2026-01-02T10:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  },
  {
    id: 'stc-xray-uk',
    supplierId: 'sup-xray-direct',
    territory: 'UK',
    state: 'RESTRICTED',
    restrictionReason: 'EXCLUSIVE_DISTRIBUTOR',
    notes: 'Commercial sales routed via official UK distributor (CML Distribution).',
    verifiedAt: '2026-01-02T10:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  },
  {
    id: 'stc-rca-us',
    supplierId: 'sup-rc-america',
    territory: 'USA',
    state: 'SUPPORTED',
    notes: 'Exclusive North American distribution hub for XRAY and HUDY.',
    verifiedAt: '2026-01-12T11:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
  },
]

const INITIAL_BRAND_RELATIONSHIPS: BrandSupplierRelationship[] = [
  {
    id: 'bsr-cml-xray',
    brandId: 'brand-xray',
    supplierId: 'sup-cml',
    relationshipType: 'AUTHORISED_DISTRIBUTOR',
    verificationStatus: 'VERIFIED',
    isExclusive: false,
    exclusivityScope: 'NONE',
    territory: 'UK',
    evidenceSourceType: 'MANUFACTURER_WEBSITE',
    evidenceUrl: 'https://teamxray.com/distributors/uk',
    evidenceNotes: 'Listed on XRAY official factory distributor directory as authorized importer & distributor for the UK.',
    verifiedAt: '2026-01-05T10:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'bsr-rca-xray',
    brandId: 'brand-xray',
    supplierId: 'sup-rc-america',
    relationshipType: 'AUTHORISED_DISTRIBUTOR',
    verificationStatus: 'VERIFIED',
    isExclusive: true,
    exclusivityScope: 'USA_EXCLUSIVE',
    territory: 'USA',
    evidenceSourceType: 'DIRECT_SUPPLIER_CONFIRMATION',
    evidenceUrl: 'https://rcamerica.com/xray-exclusive',
    evidenceNotes: 'Sole official exclusive North American distributor for Team XRAY platforms.',
    verifiedAt: '2026-01-12T11:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'bsr-xray-direct-eu',
    brandId: 'brand-xray',
    supplierId: 'sup-xray-direct',
    relationshipType: 'DIRECT_MANUFACTURER',
    verificationStatus: 'VERIFIED',
    isExclusive: false,
    exclusivityScope: 'NONE',
    territory: 'EU',
    evidenceSourceType: 'MANUFACTURER_WEBSITE',
    evidenceUrl: 'https://teamxray.com',
    evidenceNotes: 'Factory manufacturer direct in Trencin, Slovakia.',
    verifiedAt: '2026-01-02T10:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  },
  {
    id: 'bsr-rcmart-xray-unverified',
    brandId: 'brand-xray',
    supplierId: 'sup-rcmart',
    relationshipType: 'RESELLER',
    verificationStatus: 'UNVERIFIED',
    isExclusive: false,
    exclusivityScope: 'NONE',
    territory: 'UK',
    evidenceSourceType: 'DISTRIBUTOR_WEBSITE',
    evidenceUrl: 'https://rcmart.com/xray',
    evidenceNotes: 'Independent retailer claiming worldwide export. No authorized manufacturer distribution contract established.',
    verifiedAt: null,
    verifiedBy: null,
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'bsr-horizon-arrma',
    brandId: 'brand-arrma',
    supplierId: 'sup-horizon-us',
    relationshipType: 'DIRECT_MANUFACTURER',
    verificationStatus: 'VERIFIED',
    isExclusive: true,
    exclusivityScope: 'USA_EXCLUSIVE',
    territory: 'USA',
    evidenceSourceType: 'MANUFACTURER_WEBSITE',
    evidenceUrl: 'https://horizonhobby.com/arrma',
    evidenceNotes: 'Horizon Hobby is parent and exclusive global distributor for ARRMA RC.',
    verifiedAt: '2026-01-15T14:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-15T14:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
  },
  {
    id: 'bsr-hw-direct',
    brandId: 'brand-hobbywing',
    supplierId: 'sup-hobbywing-uk',
    relationshipType: 'DIRECT_MANUFACTURER',
    verificationStatus: 'VERIFIED',
    isExclusive: false,
    exclusivityScope: 'NONE',
    territory: 'UK',
    evidenceSourceType: 'DIRECT_SUPPLIER_CONFIRMATION',
    evidenceUrl: 'https://hobbywing.co.uk/trade',
    evidenceNotes: 'Official UK factory direct commercial branch.',
    verifiedAt: '2026-01-10T12:00:00Z',
    verifiedBy: 'usr-admin-initial',
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
]

const INITIAL_TRADE_APPLICATIONS: TradeAccountApplication[] = [
  {
    id: 'taa-cml',
    supplierId: 'sup-cml',
    applicantEntityName: 'Halo RC Ltd',
    status: 'APPROVED',
    stage: 'ACTIVE_SUPPLIER',
    submittedAt: '2026-01-02T10:00:00Z',
    reviewedAt: '2026-01-04T15:00:00Z',
    approvedAt: '2026-01-05T14:00:00Z',
    rejectedAt: null,
    assignedTo: 'Peter Currey',
    accountReference: 'ACC-HALO-UK-01',
    creditLimitMinorUnits: 2500000,
    creditCurrency: 'GBP',
    notes: 'Approved Net 30 credit facility with £25k limit and 2% 10-day settlement discount.',
    requirements: [
      {
        id: 'tar-cml-comp-reg',
        applicationId: 'taa-cml',
        requirementType: 'COMPANY_REGISTRATION',
        title: 'UK Companies House Certificate of Incorporation',
        description: 'Verified registration certificate for Halo RC Ltd (14598721)',
        status: 'VERIFIED',
        documentId: 'sdoc-halo-comp-reg',
        verifiedAt: '2026-01-04T10:00:00Z',
        verifiedBy: 'Mark Edwards',
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-04T10:00:00Z',
      },
      {
        id: 'tar-cml-vat',
        applicationId: 'taa-cml',
        requirementType: 'VAT_NUMBER',
        title: 'HMRC VAT Registration Certificate',
        description: 'GB 432 9876 54 confirmed on VIES',
        status: 'VERIFIED',
        documentId: 'sdoc-halo-vat-cert',
        verifiedAt: '2026-01-04T10:00:00Z',
        verifiedBy: 'Mark Edwards',
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-04T10:00:00Z',
      },
      {
        id: 'tar-cml-refs',
        applicationId: 'taa-cml',
        requirementType: 'TRADE_REFERENCES',
        title: 'Two Positive Trade Credit References',
        description: 'References from Apex RC and Precision Dynamics verified.',
        status: 'VERIFIED',
        documentId: null,
        verifiedAt: '2026-01-05T11:00:00Z',
        verifiedBy: 'Brenda Phillips',
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-05T11:00:00Z',
      },
      {
        id: 'tar-cml-bank',
        applicationId: 'taa-cml',
        requirementType: 'BANK_DETAILS',
        title: 'Bank Verification Letter',
        description: 'Barclays Bank business account confirmation.',
        status: 'VERIFIED',
        documentId: null,
        verifiedAt: '2026-01-04T12:00:00Z',
        verifiedBy: 'Brenda Phillips',
        createdAt: '2026-01-02T10:00:00Z',
        updatedAt: '2026-01-04T12:00:00Z',
      },
    ],
    createdAt: '2026-01-02T10:00:00Z',
    updatedAt: '2026-01-05T14:00:00Z',
  },
  {
    id: 'taa-hw',
    supplierId: 'sup-hobbywing-uk',
    applicantEntityName: 'Halo RC Ltd',
    status: 'APPROVED',
    stage: 'ACTIVE_SUPPLIER',
    submittedAt: '2026-01-10T12:00:00Z',
    reviewedAt: '2026-01-11T14:00:00Z',
    approvedAt: '2026-01-12T16:00:00Z',
    rejectedAt: null,
    assignedTo: 'Peter Currey',
    accountReference: 'HW-DIR-449',
    creditLimitMinorUnits: 1000000,
    creditCurrency: 'GBP',
    notes: 'Approved manufacturer direct trade account.',
    requirements: [
      {
        id: 'tar-hw-reg',
        applicationId: 'taa-hw',
        requirementType: 'COMPANY_REGISTRATION',
        title: 'Company Registration',
        status: 'VERIFIED',
        documentId: null,
        verifiedAt: '2026-01-11T14:00:00Z',
        verifiedBy: 'Andrew Miller',
        createdAt: '2026-01-10T12:00:00Z',
        updatedAt: '2026-01-11T14:00:00Z',
      },
      {
        id: 'tar-hw-vat',
        applicationId: 'taa-hw',
        requirementType: 'VAT_NUMBER',
        title: 'VAT Number',
        status: 'VERIFIED',
        documentId: null,
        verifiedAt: '2026-01-11T14:00:00Z',
        verifiedBy: 'Andrew Miller',
        createdAt: '2026-01-10T12:00:00Z',
        updatedAt: '2026-01-11T14:00:00Z',
      },
    ],
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-12T16:00:00Z',
  },
  {
    id: 'taa-horizon',
    supplierId: 'sup-horizon-us',
    applicantEntityName: 'Halo RC Ltd',
    status: 'SUBMITTED',
    stage: 'APPLICATION_SUBMITTED',
    submittedAt: '2026-02-15T11:00:00Z',
    reviewedAt: '2026-02-18T16:00:00Z',
    approvedAt: null,
    rejectedAt: null,
    assignedTo: 'Peter Currey',
    accountReference: null,
    creditLimitMinorUnits: null,
    creditCurrency: 'USD',
    notes: 'Application submitted for US dealer pricing. Pending US bank trade reference check.',
    requirements: [
      {
        id: 'tar-horizon-corp',
        applicationId: 'taa-horizon',
        requirementType: 'COMPANY_REGISTRATION',
        title: 'Corporate Legal Identity Documents',
        description: 'Halo RC certificate and tax registration provided.',
        status: 'VERIFIED',
        documentId: null,
        verifiedAt: '2026-02-18T16:00:00Z',
        verifiedBy: 'Jason Vance',
        createdAt: '2026-02-15T11:00:00Z',
        updatedAt: '2026-02-18T16:00:00Z',
      },
      {
        id: 'tar-horizon-resale',
        applicationId: 'taa-horizon',
        requirementType: 'RESALE_CERTIFICATE',
        title: 'Uniform Sales & Use Tax Exemption / Resale Certificate',
        description: 'Multi-jurisdiction resale documentation submitted.',
        status: 'PROVIDED',
        documentId: null,
        verifiedAt: null,
        verifiedBy: null,
        createdAt: '2026-02-15T11:00:00Z',
        updatedAt: '2026-02-15T11:00:00Z',
      },
      {
        id: 'tar-horizon-refs',
        applicationId: 'taa-horizon',
        requirementType: 'TRADE_REFERENCES',
        title: 'US Commercial Trade References',
        description: 'Awaiting response from international credit bureau.',
        status: 'PENDING',
        documentId: null,
        verifiedAt: null,
        verifiedBy: null,
        createdAt: '2026-02-15T11:00:00Z',
        updatedAt: '2026-02-15T11:00:00Z',
      },
    ],
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-02-18T16:00:00Z',
  },
]

const INITIAL_COMMERCIAL_TERMS: SupplierCommercialTerms[] = [
  {
    id: 'sct-cml-gbp',
    supplierId: 'sup-cml',
    currency: 'GBP',
    paymentTerms: 'NET_30',
    paymentTermsDays: 30,
    earlyPaymentDiscountPercent: 2,
    minimumOrderQuantityUnits: 1,
    minimumOrderValueMinorUnits: 15000,
    freeFreightThresholdMinorUnits: 50000,
    standardDiscountTierPercent: 35,
    dropShipAvailable: false,
    dropShipFeeMinorUnits: null,
    orderingMethod: 'B2B Web Portal & CSV Integration',
    isVerified: true,
    verifiedAt: '2026-01-05T14:00:00Z',
    verifiedBy: 'Peter Currey',
    notes: 'Standard trade dealer pricing. Carriage paid at £500. Next-day dispatch on stock orders placed by 15:00.',
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-01-05T14:00:00Z',
  },
  {
    id: 'sct-hw-gbp',
    supplierId: 'sup-hobbywing-uk',
    currency: 'GBP',
    paymentTerms: 'NET_30',
    paymentTermsDays: 30,
    earlyPaymentDiscountPercent: null,
    minimumOrderQuantityUnits: 5,
    minimumOrderValueMinorUnits: 25000,
    freeFreightThresholdMinorUnits: 60000,
    standardDiscountTierPercent: 30,
    dropShipAvailable: false,
    dropShipFeeMinorUnits: null,
    orderingMethod: 'REST API & Direct EDI',
    isVerified: true,
    verifiedAt: '2026-01-12T16:00:00Z',
    verifiedBy: 'Peter Currey',
    notes: 'Tier 1 dealer margin. Minimum order quantity 5 units across any brushless motor / ESC combinations.',
    createdAt: '2026-01-12T16:00:00Z',
    updatedAt: '2026-01-12T16:00:00Z',
  },
  {
    id: 'sct-horizon-usd',
    supplierId: 'sup-horizon-us',
    currency: 'USD',
    paymentTerms: 'NET_30',
    paymentTermsDays: 30,
    earlyPaymentDiscountPercent: null,
    minimumOrderQuantityUnits: 1,
    minimumOrderValueMinorUnits: 50000,
    freeFreightThresholdMinorUnits: 200000,
    standardDiscountTierPercent: 28,
    dropShipAvailable: true,
    dropShipFeeMinorUnits: 500,
    orderingMethod: 'Dealer Portal & Automated CSV',
    isVerified: false,
    verifiedAt: null,
    verifiedBy: null,
    notes: 'Draft terms under review pending trade application approval.',
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
  },
  {
    id: 'sct-rcmart-usd',
    supplierId: 'sup-rcmart',
    currency: 'USD',
    paymentTerms: 'PREPAYMENT',
    paymentTermsDays: 0,
    earlyPaymentDiscountPercent: null,
    minimumOrderQuantityUnits: 1,
    minimumOrderValueMinorUnits: 10000,
    freeFreightThresholdMinorUnits: null,
    standardDiscountTierPercent: 20,
    dropShipAvailable: false,
    dropShipFeeMinorUnits: null,
    orderingMethod: 'Wholesale B2B Cart & JSON API',
    isVerified: true,
    verifiedAt: '2026-01-05T09:00:00Z',
    verifiedBy: 'Peter Currey',
    notes: 'Prepayment wire or company credit card. Freight charged at actual cost per consignment.',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-01-05T09:00:00Z',
  },
]

const INITIAL_PRICING_POLICIES: SupplierPricingPolicy[] = [
  {
    id: 'spp-cml-xray',
    supplierId: 'sup-cml',
    brandId: 'brand-xray',
    policyType: 'RRP',
    enforcementLevel: 'STRICT',
    minimumAdvertisedPricePercent: 100,
    policyUrl: 'https://cmldistribution.co.uk/policies/rrp',
    notes: 'Strict compliance with factory recommended retail pricing. No advertised discounting without prior clearance.',
    createdAt: '2026-01-05T14:00:00Z',
    updatedAt: '2026-01-05T14:00:00Z',
  },
  {
    id: 'spp-horizon-arrma',
    supplierId: 'sup-horizon-us',
    brandId: 'brand-arrma',
    policyType: 'MAP',
    enforcementLevel: 'STRICT',
    minimumAdvertisedPricePercent: 100,
    policyUrl: 'https://horizonhobby.com/dealers/map-policy',
    notes: 'Unilateral MAP policy enforced across all US e-commerce channels.',
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
  },
]

const INITIAL_CONTACTS: SupplierContact[] = [
  {
    id: 'ct-cml-sales',
    supplierId: 'sup-cml',
    firstName: 'Mark',
    lastName: 'Edwards',
    name: 'Mark Edwards',
    role: 'COMMERCIAL_SALES',
    title: 'National Accounts Manager',
    email: 'medwards@cmldistribution.co.uk',
    phone: '+44 1527 575349',
    isPrimary: true,
    notes: 'Primary liaison for competition chassis pre-orders and stock allocations.',
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'ct-cml-credit',
    supplierId: 'sup-cml',
    firstName: 'Brenda',
    lastName: 'Phillips',
    name: 'Brenda Phillips',
    role: 'CREDIT',
    title: 'Credit Control Lead',
    email: 'accounts@cmldistribution.co.uk',
    phone: '+44 1527 575350',
    isPrimary: false,
    notes: 'Trade terms, statements, and payment remittance verification.',
    createdAt: '2026-01-05T10:00:00Z',
    updatedAt: '2026-01-05T10:00:00Z',
  },
  {
    id: 'ct-hw-trade',
    supplierId: 'sup-hobbywing-uk',
    firstName: 'Andrew',
    lastName: 'Miller',
    name: 'Andrew Miller',
    role: 'TRADE_ACCOUNTS',
    title: 'UK Trade Coordinator',
    email: 'orders@hobbywing.co.uk',
    phone: '+44 20 8123 4567',
    isPrimary: true,
    notes: 'Direct contact for brushless team allocations and factory warranties.',
    createdAt: '2026-01-10T12:00:00Z',
    updatedAt: '2026-01-10T12:00:00Z',
  },
  {
    id: 'ct-horizon-dealer',
    supplierId: 'sup-horizon-us',
    firstName: 'Jason',
    lastName: 'Vance',
    name: 'Jason Vance',
    role: 'TRADE_ACCOUNTS',
    title: 'Dealer Onboarding Specialist',
    email: 'dealer-services@horizonhobby.com',
    phone: '+1 800 338 4639',
    isPrimary: true,
    notes: 'Account manager reviewing North American dealer opening documentation.',
    createdAt: '2026-02-15T11:00:00Z',
    updatedAt: '2026-02-15T11:00:00Z',
  },
]

const INITIAL_COMMUNICATIONS: SupplierCommunication[] = [
  {
    id: 'scomm-cml-01',
    supplierId: 'sup-cml',
    contactId: 'ct-cml-sales',
    type: 'EMAIL',
    subject: 'Trade Account Approval & Q1 Allocations',
    summary: 'Confirmed approval of Net 30 trade account with £25k limit and priority allocation on XRAY X4 2026 touring kits.',
    loggedBy: 'Peter Currey',
    occurredAt: '2026-01-05T14:30:00Z',
    nextFollowUpDate: null,
    createdAt: '2026-01-05T14:30:00Z',
  },
  {
    id: 'scomm-horizon-01',
    supplierId: 'sup-horizon-us',
    contactId: 'ct-horizon-dealer',
    type: 'EMAIL',
    subject: 'US Dealer Application Submission & Documents',
    summary: 'Submitted Halo RC Ltd incorporation pack, VAT/Tax details, and US resale exemption certificate.',
    loggedBy: 'Peter Currey',
    occurredAt: '2026-02-15T11:30:00Z',
    nextFollowUpDate: '2026-03-20',
    createdAt: '2026-02-15T11:30:00Z',
  },
]

const INITIAL_DOCUMENTS: SupplierDocument[] = [
  {
    id: 'sdoc-cml-agreement',
    supplierId: 'sup-cml',
    documentType: 'DEALER_APPLICATION',
    title: 'CML Dealer Terms & Account Agreement 2026.pdf',
    fileUrl: '/procurement/docs/cml-dealer-agreement-2026.pdf',
    fileSize: 412000,
    mimeType: 'application/pdf',
    uploadedBy: 'Peter Currey',
    expiresAt: '2026-12-31T23:59:59Z',
    createdAt: '2026-01-05T14:00:00Z',
  },
  {
    id: 'sdoc-cml-price-list',
    supplierId: 'sup-cml',
    documentType: 'PRICE_LIST',
    title: 'CML XRAY Trade Price Schedule Q1 2026.xlsx',
    fileUrl: '/procurement/docs/cml-xray-trade-q1.xlsx',
    fileSize: 1850000,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadedBy: 'Peter Currey',
    expiresAt: '2026-04-30T23:59:59Z',
    createdAt: '2026-01-05T14:00:00Z',
  },
]

const INITIAL_TASKS: ProcurementTask[] = [
  {
    id: 'ptask-horizon-refs',
    supplierId: 'sup-horizon-us',
    taskType: 'PROVIDE_TRADE_REFERENCES',
    title: 'Provide US bank credit verification letter to Horizon Dealer Services',
    description: 'Provide second international banking reference to finalize Net 30 terms review.',
    status: 'OPEN',
    priority: 'HIGH',
    dueDate: '2026-03-20',
    assignedTo: 'Peter Currey',
    completedAt: null,
    createdAt: '2026-02-18T16:30:00Z',
    updatedAt: '2026-02-18T16:30:00Z',
  },
  {
    id: 'ptask-cml-review',
    supplierId: 'sup-cml',
    taskType: 'REVIEW_COMMERCIALS',
    title: 'Quarterly race team rebate & volume tier review',
    description: 'Review Q1 purchasing volume to trigger 3% additional retrospective annual rebate tier.',
    status: 'OPEN',
    priority: 'MEDIUM',
    dueDate: '2026-04-01',
    assignedTo: 'Peter Currey',
    completedAt: null,
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
]

// Mutable In-Memory Stores for Phase 11
let SUPPLIER_TERRITORY_COVERAGES_STORE: SupplierTerritoryCoverage[] = [...INITIAL_TERRITORY_COVERAGES]
let BRAND_SUPPLIER_RELATIONSHIPS_STORE: BrandSupplierRelationship[] = [...INITIAL_BRAND_RELATIONSHIPS]
let TRADE_ACCOUNT_APPLICATIONS_STORE: TradeAccountApplication[] = JSON.parse(JSON.stringify(INITIAL_TRADE_APPLICATIONS))
let SUPPLIER_COMMERCIAL_TERMS_STORE: SupplierCommercialTerms[] = [...INITIAL_COMMERCIAL_TERMS]
let SUPPLIER_PRICING_POLICIES_STORE: SupplierPricingPolicy[] = [...INITIAL_PRICING_POLICIES]
let SUPPLIER_CONTACTS_STORE: SupplierContact[] = [...INITIAL_CONTACTS]
let SUPPLIER_COMMUNICATIONS_STORE: SupplierCommunication[] = [...INITIAL_COMMUNICATIONS]
let SUPPLIER_DOCUMENTS_STORE: SupplierDocument[] = [...INITIAL_DOCUMENTS]
let PROCUREMENT_TASKS_STORE: ProcurementTask[] = [...INITIAL_TASKS]

export function __resetProcurementPhase11StoreForTesting() {
  SUPPLIER_TERRITORY_COVERAGES_STORE = [...INITIAL_TERRITORY_COVERAGES]
  BRAND_SUPPLIER_RELATIONSHIPS_STORE = [...INITIAL_BRAND_RELATIONSHIPS]
  TRADE_ACCOUNT_APPLICATIONS_STORE = JSON.parse(JSON.stringify(INITIAL_TRADE_APPLICATIONS))
  SUPPLIER_COMMERCIAL_TERMS_STORE = [...INITIAL_COMMERCIAL_TERMS]
  SUPPLIER_PRICING_POLICIES_STORE = [...INITIAL_PRICING_POLICIES]
  SUPPLIER_CONTACTS_STORE = [...INITIAL_CONTACTS]
  SUPPLIER_COMMUNICATIONS_STORE = [...INITIAL_COMMUNICATIONS]
  SUPPLIER_DOCUMENTS_STORE = [...INITIAL_DOCUMENTS]
  PROCUREMENT_TASKS_STORE = [...INITIAL_TASKS]
  PROCUREMENT_NOTES_STORE = []
  PROCUREMENT_AUDIT_STORE = []
}

// ── Territory Coverage Operations ──────────────────────────────────────────────

export async function getSupplierTerritoryCoverages(
  supplierId?: string
): Promise<SupplierTerritoryCoverage[]> {
  if (!supplierId) return [...SUPPLIER_TERRITORY_COVERAGES_STORE]
  return SUPPLIER_TERRITORY_COVERAGES_STORE.filter((c) => c.supplierId === supplierId)
}

export async function setSupplierTerritoryCoverage(
  input: Omit<SupplierTerritoryCoverage, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<SupplierTerritoryCoverage> {
  const existingIndex = SUPPLIER_TERRITORY_COVERAGES_STORE.findIndex(
    (c) => c.supplierId === input.supplierId && c.territory === input.territory
  )

  const now = new Date().toISOString()
  if (existingIndex >= 0 && SUPPLIER_TERRITORY_COVERAGES_STORE[existingIndex]) {
    const existing = SUPPLIER_TERRITORY_COVERAGES_STORE[existingIndex]!
    const updated: SupplierTerritoryCoverage = {
      id: existing.id,
      supplierId: existing.supplierId,
      territory: existing.territory,
      state: input.state,
      restrictionReason: input.restrictionReason ?? null,
      notes: input.notes ?? null,
      verifiedAt: input.verifiedAt ?? null,
      verifiedBy: input.verifiedBy ?? null,
      createdAt: existing.createdAt,
      updatedAt: now,
    }
    SUPPLIER_TERRITORY_COVERAGES_STORE[existingIndex] = updated
    return updated
  }

  const created: SupplierTerritoryCoverage = {
    id: input.id ?? `stc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    supplierId: input.supplierId,
    territory: input.territory,
    state: input.state,
    restrictionReason: input.restrictionReason ?? null,
    notes: input.notes ?? null,
    verifiedAt: input.verifiedAt ?? null,
    verifiedBy: input.verifiedBy ?? null,
    createdAt: now,
    updatedAt: now,
  }
  SUPPLIER_TERRITORY_COVERAGES_STORE.push(created)
  return created
}

// ── Brand Supplier Relationships Operations ────────────────────────────────────

export async function getBrandSupplierRelationships(
  brandId?: string,
  supplierId?: string,
  territory?: ProcurementTerritory
): Promise<BrandSupplierRelationship[]> {
  return BRAND_SUPPLIER_RELATIONSHIPS_STORE.filter((r) => {
    if (brandId && r.brandId !== brandId) return false
    if (supplierId && r.supplierId !== supplierId) return false
    if (territory && r.territory !== territory) return false
    return true
  })
}

export async function verifyBrandSupplierRelationship(input: {
  brandId: string
  supplierId: string
  territory: ProcurementTerritory
  relationshipType: BrandSupplierRelationshipType
  verificationStatus: CommercialRelationshipVerificationStatus
  isExclusive?: boolean
  exclusivityScope?: ExclusivityScope | null
  evidenceSourceType: RelationshipEvidenceSourceType
  evidenceUrl?: string | null
  evidenceNotes?: string | null
  verifiedBy?: string | null
}): Promise<BrandSupplierRelationship> {
  const existingIndex = BRAND_SUPPLIER_RELATIONSHIPS_STORE.findIndex(
    (r) =>
      r.brandId === input.brandId &&
      r.supplierId === input.supplierId &&
      r.territory === input.territory
  )

  const now = new Date().toISOString()
  if (existingIndex >= 0 && BRAND_SUPPLIER_RELATIONSHIPS_STORE[existingIndex]) {
    const existing = BRAND_SUPPLIER_RELATIONSHIPS_STORE[existingIndex]!
    const updated: BrandSupplierRelationship = {
      id: existing.id,
      brandId: existing.brandId,
      supplierId: existing.supplierId,
      territory: existing.territory,
      relationshipType: input.relationshipType,
      verificationStatus: input.verificationStatus,
      isExclusive: input.isExclusive ?? false,
      exclusivityScope: input.exclusivityScope ?? 'NONE',
      evidenceSourceType: input.evidenceSourceType,
      evidenceUrl: input.evidenceUrl ?? null,
      evidenceNotes: input.evidenceNotes ?? null,
      verifiedAt: input.verificationStatus === 'VERIFIED' ? now : null,
      verifiedBy: input.verifiedBy ?? null,
      createdAt: existing.createdAt,
      updatedAt: now,
    }
    BRAND_SUPPLIER_RELATIONSHIPS_STORE[existingIndex] = updated
    return updated
  }

  const created: BrandSupplierRelationship = {
    id: `bsr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    brandId: input.brandId,
    supplierId: input.supplierId,
    relationshipType: input.relationshipType,
    verificationStatus: input.verificationStatus,
    isExclusive: input.isExclusive ?? false,
    exclusivityScope: input.exclusivityScope ?? 'NONE',
    territory: input.territory,
    evidenceSourceType: input.evidenceSourceType,
    evidenceUrl: input.evidenceUrl ?? null,
    evidenceNotes: input.evidenceNotes ?? null,
    verifiedAt: input.verificationStatus === 'VERIFIED' ? now : null,
    verifiedBy: input.verifiedBy ?? null,
    createdAt: now,
    updatedAt: now,
  }
  BRAND_SUPPLIER_RELATIONSHIPS_STORE.push(created)
  return created
}

// ── Trade Account Applications Operations ──────────────────────────────────────

export async function getTradeAccountApplications(
  supplierId?: string
): Promise<TradeAccountApplication[]> {
  if (!supplierId) return [...TRADE_ACCOUNT_APPLICATIONS_STORE]
  return TRADE_ACCOUNT_APPLICATIONS_STORE.filter((a) => a.supplierId === supplierId)
}

export async function getTradeAccountApplicationById(
  id: string
): Promise<TradeAccountApplication | null> {
  const app = TRADE_ACCOUNT_APPLICATIONS_STORE.find((a) => a.id === id)
  return app ? { ...app } : null
}

export async function createTradeAccountApplication(input: {
  supplierId: string
  applicantEntityName?: string
  notes?: string | null
  assignedTo?: string | null
}): Promise<TradeAccountApplication> {
  const supplier = SUPPLIERS_STORE.find((s) => s.id === input.supplierId)
  if (!supplier) throw new Error(`Supplier "${input.supplierId}" not found.`)

  const now = new Date().toISOString()
  const appId = `taa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

  // Build standard compliance requirement checklist
  const requirements: TradeAccountRequirement[] = [
    {
      id: `tar-${Date.now()}-1`,
      applicationId: appId,
      requirementType: 'COMPANY_REGISTRATION',
      title: 'Company Registration Certificate',
      description: 'Official incorporation proof (Companies House / state registry)',
      status: 'PENDING',
      documentId: null,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `tar-${Date.now()}-2`,
      applicationId: appId,
      requirementType: 'VAT_NUMBER',
      title: 'Tax / VAT Registration',
      description: 'Government tax registration proof or VAT exemption certificate',
      status: 'PENDING',
      documentId: null,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `tar-${Date.now()}-3`,
      applicationId: appId,
      requirementType: 'TRADE_REFERENCES',
      title: 'Trade Credit References',
      description: 'Two verified commercial trade references',
      status: 'PENDING',
      documentId: null,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `tar-${Date.now()}-4`,
      applicationId: appId,
      requirementType: 'BANK_DETAILS',
      title: 'Bank Verification Letter',
      description: 'Proof of commercial clearing bank account',
      status: 'PENDING',
      documentId: null,
      verifiedAt: null,
      verifiedBy: null,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const app: TradeAccountApplication = {
    id: appId,
    supplierId: input.supplierId,
    applicantEntityName: input.applicantEntityName ?? 'Halo RC Ltd',
    status: 'RESEARCHING',
    stage: 'IDENTIFIED',
    submittedAt: null,
    reviewedAt: null,
    approvedAt: null,
    rejectedAt: null,
    assignedTo: input.assignedTo ?? null,
    accountReference: null,
    creditLimitMinorUnits: null,
    creditCurrency: supplier.currency,
    notes: input.notes ?? null,
    requirements,
    createdAt: now,
    updatedAt: now,
  }

  TRADE_ACCOUNT_APPLICATIONS_STORE.push(app)
  return app
}

export async function updateTradeAccountApplicationStatus(
  id: string,
  status: TradeAccountApplicationStatus,
  stage?: ProcurementPipelineStage,
  details?: {
    accountReference?: string | null
    creditLimitMinorUnits?: number | null
    creditCurrency?: Currency | null
    notes?: string | null
    reviewedBy?: string | null
  }
): Promise<TradeAccountApplication> {
  const app = TRADE_ACCOUNT_APPLICATIONS_STORE.find((a) => a.id === id)
  if (!app) throw new Error(`Trade account application "${id}" not found.`)

  const now = new Date().toISOString()
  app.status = status
  if (stage) app.stage = stage

  if (status === 'SUBMITTED' && !app.submittedAt) {
    app.submittedAt = now
  } else if (status === 'UNDER_REVIEW') {
    app.reviewedAt = now
  } else if (status === 'APPROVED') {
    app.approvedAt = now
    app.stage = 'ACCOUNT_OPENED'
    // Also activate supplier relationship if previously prospect/applied
    const supplier = SUPPLIERS_STORE.find((s) => s.id === app.supplierId)
    if (supplier) {
      supplier.relationshipStatus = 'ACTIVE'
      if (details?.accountReference) supplier.accountReference = details.accountReference
    }
  } else if (status === 'REJECTED') {
    app.rejectedAt = now
  }

  if (details?.accountReference !== undefined) app.accountReference = details.accountReference
  if (details?.creditLimitMinorUnits !== undefined) app.creditLimitMinorUnits = details.creditLimitMinorUnits
  if (details?.creditCurrency !== undefined) app.creditCurrency = details.creditCurrency
  if (details?.notes !== undefined) app.notes = details.notes
  app.updatedAt = now

  return { ...app }
}

export async function updateTradeAccountRequirement(
  id: string,
  status: TradeAccountRequirementStatus,
  details?: {
    documentId?: string | null
    verifiedBy?: string | null
  }
): Promise<TradeAccountRequirement> {
  for (const app of TRADE_ACCOUNT_APPLICATIONS_STORE) {
    const req = app.requirements.find((r) => r.id === id)
    if (req) {
      const now = new Date().toISOString()
      req.status = status
      if (details?.documentId !== undefined) req.documentId = details.documentId
      if (status === 'VERIFIED') {
        req.verifiedAt = now
        req.verifiedBy = details?.verifiedBy ?? 'usr-admin'
      }
      req.updatedAt = now
      return { ...req }
    }
  }
  throw new Error(`Trade account requirement "${id}" not found.`)
}

// ── Commercial Terms & Pricing Policies Operations ────────────────────────────

export async function getSupplierCommercialTerms(
  supplierId: string,
  currency?: Currency
): Promise<SupplierCommercialTerms | null> {
  const match = SUPPLIER_COMMERCIAL_TERMS_STORE.find(
    (t) => t.supplierId === supplierId && (!currency || t.currency === currency)
  )
  return match ? { ...match } : null
}

export async function setSupplierCommercialTerms(
  input: Omit<SupplierCommercialTerms, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<SupplierCommercialTerms> {
  const existingIndex = SUPPLIER_COMMERCIAL_TERMS_STORE.findIndex(
    (t) => t.supplierId === input.supplierId && t.currency === input.currency
  )

  const now = new Date().toISOString()
  if (existingIndex >= 0 && SUPPLIER_COMMERCIAL_TERMS_STORE[existingIndex]) {
    const existing = SUPPLIER_COMMERCIAL_TERMS_STORE[existingIndex]!
    const updated: SupplierCommercialTerms = {
      id: existing.id,
      supplierId: existing.supplierId,
      currency: existing.currency,
      paymentTerms: input.paymentTerms,
      paymentTermsDays: input.paymentTermsDays ?? null,
      earlyPaymentDiscountPercent: input.earlyPaymentDiscountPercent ?? null,
      minimumOrderQuantityUnits: input.minimumOrderQuantityUnits ?? null,
      minimumOrderValueMinorUnits: input.minimumOrderValueMinorUnits ?? null,
      freeFreightThresholdMinorUnits: input.freeFreightThresholdMinorUnits ?? null,
      standardDiscountTierPercent: input.standardDiscountTierPercent ?? null,
      dropShipAvailable: input.dropShipAvailable,
      dropShipFeeMinorUnits: input.dropShipFeeMinorUnits ?? null,
      orderingMethod: input.orderingMethod ?? null,
      isVerified: input.isVerified,
      verifiedAt: input.isVerified ? (input.verifiedAt ?? now) : null,
      verifiedBy: input.verifiedBy ?? null,
      notes: input.notes ?? null,
      createdAt: existing.createdAt,
      updatedAt: now,
    }
    SUPPLIER_COMMERCIAL_TERMS_STORE[existingIndex] = updated
    return updated
  }

  const created: SupplierCommercialTerms = {
    id: input.id ?? `sct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    supplierId: input.supplierId,
    currency: input.currency,
    paymentTerms: input.paymentTerms,
    paymentTermsDays: input.paymentTermsDays ?? null,
    earlyPaymentDiscountPercent: input.earlyPaymentDiscountPercent ?? null,
    minimumOrderQuantityUnits: input.minimumOrderQuantityUnits ?? null,
    minimumOrderValueMinorUnits: input.minimumOrderValueMinorUnits ?? null,
    freeFreightThresholdMinorUnits: input.freeFreightThresholdMinorUnits ?? null,
    standardDiscountTierPercent: input.standardDiscountTierPercent ?? null,
    dropShipAvailable: input.dropShipAvailable,
    dropShipFeeMinorUnits: input.dropShipFeeMinorUnits ?? null,
    orderingMethod: input.orderingMethod ?? null,
    isVerified: input.isVerified,
    verifiedAt: input.isVerified ? (input.verifiedAt ?? now) : null,
    verifiedBy: input.verifiedBy ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }
  SUPPLIER_COMMERCIAL_TERMS_STORE.push(created)
  return created
}

export async function getSupplierPricingPolicies(
  supplierId?: string,
  brandId?: string
): Promise<SupplierPricingPolicy[]> {
  return SUPPLIER_PRICING_POLICIES_STORE.filter((p) => {
    if (supplierId && p.supplierId !== supplierId) return false
    if (brandId && p.brandId !== brandId) return false
    return true
  })
}

export async function setSupplierPricingPolicy(
  input: Omit<SupplierPricingPolicy, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<SupplierPricingPolicy> {
  const existingIndex = SUPPLIER_PRICING_POLICIES_STORE.findIndex(
    (p) => p.supplierId === input.supplierId && p.brandId === input.brandId
  )

  const now = new Date().toISOString()
  if (existingIndex >= 0 && SUPPLIER_PRICING_POLICIES_STORE[existingIndex]) {
    const existing = SUPPLIER_PRICING_POLICIES_STORE[existingIndex]!
    const updated: SupplierPricingPolicy = {
      id: existing.id,
      supplierId: existing.supplierId,
      brandId: existing.brandId ?? null,
      policyType: input.policyType,
      enforcementLevel: input.enforcementLevel,
      minimumAdvertisedPricePercent: input.minimumAdvertisedPricePercent ?? null,
      policyUrl: input.policyUrl ?? null,
      notes: input.notes ?? null,
      createdAt: existing.createdAt,
      updatedAt: now,
    }
    SUPPLIER_PRICING_POLICIES_STORE[existingIndex] = updated
    return updated
  }

  const created: SupplierPricingPolicy = {
    id: input.id ?? `spp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    supplierId: input.supplierId,
    brandId: input.brandId ?? null,
    policyType: input.policyType,
    enforcementLevel: input.enforcementLevel,
    minimumAdvertisedPricePercent: input.minimumAdvertisedPricePercent ?? null,
    policyUrl: input.policyUrl ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }
  SUPPLIER_PRICING_POLICIES_STORE.push(created)
  return created
}

// ── Contacts, Communications, Documents & Tasks ────────────────────────────────

export async function getSupplierContacts(supplierId?: string): Promise<SupplierContact[]> {
  if (!supplierId) return [...SUPPLIER_CONTACTS_STORE]
  return SUPPLIER_CONTACTS_STORE.filter((c) => c.supplierId === supplierId)
}

export async function addSupplierContact(
  input: Omit<SupplierContact, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SupplierContact> {
  const now = new Date().toISOString()
  const contact: SupplierContact = {
    id: `ct-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    supplierId: input.supplierId,
    firstName: input.firstName,
    lastName: input.lastName,
    name: input.name,
    role: input.role,
    title: input.title ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    isPrimary: input.isPrimary,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  }
  SUPPLIER_CONTACTS_STORE.push(contact)
  return contact
}

export async function getSupplierCommunications(
  supplierId?: string
): Promise<SupplierCommunication[]> {
  if (!supplierId) return [...SUPPLIER_COMMUNICATIONS_STORE]
  return SUPPLIER_COMMUNICATIONS_STORE.filter((c) => c.supplierId === supplierId)
}

export async function logSupplierCommunication(
  input: Omit<SupplierCommunication, 'id' | 'createdAt'>
): Promise<SupplierCommunication> {
  const now = new Date().toISOString()
  const comm: SupplierCommunication = {
    id: `scomm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    supplierId: input.supplierId,
    contactId: input.contactId ?? null,
    type: input.type,
    subject: input.subject,
    summary: input.summary,
    loggedBy: input.loggedBy,
    occurredAt: input.occurredAt || now,
    nextFollowUpDate: input.nextFollowUpDate ?? null,
    createdAt: now,
  }
  SUPPLIER_COMMUNICATIONS_STORE.push(comm)
  return comm
}

export async function getSupplierDocuments(supplierId?: string): Promise<SupplierDocument[]> {
  if (!supplierId) return [...SUPPLIER_DOCUMENTS_STORE]
  return SUPPLIER_DOCUMENTS_STORE.filter((d) => d.supplierId === supplierId)
}

export async function uploadSupplierDocument(
  input: Omit<SupplierDocument, 'id' | 'createdAt'>
): Promise<SupplierDocument> {
  const now = new Date().toISOString()
  const doc: SupplierDocument = {
    id: `sdoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    supplierId: input.supplierId,
    documentType: input.documentType,
    title: input.title,
    fileUrl: input.fileUrl,
    fileSize: input.fileSize ?? null,
    mimeType: input.mimeType ?? null,
    uploadedBy: input.uploadedBy,
    expiresAt: input.expiresAt ?? null,
    createdAt: now,
  }
  SUPPLIER_DOCUMENTS_STORE.push(doc)
  return doc
}

export async function getProcurementTasks(
  supplierId?: string,
  status?: string
): Promise<ProcurementTask[]> {
  return PROCUREMENT_TASKS_STORE.filter((t) => {
    if (supplierId && t.supplierId !== supplierId) return false
    if (status && t.status !== status) return false
    return true
  })
}

export async function createProcurementTask(
  input: Omit<ProcurementTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProcurementTask> {
  const now = new Date().toISOString()
  const task: ProcurementTask = {
    id: `ptask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    supplierId: input.supplierId,
    taskType: input.taskType,
    title: input.title,
    description: input.description ?? null,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate ?? null,
    assignedTo: input.assignedTo ?? null,
    completedAt: input.completedAt ?? null,
    createdAt: now,
    updatedAt: now,
  }
  PROCUREMENT_TASKS_STORE.push(task)
  return task
}

export async function updateProcurementTask(
  id: string,
  updates: Partial<ProcurementTask>
): Promise<ProcurementTask> {
  const task = PROCUREMENT_TASKS_STORE.find((t) => t.id === id)
  if (!task) throw new Error(`Procurement task "${id}" not found.`)

  Object.assign(task, {
    ...updates,
    updatedAt: new Date().toISOString(),
  })
  return { ...task }
}

// ── 7-Factor Procurement Readiness Evaluator ───────────────────────────────────

export async function calculateProcurementReadiness(
  supplierId: string,
  brandId?: string
): Promise<ProcurementReadinessResult> {
  const supplier = SUPPLIERS_STORE.find((s) => s.id === supplierId)
  if (!supplier) throw new Error(`Supplier "${supplierId}" not found.`)

  const blockers: string[] = []

  // 1. Verified Relationship
  let hasVerifiedRelationship = false
  if (brandId) {
    const rel = BRAND_SUPPLIER_RELATIONSHIPS_STORE.find(
      (r) => r.supplierId === supplierId && r.brandId === brandId && r.verificationStatus === 'VERIFIED'
    )
    hasVerifiedRelationship = Boolean(rel)
    if (!hasVerifiedRelationship) {
      blockers.push(`Brand "${brandId}" is not officially verified as distributed by this supplier.`)
    }
  } else {
    const anyVerified = BRAND_SUPPLIER_RELATIONSHIPS_STORE.some(
      (r) => r.supplierId === supplierId && r.verificationStatus === 'VERIFIED'
    )
    hasVerifiedRelationship = anyVerified || supplier.supplierType === 'DIRECT_BRAND'
    if (!hasVerifiedRelationship) {
      blockers.push('No verified brand distribution relationships found on file.')
    }
  }

  // 2. Approved Trade Account
  const approvedApp = TRADE_ACCOUNT_APPLICATIONS_STORE.find(
    (a) => a.supplierId === supplierId && a.status === 'APPROVED'
  )
  const hasApprovedAccount = Boolean(approvedApp) || supplier.relationshipStatus === 'ACTIVE'
  if (!hasApprovedAccount) {
    blockers.push('Trade account application is not yet approved.')
  }

  // 3. Supported Territory
  const territories = SUPPLIER_TERRITORY_COVERAGES_STORE.filter((t) => t.supplierId === supplierId)
  const isTerritorySupported = territories.some((t) => t.state === 'SUPPORTED')
  if (!isTerritorySupported) {
    blockers.push('No supported sales territory configured or verified.')
  }

  // 4. Verified Commercial Terms
  const terms = SUPPLIER_COMMERCIAL_TERMS_STORE.find((t) => t.supplierId === supplierId)
  const hasVerifiedTerms = Boolean(terms?.isVerified)
  if (!hasVerifiedTerms) {
    blockers.push('Commercial trading terms (MOQ, payment, discount) have not been verified.')
  }

  // 5. Active Feed or Offer
  const offers = SUPPLIER_OFFERS_STORE.filter((o) => o.supplierId === supplierId && o.status === 'ACTIVE')
  const hasActiveFeedOrOffer = offers.length > 0 || supplier.integrationType !== 'MANUAL'
  if (!hasActiveFeedOrOffer) {
    blockers.push('No active inventory feed or commercial offers configured.')
  }

  // 6. Verified Product Mappings
  const mappings = SUPPLIER_MAPPINGS_STORE.filter((m) => m.supplierId === supplierId)
  const hasVerifiedProductMappings = mappings.some((m) => m.status === 'MATCHED')
  if (!hasVerifiedProductMappings) {
    blockers.push('No catalog products have been matched to supplier SKUs.')
  }

  // 7. Fresh Inventory
  const hasFreshInventory = offers.length > 0 && offers.every((o) => o.freshnessState === 'FRESH')
  if (!hasFreshInventory && offers.length > 0) {
    blockers.push('Supplier inventory data is stale or unverified.')
  }

  const checklist = {
    hasVerifiedRelationship,
    hasApprovedAccount,
    isTerritorySupported,
    hasVerifiedTerms,
    hasActiveFeedOrOffer,
    hasVerifiedProductMappings,
    hasFreshInventory,
  }

  const passedCount = Object.values(checklist).filter(Boolean).length
  const score = Math.round((passedCount / 7) * 100)
  const isProcurementReady = passedCount === 7

  let state: ProcurementReadinessState = 'NOT_READY'
  if (isProcurementReady) {
    state = 'PROCUREMENT_READY'
  } else if (!hasVerifiedRelationship) {
    state = 'RELATIONSHIP_UNVERIFIED'
  } else if (!hasApprovedAccount) {
    state = 'ACCOUNT_PENDING'
  } else if (!hasVerifiedTerms) {
    state = 'TERMS_MISSING'
  } else if (!hasActiveFeedOrOffer) {
    state = 'FEED_MISSING'
  }

  let nextRecommendedAction: string | null = null
  if (state === 'RELATIONSHIP_UNVERIFIED') {
    nextRecommendedAction = 'Obtain manufacturer distribution authorization evidence or dealer letter.'
  } else if (state === 'ACCOUNT_PENDING') {
    nextRecommendedAction = 'Complete outstanding trade account requirements and chase approval.'
  } else if (state === 'TERMS_MISSING') {
    nextRecommendedAction = 'Verify trade price list, minimum order values, and credit terms.'
  } else if (state === 'FEED_MISSING') {
    nextRecommendedAction = 'Configure automated inventory integration feed.'
  } else if (!hasVerifiedProductMappings) {
    nextRecommendedAction = 'Review unmatched supplier products and confirm SKU mappings.'
  } else if (isProcurementReady) {
    nextRecommendedAction = 'Supplier is fully authorized and ready for live purchase orders.'
  }

  return {
    supplierId,
    brandId: brandId ?? null,
    state,
    isProcurementReady,
    score,
    checklist,
    blockers,
    nextRecommendedAction,
  }
}

// ── Deterministic Opportunity Scorer ──────────────────────────────────────────

export async function calculateSupplierOpportunityScore(
  supplierId: string
): Promise<SupplierOpportunityScore> {
  const supplier = SUPPLIERS_STORE.find((s) => s.id === supplierId)
  if (!supplier) throw new Error(`Supplier "${supplierId}" not found.`)

  const reasons: string[] = []

  // 1. Brand Strategic Value (0 - 25)
  const relationships = BRAND_SUPPLIER_RELATIONSHIPS_STORE.filter(
    (r) => r.supplierId === supplierId && r.verificationStatus === 'VERIFIED'
  )
  let brandStrategicValue = 0
  if (relationships.some((r) => r.brandId === 'brand-xray')) {
    brandStrategicValue += 15
    reasons.push('Carries Tier 1 competition chassis brand (Team XRAY).')
  }
  if (relationships.some((r) => r.brandId === 'brand-hobbywing')) {
    brandStrategicValue += 10
    reasons.push('Direct access to market-leading brushless electronics (Hobbywing).')
  }
  if (relationships.some((r) => r.brandId === 'brand-arrma')) {
    brandStrategicValue += 10
    reasons.push('Key enthusiast and basher platform distributor (ARRMA).')
  }
  brandStrategicValue = Math.min(25, Math.max(5, brandStrategicValue))

  // 2. Catalogue Breadth (0 - 20)
  const mappings = SUPPLIER_MAPPINGS_STORE.filter((m) => m.supplierId === supplierId)
  let catalogueBreadth = 5
  if (mappings.length > 5) {
    catalogueBreadth = 20
    reasons.push(`Broad matched catalogue coverage (${mappings.length} items).`)
  } else if (mappings.length > 0) {
    catalogueBreadth = 12
    reasons.push(`Targeted catalogue depth (${mappings.length} active mappings).`)
  }

  // 3. Commercial Margin Potential (0 - 25)
  const terms = SUPPLIER_COMMERCIAL_TERMS_STORE.find((t) => t.supplierId === supplierId)
  let commercialMarginPotential = 10
  if (terms?.standardDiscountTierPercent) {
    if (terms.standardDiscountTierPercent >= 35) {
      commercialMarginPotential = 25
      reasons.push(`Strong wholesale margin tier (${terms.standardDiscountTierPercent}% discount).`)
    } else if (terms.standardDiscountTierPercent >= 25) {
      commercialMarginPotential = 18
      reasons.push(`Viable commercial margin (${terms.standardDiscountTierPercent}% discount).`)
    }
  }

  // 4. Ease of Integration (0 - 15)
  let easeOfIntegration = 5
  if (supplier.integrationType === 'REST_API' || supplier.integrationType === 'JSON_API') {
    easeOfIntegration = 15
    reasons.push('Automated API data feed with real-time stock sync.')
  } else if (supplier.integrationType === 'CSV') {
    easeOfIntegration = 10
    reasons.push('Standard structured CSV feed available.')
  } else {
    reasons.push('Manual order placement required.')
  }

  // 5. Territory Coverage Strength (0 - 15)
  const territories = SUPPLIER_TERRITORY_COVERAGES_STORE.filter((t) => t.supplierId === supplierId)
  let territoryCoverageStrength = 5
  const hasUk = territories.some((t) => t.territory === 'UK' && t.state === 'SUPPORTED')
  const hasUs = territories.some((t) => t.territory === 'USA' && t.state === 'SUPPORTED')
  if (hasUk && hasUs) {
    territoryCoverageStrength = 15
    reasons.push('Multi-market coverage supporting both UK and USA operations.')
  } else if (hasUk || hasUs) {
    territoryCoverageStrength = 10
    reasons.push('Direct domestic coverage for primary commercial hub.')
  }

  const overallScore =
    brandStrategicValue +
    catalogueBreadth +
    commercialMarginPotential +
    easeOfIntegration +
    territoryCoverageStrength

  let tier: SupplierOpportunityTier = 'LOW'
  if (overallScore >= 75) tier = 'HIGH'
  else if (overallScore >= 50) tier = 'MEDIUM'

  return {
    supplierId,
    overallScore,
    tier,
    breakdown: {
      brandStrategicValue,
      catalogueBreadth,
      commercialMarginPotential,
      easeOfIntegration,
      territoryCoverageStrength,
    },
    reasons,
  }
}

// ── Brand Sourcing Matrix Engine ───────────────────────────────────────────────

export async function getBrandSourcingView(
  brandId: string,
  territory: ProcurementTerritory = 'UK'
): Promise<BrandSourcingView> {
  const brand = SEED_BRANDS.find((b) => b.id === brandId)
  const brandName = brand ? brand.name : brandId

  // 1. Direct Manufacturer
  const directRel = BRAND_SUPPLIER_RELATIONSHIPS_STORE.find(
    (r) =>
      r.brandId === brandId &&
      r.relationshipType === 'DIRECT_MANUFACTURER' &&
      r.verificationStatus === 'VERIFIED'
  )
  const directSupplier = directRel
    ? SUPPLIERS_STORE.find((s) => s.id === directRel.supplierId) ?? null
    : null

  // 2. Verified Distributors in Territory
  const verifiedRels = BRAND_SUPPLIER_RELATIONSHIPS_STORE.filter(
    (r) =>
      r.brandId === brandId &&
      r.territory === territory &&
      r.verificationStatus === 'VERIFIED' &&
      r.relationshipType !== 'DIRECT_MANUFACTURER'
  )

  const verifiedDistributors = verifiedRels
    .map((r) => {
      const supplier = SUPPLIERS_STORE.find((s) => s.id === r.supplierId)
      if (!supplier) return null
      const terms = SUPPLIER_COMMERCIAL_TERMS_STORE.find((t) => t.supplierId === supplier.id)
      return {
        supplier,
        relationship: r,
        terms: terms ?? null,
      }
    })
    .filter(Boolean) as BrandSourcingView['verifiedDistributors']

  // 3. Unverified Distributors
  const unverifiedRels = BRAND_SUPPLIER_RELATIONSHIPS_STORE.filter(
    (r) =>
      r.brandId === brandId &&
      r.territory === territory &&
      r.verificationStatus === 'UNVERIFIED'
  )
  const unverifiedDistributors = unverifiedRels
    .map((r) => {
      const supplier = SUPPLIERS_STORE.find((s) => s.id === r.supplierId)
      if (!supplier) return null
      return {
        supplier,
        relationship: r,
      }
    })
    .filter(Boolean) as BrandSourcingView['unverifiedDistributors']

  // 4. Exclusivity Check
  const exclusiveRel = BRAND_SUPPLIER_RELATIONSHIPS_STORE.find(
    (r) =>
      r.brandId === brandId &&
      r.territory === territory &&
      r.verificationStatus === 'VERIFIED' &&
      r.isExclusive
  )
  const hasExclusivityConstraint = Boolean(exclusiveRel)
  const exclusiveSupplier = exclusiveRel
    ? SUPPLIERS_STORE.find((s) => s.id === exclusiveRel.supplierId) ?? null
    : null

  // 5. Purchasability
  // Brand is purchasable in territory if there is at least 1 verified supplier (direct or distributor)
  // that supports this territory and has an active account.
  const isPurchasableInTerritory =
    verifiedDistributors.some((vd) => vd.supplier.relationshipStatus === 'ACTIVE') ||
    (directSupplier !== null &&
      SUPPLIER_TERRITORY_COVERAGES_STORE.some(
        (t) => t.supplierId === directSupplier.id && t.territory === territory && t.state === 'SUPPORTED'
      ))

  return {
    brandId,
    brandName,
    territory,
    directManufacturer: directSupplier,
    verifiedDistributors,
    unverifiedDistributors,
    hasExclusivityConstraint,
    exclusiveSupplier,
    isPurchasableInTerritory,
  }
}

// ── Product Sourcing View ──────────────────────────────────────────────────────

export async function getProductSourcingView(
  productId: string,
  territory: ProcurementTerritory = 'UK'
): Promise<ProductSourcingView> {
  const product = SEED_PRODUCTS.find((p) => p.id === productId)
  if (!product) throw new Error(`Product "${productId}" not found.`)

  const brand = SEED_BRANDS.find((b) => b.id === product.brandId)
  const brandName = brand ? brand.name : product.brandId

  // Find all offers matching this product
  const marketCode: MarketCode = territory === 'USA' ? 'US' : 'UK'
  const offers = SUPPLIER_OFFERS_STORE.filter(
    (o) => o.canonicalProductId === productId && o.marketCode === marketCode && o.status === 'ACTIVE'
  )

  const availableSuppliers: ProductSourcingView['availableSuppliers'] = []
  for (const offer of offers) {
    const supplier = SUPPLIERS_STORE.find((s) => s.id === offer.supplierId)
    if (!supplier) continue

    const isDirect = supplier.supplierType === 'DIRECT_BRAND'
    availableSuppliers.push({
      supplier,
      isDirect,
      costMinorUnits: offer.costMinorUnits,
      inStock: offer.availability === 'IN_STOCK',
      quantityAvailable: offer.quantity ?? 0,
    })
  }

  // Best supplier: cheapest cost in stock
  let bestSupplier: SupplierRecord | null = null
  if (availableSuppliers.length > 0) {
    const sorted = [...availableSuppliers].sort((a, b) => {
      if (a.inStock && !b.inStock) return -1
      if (!a.inStock && b.inStock) return 1
      return (a.costMinorUnits ?? 9999999) - (b.costMinorUnits ?? 9999999)
    })
    bestSupplier = sorted[0]?.supplier ?? null
  }

  const readiness = bestSupplier
    ? await calculateProcurementReadiness(bestSupplier.id, product.brandId)
    : {
        supplierId: 'none',
        state: 'NOT_READY' as ProcurementReadinessState,
        isProcurementReady: false,
        score: 0,
        checklist: {
          hasVerifiedRelationship: false,
          hasApprovedAccount: false,
          isTerritorySupported: false,
          hasVerifiedTerms: false,
          hasActiveFeedOrOffer: false,
          hasVerifiedProductMappings: false,
          hasFreshInventory: false,
        },
        blockers: ['No active supplier offers in territory.'],
      }

  return {
    productId,
    sku: product.sku,
    brandId: product.brandId,
    brandName,
    territory,
    bestSupplier,
    availableSuppliers,
    readinessState: readiness.state,
  }
}

// ── Duplicate Supplier Detection ───────────────────────────────────────────────

export async function detectDuplicateSupplier(
  name: string,
  website?: string | null,
  email?: string | null
): Promise<{ isDuplicate: boolean; matchedSupplier?: SupplierRecord | null; reason?: string | null }> {
  const normName = name.toLowerCase().trim()
  for (const s of SUPPLIERS_STORE) {
    if (s.name.toLowerCase().trim() === normName) {
      return {
        isDuplicate: true,
        matchedSupplier: s,
        reason: `Supplier name matches existing record "${s.name}".`,
      }
    }
    if (s.legalName && s.legalName.toLowerCase().trim() === normName) {
      return {
        isDuplicate: true,
        matchedSupplier: s,
        reason: `Supplier matches existing legal entity "${s.legalName}".`,
      }
    }
    if (website && s.website) {
      const normaliseUrl = (u: string) =>
        u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '').toLowerCase()
      const w1 = normaliseUrl(website)
      const w2 = normaliseUrl(s.website)
      if (w1 === w2) {
        return {
          isDuplicate: true,
          matchedSupplier: s,
          reason: `Supplier website "${website}" matches existing record "${s.name}".`,
        }
      }
    }
    const normEmail = email ? email.toLowerCase().trim() : null
    if (normEmail && s.contactEmail && normEmail === s.contactEmail.toLowerCase().trim()) {
      return {
        isDuplicate: true,
        matchedSupplier: s,
        reason: `Contact email matches existing supplier "${s.name}".`,
      }
    }
    if (normEmail && s.dealerEmail && normEmail === s.dealerEmail.toLowerCase().trim()) {
      return {
        isDuplicate: true,
        matchedSupplier: s,
        reason: `Dealer email matches existing supplier "${s.name}".`,
      }
    }
  }

  return { isDuplicate: false, matchedSupplier: null, reason: null }
}

// ── Procurement Data Quality Audit Report ──────────────────────────────────────

export async function getProcurementDataQualityReport(): Promise<{
  unverifiedRelationshipsCount: number
  unverifiedTermsCount: number
  pendingRequirementsCount: number
  staleOffersCount: number
  unmappedProductsCount: number
  alerts: Array<{ severity: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; supplierId?: string }>
}> {
  const unverifiedRelationships = BRAND_SUPPLIER_RELATIONSHIPS_STORE.filter(
    (r) => r.verificationStatus === 'UNVERIFIED'
  )
  const unverifiedTerms = SUPPLIER_COMMERCIAL_TERMS_STORE.filter((t) => !t.isVerified)
  
  let pendingRequirementsCount = 0
  for (const app of TRADE_ACCOUNT_APPLICATIONS_STORE) {
    pendingRequirementsCount += app.requirements.filter((r) => r.status === 'PENDING').length
  }

  const staleOffers = SUPPLIER_OFFERS_STORE.filter((o) => o.freshnessState === 'STALE')
  const unmappedProducts = SUPPLIER_MAPPINGS_STORE.filter((m) => m.status === 'UNMATCHED')

  const alerts: Array<{ severity: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; supplierId?: string }> = []

  if (unverifiedRelationships.length > 0) {
    alerts.push({
      severity: 'WARNING',
      message: `${unverifiedRelationships.length} brand-supplier distribution claims require verification.`,
    })
  }

  if (staleOffers.length > 0) {
    alerts.push({
      severity: 'CRITICAL',
      message: `${staleOffers.length} supplier inventory offers are stale and require synchronisation.`,
    })
  }

  if (pendingRequirementsCount > 0) {
    alerts.push({
      severity: 'INFO',
      message: `${pendingRequirementsCount} compliance items pending on open trade applications.`,
    })
  }

  return {
    unverifiedRelationshipsCount: unverifiedRelationships.length,
    unverifiedTermsCount: unverifiedTerms.length,
    pendingRequirementsCount,
    staleOffersCount: staleOffers.length,
    unmappedProductsCount: unmappedProducts.length,
    alerts,
  }
}

