// packages/db/src/queries/markets.ts
// International Markets, Multi-Market Configuration, Tax Presentation, and Shipping Architecture

import type {
  MarketCode,
  MarketConfig,
  ShippingMethod,
  ProductShippingConstraint,
  ShippingEligibilityResult,
  MarketCompletenessScore,
  MarketAnalyticsSummary,
  MultiMarketReporting,
} from '@halo-rc/types'
import { SEED_PRODUCTS, SEED_OFFERS } from '../seed/catalogue-data'
import { __getRawCommerceCounts, __getRawOrdersAndBaskets } from './commerce'

// ── Authoritative Market Configurations ────────────────────────────────────────

const INITIAL_MARKET_CONFIGS: Record<MarketCode, MarketConfig> = {
  UK: {
    marketCode: 'UK',
    countryCode: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    locale: 'en-GB',
    taxMode: 'INCLUSIVE',
    taxDisplayMode: 'TAX_INCLUDED',
    defaultLanguage: 'en',
    measurementSystem: 'METRIC',
    shippingRegion: 'UK_DOMESTIC',
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  US: {
    marketCode: 'US',
    countryCode: 'US',
    name: 'United States',
    currency: 'USD',
    locale: 'en-US',
    taxMode: 'EXCLUSIVE',
    taxDisplayMode: 'TAX_EXCLUDED',
    defaultLanguage: 'en',
    measurementSystem: 'IMPERIAL',
    shippingRegion: 'US_DOMESTIC',
    enabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
}

// ── Configured Shipping Methods by Market ──────────────────────────────────────

const INITIAL_SHIPPING_METHODS: ShippingMethod[] = [
  // UK Domestic Methods
  {
    id: 'ship-uk-std',
    marketCode: 'UK',
    name: 'DPD Carbon Neutral Tracked',
    carrier: 'DPD',
    serviceLevel: 'Tracked 24/48',
    costMinorUnits: 495, // £4.95
    currency: 'GBP',
    estimatedDaysMin: 1,
    estimatedDaysMax: 2,
    cutoffTimeUtc: '15:00',
    freeThresholdMinorUnits: 5000, // Free on orders over £50
    active: true,
  },
  {
    id: 'ship-uk-exp',
    marketCode: 'UK',
    name: 'Royal Mail Special Delivery (Next Day Guaranteed)',
    carrier: 'Royal Mail',
    serviceLevel: 'Special Delivery Guaranteed by 1pm',
    costMinorUnits: 895, // £8.95
    currency: 'GBP',
    estimatedDaysMin: 1,
    estimatedDaysMax: 1,
    cutoffTimeUtc: '16:00',
    freeThresholdMinorUnits: null,
    active: true,
  },

  // US Domestic Methods
  {
    id: 'ship-us-std',
    marketCode: 'US',
    name: 'FedEx Ground Commercial',
    carrier: 'FedEx',
    serviceLevel: 'Ground',
    costMinorUnits: 995, // $9.95
    currency: 'USD',
    estimatedDaysMin: 3,
    estimatedDaysMax: 5,
    cutoffTimeUtc: '14:00',
    freeThresholdMinorUnits: 10000, // Free on orders over $100
    active: true,
  },
  {
    id: 'ship-us-exp',
    marketCode: 'US',
    name: 'UPS 2nd Day Air Specialist',
    carrier: 'UPS',
    serviceLevel: '2nd Day Air',
    costMinorUnits: 2495, // $24.95
    currency: 'USD',
    estimatedDaysMin: 2,
    estimatedDaysMax: 2,
    cutoffTimeUtc: '16:00',
    freeThresholdMinorUnits: null,
    active: true,
  },
]

// ── Product Shipping Constraints ──────────────────────────────────────────────

const INITIAL_SHIPPING_CONSTRAINTS: ProductShippingConstraint[] = [
  {
    productId: 'prod-hw-v10-g4-135t',
    isOversize: false,
    isHazardous: false,
    maxQuantityPerConsignment: 10,
    requiresSpecialHandling: false,
    prohibitedMarkets: [],
    restrictionNote: null,
  },
  {
    productId: 'prod-lipo-battery-comp',
    isOversize: false,
    isHazardous: true, // UN3480 Lithium Ion / Polymer
    maxQuantityPerConsignment: 2,
    requiresSpecialHandling: true,
    prohibitedMarkets: [],
    restrictionNote: 'Requires ADR / DOT hazmat ground transport compliant courier.',
  },
  {
    productId: 'prod-large-scale-5t-gas',
    isOversize: true, // 1/5 Scale freight
    isHazardous: false,
    maxQuantityPerConsignment: 1,
    requiresSpecialHandling: true,
    prohibitedMarkets: [],
    restrictionNote: 'Pallet / oversize transport surcharge may apply for residential delivery.',
  },
]

let MARKET_CONFIGS_STORE = { ...INITIAL_MARKET_CONFIGS }
let SHIPPING_METHODS_STORE = [...INITIAL_SHIPPING_METHODS]
let SHIPPING_CONSTRAINTS_STORE = [...INITIAL_SHIPPING_CONSTRAINTS]

export function __resetMarketsStoreForTesting(): void {
  MARKET_CONFIGS_STORE = { ...INITIAL_MARKET_CONFIGS }
  SHIPPING_METHODS_STORE = [...INITIAL_SHIPPING_METHODS]
  SHIPPING_CONSTRAINTS_STORE = [...INITIAL_SHIPPING_CONSTRAINTS]
}

// ── Market Configuration Queries ───────────────────────────────────────────────

export function getMarketConfig(marketCode: MarketCode = 'UK'): MarketConfig {
  const config = MARKET_CONFIGS_STORE[marketCode]
  if (!config) {
    return MARKET_CONFIGS_STORE['UK']
  }
  return config
}

export function getAllMarketConfigs(): MarketConfig[] {
  return Object.values(MARKET_CONFIGS_STORE)
}

// ── Shipping Operations & Eligibility Engine ───────────────────────────────────

/**
 * Resolve available shipping methods for a given market, applying free shipping thresholds.
 */
export function getShippingMethodsForMarket(
  marketCode: MarketCode = 'UK',
  subtotalMinorUnits: number = 0
): ShippingMethod[] {
  const methods = SHIPPING_METHODS_STORE.filter(
    (m) => m.marketCode === marketCode && m.active
  )

  return methods.map((m) => {
    let effectiveCost = m.costMinorUnits
    if (m.freeThresholdMinorUnits !== null && m.freeThresholdMinorUnits !== undefined) {
      if (subtotalMinorUnits >= m.freeThresholdMinorUnits) {
        effectiveCost = 0
      }
    }
    return {
      ...m,
      costMinorUnits: effectiveCost,
    }
  })
}

export type ShippingConsignmentItem = string | { productId: string; quantity?: number }

/**
 * Validates shipping eligibility against market destination and product constraints.
 */
export function checkShippingEligibility(
  methodOrMarket: string,
  destinationCountry?: string,
  items: ShippingConsignmentItem[] = []
): ShippingEligibilityResult {
  const method = SHIPPING_METHODS_STORE.find((m) => m.id === methodOrMarket)
  const marketCode: MarketCode = method ? method.marketCode : (methodOrMarket === 'US' ? 'US' : 'UK')

  const reasons: string[] = []
  let eligible = true
  let isHazardous = false
  let isOversize = false
  let requiresSpecialHandling = false
  let restrictionNote: string | null = null

  // 1. Destination Country Alignment
  if (destinationCountry) {
    const expectedCountry = marketCode === 'UK' ? 'GB' : 'US'
    if (typeof destinationCountry === 'string' && destinationCountry.toUpperCase() !== expectedCountry) {
      eligible = false
      const msg = `Shipping method "${methodOrMarket}" does not service destination country "${destinationCountry}". Expected ${expectedCountry}.`
      reasons.push(msg)
    }
  }

  // 2. Product Constraints Check
  for (const rawItem of items) {
    const productId = typeof rawItem === 'string' ? rawItem : rawItem.productId
    const quantity = typeof rawItem === 'string' ? 1 : (rawItem.quantity ?? 1)

    const constraint = SHIPPING_CONSTRAINTS_STORE.find((c) => c.productId === productId)
    if (constraint) {
      if (constraint.isHazardous) isHazardous = true
      if (constraint.isOversize) isOversize = true
      if (constraint.requiresSpecialHandling) requiresSpecialHandling = true
      if (constraint.restrictionNote) restrictionNote = constraint.restrictionNote

      if (constraint.prohibitedMarkets.includes(marketCode)) {
        eligible = false
        reasons.push(`Product "${productId}" is prohibited from distribution in the ${marketCode} commercial territory.`)
      }

      if (constraint.maxQuantityPerConsignment !== null && constraint.maxQuantityPerConsignment !== undefined) {
        if (quantity > constraint.maxQuantityPerConsignment) {
          eligible = false
          reasons.push(
            `Product "${productId}" quantity (${quantity}) exceeds maximum allowed consignment limit (${constraint.maxQuantityPerConsignment}).`
          )
        }
      }
    }
  }

  const availableMethods = eligible ? getShippingMethodsForMarket(marketCode, 0) : []

  return {
    eligible,
    restrictionReason: reasons.length > 0 ? (reasons[0] ?? null) : null,
    reasons,
    isHazardous,
    isOversize,
    requiresSpecialHandling,
    restrictionNote,
    availableMethods,
  }
}

// ── Market Completeness & Data Quality ─────────────────────────────────────────

/**
 * Deterministic market completeness assessment for commercial offers.
 */
export function getMarketCompletenessReport(): MarketCompletenessScore[] {
  const publishedProducts = SEED_PRODUCTS.filter((p) => p.published && p.lifecycle === 'ACTIVE')
  const totalProductsCount = publishedProducts.length

  const markets: MarketCode[] = ['UK', 'US']

  return markets.map((marketCode) => {
    let offeredCount = 0
    for (const prod of publishedProducts) {
      const hasOffer = SEED_OFFERS.some(
        (o) => o.marketCode === marketCode && o.productVariantId.startsWith(`var-${prod.id.replace('prod-', '')}`)
      )
      if (hasOffer) {
        offeredCount++
      }
    }

    const coveragePercentage = totalProductsCount > 0 ? Math.round((offeredCount / totalProductsCount) * 100) : 0
    const status: MarketCompletenessScore['status'] =
      coveragePercentage >= 90 ? 'COMPLETE' : coveragePercentage >= 50 ? 'PARTIAL' : 'MISSING'

    return {
      marketCode,
      status,
      totalProductsCount,
      offeredProductsCount: offeredCount,
      coveragePercentage,
    }
  })
}

// ── Multi-Currency Analytics & Segregated Reporting ────────────────────────────

/**
 * Produce multi-currency analytics without cross-currency contamination.
 * INVARIANT: GBP and USD are NEVER summed together directly.
 */
export function getMultiMarketAnalytics(): MultiMarketReporting {
  const { orders, baskets } = __getRawOrdersAndBaskets()

  const ukPaidOrders = orders.filter((o) => o.marketCode === 'UK' && o.paymentStatus === 'PAID')
  const ukRevenue = ukPaidOrders.reduce((sum, o) => sum + o.totalMinorUnits, 0)
  const ukActiveBaskets = baskets.filter((b) => b.marketCode === 'UK' && b.status === 'ACTIVE').length

  const ukSummary: MarketAnalyticsSummary = {
    marketCode: 'UK',
    currency: 'GBP',
    totalOrders: ukPaidOrders.length,
    grossRevenueMinorUnits: ukRevenue,
    averageOrderValueMinorUnits: ukPaidOrders.length > 0 ? Math.round(ukRevenue / ukPaidOrders.length) : 0,
    activeBasketsCount: ukActiveBaskets,
  }

  const usPaidOrders = orders.filter((o) => o.marketCode === 'US' && o.paymentStatus === 'PAID')
  const usRevenue = usPaidOrders.reduce((sum, o) => sum + o.totalMinorUnits, 0)
  const usActiveBaskets = baskets.filter((b) => b.marketCode === 'US' && b.status === 'ACTIVE').length

  const usSummary: MarketAnalyticsSummary = {
    marketCode: 'US',
    currency: 'USD',
    totalOrders: usPaidOrders.length,
    grossRevenueMinorUnits: usRevenue,
    averageOrderValueMinorUnits: usPaidOrders.length > 0 ? Math.round(usRevenue / usPaidOrders.length) : 0,
    activeBasketsCount: usActiveBaskets,
  }

  return {
    markets: [ukSummary, usSummary],
    reportingTimestamp: new Date().toISOString(),
  }
}
