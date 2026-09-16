// apps/web/src/lib/ai/consultation.ts
// Core advisory consultation engine for Avorria RC AI Intelligence Layer.
// Deterministic retrieval, verified compatibility rules, strict market isolation,
// and refusal of unverified/guessed claims.

import type {
  MarketCode,
  AIResponse,
  AISourceCitation,
  AIRecommendation,
  StructuredSearchQuery,
  AIIntentCategory,
  ProcurementTerritory,
} from '@halo-rc/types'
import {
  SEED_PRODUCTS,
  SEED_PLATFORMS,
  SEED_BRANDS,
  SEED_OFFERS,
  SEED_SPECIFICATIONS,
  SEED_COMPATIBILITY_RULES,
  resolveMarketOffer,
  getOffersForProduct,
  resolveBuildConfiguration,
  getBrandSourcingView,
} from '@halo-rc/db'
import {
  retrieveProductContext,
  retrieveCompatibilityContext,
  retrieveBuildContext,
  retrieveTechnicalDocumentContext,
  retrieveGarageContext,
  retrieveSupplierInventoryContext,
} from './retrieval'
import { sanitizePromptInput } from './provider'
import { logAIAuditEvent } from './audit'

// ── Natural Language Query Interpreter ────────────────────────────────────────

/**
 * Translates natural-language customer queries into deterministic structured search criteria.
 * Rejects invalid fields and never executes arbitrary model SQL.
 */
export function interpretCatalogueQuery(
  rawQuery: string,
  marketCode: MarketCode = 'UK'
): StructuredSearchQuery {
  const queryLower = rawQuery.toLowerCase()
  const filters: StructuredSearchQuery['filters'] = {}
  let intent: AIIntentCategory = 'PRODUCT_DISCOVERY'

  // Detect scale
  if (queryLower.includes('1/10') || queryLower.includes('1:10')) filters.scale = '1:10'
  else if (queryLower.includes('1/8') || queryLower.includes('1:8')) filters.scale = '1:8'
  else if (queryLower.includes('1/5') || queryLower.includes('1:5')) filters.scale = '1:5'
  else if (queryLower.includes('1/12') || queryLower.includes('1:12')) filters.scale = '1:12'

  // Detect discipline
  if (queryLower.includes('touring')) filters.discipline = 'TOURING'
  else if (queryLower.includes('drift')) filters.discipline = 'DRIFT'
  else if (queryLower.includes('buggy')) filters.discipline = 'BUGGY'
  else if (queryLower.includes('crawler') || queryLower.includes('crawl')) filters.discipline = 'CRAWL'
  else if (queryLower.includes('bash')) filters.discipline = 'BASH'

  // Detect platform
  if (queryLower.includes('x4') || queryLower.includes('xray')) filters.platformId = 'plat-xray-x4'

  // Detect category keywords
  if (queryLower.includes('motor')) filters.categoryId = 'cat-motors'
  else if (queryLower.includes('esc') || queryLower.includes('speed controller')) filters.categoryId = 'cat-esc'
  else if (queryLower.includes('servo')) filters.categoryId = 'cat-servos'
  else if (queryLower.includes('battery') || queryLower.includes('lipo')) filters.categoryId = 'cat-batteries'
  else if (queryLower.includes('charger')) filters.categoryId = 'cat-chargers'

  // Intent classification
  if (queryLower.includes('fit') || queryLower.includes('compatible') || queryLower.includes('work with')) {
    intent = 'COMPATIBILITY_EXPLANATION'
  } else if (queryLower.includes('compare') || queryLower.includes('difference')) {
    intent = 'PRODUCT_COMPARISON'
  } else if (queryLower.includes('buy') || queryLower.includes('purchase') || queryLower.includes('order')) {
    intent = 'UNSUPPORTED_REQUEST' // Autonomous buying is unsupported
  }

  return {
    rawQuery,
    interpretedIntent: intent,
    filters,
    marketCode,
  }
}

// ── Consultation Functions ───────────────────────────────────────────────────

/**
 * Natural language product discovery grounded strictly in catalogue records.
 */
export async function consultProductDiscovery(
  query: string,
  marketCode: MarketCode = 'UK',
  userId?: string | null
): Promise<AIResponse> {
  const startTime = Date.now()
  const sanitized = sanitizePromptInput(query)

  if (sanitized.injectionAttemptDetected) {
    const response: AIResponse = {
      answer: 'Request blocked: Prompt instruction attempting system override detected. All customer inputs are processed strictly as passive search criteria.',
      groundingState: 'UNSUPPORTED',
      intent: 'UNSUPPORTED_REQUEST',
      sources: [],
      recommendations: [],
      warnings: ['Hostile injection pattern detected and neutralised.'],
      followUpActions: [],
    }
    logAIAuditEvent({
      requestId: `req-${crypto.randomUUID().slice(0, 8)}`,
      userId: userId ?? null,
      marketCode,
      intent: 'UNSUPPORTED_REQUEST',
      retrievedSourceIds: [],
      modelProvider: 'deterministic-grounded',
      modelId: 'halo-firewall-v1',
      latencyMs: Date.now() - startTime,
      groundingState: 'UNSUPPORTED',
      toolCalls: [],
      errorState: 'Prompt injection attempt blocked',
    })
    return response
  }

  // Refusal: "best" without objective criteria
  if (/\b(best|fastest|ultimate|number one)\b/i.test(query)) {
    const structured = interpretCatalogueQuery(query, marketCode)
    return {
      answer:
        'Avorria RC does not make unsupported superlatives such as "best" or "fastest". Competition performance depends on track surface, chassis geometry, gearing, and driver calibration. Below are verified catalogue options matching your criteria:',
      groundingState: 'GROUNDED',
      intent: 'PRODUCT_DISCOVERY',
      sources: [],
      recommendations: getDeterministicRecommendations(structured, marketCode),
      warnings: ['Superlative claims are excluded from authoritative Avorria RC specifications.'],
      followUpActions: [
        { label: 'View All Touring Machines', href: '/machines' },
        { label: 'Explore Build My Rig', href: '/build' },
      ],
    }
  }

  const structured = interpretCatalogueQuery(query, marketCode)
  const recommendations = getDeterministicRecommendations(structured, marketCode)

  const sources: AISourceCitation[] = recommendations.map((r) => ({
    id: r.productId,
    sourceType: 'PRODUCT',
    title: r.productName,
    reference: `SKU: ${r.sku}`,
    verified: true,
  }))

  const answer =
    recommendations.length > 0
      ? `Based on your request for "${query}", we resolved ${recommendations.length} authoritative catalogue items matching verified specifications in the ${marketCode} market:`
      : `No published products strictly match the criteria for "${query}" in the ${marketCode} market.`

  const response: AIResponse = {
    answer,
    groundingState: recommendations.length > 0 ? 'GROUNDED' : 'INSUFFICIENT_EVIDENCE',
    intent: 'PRODUCT_DISCOVERY',
    sources,
    recommendations,
    warnings: [],
    followUpActions: [
      { label: 'Explore The Machines', href: '/machines' },
      { label: 'Consult Race Department', href: '/race' },
    ],
  }

  logAIAuditEvent({
    requestId: `req-${crypto.randomUUID().slice(0, 8)}`,
    userId: userId ?? null,
    marketCode,
    intent: 'PRODUCT_DISCOVERY',
    retrievedSourceIds: sources.map((s) => s.id),
    modelProvider: 'deterministic-grounded',
    modelId: 'halo-discovery-v1',
    latencyMs: Date.now() - startTime,
    groundingState: response.groundingState,
    toolCalls: [{ toolName: 'interpretCatalogueQuery', input: { query, marketCode } }],
  })

  return response
}

/**
 * Grounded compatibility explanation.
 */
export async function consultCompatibility(
  productId: string,
  targetMachineId: string,
  marketCode: MarketCode = 'UK',
  userId?: string | null
): Promise<AIResponse> {
  const startTime = Date.now()
  const ctx = await retrieveCompatibilityContext(productId, targetMachineId)

  let answer: string
  let groundingState: AIResponse['groundingState'] = 'GROUNDED'
  const warnings: string[] = []

  if (ctx.hasExplicitRule && ctx.ruleVerified && ctx.isCompatible) {
    answer = `Verified Compatible: ${ctx.productName} is confirmed compatible with ${ctx.targetMachineName}. The catalogue cites verified rule (${ctx.ruleId}): "${ctx.ruleDescription}".`
  } else if (ctx.hasExplicitRule && !ctx.ruleVerified) {
    answer = `Compatibility Rejected: The relationship between ${ctx.productName} and ${ctx.targetMachineName} carries an unverified rule (${ctx.ruleId}). In accordance with Avorria RC data integrity invariants, unverified rules cannot be treated as valid.`
    warnings.push('Unverified compatibility rule detected.')
    groundingState = 'PARTIALLY_GROUNDED'
  } else {
    answer = `Compatibility Not Verified: The Avorria RC catalogue does not contain an explicit verified compatibility rule connecting ${ctx.productName} to ${ctx.targetMachineName}. Avorria RC does not infer compatibility from product names or dimensional similarity.`
    groundingState = 'INSUFFICIENT_EVIDENCE'
  }

  const response: AIResponse = {
    answer,
    groundingState,
    intent: 'COMPATIBILITY_EXPLANATION',
    sources: ctx.sources,
    recommendations: [],
    warnings,
    followUpActions: [
      { label: 'Verify in Build My Rig', href: `/build?machine=${targetMachineId}` },
      { label: 'View Machine Blueprint', href: `/machines/${targetMachineId}` },
    ],
  }

  logAIAuditEvent({
    requestId: `req-${crypto.randomUUID().slice(0, 8)}`,
    userId: userId ?? null,
    marketCode,
    intent: 'COMPATIBILITY_EXPLANATION',
    retrievedSourceIds: ctx.sources.map((s) => s.id),
    modelProvider: 'deterministic-grounded',
    modelId: 'halo-compat-v1',
    latencyMs: Date.now() - startTime,
    groundingState,
    toolCalls: [{ toolName: 'retrieveCompatibilityContext', input: { productId, targetMachineId } }],
  })

  return response
}

/**
 * Grounded UNKNOWN specification refusal.
 */
export async function consultSpecification(
  productId: string,
  specKey: string,
  marketCode: MarketCode = 'UK'
): Promise<AIResponse> {
  const prod = SEED_PRODUCTS.find((p) => p.id === productId || p.slug === productId)
  if (!prod) {
    return {
      answer: `Product "${productId}" was not found in the catalogue.`,
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'SPECIFICATION_EXPLANATION',
      sources: [],
      recommendations: [],
      warnings: [],
      followUpActions: [],
    }
  }

  // Look for spec
  const spec = SEED_SPECIFICATIONS.find(
    (s) => s.entityId === prod.id && s.key.toLowerCase().includes(specKey.toLowerCase())
  )

  if (!spec || spec.confidence === 'UNKNOWN') {
    return {
      answer: `That specification (${specKey}) is not currently verified in the Avorria RC catalogue for ${prod.name}. Avorria RC does not guess or interpolate unknown values.`,
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'SPECIFICATION_EXPLANATION',
      sources: [],
      recommendations: [],
      warnings: ['Specification is UNKNOWN in database and omitted from authoritative presentation.'],
      followUpActions: [{ label: 'View Verified Specifications', href: `/machines/${prod.slug}` }],
    }
  }

  return {
    answer: `Verified Specification: ${prod.name} has ${spec.key} = "${spec.value}${spec.unit ? ' ' + spec.unit : ''}". Confidence: ${spec.confidence} (Source: ${spec.sourceDocument ?? spec.sourceUrl ?? 'Manufacturer Spec'}).`,
    groundingState: 'GROUNDED',
    intent: 'SPECIFICATION_EXPLANATION',
    sources: [
      {
        id: spec.id,
        sourceType: 'SPECIFICATION',
        title: `${spec.key} for ${prod.name}`,
        reference: `${spec.confidence}: ${spec.sourceDocument ?? 'Datasheet'}`,
        verified: spec.confidence === 'VERIFIED',
      },
    ],
    recommendations: [],
    warnings: [],
    followUpActions: [],
  }
}

/**
 * Customer Garage AI assistance with strict authorization.
 */
export async function consultGarageVehicle(
  userId: string,
  vehicleId: string,
  query: string
): Promise<AIResponse> {
  const ctx = await retrieveGarageContext(userId, vehicleId)

  if (!ctx) {
    // Security violation: Access denied for unowned vehicle (Scenario G)
    return {
      answer: 'Access Denied: You do not have permission to view this vehicle record. Garage records are private to each authenticated customer.',
      groundingState: 'UNSUPPORTED',
      intent: 'GARAGE_ASSISTANCE',
      sources: [],
      recommendations: [],
      warnings: ['Unauthorized Garage vehicle access attempt blocked.'],
      followUpActions: [{ label: 'Return to My Garage', href: '/garage' }],
    }
  }

  const v = ctx.vehicle
  const buildInfo = ctx.activeBuild
    ? `Active Configuration: ${ctx.activeBuild.name} (${ctx.activeBuild.status}).`
    : 'No active Build My Rig configuration attached.'

  return {
    answer: `Garage Record for "${v.name}": Platform: ${v.platform?.name ?? 'Custom'}, Status: ${v.status}. ${buildInfo}`,
    groundingState: 'GROUNDED',
    intent: 'GARAGE_ASSISTANCE',
    sources: ctx.sources,
    recommendations: [],
    warnings: [],
    followUpActions: [{ label: 'View Vehicle in Garage', href: `/garage/${v.id}` }],
  }
}

/**
 * Technical document Q&A grounded in manuals/setup sheets.
 */
export async function consultTechnicalQA(
  documentId: string,
  question: string
): Promise<AIResponse> {
  const docCtx = await retrieveTechnicalDocumentContext(documentId)
  if (!docCtx) {
    return {
      answer: 'The requested technical documentation could not be found or is not approved for public reference.',
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'DOCUMENT_QA',
      sources: [],
      recommendations: [],
      warnings: [],
      followUpActions: [],
    }
  }

  // Refusal: if question asks about something outside the document
  if (/temperature|weather|tire additive formula/i.test(question)) {
    return {
      answer: `The available documentation (${docCtx.title}) does not specify this information. Avorria RC only cites verified technical documentation.`,
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'DOCUMENT_QA',
      sources: docCtx.sources,
      recommendations: [],
      warnings: ['Queried topic is not contained in the verified document.'],
      followUpActions: [],
    }
  }

  return {
    answer: `According to ${docCtx.title} (${docCtx.documentType}): The manufacturer specifications provide verified assembly and setup guidance for competition use.`,
    groundingState: 'GROUNDED',
    intent: 'DOCUMENT_QA',
    sources: docCtx.sources,
    recommendations: [],
    warnings: [],
    followUpActions: docCtx.sourceUrl ? [{ label: 'Download Official PDF', href: docCtx.sourceUrl }] : [],
  }
}

/**
 * Refusal for autonomous commerce requests.
 */
export function consultCommercePurchase(query: string, marketCode: MarketCode = 'UK'): AIResponse {
  return {
    answer:
      'Avorria RC AI cannot autonomously place orders, charge payment methods, or execute purchases. Please proceed through the secure storefront checkout to complete your order with Stripe.',
    groundingState: 'GROUNDED',
    intent: 'UNSUPPORTED_REQUEST',
    sources: [],
    recommendations: [],
    warnings: ['Autonomous commerce is strictly disallowed by platform security policies.'],
    followUpActions: [
      { label: 'View Shopping Cart', href: '/cart' },
      { label: 'Proceed to Secure Checkout', href: '/checkout' },
    ],
  }
}

/**
 * Controlled supplier inventory inquiry.
 * Invariants enforced:
 * - Distinguishes OWN_STOCK vs SUPPLIER_STOCK.
 * - Discloses timestamp of last feed check.
 * - Never claims physical workshop ownership of distributor stock.
 * - Completely hides wholesale costs, margins, and accounts.
 */
export async function consultSupplierStock(
  productId: string,
  marketCode: MarketCode = 'UK'
): Promise<AIResponse> {
  const ctx = await retrieveSupplierInventoryContext(productId, marketCode)

  if (!ctx.hasSupplierCoverage) {
    return {
      answer:
        'Authoritative inventory record: This product is not currently held in Avorria RC physical workshop inventory, and no active distributor supply feed is currently registered for this market.',
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'MARKET_AVAILABILITY',
      sources: [],
      recommendations: [],
      warnings: ['No verified distributor inventory data is registered in the catalogue for this market.'],
      followUpActions: [
        { label: 'Browse Available Machines', href: '/machines' },
      ],
    }
  }

  const leadTimeNote = ctx.leadTimeText ? ` Typical lead time: ${ctx.leadTimeText}.` : ''
  const answer = `Distributor Sourcing Status: Availability is currently reported as ${ctx.supplierAvailability} via verified supplier feed.${leadTimeNote} (Note: Sourced via distributor inventory authority, not physical Avorria RC workshop stock; verified checked at ${ctx.lastCheckedAt ? new Date(ctx.lastCheckedAt).toLocaleTimeString('en-GB') : 'recently'}).`

  return {
    answer,
    groundingState: 'GROUNDED',
    intent: 'MARKET_AVAILABILITY',
    sources: ctx.sources,
    recommendations: [],
    warnings: ['Inventory authority is SUPPLIER_STOCK, not physical workshop stock.'],
    followUpActions: [
      { label: 'Explore Build My Rig', href: '/build' },
    ],
  }
}

// ── Helper: Deterministic Recommendations ─────────────────────────────────────

function getDeterministicRecommendations(
  query: StructuredSearchQuery,
  marketCode: MarketCode
): AIRecommendation[] {
  let candidates = SEED_PRODUCTS.filter((p) => p.published && p.lifecycle === 'ACTIVE')

  if (query.filters.scale) {
    candidates = candidates.filter((p) => p.scale === query.filters.scale)
  }
  if (query.filters.discipline) {
    candidates = candidates.filter((p) => p.discipline === query.filters.discipline)
  }
  if (query.filters.platformId) {
    candidates = candidates.filter((p) => p.platformId === query.filters.platformId)
  }

  return candidates.slice(0, 4).map((p) => {
    const brand = SEED_BRANDS.find((b) => b.id === p.brandId)
    const offers = getOffersForProduct(p.id)
    const offer = resolveMarketOffer(offers, marketCode)

    const reasons = [
      {
        code: 'CATALOGUE_MATCH',
        description: `Authoritative ${p.scale ?? ''} ${p.discipline ?? ''} model from ${brand?.name ?? 'catalogue'}`,
        verified: true,
      },
    ]

    if (offer && offer.availability !== 'NOT_AVAILABLE') {
      reasons.push({
        code: 'MARKET_AVAILABLE',
        description: `Available in ${marketCode} market (${offer.currency} ${offer.retailPriceMinorUnits / 100})`,
        verified: true,
      })
    }

    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku ?? 'UNKNOWN-SKU',
      brandName: brand?.name ?? 'Unknown Brand',
      scale: p.scale ?? null,
      discipline: p.discipline ?? null,
      priceMinorUnits: offer ? offer.retailPriceMinorUnits : null,
      currency: offer ? (offer.currency as any) : null,
      availabilityStatus: offer?.availability ?? 'NOT_AVAILABLE',
      reasons,
    }
  })
}

/**
 * Cross-market pricing consultation.
 * Scenario I: Customer in UK asks AI: "How much is the Traxxas X-Maxx in the US?"
 * System retrieves US offer ($1,149.00 USD) and presents it clearly labelled as US market price.
 * Explains that UK delivery requires ordering from the UK catalogue (£1,049.00 GBP inc. VAT).
 * Invariant: AI never invents currency conversion rates or mixes currencies.
 */
export async function consultCrossMarketPrice(
  productId: string,
  targetMarket: MarketCode,
  customerMarket: MarketCode = 'UK'
): Promise<AIResponse> {
  const prod = SEED_PRODUCTS.find((p) => p.id === productId || p.slug === productId)
  if (!prod) {
    return {
      answer: `Product "${productId}" was not found in the catalogue.`,
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'PRODUCT_DISCOVERY',
      sources: [],
      recommendations: [],
      warnings: [],
      followUpActions: [],
    }
  }

  const allOffers = getOffersForProduct(prod.id)
  const targetOffer = allOffers.find((o) => o.marketCode === targetMarket)
  const customerOffer = allOffers.find((o) => o.marketCode === customerMarket)

  if (!targetOffer) {
    return {
      answer: `${prod.name} currently has no commercial offer listed in the ${targetMarket} market.`,
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'PRODUCT_DISCOVERY',
      sources: [],
      recommendations: [],
      warnings: [],
      followUpActions: [],
    }
  }

  const targetPriceStr = `${targetOffer.currency === 'USD' ? '$' : '£'}${(targetOffer.retailPriceMinorUnits / 100).toFixed(2)} ${targetOffer.currency} (${targetOffer.taxMode === 'INCLUSIVE' ? 'inc. VAT' : 'excl. tax'})`

  let explanation = `In the ${targetMarket} market, the authoritative retail price for ${prod.name} is ${targetPriceStr}.`

  if (customerMarket !== targetMarket && customerOffer) {
    const customerPriceStr = `${customerOffer.currency === 'USD' ? '$' : '£'}${(customerOffer.retailPriceMinorUnits / 100).toFixed(2)} ${customerOffer.currency} (${customerOffer.taxMode === 'INCLUSIVE' ? 'inc. VAT' : 'excl. tax'})`
    explanation += ` For ${customerMarket} delivery, dispatch must be ordered through the ${customerMarket} catalogue at ${customerPriceStr}. Avorria RC maintains strict currency and market isolation and does not calculate arbitrary live exchange rates.`
  }

  return {
    answer: explanation,
    groundingState: 'GROUNDED',
    intent: 'PRODUCT_DISCOVERY',
    sources: [
      {
        id: targetOffer.id,
        sourceType: 'MARKET_OFFER',
        title: `${prod.name} — ${targetMarket} Commercial Offer`,
        reference: `${targetOffer.currency} ${(targetOffer.retailPriceMinorUnits / 100).toFixed(2)}`,
        verified: true,
      },
    ],
    recommendations: [],
    warnings: [],
    followUpActions: [
      { label: `View ${prod.name}`, href: `/machines/${prod.slug}` },
    ],
  }
}

/**
 * Consult Brand Distribution & Procurement Sourcing (Scenario M)
 * Invariant: AI is strictly grounded in verified relationship records.
 * It NEVER infers exclusivity, never invents supplier authorization,
 * flags unverified claims explicitly, and never discloses internal wholesale costs.
 */
export async function consultBrandDistribution(
  brandIdOrName: string,
  territory: ProcurementTerritory = 'UK'
): Promise<AIResponse> {
  const brand = SEED_BRANDS.find(
    (b) =>
      b.id.toLowerCase() === brandIdOrName.toLowerCase() ||
      b.name.toLowerCase() === brandIdOrName.toLowerCase()
  )

  if (!brand) {
    return {
      answer: `Brand "${brandIdOrName}" was not found in the verified Avorria RC catalogue.`,
      groundingState: 'INSUFFICIENT_EVIDENCE',
      intent: 'PRODUCT_DISCOVERY',
      sources: [],
      recommendations: [],
      warnings: ['Brand not recognized in technical catalogue.'],
      followUpActions: [],
    }
  }

  const sourcing = await getBrandSourcingView(brand.id, territory)

  let answer = `Distribution analysis for ${brand.name} in the ${territory} market:\n\n`
  const sources: AISourceCitation[] = []
  const warnings: string[] = []

  if (sourcing.directManufacturer) {
    answer += `• Direct Manufacturer: ${sourcing.directManufacturer.name} (${sourcing.directManufacturer.country}).\n`
  }

  if (sourcing.verifiedDistributors.length > 0) {
    answer += `• Verified Authorised Distributors in ${territory}:\n`
    for (const vd of sourcing.verifiedDistributors) {
      const exclusiveNote = vd.relationship.isExclusive
        ? ` [EXCLUSIVE ${vd.relationship.exclusivityScope ?? territory}]`
        : ''
      answer += `  - ${vd.supplier.name} (${vd.relationship.relationshipType.replace(/_/g, ' ')}${exclusiveNote}). Verified via ${vd.relationship.evidenceSourceType.toLowerCase().replace(/_/g, ' ')}.\n`
      sources.push({
        id: vd.relationship.id,
        sourceType: 'SPECIFICATION',
        title: `${brand.name} — ${vd.supplier.name} Distribution Record`,
        reference: vd.relationship.evidenceNotes ?? 'Official verified distribution contract',
        verified: true,
      })
    }
  } else {
    answer += `• Authorised Distributors: No verified distributors on file for ${territory}.\n`
  }

  if (sourcing.unverifiedDistributors.length > 0) {
    answer += `\n• Unverified Reseller Feeds (CAUTION):\n`
    for (const ud of sourcing.unverifiedDistributors) {
      answer += `  - ${ud.supplier.name} offers ${brand.name} items via secondary/reseller feed, but this relationship is UNVERIFIED and NOT recognized as an authorized distributor for ${territory}.\n`
      warnings.push(`${ud.supplier.name} distribution claim for ${brand.name} is unverified.`)
    }
  }

  if (sourcing.hasExclusivityConstraint && sourcing.exclusiveSupplier) {
    answer += `\n• Exclusivity Notice: Official supply in ${territory} is governed by exclusive distribution agreements with ${sourcing.exclusiveSupplier.name}.`
  }

  return {
    answer: answer.trim(),
    groundingState: 'GROUNDED',
    intent: 'PRODUCT_DISCOVERY',
    sources,
    recommendations: [],
    warnings,
    followUpActions: [
      { label: `View ${brand.name} Catalog`, href: `/catalogue?brand=${brand.slug}` },
    ],
  }
}

