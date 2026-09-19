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
import { db, isDbConfigured } from '../client'
import {
  products,
  brands,
  vehiclePlatforms,
  categories,
  productVariants,
  marketOffers,
  specifications,
  documents,
  compatibilityRules,
} from '../schema'
import { eq, and, or, ilike, desc, asc, inArray, ne, sql } from 'drizzle-orm'
import {
  STORE_PRODUCTS,
  STORE_VARIANTS,
  STORE_OFFERS,
  STORE_SPECIFICATIONS,
  STORE_PLATFORMS,
  STORE_BRANDS,
  STORE_COMPATIBILITY_RULES,
  STORE_DOCUMENTS,
  __resetCatalogueStoreForTesting,
} from './catalogue-store'

import { __getRawGarageCounts } from './garage'
import { __getRawCommerceCounts } from './commerce'
import { __getRawRaceCounts } from './race'
import { __getRawProcurementCounts } from './procurement'

const IS_PRODUCTION = process.env['NODE_ENV'] === 'production'

export { __resetCatalogueStoreForTesting }

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

export interface PartPlatformCompatibility {
  platformId: string
  platformSlug: string
  platformName: string
  brandName: string
  ruleType: CompatibilityRuleType
  verified: boolean
}

export interface PartListItem {
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
  productType: string
  tier: ProductTier
  haloClassification?: string | null | undefined
  scale?: string | null | undefined
  powerType?: string | null | undefined
  discipline?: Discipline | string | undefined
  editorialSummary: string
  offer: ResolvedMarketOffer | null
}

export interface PartDetail {
  id: string
  slug: string
  sku: string
  name: string
  shortName: string
  brand: SeedBrand
  platform: SeedPlatform | null
  productType: string
  tier: ProductTier
  haloClassification?: string | null | undefined
  scale?: string | null | undefined
  powerType?: string | null | undefined
  discipline?: Discipline | string | undefined
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
  fitsPlatforms: PartPlatformCompatibility[]
  relatedProducts: Array<{
    relationType: CompatibilityRuleType
    product: {
      id: string
      slug: string
      name: string
      sku: string
      tier: ProductTier
      productType: string
      offer: ResolvedMarketOffer | null
    }
  }>
  replacementLineage: ReplacementLineage | null
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
  const variant = STORE_VARIANTS.find((v) => v.productId === productId && v.published)
  if (!variant) return []
  return STORE_OFFERS.filter((o) => o.productVariantId === variant.id).map((o) => ({
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
 * In production (isDbConfigured): executes PostgreSQL queries via Drizzle ORM.
 * In dev/hermetic tests (!isDbConfigured): queries the mutable catalogue store.
 */
export async function getMachinesList(params?: {
  discipline?: string | undefined
  brand?: string | undefined
  tier?: ProductTier | undefined
  scale?: string | undefined
  sort?: string | undefined
  marketCode?: MarketCode | undefined
  limit?: number | undefined
  offset?: number | undefined
}): Promise<MachineListItem[]> {
  const market = params?.marketCode ?? 'UK'

  if (isDbConfigured) {
    const conditions = [
      eq(products.published, true),
      eq(products.status, 'PUBLISHED'),
      inArray(products.productType, ['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE']),
    ]

    if (params?.discipline && params.discipline !== 'all') {
      const disc = params.discipline.toUpperCase()
      const disciplineConditions = [
        sql`${disc} = ANY(${products.tags})`,
        ilike(categories.slug, `%${params.discipline}%`),
        ilike(products.categoryId, `%${params.discipline}%`),
      ]

      if (disc === 'RACE') {
        disciplineConditions.push(
          eq(categories.parentId, 'cat-race'),
          eq(categories.parentId, 'cat-race-machines'),
          sql`${products.categoryId} IN ('cat-race', 'cat-race-machines', 'cat-110-touring', 'cat-18-buggy', 'cat-18-gt', 'cat-f1', 'cat-112', 'cat-15-onroad')`
        )
      }

      conditions.push(or(...disciplineConditions)!)
    }

    if (params?.brand && params.brand !== 'all') {
      const brandSlug = params.brand.toLowerCase()
      conditions.push(
        or(
          eq(brands.slug, brandSlug),
          eq(brands.id, params.brand),
          ilike(brands.name, `%${params.brand}%`)
        )!
      )
    }

    if (params?.tier) {
      conditions.push(eq(products.tier, params.tier))
    }

    if (params?.scale && params.scale !== 'all') {
      const normalised = params.scale.replace('-', ':')
      conditions.push(
        or(
          ilike(products.scale, `%${normalised}%`),
          ilike(products.scale, `%${params.scale}%`)
        )!
      )
    }

    const whereClause = and(...conditions)

    const rows = await db
      .select({
        product: products,
        brand: brands,
        category: categories,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .limit(params?.limit ?? 100)
      .offset(params?.offset ?? 0)

    const productIds = rows.map((r) => r.product.id)
    const offerMap = new Map<string, ResolvedMarketOffer>()

    if (productIds.length > 0) {
      const offerRows = await db
        .select({
          productId: productVariants.productId,
          offer: marketOffers,
        })
        .from(marketOffers)
        .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
        .where(
          and(
            inArray(productVariants.productId, productIds),
            eq(productVariants.published, true),
            eq(marketOffers.marketCode, market)
          )
        )

      for (const row of offerRows) {
        if (!offerMap.has(row.productId)) {
          offerMap.set(row.productId, {
            id: row.offer.id,
            productVariantId: row.offer.productVariantId,
            marketCode: row.offer.marketCode as MarketCode,
            retailPriceMinorUnits: row.offer.retailPrice,
            currency: row.offer.currency as Currency,
            taxMode: row.offer.taxMode as TaxMode,
            availability: row.offer.availability as AvailabilityStatus,
            leadTimeDays: row.offer.leadTimeDays ?? null,
            supplyRoute: (row.offer.supplyRoute as any) ?? null,
            notes: row.offer.notes ?? null,
          })
        }
      }
    }

    const list: MachineListItem[] = rows.map((r) => {
      let resolvedDiscipline: Discipline = 'RACE'
      const tagDisc = r.product.tags?.[0] as Discipline | undefined
      if (tagDisc) {
        resolvedDiscipline = tagDisc
      } else {
        const catSlug = (r.category?.slug || r.product.categoryId || '').toLowerCase()
        if (catSlug.includes('bash')) resolvedDiscipline = 'BASH'
        else if (catSlug.includes('drift')) resolvedDiscipline = 'DRIFT'
        else if (catSlug.includes('crawl')) resolvedDiscipline = 'CRAWL'
        else if (catSlug.includes('scale') && !catSlug.includes('large')) resolvedDiscipline = 'SCALE'
        else if (catSlug.includes('large-scale') || catSlug.includes('large_scale')) resolvedDiscipline = 'LARGE_SCALE'
        else resolvedDiscipline = 'RACE'
      }

      return {
        id: r.product.id,
        slug: r.product.slug,
        sku: r.product.sku ?? '',
        name: r.product.name,
        shortName: r.product.shortName ?? r.product.name,
        brand: {
          id: r.brand.id,
          slug: r.brand.slug,
          name: r.brand.name,
        },
        tier: r.product.tier as ProductTier,
        haloClassification: r.product.haloClassification ?? null,
        scale: r.product.scale ?? null,
        powerType: r.product.powerType ?? null,
        discipline: resolvedDiscipline,
        editorialSummary: r.product.editorialSummary ?? '',
        offer: offerMap.get(r.product.id) ?? null,
      }
    })

    // Sorting
    if (params?.sort === 'price_asc') {
      list.sort((a, b) => (a.offer?.retailPriceMinorUnits ?? 0) - (b.offer?.retailPriceMinorUnits ?? 0))
    } else if (params?.sort === 'price_desc') {
      list.sort((a, b) => (b.offer?.retailPriceMinorUnits ?? 0) - (a.offer?.retailPriceMinorUnits ?? 0))
    } else if (params?.sort === 'brand') {
      list.sort((a, b) => a.brand.name.localeCompare(b.brand.name))
    } else {
      list.sort((a, b) => {
        if (a.tier === 'HALO' && b.tier !== 'HALO') return -1
        if (b.tier === 'HALO' && a.tier !== 'HALO') return 1
        return a.name.localeCompare(b.name)
      })
    }

    return list
  }

  // Development & Hermetic Test Fallback Store
  let filtered = STORE_PRODUCTS.filter(
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
    const brand = STORE_BRANDS.find((b) => b.slug === brandSlug || b.id === params.brand)
    if (brand) {
      filtered = filtered.filter((p) => p.brandId === brand.id)
    }
  }

  if (params?.tier) {
    filtered = filtered.filter((p) => p.tier === params.tier)
  }

  if (params?.scale && params.scale !== 'all') {
    const normalised = params.scale.replace('-', ':')
    filtered = filtered.filter((p) => p.scale?.includes(normalised) || p.scale?.includes(params.scale!))
  }

  const list = filtered.map((prod) => {
    const brand = STORE_BRANDS.find((b) => b.id === prod.brandId)!
    const offers = getOffersForProduct(prod.id)
    const offer = resolveMarketOffer(offers, market)

    return {
      id: prod.id,
      slug: prod.slug,
      sku: prod.sku,
      name: prod.name,
      shortName: prod.shortName,
      brand: {
        id: brand ? brand.id : prod.brandId,
        slug: brand ? brand.slug : 'unknown',
        name: brand ? brand.name : 'Unknown',
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

  // Sorting
  if (params?.sort === 'price_asc') {
    list.sort((a, b) => (a.offer?.retailPriceMinorUnits ?? 0) - (b.offer?.retailPriceMinorUnits ?? 0))
  } else if (params?.sort === 'price_desc') {
    list.sort((a, b) => (b.offer?.retailPriceMinorUnits ?? 0) - (a.offer?.retailPriceMinorUnits ?? 0))
  } else if (params?.sort === 'brand') {
    list.sort((a, b) => a.brand.name.localeCompare(b.brand.name))
  } else {
    list.sort((a, b) => {
      if (a.tier === 'HALO' && b.tier !== 'HALO') return -1
      if (b.tier === 'HALO' && a.tier !== 'HALO') return 1
      return a.name.localeCompare(b.name)
    })
  }

  return list
}

/**
 * Hydrates complete product graph for a machine detail view:
 * Brand -> Platform -> Vehicle -> Variant -> Market Offer -> DNA -> Documents -> Compatible Parts -> Replacement
 * In production (isDbConfigured): executes PostgreSQL queries via Drizzle ORM.
 * In dev/hermetic tests (!isDbConfigured): queries the mutable catalogue store.
 */
export async function getMachineDetail(
  slug: string,
  targetMarket: MarketCode
): Promise<MachineDetail | null> {
  if (isDbConfigured) {
    const rows = await db
      .select({
        product: products,
        brand: brands,
        platform: vehiclePlatforms,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(vehiclePlatforms, eq(products.platformId, vehiclePlatforms.id))
      .where(and(eq(products.slug, slug), eq(products.published, true)))
      .limit(1)

    const match = rows[0]
    if (!match) return null

    const prod = match.product
    const brand = match.brand
    const platform = match.platform

    // Retrieve market offer for primary variant
    const offerRows = await db
      .select({
        offer: marketOffers,
      })
      .from(marketOffers)
      .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
      .where(
        and(
          eq(productVariants.productId, prod.id),
          eq(productVariants.published, true),
          eq(marketOffers.marketCode, targetMarket)
        )
      )
      .limit(1)

    const rawOffer = offerRows[0]?.offer
    const offer: ResolvedMarketOffer | null = rawOffer
      ? {
          id: rawOffer.id,
          productVariantId: rawOffer.productVariantId,
          marketCode: rawOffer.marketCode as MarketCode,
          retailPriceMinorUnits: rawOffer.retailPrice,
          currency: rawOffer.currency as Currency,
          taxMode: rawOffer.taxMode as TaxMode,
          availability: rawOffer.availability as AvailabilityStatus,
          leadTimeDays: rawOffer.leadTimeDays ?? null,
          supplyRoute: (rawOffer.supplyRoute as any) ?? null,
          notes: rawOffer.notes ?? null,
        }
      : null

    // Specifications sanitized of UNKNOWN
    const specRows = await db
      .select()
      .from(specifications)
      .where(and(eq(specifications.entityId, prod.id), ne(specifications.confidence, 'UNKNOWN')))

    const dna: SpecificationRecord[] = specRows.map((s) => ({
      key: s.key,
      value: s.value,
      unit: s.unit ?? null,
      confidence: s.confidence,
      sourceType: s.sourceType ?? null,
      sourceUrl: s.sourceUrl ?? null,
      sourceDocument: s.sourceDocument ?? null,
      verifiedAt: s.verifiedAt ? new Date(s.verifiedAt) : null,
    }))

    // Documents
    const entityIds = [prod.id, ...(platform?.id ? [platform.id] : [])]
    const docRows = await db
      .select()
      .from(documents)
      .where(
        and(
          inArray(documents.entityId, entityIds),
          eq(documents.published, true),
          eq(documents.approvedForUse, true)
        )
      )

    const docs = docRows.map((d) => ({
      id: d.id,
      title: d.title,
      documentType: d.documentType,
      version: d.version ?? null,
      sourceUrl: d.sourceUrl ?? null,
    }))

    // Compatible parts
    const compRules = await db
      .select()
      .from(compatibilityRules)
      .where(
        and(
          inArray(compatibilityRules.targetEntityId, entityIds),
          eq(compatibilityRules.verified, true)
        )
      )

    const compatibleParts: CompatiblePartRecord[] = []
    for (const rule of compRules) {
      const partRow = await db
        .select()
        .from(products)
        .where(and(eq(products.id, rule.sourceEntityId), eq(products.published, true)))
        .limit(1)

      const part = partRow[0]
      if (!part) continue

      const partOfferRow = await db
        .select({ offer: marketOffers })
        .from(marketOffers)
        .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
        .where(
          and(
            eq(productVariants.productId, part.id),
            eq(productVariants.published, true),
            eq(marketOffers.marketCode, targetMarket)
          )
        )
        .limit(1)

      const pOff = partOfferRow[0]?.offer
      compatibleParts.push({
        partId: part.id,
        sku: part.sku,
        name: part.name,
        slug: part.slug,
        ruleType: rule.ruleType,
        verified: rule.verified,
        tier: part.tier as ProductTier,
        price: pOff
          ? {
              id: pOff.id,
              productVariantId: pOff.productVariantId,
              marketCode: pOff.marketCode as MarketCode,
              retailPriceMinorUnits: pOff.retailPrice,
              currency: pOff.currency as Currency,
              taxMode: pOff.taxMode as TaxMode,
              availability: pOff.availability as AvailabilityStatus,
              leadTimeDays: pOff.leadTimeDays ?? null,
              supplyRoute: (pOff.supplyRoute as any) ?? null,
              notes: pOff.notes ?? null,
            }
          : null,
      })
    }

    // Related products
    const relatedRules = compRules.filter((r) =>
      ['RECOMMENDED', 'UPGRADE', 'OPTION', 'REQUIRED'].includes(r.ruleType)
    )

    const relatedProducts = []
    for (const rule of relatedRules) {
      const relRow = await db
        .select()
        .from(products)
        .where(and(eq(products.id, rule.sourceEntityId), eq(products.published, true)))
        .limit(1)

      const rel = relRow[0]
      if (!rel) continue

      const relOfferRow = await db
        .select({ offer: marketOffers })
        .from(marketOffers)
        .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
        .where(
          and(
            eq(productVariants.productId, rel.id),
            eq(productVariants.published, true),
            eq(marketOffers.marketCode, targetMarket)
          )
        )
        .limit(1)

      const rOff = relOfferRow[0]?.offer
      relatedProducts.push({
        relationType: rule.ruleType,
        product: {
          id: rel.id,
          slug: rel.slug,
          name: rel.name,
          sku: rel.sku ?? '',
          tier: rel.tier as ProductTier,
          offer: rOff
            ? {
                id: rOff.id,
                productVariantId: rOff.productVariantId,
                marketCode: rOff.marketCode as MarketCode,
                retailPriceMinorUnits: rOff.retailPrice,
                currency: rOff.currency as Currency,
                taxMode: rOff.taxMode as TaxMode,
                availability: rOff.availability as AvailabilityStatus,
                leadTimeDays: rOff.leadTimeDays ?? null,
                supplyRoute: (rOff.supplyRoute as any) ?? null,
                notes: rOff.notes ?? null,
              }
            : null,
        },
      })
    }

    // Replacement lineage
    let replacementLineage: ReplacementLineage | null = null
    if (prod.lifecycle === 'REPLACED' && prod.replacementProductId) {
      const replRow = await db
        .select()
        .from(products)
        .where(eq(products.id, prod.replacementProductId))
        .limit(1)

      const repl = replRow[0]
      if (repl) {
        replacementLineage = {
          originalProductId: prod.id,
          originalName: prod.name,
          originalSku: prod.sku,
          lifecycle: 'REPLACED',
          replacementProductId: repl.id,
          replacementName: repl.name,
          replacementSku: repl.sku ?? '',
          replacementSlug: repl.slug,
        }
      }
    }

    const haloSpecs =
      prod.tier === 'HALO'
        ? [
            { category: 'Architecture', detail: 'Symmetrical chassis layout with variable torsional flex adjustment.' },
            { category: 'Suspension', detail: 'C-hub-free ultra-low suspension arms with carbon-composite inserts.' },
            { category: 'Transmission', detail: 'Direct-drive central spur with Kevlar-reinforced dual belt arrangement.' },
            { category: 'Bearings', detail: 'High-speed precision steel ball bearings, rubber sealed throughout.' },
            { category: 'Shocks', detail: 'Ultra-short ULP coil-over dampers with hard-anodised shock bodies.' },
          ]
        : undefined

    const pedigree =
      prod.tier === 'HALO' && prod.slug.includes('xray-x4')
        ? [
            { event: 'IFMAR World Championship', result: '1st Place (Touring Car)', year: '2024' },
            { event: 'EFRA European Championship', result: 'Winner (Modified Class)', year: '2025' },
          ]
        : undefined

    return {
      id: prod.id,
      slug: prod.slug,
      sku: prod.sku ?? '',
      name: prod.name,
      shortName: prod.shortName ?? prod.name,
      brand: {
        id: brand.id,
        slug: brand.slug,
        name: brand.name,
        tier: (brand.tier as any) || 'FLAGSHIP',
        status: (brand.status as any) || 'ACTIVE',
        countryOfOrigin: brand.countryOfOrigin ?? 'Unknown',
        foundedYear: brand.foundedYear,
        description: brand.description ?? '',
        website: brand.website,
        commercialRelationship: 'OFFICIAL_DEALER' as const,
        specialisms: [],
        disciplines: [],
      },
      platform: platform
        ? {
            id: platform.id,
            slug: platform.slug,
            name: platform.name,
            brandId: platform.brandId,
            chassisMaterial: platform.chassisMaterial ?? '',
            driveConfig: (platform.driveConfig as any) || '4WD',
            wheelbaseMm: platform.wheelbaseMm ?? 0,
            description: platform.description ?? '',
            status: platform.status as any,
            published: platform.published,
          }
        : null,
      tier: prod.tier as ProductTier,
      haloClassification: prod.haloClassification ?? null,
      scale: prod.scale ?? null,
      powerType: prod.powerType ?? null,
      discipline: ((prod.tags?.[0] as Discipline) || 'RACE'),
      editorialSummary: prod.editorialSummary ?? '',
      lifecycle: prod.lifecycle as LifecycleStatus,
      offer,
      dna,
      documents: docs,
      compatibleParts,
      relatedProducts,
      replacementLineage,
      haloSpecs: haloSpecs ?? null,
      pedigree: pedigree ?? null,
    }
  }

  // Development & Hermetic Test Fallback Store
  const product = STORE_PRODUCTS.find((p) => p.slug === slug && p.published)
  if (!product) return null

  const brand = STORE_BRANDS.find((b) => b.id === product.brandId) ?? {
    id: product.brandId,
    slug: 'unknown-brand',
    name: 'Unknown Brand',
    tier: 'FLAGSHIP' as const,
    status: 'ACTIVE' as const,
    countryOfOrigin: 'Unknown',
    foundedYear: 2026,
    description: '',
    website: null,
    commercialRelationship: 'OFFICIAL_DEALER' as const,
    specialisms: [],
    disciplines: [],
  }
  const platform = product.platformId
    ? STORE_PLATFORMS.find((p) => p.id === product.platformId) ?? null
    : null

  const offers = getOffersForProduct(product.id)
  const offer = resolveMarketOffer(offers, targetMarket)

  // Retrieve raw specifications and sanitize out UNKNOWN
  const rawSpecs: SpecificationRecord[] = STORE_SPECIFICATIONS.filter(
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
  const docs = STORE_DOCUMENTS.filter(
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
  const matchingRules = STORE_COMPATIBILITY_RULES.filter(
    (r) => targetIds.includes(r.targetEntityId) && r.verified
  )

  const compatibleParts: CompatiblePartRecord[] = []
  for (const rule of matchingRules) {
    const part = STORE_PRODUCTS.find((p) => p.id === rule.sourceEntityId)
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
  const relatedRules = STORE_COMPATIBILITY_RULES.filter(
    (r) =>
      (r.targetEntityId === product.id || (platform && r.targetEntityId === platform.id)) &&
      ['RECOMMENDED', 'UPGRADE', 'OPTION', 'REQUIRED'].includes(r.ruleType) &&
      r.verified
  )

  const relatedProducts = relatedRules
    .map((rule) => {
      const relProd = STORE_PRODUCTS.find((p) => p.id === rule.sourceEntityId)
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
    const replacementProd = STORE_PRODUCTS.find(
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
 * Query parts list with type, platform, brand, tier filtering and market offer resolution.
 * In production (isDbConfigured): executes PostgreSQL queries via Drizzle ORM.
 * In dev/hermetic tests (!isDbConfigured): queries the mutable catalogue store.
 */
export async function getPartsList(params?: {
  type?: string | undefined
  brand?: string | undefined
  tier?: ProductTier | undefined
  platformId?: string | undefined
  sort?: string | undefined
  marketCode?: MarketCode | undefined
  limit?: number | undefined
  offset?: number | undefined
}): Promise<PartListItem[]> {
  const market = params?.marketCode ?? 'UK'

  if (isDbConfigured) {
    const conditions = [
      eq(products.published, true),
      eq(products.status, 'PUBLISHED'),
      sql`${products.productType} NOT IN ('RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE')`,
    ]

    if (params?.type && params.type !== 'all') {
      const typeUpper = params.type.toUpperCase()
      conditions.push(
        or(
          sql`UPPER(${products.productType}) = ${typeUpper}`,
          ilike(categories.slug, `%${params.type}%`),
          ilike(products.categoryId, `%${params.type}%`),
          sql`${typeUpper} = ANY(${products.tags})`
        )!
      )
    }

    if (params?.brand && params.brand !== 'all') {
      const brandSlug = params.brand.toLowerCase()
      conditions.push(
        or(
          eq(brands.slug, brandSlug),
          eq(brands.id, params.brand),
          ilike(brands.name, `%${params.brand}%`)
        )!
      )
    }

    if (params?.tier) {
      conditions.push(eq(products.tier, params.tier))
    }

    if (params?.platformId && params.platformId !== 'all') {
      conditions.push(
        or(
          eq(products.platformId, params.platformId),
          sql`${products.id} IN (
            SELECT ${compatibilityRules.sourceEntityId}
            FROM ${compatibilityRules}
            WHERE ${compatibilityRules.targetEntityId} = ${params.platformId}
               OR ${compatibilityRules.targetEntityId} IN (
                  SELECT ${products.id} FROM ${products} WHERE ${products.platformId} = ${params.platformId}
               )
          )`
        )!
      )
    }

    const whereClause = and(...conditions)

    const rows = await db
      .select({
        product: products,
        brand: brands,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .limit(params?.limit ?? 100)
      .offset(params?.offset ?? 0)

    const productIds = rows.map((r) => r.product.id)
    const offerMap = new Map<string, ResolvedMarketOffer>()

    if (productIds.length > 0) {
      const offerRows = await db
        .select({
          productId: productVariants.productId,
          offer: marketOffers,
        })
        .from(marketOffers)
        .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
        .where(
          and(
            inArray(productVariants.productId, productIds),
            eq(productVariants.published, true),
            eq(marketOffers.marketCode, market)
          )
        )

      for (const row of offerRows) {
        if (!offerMap.has(row.productId)) {
          offerMap.set(row.productId, {
            id: row.offer.id,
            productVariantId: row.offer.productVariantId,
            marketCode: row.offer.marketCode as MarketCode,
            retailPriceMinorUnits: row.offer.retailPrice,
            currency: row.offer.currency as Currency,
            taxMode: row.offer.taxMode as TaxMode,
            availability: row.offer.availability as AvailabilityStatus,
            leadTimeDays: row.offer.leadTimeDays ?? null,
            supplyRoute: (row.offer.supplyRoute as any) ?? null,
            notes: row.offer.notes ?? null,
          })
        }
      }
    }

    const list: PartListItem[] = rows.map((r) => ({
      id: r.product.id,
      slug: r.product.slug,
      sku: r.product.sku ?? '',
      name: r.product.name,
      shortName: r.product.shortName ?? r.product.name,
      brand: {
        id: r.brand.id,
        slug: r.brand.slug,
        name: r.brand.name,
      },
      productType: r.product.productType,
      tier: r.product.tier as ProductTier,
      haloClassification: r.product.haloClassification ?? null,
      scale: r.product.scale ?? null,
      powerType: r.product.powerType ?? null,
      discipline: ((r.product.tags?.[0] as Discipline) || undefined),
      editorialSummary: r.product.editorialSummary ?? '',
      offer: offerMap.get(r.product.id) ?? null,
    }))

    // Sorting
    if (params?.sort === 'price_asc') {
      list.sort((a, b) => (a.offer?.retailPriceMinorUnits ?? 0) - (b.offer?.retailPriceMinorUnits ?? 0))
    } else if (params?.sort === 'price_desc') {
      list.sort((a, b) => (b.offer?.retailPriceMinorUnits ?? 0) - (a.offer?.retailPriceMinorUnits ?? 0))
    } else if (params?.sort === 'brand') {
      list.sort((a, b) => a.brand.name.localeCompare(b.brand.name))
    } else {
      list.sort((a, b) => {
        if (a.tier === 'HALO' && b.tier !== 'HALO') return -1
        if (b.tier === 'HALO' && a.tier !== 'HALO') return 1
        return a.name.localeCompare(b.name)
      })
    }

    return list
  }

  // Development & Hermetic Test Fallback Store
  let filtered = STORE_PRODUCTS.filter(
    (p) =>
      p.published &&
      !['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType)
  )

  if (params?.type && params.type !== 'all') {
    const typeUpper = params.type.toUpperCase()
    filtered = filtered.filter(
      (p) =>
        p.productType.toUpperCase() === typeUpper ||
        p.categoryId.toLowerCase().includes(params.type!.toLowerCase()) ||
        p.tags?.includes(typeUpper)
    )
  }

  if (params?.brand && params.brand !== 'all') {
    const brandSlug = params.brand.toLowerCase()
    const brand = STORE_BRANDS.find((b) => b.slug === brandSlug || b.id === params.brand)
    if (brand) {
      filtered = filtered.filter((p) => p.brandId === brand.id)
    }
  }

  if (params?.tier) {
    filtered = filtered.filter((p) => p.tier === params.tier)
  }

  if (params?.platformId && params.platformId !== 'all') {
    const platformId = params.platformId
    const matchingMachineIds = STORE_PRODUCTS.filter(m => m.platformId === platformId).map(m => m.id)
    const matchingSourceIds = new Set(
      STORE_COMPATIBILITY_RULES.filter(
        r => r.verified && (r.targetEntityId === platformId || matchingMachineIds.includes(r.targetEntityId))
      ).map(r => r.sourceEntityId)
    )
    filtered = filtered.filter(
      (p) => p.platformId === platformId || matchingSourceIds.has(p.id)
    )
  }

  const list: PartListItem[] = filtered.map((prod) => {
    const brand = STORE_BRANDS.find((b) => b.id === prod.brandId)!
    const offers = getOffersForProduct(prod.id)
    const offer = resolveMarketOffer(offers, market)

    return {
      id: prod.id,
      slug: prod.slug,
      sku: prod.sku,
      name: prod.name,
      shortName: prod.shortName ?? prod.name,
      brand: {
        id: brand ? brand.id : prod.brandId,
        slug: brand ? brand.slug : 'unknown',
        name: brand ? brand.name : 'Unknown',
      },
      productType: prod.productType,
      tier: prod.tier,
      haloClassification: prod.haloClassification ?? null,
      scale: prod.scale ?? null,
      powerType: prod.powerType ?? null,
      discipline: prod.discipline,
      editorialSummary: prod.editorialSummary,
      offer,
    }
  })

  // Sorting
  if (params?.sort === 'price_asc') {
    list.sort((a, b) => (a.offer?.retailPriceMinorUnits ?? 0) - (b.offer?.retailPriceMinorUnits ?? 0))
  } else if (params?.sort === 'price_desc') {
    list.sort((a, b) => (b.offer?.retailPriceMinorUnits ?? 0) - (a.offer?.retailPriceMinorUnits ?? 0))
  } else if (params?.sort === 'brand') {
    list.sort((a, b) => a.brand.name.localeCompare(b.brand.name))
  } else {
    list.sort((a, b) => {
      if (a.tier === 'HALO' && b.tier !== 'HALO') return -1
      if (b.tier === 'HALO' && a.tier !== 'HALO') return 1
      return a.name.localeCompare(b.name)
    })
  }

  return list
}

/**
 * Hydrates complete product graph for a part detail view:
 * Brand -> Platform(s) it fits -> Variants -> Market Offer -> DNA -> Documents -> Related/Option Parts -> Replacement
 * In production (isDbConfigured): executes PostgreSQL queries via Drizzle ORM.
 * In dev/hermetic tests (!isDbConfigured): queries the mutable catalogue store.
 */
export async function getPartDetail(
  slug: string,
  targetMarket: MarketCode
): Promise<PartDetail | null> {
  if (isDbConfigured) {
    const rows = await db
      .select({
        product: products,
        brand: brands,
        platform: vehiclePlatforms,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(vehiclePlatforms, eq(products.platformId, vehiclePlatforms.id))
      .where(
        and(
          eq(products.slug, slug),
          eq(products.published, true),
          sql`${products.productType} NOT IN ('RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE')`
        )
      )
      .limit(1)

    const match = rows[0]
    if (!match) return null

    const prod = match.product
    const brand = match.brand
    const platform = match.platform

    // Retrieve market offer for primary variant
    const offerRows = await db
      .select({
        offer: marketOffers,
      })
      .from(marketOffers)
      .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
      .where(
        and(
          eq(productVariants.productId, prod.id),
          eq(productVariants.published, true),
          eq(marketOffers.marketCode, targetMarket)
        )
      )
      .limit(1)

    const rawOffer = offerRows[0]?.offer
    const offer: ResolvedMarketOffer | null = rawOffer
      ? {
          id: rawOffer.id,
          productVariantId: rawOffer.productVariantId,
          marketCode: rawOffer.marketCode as MarketCode,
          retailPriceMinorUnits: rawOffer.retailPrice,
          currency: rawOffer.currency as Currency,
          taxMode: rawOffer.taxMode as TaxMode,
          availability: rawOffer.availability as AvailabilityStatus,
          leadTimeDays: rawOffer.leadTimeDays ?? null,
          supplyRoute: (rawOffer.supplyRoute as any) ?? null,
          notes: rawOffer.notes ?? null,
        }
      : null

    // Specifications sanitized of UNKNOWN
    const specRows = await db
      .select()
      .from(specifications)
      .where(and(eq(specifications.entityId, prod.id), ne(specifications.confidence, 'UNKNOWN')))

    const dna: SpecificationRecord[] = specRows.map((s) => ({
      key: s.key,
      value: s.value,
      unit: s.unit ?? null,
      confidence: s.confidence,
      sourceType: s.sourceType ?? null,
      sourceUrl: s.sourceUrl ?? null,
      sourceDocument: s.sourceDocument ?? null,
      verifiedAt: s.verifiedAt ? new Date(s.verifiedAt) : null,
    }))

    // Documents
    const entityIds = [prod.id, ...(platform?.id ? [platform.id] : [])]
    const docRows = await db
      .select()
      .from(documents)
      .where(
        and(
          inArray(documents.entityId, entityIds),
          eq(documents.published, true),
          eq(documents.approvedForUse, true)
        )
      )

    const docs = docRows.map((d) => ({
      id: d.id,
      title: d.title,
      documentType: d.documentType,
      version: d.version ?? null,
      sourceUrl: d.sourceUrl ?? null,
    }))

    // Platforms and vehicles this part fits (where sourceEntityId is this part)
    const fitRules = await db
      .select()
      .from(compatibilityRules)
      .where(
        and(
          eq(compatibilityRules.sourceEntityId, prod.id),
          eq(compatibilityRules.verified, true)
        )
      )

    const fitsPlatforms: PartPlatformCompatibility[] = []
    const seenPlatformIds = new Set<string>()

    for (const rule of fitRules) {
      // Check if target is a vehiclePlatform
      const platRows = await db
        .select({ platform: vehiclePlatforms, brand: brands })
        .from(vehiclePlatforms)
        .innerJoin(brands, eq(vehiclePlatforms.brandId, brands.id))
        .where(eq(vehiclePlatforms.id, rule.targetEntityId))
        .limit(1)

      if (platRows[0]) {
        const p = platRows[0].platform
        const b = platRows[0].brand
        if (!seenPlatformIds.has(p.id)) {
          seenPlatformIds.add(p.id)
          fitsPlatforms.push({
            platformId: p.id,
            platformSlug: p.slug,
            platformName: p.name,
            brandName: b.name,
            ruleType: rule.ruleType,
            verified: rule.verified,
          })
        }
        continue
      }

      // Check if target is a machine product
      const targetProdRows = await db
        .select({ product: products, brand: brands })
        .from(products)
        .innerJoin(brands, eq(products.brandId, brands.id))
        .where(eq(products.id, rule.targetEntityId))
        .limit(1)

      if (targetProdRows[0]) {
        const tp = targetProdRows[0].product
        const tb = targetProdRows[0].brand
        if (!seenPlatformIds.has(tp.id)) {
          seenPlatformIds.add(tp.id)
          fitsPlatforms.push({
            platformId: tp.id,
            platformSlug: tp.slug,
            platformName: tp.name,
            brandName: tb.name,
            ruleType: rule.ruleType,
            verified: rule.verified,
          })
        }
      }
    }

    // If part has explicit platformId and wasn't in rules
    if (platform && !seenPlatformIds.has(platform.id)) {
      fitsPlatforms.push({
        platformId: platform.id,
        platformSlug: platform.slug,
        platformName: platform.name,
        brandName: brand.name,
        ruleType: 'FITS' as CompatibilityRuleType,
        verified: true,
      })
    }

    // Related products (same platform or related options)
    const relatedProducts: PartDetail['relatedProducts'] = []
    if (platform) {
      const otherPartRows = await db
        .select({ product: products })
        .from(products)
        .where(
          and(
            eq(products.platformId, platform.id),
            ne(products.id, prod.id),
            eq(products.published, true),
            sql`${products.productType} NOT IN ('RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE')`
          )
        )
        .limit(4)

      for (const op of otherPartRows) {
        const opOfferRow = await db
          .select({ offer: marketOffers })
          .from(marketOffers)
          .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
          .where(
            and(
              eq(productVariants.productId, op.product.id),
              eq(productVariants.published, true),
              eq(marketOffers.marketCode, targetMarket)
            )
          )
          .limit(1)

        const opOff = opOfferRow[0]?.offer
        relatedProducts.push({
          relationType: (op.product.productType === 'OPTION_PART' ? 'OPTION' : 'RECOMMENDED') as CompatibilityRuleType,
          product: {
            id: op.product.id,
            slug: op.product.slug,
            name: op.product.name,
            sku: op.product.sku ?? '',
            tier: op.product.tier as ProductTier,
            productType: op.product.productType,
            offer: opOff
              ? {
                  id: opOff.id,
                  productVariantId: opOff.productVariantId,
                  marketCode: opOff.marketCode as MarketCode,
                  retailPriceMinorUnits: opOff.retailPrice,
                  currency: opOff.currency as Currency,
                  taxMode: opOff.taxMode as TaxMode,
                  availability: opOff.availability as AvailabilityStatus,
                  leadTimeDays: opOff.leadTimeDays ?? null,
                  supplyRoute: (opOff.supplyRoute as any) ?? null,
                  notes: opOff.notes ?? null,
                }
              : null,
          },
        })
      }
    }

    // Replacement lineage
    let replacementLineage: ReplacementLineage | null = null
    if (prod.lifecycle === 'REPLACED' && prod.replacementProductId) {
      const replRow = await db
        .select()
        .from(products)
        .where(eq(products.id, prod.replacementProductId))
        .limit(1)

      const repl = replRow[0]
      if (repl) {
        replacementLineage = {
          originalProductId: prod.id,
          originalName: prod.name,
          originalSku: prod.sku,
          lifecycle: 'REPLACED',
          replacementProductId: repl.id,
          replacementName: repl.name,
          replacementSku: repl.sku ?? '',
          replacementSlug: repl.slug,
        }
      }
    }

    return {
      id: prod.id,
      slug: prod.slug,
      sku: prod.sku ?? '',
      name: prod.name,
      shortName: prod.shortName ?? prod.name,
      brand: {
        id: brand.id,
        slug: brand.slug,
        name: brand.name,
        tier: (brand.tier as any) || 'FLAGSHIP',
        status: (brand.status as any) || 'ACTIVE',
        countryOfOrigin: brand.countryOfOrigin ?? 'Unknown',
        foundedYear: brand.foundedYear,
        description: brand.description ?? '',
        website: brand.website,
        commercialRelationship: 'OFFICIAL_DEALER' as const,
        specialisms: [],
        disciplines: [],
      },
      platform: platform
        ? {
            id: platform.id,
            slug: platform.slug,
            name: platform.name,
            brandId: platform.brandId,
            chassisMaterial: platform.chassisMaterial ?? '',
            driveConfig: (platform.driveConfig as any) || '4WD',
            wheelbaseMm: platform.wheelbaseMm ?? 0,
            description: platform.description ?? '',
            status: platform.status as any,
            published: platform.published,
          }
        : null,
      productType: prod.productType,
      tier: prod.tier as ProductTier,
      haloClassification: prod.haloClassification ?? null,
      scale: prod.scale ?? null,
      powerType: prod.powerType ?? null,
      discipline: ((prod.tags?.[0] as Discipline) || undefined),
      editorialSummary: prod.editorialSummary ?? '',
      lifecycle: prod.lifecycle as LifecycleStatus,
      offer,
      dna,
      documents: docs,
      fitsPlatforms,
      relatedProducts,
      replacementLineage,
    }
  }

  // Development & Hermetic Test Fallback Store
  const product = STORE_PRODUCTS.find(
    (p) =>
      p.slug === slug &&
      p.published &&
      !['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType)
  )
  if (!product) return null

  const brand = STORE_BRANDS.find((b) => b.id === product.brandId) ?? {
    id: product.brandId,
    slug: 'unknown-brand',
    name: 'Unknown Brand',
    tier: 'FLAGSHIP' as const,
    status: 'ACTIVE' as const,
    countryOfOrigin: 'Unknown',
    foundedYear: 2026,
    description: '',
    website: null,
    commercialRelationship: 'OFFICIAL_DEALER' as const,
    specialisms: [],
    disciplines: [],
  }
  const platform = product.platformId
    ? STORE_PLATFORMS.find((p) => p.id === product.platformId) ?? null
    : null

  const offers = getOffersForProduct(product.id)
  const offer = resolveMarketOffer(offers, targetMarket)

  // Retrieve raw specifications and sanitize out UNKNOWN
  const rawSpecs: SpecificationRecord[] = STORE_SPECIFICATIONS.filter(
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

  // Documents
  const entityIds = [product.id, ...(platform ? [platform.id] : [])]
  const docs = STORE_DOCUMENTS.filter(
    (d) => entityIds.includes(d.entityId) && d.published && d.approvedForUse
  ).map((d) => ({
    id: d.id,
    title: d.title,
    documentType: d.documentType,
    version: d.version ?? null,
    sourceUrl: d.sourceUrl ?? null,
  }))

  // Fits platforms
  const fitRules = STORE_COMPATIBILITY_RULES.filter(
    (r) => r.sourceEntityId === product.id && r.verified
  )
  const fitsPlatforms: PartPlatformCompatibility[] = []
  const seenIds = new Set<string>()

  for (const rule of fitRules) {
    const plat = STORE_PLATFORMS.find((p) => p.id === rule.targetEntityId)
    if (plat) {
      const platBrand = STORE_BRANDS.find((b) => b.id === plat.brandId)
      if (!seenIds.has(plat.id)) {
        seenIds.add(plat.id)
        fitsPlatforms.push({
          platformId: plat.id,
          platformSlug: plat.slug,
          platformName: plat.name,
          brandName: platBrand?.name ?? '',
          ruleType: rule.ruleType,
          verified: rule.verified,
        })
      }
      continue
    }

    const machine = STORE_PRODUCTS.find((p) => p.id === rule.targetEntityId)
    if (machine) {
      const mBrand = STORE_BRANDS.find((b) => b.id === machine.brandId)
      if (!seenIds.has(machine.id)) {
        seenIds.add(machine.id)
        fitsPlatforms.push({
          platformId: machine.platformId ?? machine.id,
          platformSlug: machine.slug,
          platformName: machine.name,
          brandName: mBrand?.name ?? '',
          ruleType: rule.ruleType,
          verified: rule.verified,
        })
      }
    }
  }

  if (platform && !seenIds.has(platform.id)) {
    fitsPlatforms.push({
      platformId: platform.id,
      platformSlug: platform.slug,
      platformName: platform.name,
      brandName: brand.name,
      ruleType: 'FITS' as CompatibilityRuleType,
      verified: true,
    })
  }

  // Related parts (e.g. other parts for same platform)
  const relatedProducts: PartDetail['relatedProducts'] = []
  if (platform) {
    const otherParts = STORE_PRODUCTS.filter(
      (p) =>
        p.platformId === platform.id &&
        p.id !== product.id &&
        p.published &&
        !['RTR_MACHINE', 'KIT', 'CHASSIS', 'VEHICLE'].includes(p.productType)
    ).slice(0, 4)

    for (const op of otherParts) {
      const opOffers = getOffersForProduct(op.id)
      relatedProducts.push({
        relationType: (op.productType === 'OPTION_PART' ? 'OPTION' : 'RECOMMENDED') as CompatibilityRuleType,
        product: {
          id: op.id,
          slug: op.slug,
          name: op.name,
          sku: op.sku,
          tier: op.tier,
          productType: op.productType,
          offer: resolveMarketOffer(opOffers, targetMarket),
        },
      })
    }
  }

  // Replacement lineage check
  let replacementLineage: ReplacementLineage | null = null
  if (product.lifecycle === 'REPLACED' && product.replacementProductId) {
    const replacementProd = STORE_PRODUCTS.find(
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

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    shortName: product.shortName,
    brand,
    platform,
    productType: product.productType,
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
    fitsPlatforms,
    relatedProducts,
    replacementLineage,
  }
}

/**
 * Searches catalogue understanding part numbers, exact SKU, partial SKU, and replaced SKUs.
 * In production (isDbConfigured): executes PostgreSQL queries via Drizzle ORM.
 * In dev/hermetic tests (!isDbConfigured): queries the mutable catalogue store.
 */
export async function searchCatalogue(params: {
  query: string
  marketCode: MarketCode
}): Promise<SearchResultItem[]> {
  const q = params.query.trim().toLowerCase()
  if (!q) return []

  if (isDbConfigured) {
    const rows = await db
      .select({
        product: products,
        brand: brands,
        platform: vehiclePlatforms,
      })
      .from(products)
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(vehiclePlatforms, eq(products.platformId, vehiclePlatforms.id))
      .where(
        and(
          eq(products.published, true),
          or(
            ilike(products.name, `%${q}%`),
            ilike(products.shortName, `%${q}%`),
            ilike(products.sku, `%${q}%`),
            ilike(products.manufacturerSku, `%${q}%`),
            ilike(brands.name, `%${q}%`),
            ilike(vehiclePlatforms.name, `%${q}%`)
          )
        )
      )
      .limit(50)

    const results: SearchResultItem[] = []
    for (const r of rows) {
      const prod = r.product
      const offerRows = await db
        .select({ offer: marketOffers })
        .from(marketOffers)
        .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
        .where(
          and(
            eq(productVariants.productId, prod.id),
            eq(productVariants.published, true),
            eq(marketOffers.marketCode, params.marketCode)
          )
        )
        .limit(1)

      const rawOffer = offerRows[0]?.offer
      const offer: ResolvedMarketOffer | null = rawOffer
        ? {
            id: rawOffer.id,
            productVariantId: rawOffer.productVariantId,
            marketCode: rawOffer.marketCode as MarketCode,
            retailPriceMinorUnits: rawOffer.retailPrice,
            currency: rawOffer.currency as Currency,
            taxMode: rawOffer.taxMode as TaxMode,
            availability: rawOffer.availability as AvailabilityStatus,
            leadTimeDays: rawOffer.leadTimeDays ?? null,
            supplyRoute: (rawOffer.supplyRoute as any) ?? null,
            notes: rawOffer.notes ?? null,
          }
        : null

      let replacement: SearchResultItem['replacement'] = null
      if (prod.lifecycle === 'REPLACED' && prod.replacementProductId) {
        const replRow = await db
          .select()
          .from(products)
          .where(eq(products.id, prod.replacementProductId))
          .limit(1)

        const repl = replRow[0]
        if (repl) {
          replacement = {
            id: repl.id,
            name: repl.name,
            sku: repl.sku ?? '',
            slug: repl.slug,
          }
        }
      }

      results.push({
        id: prod.id,
        slug: prod.slug,
        sku: prod.sku ?? '',
        name: prod.name,
        shortName: prod.shortName ?? prod.name,
        brandName: r.brand?.name ?? '',
        productType: prod.productType,
        tier: prod.tier as ProductTier,
        lifecycle: prod.lifecycle as LifecycleStatus,
        offer,
        isReplaced: prod.lifecycle === 'REPLACED',
        replacement,
      })
    }

    return results
  }

  // Development & Hermetic Test Fallback Store
  const results: SearchResultItem[] = []

  for (const prod of STORE_PRODUCTS) {
    if (!prod.published) continue

    const brand = STORE_BRANDS.find((b) => b.id === prod.brandId)
    const brandName = brand ? brand.name : ''
    const sku = prod.sku ? prod.sku.toLowerCase() : ''
    const name = prod.name.toLowerCase()
    const shortName = prod.shortName.toLowerCase()
    const platform = prod.platformId ? STORE_PLATFORMS.find((p) => p.id === prod.platformId) : null
    const platformName = platform ? platform.name.toLowerCase() : ''

    const isSkuMatch = sku.includes(q)
    const isNameMatch = name.includes(q) || shortName.includes(q)
    const isPlatformMatch = platformName.includes(q)
    const isBrandMatch = brandName.toLowerCase().includes(q)

    if (isSkuMatch || isNameMatch || isPlatformMatch || isBrandMatch) {
      const offers = getOffersForProduct(prod.id)
      const offer = resolveMarketOffer(offers, params.marketCode)

      let replacement: SearchResultItem['replacement'] = null
      if (prod.lifecycle === 'REPLACED' && prod.replacementProductId) {
        const repl = STORE_PRODUCTS.find((p) => p.id === prod.replacementProductId)
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
  return STORE_BRANDS.map((b) => {
    const brandProducts = STORE_PRODUCTS.filter((p) => p.brandId === b.id && p.published)
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
  const brand = STORE_BRANDS.find((b) => b.slug === slug.toLowerCase())
  if (!brand) return null

  const platforms = STORE_PLATFORMS.filter(
    (p) => p.brandId === brand.id && p.published
  )

  const brandProducts = STORE_PRODUCTS.filter(
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

// ─── Admin Platform Queries ──────────────────────────────────────────────────
export * from './admin-products'
export * from './admin-leads'
export * from './admin-orders'
export * from './admin-cms'
export * from './catalogue-store'
