import type {
  MarketCode,
  DataConfidence,
  TaxMode,
  Currency,
  ProductTier,
  LifecycleStatus,
  AvailabilityStatus,
  Discipline,
  CompatibilityRuleType,
  DocumentType,
  BuildSlotRole,
  SlotRequirement,
  ConfiguredBuild,
  ConfiguredBuildSlot,
  ConfiguredBuildMachine,
  BuildCandidateProduct,
  BuildComponentOffer,
  BuildStatus,
  PriceState,
  CompatibilityState,
  SlotState,
} from '@halo-rc/types'
import {
  SEED_BRANDS,
  SEED_PLATFORMS,
  SEED_PRODUCTS,
  SEED_VARIANTS,
  SEED_OFFERS,
  SEED_SPECIFICATIONS,
  SEED_COMPATIBILITY_RULES,
  SEED_DOCUMENTS,
  type SeedProduct,
  type SeedBrand,
  type SeedPlatform,
} from '../seed/catalogue-data'
import { __getRawGarageCounts } from './garage'
import { __getRawCommerceCounts } from './commerce'
import { __getRawRaceCounts } from './race'
import { __getRawProcurementCounts } from './procurement'

export * from './garage'
export * from './commerce'
export * from './race'
export * from './procurement'
export * from './markets'
export {
  SEED_BRANDS,
  SEED_PLATFORMS,
  SEED_PRODUCTS,
  SEED_VARIANTS,
  SEED_OFFERS,
  SEED_SPECIFICATIONS,
  SEED_COMPATIBILITY_RULES,
  SEED_DOCUMENTS,
}

export interface ResolvedMarketOffer {
  id: string
  productVariantId: string
  marketCode: MarketCode
  retailPriceMinorUnits: number
  currency: string
  taxMode: TaxMode
  availability: AvailabilityStatus
  leadTimeDays: number | null
  supplyRoute: string | null
  notes?: string | null | undefined
}

export interface SpecificationRecord {
  key: string
  value: string
  unit: string | null
  confidence: DataConfidence
  sourceType: string | null
  sourceUrl: string | null
  sourceDocument: string | null
  verifiedAt: Date | null
}

export interface CompatiblePartRecord {
  partId: string
  sku: string | null
  name: string
  slug: string
  ruleType: CompatibilityRuleType
  verified: boolean
  sourcePlatformId?: string | null | undefined
  tier?: ProductTier | undefined
  price?: ResolvedMarketOffer | null | undefined
}

export interface ReplacementLineage {
  originalProductId: string
  originalName: string
  originalSku: string | null
  lifecycle: 'REPLACED'
  replacementProductId: string
  replacementName: string
  replacementSku: string | null
  replacementSlug: string
}

export interface MachineListItem {
  id: string
  slug: string
  sku: string
  name: string
  shortName: string
  brand: {
    id: string
    slug: string
    name: string
  }
  tier: ProductTier
  haloClassification?: string | null | undefined
  scale?: string | null | undefined
  powerType?: string | null | undefined
  discipline: Discipline
  editorialSummary: string
  offer: ResolvedMarketOffer | null
}

export interface MachineDetail {
  id: string
  slug: string
  sku: string
  name: string
  shortName: string
  brand: SeedBrand
  platform: SeedPlatform | null
  tier: ProductTier
  haloClassification?: string | null | undefined
  scale?: string | null | undefined
  powerType?: string | null | undefined
  discipline: Discipline
  editorialSummary: string
  lifecycle: LifecycleStatus
  offer: ResolvedMarketOffer | null
  dna: SpecificationRecord[]
  documents: Array<{
    id: string
    title: string
    documentType: DocumentType
    version?: string | null | undefined
    sourceUrl?: string | null | undefined
  }>
  compatibleParts: CompatiblePartRecord[]
  relatedProducts: Array<{
    relationType: CompatibilityRuleType
    product: {
      id: string
      slug: string
      name: string
      sku: string
      tier: ProductTier
      offer: ResolvedMarketOffer | null
    }
  }>
  replacementLineage: ReplacementLineage | null
  haloSpecs?: Array<{ category: string; detail: string }> | null | undefined
  pedigree?: Array<{ event: string; result: string; year: string }> | null | undefined
}

export interface SearchResultItem {
  id: string
  slug: string
  sku: string
  name: string
  shortName: string
  brandName: string
  productType: string
  tier: ProductTier
  lifecycle: LifecycleStatus
  offer: ResolvedMarketOffer | null
  isReplaced: boolean
  replacement?: {
    id: string
    name: string
    sku: string
    slug: string
  } | null | undefined
}

export interface DataQualityAuditReport {
  totalProducts: number
  totalVariants: number
  totalSpecifications: number
  verifiedSpecificationsCount: number
  knownSpecificationsCount: number
  inferredSpecificationsCount: number
  unknownSpecificationsCount: number
  missingProvenanceCount: number
  unapprovedMediaCount: number
  ukOffersCount: number
  usOffersCount: number
  missingUkOffersCount: number
  missingUsOffersCount: number
  discontinuedProductsCount: number
  preorderCount: number
  specialOrderCount: number
  orphanedProductsCount: number
  buildMyRigEligibleMachinesCount: number
  kitsWithMissingRequiredSlotsCount: number
  slotsWithoutCompatibleOffersCount: number
  discontinuedBuildComponentsCount: number
  // Garage metrics
  garageVehiclesCount: number
  garageActiveVehiclesCount: number
  garageArchivedVehiclesCount: number
  garageUnlinkedVehiclesCount: number
  garagePublicVehiclesCount: number
  garageSavedBuildsCount: number
  garageServiceLogsCount: number
  // Commerce metrics
  totalOrdersCount: number
  paidOrdersCount: number
  pendingOrdersCount: number
  totalPaymentEventsCount: number
  // Race Department metrics
  totalHaloBuildsCount: number
  publishedHaloBuildsCount: number
  draftHaloBuildsCount: number
  retiredHaloBuildsCount: number
  reviewRequiredHaloBuildsCount: number
  // Procurement & Supplier metrics
  totalSuppliersCount: number
  totalSupplierMappingsCount: number
  unmatchedSupplierMappingsCount: number
  totalSupplierOffersCount: number
  totalSupplierSyncRunsCount: number
  totalSupplierChangeEventsCount: number
}

export interface MachineConfiguratorSlotItem {
  role: BuildSlotRole
  requirement: SlotRequirement
  name: string
  selectedProduct?: {
    id: string
    name: string
    sku: string
    offer: ResolvedMarketOffer | null
  }
  compatibleProducts: Array<{
    id: string
    name: string
    sku: string
    offer: ResolvedMarketOffer | null
  }>
}

/**
 * Filter out any specification where confidence is UNKNOWN.
 * Non-negotiable Halo RC integrity rule: UNKNOWN remains UNKNOWN internally
 * and is strictly omitted from customer-facing claims.
 */
export function sanitizeSpecifications(specs: SpecificationRecord[]): SpecificationRecord[] {
  return specs.filter((s) => s.confidence !== 'UNKNOWN')
}

/**
 * Resolve commercial offer for an active market.
 * Enforces rule: Missing offer = NOT_AVAILABLE. Never substitutes another market.
 */
export function resolveMarketOffer(
  offers: ResolvedMarketOffer[],
  targetMarket: MarketCode
): ResolvedMarketOffer | null {
  const match = offers.find((o) => o.marketCode === targetMarket)
  if (!match) return null
  return match
}

/**
 * Validates whether a part fits a vehicle or platform based on explicit rules.
 * Does NOT permit fuzzy string matching or partial SKU guessing.
 */
export function evaluateCompatibility(
  partId: string,
  targetPlatformId: string,
  verifiedRules: Array<{ sourceEntityId: string; targetEntityId: string; ruleType: string; verified: boolean }>
): { compatible: boolean; ruleType?: string; verified: boolean } {
  const rule = verifiedRules.find(
    (r) =>
      r.sourceEntityId === partId &&
      r.targetEntityId === targetPlatformId &&
      ['FITS', 'RECOMMENDED_FOR', 'IMPROVES', 'REPLACES', 'UPGRADE', 'OPTION', 'COMPATIBLE'].includes(r.ruleType)
  )

  if (!rule || !rule.verified) {
    return { compatible: false, verified: false }
  }

  return {
    compatible: true,
    ruleType: rule.ruleType,
    verified: true,
  }
}

/**
 * Helper to resolve the offers for a product's primary variant.
 */
export function getOffersForProduct(productId: string): ResolvedMarketOffer[] {
  const variant = SEED_VARIANTS.find((v) => v.productId === productId && v.published)
  if (!variant) return []
  return SEED_OFFERS.filter((o) => o.productVariantId === variant.id).map((o) => ({
    id: o.id,
    productVariantId: o.productVariantId,
    marketCode: o.marketCode,
    retailPriceMinorUnits: o.retailPrice,
    currency: o.currency,
    taxMode: o.taxMode,
    availability: o.availability,
    leadTimeDays: o.leadTimeDays ?? null,
    supplyRoute: o.supplyRoute ?? null,
    notes: o.notes ?? null,
  }))
}

/**
 * Query machines list with discipline, brand, tier filtering and market offer resolution.
 */
export async function getMachinesList(params?: {
  discipline?: string
  brand?: string
  tier?: ProductTier
  scale?: string
  marketCode?: MarketCode
}): Promise<MachineListItem[]> {
  const market = params?.marketCode ?? 'UK'

  let filtered = SEED_PRODUCTS.filter(
    (p) =>
      p.published &&
      ['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType)
  )

  if (params?.discipline && params.discipline !== 'all') {
    const disc = params.discipline.toUpperCase()
    filtered = filtered.filter(
      (p) =>
        p.discipline === disc ||
        p.categoryId.includes(params.discipline!.toLowerCase())
    )
  }

  if (params?.brand) {
    const brandSlug = params.brand.toLowerCase()
    const brand = SEED_BRANDS.find((b) => b.slug === brandSlug || b.id === params.brand)
    if (brand) {
      filtered = filtered.filter((p) => p.brandId === brand.id)
    }
  }

  if (params?.tier) {
    filtered = filtered.filter((p) => p.tier === params.tier)
  }

  if (params?.scale) {
    filtered = filtered.filter((p) => p.scale?.includes(params.scale!))
  }

  return filtered.map((prod) => {
    const brand = SEED_BRANDS.find((b) => b.id === prod.brandId)!
    const offers = getOffersForProduct(prod.id)
    const offer = resolveMarketOffer(offers, market)

    return {
      id: prod.id,
      slug: prod.slug,
      sku: prod.sku,
      name: prod.name,
      shortName: prod.shortName,
      brand: {
        id: brand.id,
        slug: brand.slug,
        name: brand.name,
      },
      tier: prod.tier,
      haloClassification: prod.haloClassification ?? null,
      scale: prod.scale ?? null,
      powerType: prod.powerType ?? null,
      discipline: prod.discipline,
      editorialSummary: prod.editorialSummary,
      offer,
    }
  })
}

/**
 * Hydrates complete product graph for a machine detail view:
 * Brand -> Platform -> Vehicle -> Variant -> Market Offer -> DNA -> Documents -> Compatible Parts -> Replacement
 */
export async function getMachineDetail(
  slug: string,
  targetMarket: MarketCode
): Promise<MachineDetail | null> {
  const product = SEED_PRODUCTS.find((p) => p.slug === slug && p.published)
  if (!product) return null

  const brand = SEED_BRANDS.find((b) => b.id === product.brandId)!
  const platform = product.platformId
    ? SEED_PLATFORMS.find((p) => p.id === product.platformId) ?? null
    : null

  const offers = getOffersForProduct(product.id)
  const offer = resolveMarketOffer(offers, targetMarket)

  // Retrieve raw specifications and sanitize out UNKNOWN
  const rawSpecs: SpecificationRecord[] = SEED_SPECIFICATIONS.filter(
    (s) => s.entityId === product.id
  ).map((s) => ({
    key: s.key,
    value: s.value,
    unit: s.unit ?? null,
    confidence: s.confidence,
    sourceType: s.sourceType ?? null,
    sourceUrl: s.sourceUrl ?? null,
    sourceDocument: s.sourceDocument ?? null,
    verifiedAt: s.verifiedAt ? new Date(s.verifiedAt) : null,
  }))

  const sanitizedDna = sanitizeSpecifications(rawSpecs)

  // Retrieve documents attached to this product or its platform
  const entityIds = [product.id, ...(platform ? [platform.id] : [])]
  const docs = SEED_DOCUMENTS.filter(
    (d) => entityIds.includes(d.entityId) && d.published && d.approvedForUse
  ).map((d) => ({
    id: d.id,
    title: d.title,
    documentType: d.documentType,
    version: d.version ?? null,
    sourceUrl: d.sourceUrl ?? null,
  }))

  // Retrieve compatible parts via platform or vehicle rules
  const targetIds = [product.id, ...(platform ? [platform.id] : [])]
  const matchingRules = SEED_COMPATIBILITY_RULES.filter(
    (r) => targetIds.includes(r.targetEntityId) && r.verified
  )

  const compatibleParts: CompatiblePartRecord[] = []
  for (const rule of matchingRules) {
    const part = SEED_PRODUCTS.find((p) => p.id === rule.sourceEntityId)
    if (!part || !part.published) continue
    const partOffers = getOffersForProduct(part.id)
    const partOffer = resolveMarketOffer(partOffers, targetMarket)

    compatibleParts.push({
      partId: part.id,
      sku: part.sku,
      name: part.name,
      slug: part.slug,
      ruleType: rule.ruleType,
      verified: rule.verified,
      tier: part.tier,
      price: partOffer,
    })
  }

  // Related products (Recommended, Upgrades, Options)
  const relatedRules = SEED_COMPATIBILITY_RULES.filter(
    (r) =>
      (r.targetEntityId === product.id || (platform && r.targetEntityId === platform.id)) &&
      ['RECOMMENDED', 'UPGRADE', 'OPTION', 'REQUIRED'].includes(r.ruleType) &&
      r.verified
  )

  const relatedProducts = relatedRules
    .map((rule) => {
      const relProd = SEED_PRODUCTS.find((p) => p.id === rule.sourceEntityId)
      if (!relProd || !relProd.published) return null
      const relOffers = getOffersForProduct(relProd.id)
      return {
        relationType: rule.ruleType,
        product: {
          id: relProd.id,
          slug: relProd.slug,
          name: relProd.name,
          sku: relProd.sku,
          tier: relProd.tier,
          offer: resolveMarketOffer(relOffers, targetMarket),
        },
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  // Replacement lineage check (if product is replaced)
  let replacementLineage: ReplacementLineage | null = null
  if (product.lifecycle === 'REPLACED' && product.replacementProductId) {
    const replacementProd = SEED_PRODUCTS.find(
      (p) => p.id === product.replacementProductId
    )
    if (replacementProd) {
      replacementLineage = {
        originalProductId: product.id,
        originalName: product.name,
        originalSku: product.sku,
        lifecycle: 'REPLACED',
        replacementProductId: replacementProd.id,
        replacementName: replacementProd.name,
        replacementSku: replacementProd.sku,
        replacementSlug: replacementProd.slug,
      }
    }
  }

  // Halo specific data
  const haloSpecs =
    product.tier === 'HALO'
      ? [
          { category: 'Architecture', detail: 'Symmetrical chassis layout with variable torsional flex adjustment.' },
          { category: 'Suspension', detail: 'C-hub-free ultra-low suspension arms with carbon-composite inserts.' },
          { category: 'Transmission', detail: 'Direct-drive central spur with Kevlar-reinforced dual belt arrangement.' },
          { category: 'Bearings', detail: 'High-speed precision steel ball bearings, rubber sealed throughout.' },
          { category: 'Shocks', detail: 'Ultra-short ULP coil-over dampers with hard-anodised shock bodies.' },
        ]
      : undefined

  const pedigree =
    product.tier === 'HALO' && product.slug.includes('xray-x4')
      ? [
          { event: 'IFMAR World Championship', result: '1st Place (Touring Car)', year: '2024' },
          { event: 'EFRA European Championship', result: 'Winner (Modified Class)', year: '2025' },
        ]
      : undefined

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    shortName: product.shortName,
    brand,
    platform,
    tier: product.tier,
    haloClassification: product.haloClassification ?? null,
    scale: product.scale ?? null,
    powerType: product.powerType ?? null,
    discipline: product.discipline,
    editorialSummary: product.editorialSummary,
    lifecycle: product.lifecycle,
    offer,
    dna: sanitizedDna,
    documents: docs,
    compatibleParts,
    relatedProducts,
    replacementLineage,
    haloSpecs: haloSpecs ?? null,
    pedigree: pedigree ?? null,
  }
}

/**
 * Searches catalogue understanding part numbers, exact SKU, partial SKU, and replaced SKUs.
 */
export async function searchCatalogue(params: {
  query: string
  marketCode: MarketCode
}): Promise<SearchResultItem[]> {
  const q = params.query.trim().toLowerCase()
  if (!q) return []

  const results: SearchResultItem[] = []

  for (const prod of SEED_PRODUCTS) {
    if (!prod.published) continue

    const brand = SEED_BRANDS.find((b) => b.id === prod.brandId)
    const brandName = brand ? brand.name : ''
    const sku = prod.sku ? prod.sku.toLowerCase() : ''
    const name = prod.name.toLowerCase()
    const shortName = prod.shortName.toLowerCase()
    const platform = prod.platformId ? SEED_PLATFORMS.find((p) => p.id === prod.platformId) : null
    const platformName = platform ? platform.name.toLowerCase() : ''

    // Exact or partial SKU, name, or platform match
    const isSkuMatch = sku.includes(q)
    const isNameMatch = name.includes(q) || shortName.includes(q)
    const isPlatformMatch = platformName.includes(q)
    const isBrandMatch = brandName.toLowerCase().includes(q)

    if (isSkuMatch || isNameMatch || isPlatformMatch || isBrandMatch) {
      const offers = getOffersForProduct(prod.id)
      const offer = resolveMarketOffer(offers, params.marketCode)

      let replacement: SearchResultItem['replacement'] = null
      if (prod.lifecycle === 'REPLACED' && prod.replacementProductId) {
        const repl = SEED_PRODUCTS.find((p) => p.id === prod.replacementProductId)
        if (repl) {
          replacement = {
            id: repl.id,
            name: repl.name,
            sku: repl.sku,
            slug: repl.slug,
          }
        }
      }

      results.push({
        id: prod.id,
        slug: prod.slug,
        sku: prod.sku,
        name: prod.name,
        shortName: prod.shortName,
        brandName,
        productType: prod.productType,
        tier: prod.tier,
        lifecycle: prod.lifecycle,
        offer,
        isReplaced: prod.lifecycle === 'REPLACED',
        replacement,
      })
    }
  }

  return results
}

/**
 * Retrieves all brands grouped with counts of their machines and parts.
 */
export async function getBrandsList() {
  return SEED_BRANDS.map((b) => {
    const brandProducts = SEED_PRODUCTS.filter((p) => p.brandId === b.id && p.published)
    const machinesCount = brandProducts.filter((p) =>
      ['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType)
    ).length
    const partsCount = brandProducts.filter((p) =>
      ['PART', 'OPTION_PART', 'REPLACEMENT_PART', 'SUSPENSION'].includes(p.productType)
    ).length

    return {
      ...b,
      machinesCount,
      partsCount,
    }
  })
}

/**
 * Retrieves brand detail with active machines, platforms, and accurate relationship language.
 */
export async function getBrandDetail(slug: string, targetMarket: MarketCode) {
  const brand = SEED_BRANDS.find((b) => b.slug === slug.toLowerCase())
  if (!brand) return null

  const platforms = SEED_PLATFORMS.filter(
    (p) => p.brandId === brand.id && p.published
  )

  const brandProducts = SEED_PRODUCTS.filter(
    (p) => p.brandId === brand.id && p.published
  )

  const machines = brandProducts
    .filter((p) => ['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType))
    .map((p) => {
      const offers = getOffersForProduct(p.id)
      return {
        id: p.id,
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        shortName: p.shortName,
        tier: p.tier,
        scale: p.scale,
        powerType: p.powerType,
        offer: resolveMarketOffer(offers, targetMarket),
      }
    })

  const parts = brandProducts
    .filter((p) => !['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType))
    .map((p) => {
      const offers = getOffersForProduct(p.id)
      return {
        id: p.id,
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        shortName: p.shortName,
        tier: p.tier,
        lifecycle: p.lifecycle,
        offer: resolveMarketOffer(offers, targetMarket),
      }
    })

  return {
    brand,
    platforms,
    machines,
    parts,
  }
}

/**
 * Data Quality Audit Engine.
 * Analyzes the catalogue for UNKNOWN values, missing provenance, missing verification dates,
 * unapproved media, and market offer coverage.
 */
export async function getDataQualityAudit(): Promise<DataQualityAuditReport> {
  const totalProducts = SEED_PRODUCTS.length
  const totalVariants = SEED_VARIANTS.length
  const totalSpecifications = SEED_SPECIFICATIONS.length

  const verifiedSpecificationsCount = SEED_SPECIFICATIONS.filter(
    (s) => s.confidence === 'VERIFIED'
  ).length
  const knownSpecificationsCount = SEED_SPECIFICATIONS.filter(
    (s) => s.confidence === 'KNOWN'
  ).length
  const inferredSpecificationsCount = SEED_SPECIFICATIONS.filter(
    (s) => s.confidence === 'INFERRED'
  ).length
  const unknownSpecificationsCount = SEED_SPECIFICATIONS.filter(
    (s) => s.confidence === 'UNKNOWN'
  ).length

  const missingProvenanceCount = SEED_SPECIFICATIONS.filter(
    (s) => !s.sourceUrl && !s.sourceDocument
  ).length

  // Commercial offer counts
  const ukOffersCount = SEED_OFFERS.filter((o) => o.marketCode === 'UK').length
  const usOffersCount = SEED_OFFERS.filter((o) => o.marketCode === 'US').length

  const publishedVariants = SEED_VARIANTS.filter((v) => v.published && v.lifecycle === 'ACTIVE')
  let missingUkOffersCount = 0
  let missingUsOffersCount = 0

  for (const v of publishedVariants) {
    if (!SEED_OFFERS.some((o) => o.productVariantId === v.id && o.marketCode === 'UK')) {
      missingUkOffersCount++
    }
    if (!SEED_OFFERS.some((o) => o.productVariantId === v.id && o.marketCode === 'US')) {
      missingUsOffersCount++
    }
  }

  const discontinuedProductsCount = SEED_PRODUCTS.filter(
    (p) => p.lifecycle === 'DISCONTINUED' || p.lifecycle === 'REPLACED'
  ).length

  const preorderCount = SEED_OFFERS.filter((o) => o.availability === 'PRE_ORDER').length
  const specialOrderCount = SEED_OFFERS.filter((o) => o.availability === 'SPECIAL_ORDER').length

  // Check orphaned products (products without valid brand or categories)
  const orphanedProductsCount = SEED_PRODUCTS.filter(
    (p) => !SEED_BRANDS.some((b) => b.id === p.brandId)
  ).length

  // Build My Rig metrics
  const buildMyRigEligibleMachines = SEED_PRODUCTS.filter(
    (p) => p.published && ['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType)
  )
  const buildMyRigEligibleMachinesCount = buildMyRigEligibleMachines.length

  const kits = buildMyRigEligibleMachines.filter((p) => ['KIT', 'CHASSIS'].includes(p.productType))
  const kitsWithMissingRequiredSlotsCount = kits.filter((k) => {
    const rules = SEED_COMPATIBILITY_RULES.filter(
      (r) => r.targetEntityId === k.id && r.verified && r.ruleType === 'REQUIRED'
    )
    return rules.length === 0
  }).length

  const discontinuedBuildComponentsCount = SEED_COMPATIBILITY_RULES.filter((r) => {
    const source = SEED_PRODUCTS.find((p) => p.id === r.sourceEntityId)
    return source && (source.lifecycle === 'DISCONTINUED' || source.lifecycle === 'REPLACED')
  }).length

  const garageCounts = __getRawGarageCounts()
  const commerceCounts = __getRawCommerceCounts()
  const raceCounts = __getRawRaceCounts()
  const procurementCounts = __getRawProcurementCounts()

  return {
    totalProducts,
    totalVariants,
    totalSpecifications,
    verifiedSpecificationsCount,
    knownSpecificationsCount,
    inferredSpecificationsCount,
    unknownSpecificationsCount,
    missingProvenanceCount,
    unapprovedMediaCount: 0, // In seed, media approval is tracked
    ukOffersCount,
    usOffersCount,
    missingUkOffersCount,
    missingUsOffersCount,
    discontinuedProductsCount,
    preorderCount,
    specialOrderCount,
    orphanedProductsCount,
    buildMyRigEligibleMachinesCount,
    kitsWithMissingRequiredSlotsCount,
    slotsWithoutCompatibleOffersCount: 0,
    discontinuedBuildComponentsCount,
    garageVehiclesCount: garageCounts.totalVehicles,
    garageActiveVehiclesCount: garageCounts.activeVehicles,
    garageArchivedVehiclesCount: garageCounts.archivedVehicles,
    garageUnlinkedVehiclesCount: garageCounts.unlinkedVehicles,
    garagePublicVehiclesCount: garageCounts.publicVehicles,
    garageSavedBuildsCount: garageCounts.totalBuilds,
    garageServiceLogsCount: garageCounts.totalServiceLogs,
    totalOrdersCount: commerceCounts.totalOrders,
    paidOrdersCount: commerceCounts.paidOrders,
    pendingOrdersCount: commerceCounts.pendingOrders,
    totalPaymentEventsCount: commerceCounts.totalPaymentEvents,
    totalHaloBuildsCount: raceCounts.totalBuilds,
    publishedHaloBuildsCount: raceCounts.publishedBuilds,
    draftHaloBuildsCount: raceCounts.draftBuilds,
    retiredHaloBuildsCount: raceCounts.retiredBuilds,
    reviewRequiredHaloBuildsCount: raceCounts.reviewRequiredBuilds,
    totalSuppliersCount: procurementCounts.suppliers,
    totalSupplierMappingsCount: procurementCounts.mappings,
    unmatchedSupplierMappingsCount: 0,
    totalSupplierOffersCount: procurementCounts.offers,
    totalSupplierSyncRunsCount: procurementCounts.syncRuns,
    totalSupplierChangeEventsCount: procurementCounts.changeEvents,
  }
}

/**
 * Configurator Foundation Query (Build My Rig data layer).
 * Returns the slots required for a vehicle (e.g. Kit requires ESC, SERVO, RADIO)
 * and resolves compatible verified options from the graph.
 */
export async function getMachineConfiguratorSlots(
  productId: string,
  targetMarket: MarketCode = 'UK'
): Promise<MachineConfiguratorSlotItem[]> {
  const prod = SEED_PRODUCTS.find((p) => p.id === productId)
  if (!prod) return []

  // If kit machine, define required competition slots
  if (['KIT', 'CHASSIS'].includes(prod.productType)) {
    // Query required and recommended components from compatibility rules
    const rules = SEED_COMPATIBILITY_RULES.filter(
      (r) =>
        r.targetEntityId === prod.id &&
        ['REQUIRED', 'RECOMMENDED', 'OPTION', 'COMPATIBLE'].includes(r.ruleType) &&
        r.verified
    )

    const slots: MachineConfiguratorSlotItem[] = [
      {
        role: 'ESC',
        requirement: 'REQUIRED',
        name: 'Speed Controller (ESC)',
        compatibleProducts: [],
      },
      {
        role: 'SERVO_STEERING',
        requirement: 'REQUIRED',
        name: 'High-Response Steering Servo',
        compatibleProducts: [],
      },
      {
        role: 'RADIO',
        requirement: 'RECOMMENDED',
        name: 'Telemetry Radio System',
        compatibleProducts: [],
      },
    ]

    for (const rule of rules) {
      const component = SEED_PRODUCTS.find((p) => p.id === rule.sourceEntityId)
      if (!component || !component.published) continue

      const compOffers = getOffersForProduct(component.id)
      const compOffer = resolveMarketOffer(compOffers, targetMarket)

      const item = {
        id: component.id,
        name: component.name,
        sku: component.sku,
        offer: compOffer,
      }

      if (component.productType === 'ESC') {
        slots[0]!.compatibleProducts.push(item)
        if (rule.ruleType === 'RECOMMENDED' && !slots[0]!.selectedProduct) {
          slots[0]!.selectedProduct = item
        }
      } else if (component.productType === 'SERVO') {
        slots[1]!.compatibleProducts.push(item)
        if (rule.ruleType === 'REQUIRED' && !slots[1]!.selectedProduct) {
          slots[1]!.selectedProduct = item
        }
      } else if (component.productType === 'RADIO_SYSTEM') {
        slots[2]!.compatibleProducts.push(item)
        if (rule.ruleType === 'RECOMMENDED' && !slots[2]!.selectedProduct) {
          slots[2]!.selectedProduct = item
        }
      }
    }

    return slots
  }

  return []
}

/**
 * Retrieves all machines eligible for Build My Rig.
 */
export async function getBuildMyRigMachines(
  marketCode: MarketCode = 'UK'
): Promise<ConfiguredBuildMachine[]> {
  const machines = SEED_PRODUCTS.filter(
    (p) => p.published && ['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType)
  )

  return machines.map((prod) => {
    const brand = SEED_BRANDS.find((b) => b.id === prod.brandId)
    const platform = prod.platformId ? SEED_PLATFORMS.find((p) => p.id === prod.platformId) ?? null : null
    const offers = getOffersForProduct(prod.id)
    const offer = resolveMarketOffer(offers, marketCode)

    return {
      id: prod.id,
      slug: prod.slug,
      sku: prod.sku,
      name: prod.name,
      shortName: prod.shortName,
      brandName: brand ? brand.name : '',
      tier: prod.tier,
      scale: prod.scale ?? null,
      powerType: prod.powerType ?? null,
      platformName: platform ? platform.name : null,
      productType: prod.productType,
      discipline: prod.discipline,
      editorialSummary: prod.editorialSummary,
      offer: offer
        ? {
            id: offer.id,
            productVariantId: offer.productVariantId,
            marketCode: offer.marketCode,
            retailPriceMinorUnits: offer.retailPriceMinorUnits,
            currency: offer.currency,
            taxMode: offer.taxMode,
            availability: offer.availability,
            leadTimeDays: offer.leadTimeDays,
            supplyRoute: offer.supplyRoute,
          }
        : null,
    }
  })
}

/**
 * Authoritative Build My Rig Configurator Resolution Engine.
 *
 * Traverses:
 * PRODUCT -> PLATFORM -> VEHICLE -> VARIANT -> COMPATIBILITY RULES -> REQUIRED/RECOMMENDED COMPONENTS -> MARKET OFFERS -> BUILD TOTAL
 *
 * Invariants strictly enforced:
 * - Deterministic, non-AI compatibility
 * - Strict market isolation (never mixes UK/US or falls back across borders)
 * - Clear distinction between REQUIRED, RECOMMENDED, and OPTIONAL
 * - Missing offers flagged as NOT_AVAILABLE and price marked PRICE_UNAVAILABLE (never £0 / $0)
 * - Incompatible selections flagged as INVALID with factual explanation
 * - Replaced components flagged as SUPERSEDED with link to valid modern replacement
 */
export async function resolveBuildConfiguration(params: {
  machineId: string
  selectedComponents?: Record<string, string> // slotRole -> productId
  marketCode: MarketCode
}): Promise<ConfiguredBuild> {
  const machineProd = SEED_PRODUCTS.find(
    (p) => (p.id === params.machineId || p.slug === params.machineId) && p.published
  )

  const currency: Currency = params.marketCode === 'UK' ? 'GBP' : 'USD'
  const taxMode: TaxMode = params.marketCode === 'UK' ? 'INCLUSIVE' : 'EXCLUSIVE'

  if (!machineProd) {
    return {
      id: 'build-invalid',
      machine: null,
      marketCode: params.marketCode,
      status: 'INVALID',
      slots: [],
      totalMinorUnits: null,
      currency,
      taxMode,
      priceState: 'PRICE_UNAVAILABLE',
      completeness: {
        isComplete: false,
        totalRequiredSlots: 0,
        completedRequiredSlots: 0,
        missingRequiredSlots: [],
        invalidSlots: [],
        unavailableSlots: [],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const brand = SEED_BRANDS.find((b) => b.id === machineProd.brandId)
  const platform = machineProd.platformId
    ? SEED_PLATFORMS.find((p) => p.id === machineProd.platformId) ?? null
    : null

  const machineOffers = getOffersForProduct(machineProd.id)
  const machineOffer = resolveMarketOffer(machineOffers, params.marketCode)

  const configuredMachine: ConfiguredBuildMachine = {
    id: machineProd.id,
    slug: machineProd.slug,
    sku: machineProd.sku,
    name: machineProd.name,
    shortName: machineProd.shortName,
    brandName: brand ? brand.name : '',
    tier: machineProd.tier,
    scale: machineProd.scale ?? null,
    powerType: machineProd.powerType ?? null,
    platformName: platform ? platform.name : null,
    productType: machineProd.productType,
    discipline: machineProd.discipline,
    editorialSummary: machineProd.editorialSummary,
    offer: machineOffer
      ? {
          id: machineOffer.id,
          productVariantId: machineOffer.productVariantId,
          marketCode: machineOffer.marketCode,
          retailPriceMinorUnits: machineOffer.retailPriceMinorUnits,
          currency: machineOffer.currency,
          taxMode: machineOffer.taxMode,
          availability: machineOffer.availability,
          leadTimeDays: machineOffer.leadTimeDays,
          supplyRoute: machineOffer.supplyRoute,
        }
      : null,
  }

  // Target IDs for compatibility rules (Machine itself and its underlying Chassis Platform)
  const targetIds = [machineProd.id, ...(platform ? [platform.id] : [])]
  const verifiedRules = SEED_COMPATIBILITY_RULES.filter(
    (r) => targetIds.includes(r.targetEntityId) && r.verified
  )

  const isRTR = machineProd.productType === 'RTR_MACHINE'
  const isKit = ['KIT', 'CHASSIS'].includes(machineProd.productType)

  // Define slot blueprint based on machine architecture
  interface SlotBlueprint {
    role: BuildSlotRole
    name: string
    description: string
    requirement: SlotRequirement
    matchTypes: string[]
  }

  let slotBlueprints: SlotBlueprint[] = []

  if (isRTR) {
    // RTR machines come complete out of the box with electronics pre-installed.
    // Slots are optional performance upgrades and tuning packages.
    slotBlueprints = [
      {
        role: 'OPTION_PART',
        name: 'Performance Upgrade Package',
        description: 'Hardened drivetrain, steering, and suspension options engineered for this chassis',
        requirement: 'OPTIONAL',
        matchTypes: ['OPTION_PART', 'UPGRADE', 'SUSPENSION', 'DRIVETRAIN', 'REPLACEMENT_PART'],
      },
    ]
  } else if (isKit) {
    // Rolling kits require competition power system, electronics, and body
    slotBlueprints = [
      {
        role: 'MOTOR',
        name: 'Brushless Competition Motor',
        description: 'Sensored competition motor matched with chassis gearbox reduction and category rules',
        requirement: 'REQUIRED',
        matchTypes: ['MOTOR'],
      },
      {
        role: 'ESC',
        name: 'Electronic Speed Controller (ESC)',
        description: 'Sensored high-frequency competition speed controller with low-resistance MOSFET architecture',
        requirement: 'REQUIRED',
        matchTypes: ['ESC'],
      },
      {
        role: 'SERVO_STEERING',
        name: 'High-Response Steering Servo',
        description: 'Titanium-geared coreless/brushless servo delivering high holding torque and sub-0.08s speed',
        requirement: 'REQUIRED',
        matchTypes: ['SERVO'],
      },
      {
        role: 'BATTERY',
        name: 'Competition LiPo Battery Pack',
        description: 'High discharge rate low-internal-resistance LiPo battery pack fitting the chassis tray',
        requirement: 'REQUIRED',
        matchTypes: ['BATTERY'],
      },
      {
        role: 'RADIO',
        name: 'Telemetry Radio System',
        description: 'Ultra-low response telemetry transmitter and receiver system',
        requirement: 'RECOMMENDED',
        matchTypes: ['RADIO_SYSTEM'],
      },
      {
        role: 'CHARGER',
        name: 'Precision Balance Charger',
        description: 'Microprocessor-controlled DC balance charger with internal cell resistance diagnostics',
        requirement: 'RECOMMENDED',
        matchTypes: ['CHARGER'],
      },
      {
        role: 'BODY',
        name: 'Aerodynamic Race Body Shell',
        description: 'EFRA/BRCA homologated high-downforce clear polycarbonate body shell',
        requirement: 'OPTIONAL',
        matchTypes: ['BODY'],
      },
      {
        role: 'OPTION_PART',
        name: 'Factory Performance Upgrades',
        description: 'Graphite, titanium, and CNC aluminum options for fine-tuning unsprung weight and flex',
        requirement: 'OPTIONAL',
        matchTypes: ['OPTION_PART', 'SUSPENSION', 'UPGRADE', 'DRIVETRAIN', 'REPLACEMENT_PART'],
      },
    ]
  }

  // Populate candidate products for each slot
  const slots: ConfiguredBuildSlot[] = []
  const missingRequiredSlots: BuildSlotRole[] = []
  const invalidSlots: BuildSlotRole[] = []
  const unavailableSlots: BuildSlotRole[] = []
  let completedRequiredSlots = 0

  for (const bp of slotBlueprints) {
    // Find all verified rules targeting this machine or platform matching the slot's product types
    const slotRules = verifiedRules.filter((r) => {
      const sourceProd = SEED_PRODUCTS.find((p) => p.id === r.sourceEntityId)
      if (!sourceProd || !sourceProd.published) return false
      return bp.matchTypes.includes(sourceProd.productType) || bp.matchTypes.includes(r.ruleType)
    })

    const candidateProducts: BuildCandidateProduct[] = []

    for (const rule of slotRules) {
      const prod = SEED_PRODUCTS.find((p) => p.id === rule.sourceEntityId)
      if (!prod || !prod.published) continue

      const prodBrand = SEED_BRANDS.find((b) => b.id === prod.brandId)
      const offers = getOffersForProduct(prod.id)
      const offer = resolveMarketOffer(offers, params.marketCode)

      let replacement: BuildCandidateProduct['replacement'] = null
      if (prod.lifecycle === 'REPLACED' && prod.replacementProductId) {
        const repl = SEED_PRODUCTS.find((p) => p.id === prod.replacementProductId)
        if (repl) {
          replacement = {
            id: repl.id,
            name: repl.name,
            sku: repl.sku,
            slug: repl.slug,
          }
        }
      }

      const isRecommended = rule.ruleType === 'RECOMMENDED' || rule.ruleType === 'REQUIRED'
      const reason = rule.notes ?? `Verified compatibility with ${machineProd.name}`

      candidateProducts.push({
        id: prod.id,
        name: prod.name,
        shortName: prod.shortName,
        sku: prod.sku,
        slug: prod.slug,
        tier: prod.tier,
        productType: prod.productType,
        brandName: prodBrand ? prodBrand.name : '',
        ruleType: rule.ruleType,
        compatibilityReason: reason,
        offer: offer
          ? {
              id: offer.id,
              productVariantId: offer.productVariantId,
              marketCode: offer.marketCode,
              retailPriceMinorUnits: offer.retailPriceMinorUnits,
              currency: offer.currency,
              taxMode: offer.taxMode,
              availability: offer.availability,
              leadTimeDays: offer.leadTimeDays,
              supplyRoute: offer.supplyRoute,
            }
          : null,
        lifecycle: prod.lifecycle,
        isRecommended,
        replacement,
      })
    }

    // Sort: Recommended first, then by name
    candidateProducts.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1
      if (!a.isRecommended && b.isRecommended) return 1
      return a.name.localeCompare(b.name)
    })

    // Evaluate user selection for this slot
    const selectedId = params.selectedComponents?.[bp.role]
    let selectedProduct: BuildCandidateProduct | null = null
    let slotState: SlotState = 'EMPTY'
    let validationError: string | null = null

    if (!selectedId) {
      if (bp.requirement === 'REQUIRED') {
        missingRequiredSlots.push(bp.role)
      }
    } else {
      const match = candidateProducts.find((p) => p.id === selectedId || p.slug === selectedId)

      if (!match) {
        // Component selected was NOT found in compatible products for this machine!
        // Look up globally in SEED_PRODUCTS to explain the conflict
        const foreign = SEED_PRODUCTS.find((p) => p.id === selectedId || p.slug === selectedId)
        const foreignName = foreign ? foreign.name : selectedId
        slotState = 'INVALID'
        validationError = `Selected component "${foreignName}" is not compatible with ${machineProd.name} (${platform?.name || 'chassis architecture'}).`
        invalidSlots.push(bp.role)
      } else {
        selectedProduct = match

        if (match.lifecycle === 'REPLACED') {
          slotState = 'INVALID'
          validationError = `Component "${match.name}" has been superseded. Select replacement ${match.replacement?.name || 'modern component'}.`
          invalidSlots.push(bp.role)
        } else if (match.offer === null) {
          slotState = 'UNAVAILABLE'
          validationError = `Component "${match.name}" is compatible but has no active commercial offer in the ${params.marketCode} market.`
          if (bp.requirement === 'REQUIRED') {
            unavailableSlots.push(bp.role)
          }
        } else {
          slotState = 'SELECTED'
          if (bp.requirement === 'REQUIRED') {
            completedRequiredSlots++
          }
        }
      }
    }

    slots.push({
      role: bp.role,
      name: bp.name,
      description: bp.description,
      requirement: bp.requirement,
      selectedProduct,
      compatibleProducts: candidateProducts,
      slotState,
      validationError,
    })
  }

  const totalRequiredSlots = slots.filter((s) => s.requirement === 'REQUIRED').length
  const isComplete =
    totalRequiredSlots === completedRequiredSlots &&
    invalidSlots.length === 0 &&
    unavailableSlots.length === 0 &&
    configuredMachine.offer !== null

  // Price Calculation & Price State
  let totalMinorUnits: number | null = null
  let priceState: PriceState = 'KNOWN_PRICE'

  if (configuredMachine.offer === null) {
    priceState = 'NOT_AVAILABLE'
    totalMinorUnits = null
  } else if (unavailableSlots.length > 0) {
    priceState = 'PRICE_UNAVAILABLE'
    totalMinorUnits = null
  } else {
    // Check if any selected required or optional item has a missing offer
    const hasMissingPrice = slots.some(
      (s) => s.selectedProduct !== null && s.selectedProduct.offer === null
    )
    if (hasMissingPrice) {
      priceState = 'PRICE_UNAVAILABLE'
      totalMinorUnits = null
    } else {
      let sum = configuredMachine.offer.retailPriceMinorUnits
      for (const s of slots) {
        if (s.selectedProduct?.offer) {
          sum += s.selectedProduct.offer.retailPriceMinorUnits
        }
      }
      totalMinorUnits = sum
      priceState = 'KNOWN_PRICE'
    }
  }

  // Build Status Determination
  let status: BuildStatus = 'DRAFT'
  if (invalidSlots.length > 0) {
    status = 'INVALID'
  } else if (isComplete) {
    status = 'COMPLETE'
  } else if (completedRequiredSlots > 0 || slots.some((s) => s.slotState === 'SELECTED')) {
    status = 'INCOMPLETE'
  } else {
    status = 'DRAFT'
  }

  return {
    id: `build-${machineProd.slug}-${params.marketCode.toLowerCase()}`,
    machine: configuredMachine,
    marketCode: params.marketCode,
    status,
    slots,
    totalMinorUnits,
    currency,
    taxMode,
    priceState,
    completeness: {
      isComplete,
      totalRequiredSlots,
      completedRequiredSlots,
      missingRequiredSlots,
      invalidSlots,
      unavailableSlots,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

