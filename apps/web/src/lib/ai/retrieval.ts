// apps/web/src/lib/ai/retrieval.ts
// Targeted authoritative retrieval layer for the AI Intelligence Layer.
// Pulls minimal structured records from database stores without dumping raw data.
// Strictly enforces UNKNOWN handling, market isolation, and customer authorization.

import type {
  MarketCode,
  AISourceCitation,
  HaloBuildRecord,
  GarageVehicleRecord,
  SavedBuildRecord,
} from '@halo-rc/types'
import {
  SEED_PRODUCTS,
  SEED_PLATFORMS,
  SEED_BRANDS,
  SEED_OFFERS,
  SEED_SPECIFICATIONS,
  SEED_COMPATIBILITY_RULES,
  SEED_DOCUMENTS,
  resolveMarketOffer,
  getOffersForProduct,
  getPublishedHaloBuilds,
  getHaloBuildById,
  getGarageVehicleById,
  getVehicleActiveBuild,
  resolveCurrentBuildPricing,
  selectBestSupplierOffer,
} from '@halo-rc/db'
import { wrapDataBoundary } from './provider'

// ── Product Context ───────────────────────────────────────────────────────────

export interface RetrievedProductContext {
  product: {
    id: string
    slug: string
    name: string
    sku: string
    brandName: string
    scale?: string | null
    discipline?: string | null
    lifecycle: string
    published: boolean
  }
  specifications: Array<{
    key: string
    value: string
    unit?: string | null
    confidence: string
  }>
  offer: {
    available: boolean
    priceMinorUnits: number | null
    currency: string
    taxMode: string
    status: string
  } | null
  sources: AISourceCitation[]
}

export async function retrieveProductContext(
  productId: string,
  marketCode: MarketCode = 'UK'
): Promise<RetrievedProductContext | null> {
  const prod = SEED_PRODUCTS.find((p) => p.id === productId || p.slug === productId)
  if (!prod || !prod.published) return null

  const brand = SEED_BRANDS.find((b) => b.id === prod.brandId)
  const specs = SEED_SPECIFICATIONS.filter(
    (s) => s.entityId === prod.id && s.confidence !== 'UNKNOWN'
  )

  const offers = getOffersForProduct(prod.id)
  const offer = resolveMarketOffer(offers, marketCode)

  const sources: AISourceCitation[] = [
    {
      id: prod.id,
      sourceType: 'PRODUCT',
      title: prod.name,
      reference: `Catalogue SKU: ${prod.sku ?? prod.id}`,
      verified: true,
    },
  ]

  if (offer) {
    sources.push({
      id: offer.id,
      sourceType: 'MARKET_OFFER',
      title: `${prod.name} — ${marketCode} Market Offer`,
      reference: `${marketCode} Offer: ${offer.currency} ${offer.retailPriceMinorUnits / 100} (${offer.taxMode} tax)`,
      verified: true,
    })
  }

  return {
    product: {
      id: prod.id,
      slug: prod.slug,
      name: prod.name,
      sku: prod.sku ?? 'UNKNOWN-SKU',
      brandName: brand?.name ?? 'Unknown Brand',
      scale: prod.scale ?? null,
      discipline: prod.discipline,
      lifecycle: prod.lifecycle,
      published: prod.published,
    },
    specifications: specs.map((s) => ({
      key: s.key,
      value: s.value,
      unit: s.unit ?? null,
      confidence: s.confidence,
    })),
    offer: offer
      ? {
          available: offer.availability !== 'NOT_AVAILABLE',
          priceMinorUnits: offer.retailPriceMinorUnits,
          currency: offer.currency,
          taxMode: offer.taxMode,
          status: offer.availability,
        }
      : null,
    sources,
  }
}

// ── Compatibility Context ─────────────────────────────────────────────────────

export interface RetrievedCompatibilityContext {
  productId: string
  productName: string
  targetMachineId: string
  targetMachineName: string
  isCompatible: boolean
  hasExplicitRule: boolean
  ruleVerified: boolean
  ruleDescription: string | null
  ruleId: string | null
  sources: AISourceCitation[]
}

export async function retrieveCompatibilityContext(
  productId: string,
  targetMachineId: string
): Promise<RetrievedCompatibilityContext> {
  const compProd = SEED_PRODUCTS.find((p) => p.id === productId || p.slug === productId)
  const targetMachine = SEED_PRODUCTS.find((p) => p.id === targetMachineId || p.slug === targetMachineId)

  const compName = compProd?.name ?? productId
  const targetName = targetMachine?.name ?? targetMachineId
  const targetPlatformId = targetMachine?.platformId

  // Look for authoritative rule in SEED_COMPATIBILITY_RULES
  const rule = SEED_COMPATIBILITY_RULES.find(
    (r) =>
      r.sourceEntityId === compProd?.id &&
      (r.targetEntityId === targetMachine?.id || (targetPlatformId && r.targetEntityId === targetPlatformId))
  )

  const sources: AISourceCitation[] = []

  if (rule) {
    sources.push({
      id: rule.id,
      sourceType: 'COMPATIBILITY_RULE',
      title: `Compatibility Rule ${rule.id}`,
      reference: rule.notes ?? `Rule type: ${rule.ruleType}`,
      verified: rule.verified,
    })

    return {
      productId: compProd?.id ?? productId,
      productName: compName,
      targetMachineId: targetMachine?.id ?? targetMachineId,
      targetMachineName: targetName,
      isCompatible: rule.verified && rule.ruleType !== 'INCOMPATIBLE',
      hasExplicitRule: true,
      ruleVerified: rule.verified,
      ruleDescription: rule.notes ?? `Rule: ${rule.ruleType}`,
      ruleId: rule.id,
      sources,
    }
  }

  // No explicit rule found
  return {
    productId: compProd?.id ?? productId,
    productName: compName,
    targetMachineId: targetMachine?.id ?? targetMachineId,
    targetMachineName: targetName,
    isCompatible: false,
    hasExplicitRule: false,
    ruleVerified: false,
    ruleDescription: 'No verified compatibility rule exists in the Avorria RC catalogue.',
    ruleId: null,
    sources,
  }
}

// ── Technical Document Context ────────────────────────────────────────────────

export interface RetrievedDocumentContext {
  documentId: string
  title: string
  documentType: string
  sourceUrl?: string | null
  contentBlock: string
  sources: AISourceCitation[]
}

export async function retrieveTechnicalDocumentContext(
  documentId: string
): Promise<RetrievedDocumentContext | null> {
  const doc = SEED_DOCUMENTS.find((d) => d.id === documentId && d.approvedForUse && d.published)
  if (!doc) return null

  const passiveData = `Document: ${doc.title}\nType: ${doc.documentType}\nVersion: ${doc.version ?? '1.0'}\nReference: ${doc.sourceUrl ?? 'Internal Archive'}`

  return {
    documentId: doc.id,
    title: doc.title,
    documentType: doc.documentType,
    sourceUrl: doc.sourceUrl ?? null,
    contentBlock: wrapDataBoundary(passiveData, 'technical_document'),
    sources: [
      {
        id: doc.id,
        sourceType: 'TECHNICAL_DOCUMENT',
        title: doc.title,
        reference: `Technical Doc v${doc.version ?? '1.0'}`,
        url: doc.sourceUrl ?? null,
        verified: true,
      },
    ],
  }
}

// ── Halo Build Context ────────────────────────────────────────────────────────

export interface RetrievedBuildContext {
  build: HaloBuildRecord
  pricing: ReturnType<typeof resolveCurrentBuildPricing>
  sources: AISourceCitation[]
}

export async function retrieveBuildContext(
  buildIdOrSlug: string,
  marketCode: MarketCode = 'UK'
): Promise<RetrievedBuildContext | null> {
  const builds = await getPublishedHaloBuilds()
  const build = builds.find((b) => b.id === buildIdOrSlug || b.slug === buildIdOrSlug)
  if (!build) return null

  const pricing = resolveCurrentBuildPricing(build, marketCode)

  const sources: AISourceCitation[] = [
    {
      id: build.id,
      sourceType: 'HALO_BUILD',
      title: build.title,
      reference: `Halo Build ${build.title} (v${build.currentVersion})`,
      verified: true,
    },
  ]

  return {
    build,
    pricing,
    sources,
  }
}

// ── Customer Garage Context ───────────────────────────────────────────────────

export interface RetrievedGarageContext {
  vehicle: GarageVehicleRecord
  activeBuild: SavedBuildRecord | null
  sources: AISourceCitation[]
}

export async function retrieveGarageContext(
  userId: string,
  vehicleId: string
): Promise<RetrievedGarageContext | null> {
  // Strict tenant authorization: verifies customer owns vehicle
  const vehicle = await getGarageVehicleById(vehicleId, userId)
  if (!vehicle) {
    return null // Denies access if not owned by userId
  }

  const activeBuild = await getVehicleActiveBuild(vehicleId, userId)

  const sources: AISourceCitation[] = [
    {
      id: vehicle.id,
      sourceType: 'GARAGE_RECORD',
      title: `Garage Vehicle: ${vehicle.name}`,
      reference: `Vehicle ID: ${vehicle.id}`,
      verified: true,
    },
  ]

  return {
    vehicle,
    activeBuild,
    sources,
  }
}

// ── Phase 8: Supplier Inventory Context ────────────────────────────────────────

export interface RetrievedSupplierInventoryContext {
  productId: string
  hasSupplierCoverage: boolean
  inventoryAuthority: 'OWN_STOCK' | 'SUPPLIER_STOCK' | 'UNKNOWN'
  supplierAvailability: string
  leadTimeDays: number | null
  leadTimeText: string | null
  lastCheckedAt: string | null
  sources: AISourceCitation[]
}

/**
 * Retrieve controlled supplier inventory context.
 * Strictly adheres to Phase 8 security mandates:
 * - Redacts wholesale cost, margins, trade terms, and supplier account numbers.
 * - Explicitly preserves inventory authority (SUPPLIER_STOCK vs OWN_STOCK).
 */
export async function retrieveSupplierInventoryContext(
  productId: string,
  marketCode: MarketCode = 'UK'
): Promise<RetrievedSupplierInventoryContext> {
  const offer = selectBestSupplierOffer(productId, marketCode)

  if (!offer) {
    return {
      productId,
      hasSupplierCoverage: false,
      inventoryAuthority: 'UNKNOWN',
      supplierAvailability: 'UNKNOWN',
      leadTimeDays: null,
      leadTimeText: null,
      lastCheckedAt: null,
      sources: [],
    }
  }

  const sources: AISourceCitation[] = [
    {
      id: offer.id,
      sourceType: 'PRODUCT',
      title: `Distributor Sourcing Feed (${offer.marketCode})`,
      reference: `Verified checked: ${new Date(offer.lastCheckedAt).toLocaleTimeString('en-GB')}`,
      verified: offer.freshnessState === 'FRESH',
    },
  ]

  return {
    productId,
    hasSupplierCoverage: true,
    inventoryAuthority: offer.inventoryAuthority,
    supplierAvailability: offer.availability,
    leadTimeDays: offer.leadTimeDays ?? null,
    leadTimeText: offer.leadTimeText ?? null,
    lastCheckedAt: offer.lastCheckedAt,
    sources,
  }
}

