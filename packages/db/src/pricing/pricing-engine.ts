// packages/db/src/pricing/pricing-engine.ts
// Authoritative pricing engine for Halo RC / Avorria RC.
//
// Rules:
// 1. Fail-closed: If category pricing rule has configured = false, product CANNOT be sold.
// 2. Multi-market currency conversion via fx_rates table.
// 3. Tax compliance:
//    - UK (market = 'GB'): Displays VAT-inclusive price (20% standard rate).
//    - US (market = 'US'): Displays pre-tax price (sales tax collected at checkout based on nexus/shipping address).
// 4. Landed cost and margin are strictly server-side internal calculations and NEVER exposed to client.

import { db } from '../client'
import { pricingRules, fxRates } from '../schema/supplier-ingestion'
import { eq } from 'drizzle-orm'

export interface PricingRule {
  id: string
  category: string
  markupPercentage: string | null
  roundingRule: 'ROUND_99' | 'ROUND_50' | 'ROUND_WHOLE' | 'NONE'
  minimumMarginPercentage: string | null
  configured: boolean
  updatedBy: string | null
  updatedAt: Date
}

export interface FxRate {
  id: string
  baseCurrency: string
  targetCurrency: string
  rate: string
  source: string
  capturedAt: Date
}

export interface LandedCostBreakdown {
  supplierNetEur: number
  fxRate: number
  targetCurrency: 'GBP' | 'USD'
  baseCostTargetCurrency: number
  estimatedShippingTargetCurrency: number
  customsDutyTargetCurrency: number
  landedCostTargetCurrency: number
}

export interface RetailPriceCalculation {
  canSell: boolean
  reasonIfNotSellable?: string
  retailPrice: number | null // in major units (e.g. £599.00 or $799.00)
  retailPriceMinor: number | null // in cents/pence (e.g. 59900)
  displayCurrency: 'GBP' | 'USD'
  taxInclusive: boolean
  taxRate: number
  // Server-side internal metrics (DO NOT serialize to public storefront API):
  _internal?: {
    landedCost: number
    grossMarginAmount: number
    grossMarginPercentage: number
  }
}

export class PricingEngine {
  private rulesCache: Map<string, PricingRule> = new Map()
  private fxCache: Map<string, number> = new Map()
  private initialized = false

  async init(): Promise<void> {
    const rules = await db.select().from(pricingRules)
    for (const rule of rules) {
      this.rulesCache.set(rule.category, rule as PricingRule)
    }

    const rates = await db.select().from(fxRates)
    for (const rate of rates) {
      this.fxCache.set(`${rate.baseCurrency}:${rate.targetCurrency}`, parseFloat(rate.rate))
    }
    this.initialized = true
  }

  getFxRate(base: string, target: string): number {
    if (base === target) return 1.0
    const key = `${base}:${target}`
    const rate = this.fxCache.get(key)
    if (!rate) {
      throw new Error(`FX rate not found for currency pair: ${key}`)
    }
    return rate
  }

  getRule(category: string): PricingRule | undefined {
    return this.rulesCache.get(category)
  }

  /**
   * Calculates retail price for a given supplier item net cost and category.
   *
   * @param netEur Net cost from supplier in EUR
   * @param category Product category e.g. COMPLETE_KIT, OPTION_PART, REPLACEMENT_PART
   * @param market Market country code ('GB' or 'US')
   * @param shippingEur Estimated per-item inbound freight in EUR (default: kits €15, parts €1.50)
   * @param dutyRate Customs tariff rate (default: 0.02 = 2%)
   */
  calculatePrice(params: {
    netEur: number
    category: string
    market: 'GB' | 'US'
    shippingEur?: number
    dutyRate?: number
  }): RetailPriceCalculation {
    const { netEur, category, market } = params
    const targetCurrency = market === 'GB' ? 'GBP' : 'USD'

    const rule = this.rulesCache.get(category)
    if (!rule || !rule.configured || rule.markupPercentage === null) {
      return {
        canSell: false,
        reasonIfNotSellable: `PRICING_NOT_CONFIGURED: Category ${category} has not been approved by administrator.`,
        retailPrice: null,
        retailPriceMinor: null,
        displayCurrency: targetCurrency,
        taxInclusive: market === 'GB',
        taxRate: market === 'GB' ? 0.20 : 0.0,
      }
    }

    const markup = parseFloat(rule.markupPercentage)
    const minMargin = rule.minimumMarginPercentage ? parseFloat(rule.minimumMarginPercentage) : 0

    // 1. Calculate Landed Cost
    const fxRate = this.getFxRate('EUR', targetCurrency)
    const shippingEur = params.shippingEur ?? (category === 'COMPLETE_KIT' ? 15.0 : 1.5)
    const dutyRate = params.dutyRate ?? 0.02 // standard UK/US hobby goods tariff ~2%

    const totalEurCost = (netEur + shippingEur) * (1 + dutyRate)
    const landedCostTarget = totalEurCost * fxRate

    // 2. Calculate Ex-Tax Selling Price based on markup percentage
    // Selling Price Ex-Tax = Landed Cost * (1 + markup / 100)
    const exTaxPrice = landedCostTarget * (1 + markup / 100)

    // Margin check: (ExTax - Landed) / ExTax
    const actualMarginPct = ((exTaxPrice - landedCostTarget) / exTaxPrice) * 100
    if (minMargin > 0 && actualMarginPct < minMargin) {
      return {
        canSell: false,
        reasonIfNotSellable: `MARGIN_BELOW_MINIMUM: Computed margin ${actualMarginPct.toFixed(1)}% is below required ${minMargin}% for category ${category}.`,
        retailPrice: null,
        retailPriceMinor: null,
        displayCurrency: targetCurrency,
        taxInclusive: market === 'GB',
        taxRate: market === 'GB' ? 0.20 : 0.0,
      }
    }

    // 3. Tax application:
    // UK: Add 20% VAT to the retail display price
    // US: Do not add VAT (tax collected at checkout)
    const taxRate = market === 'GB' ? 0.20 : 0.0
    const rawConsumerPrice = exTaxPrice * (1 + taxRate)

    // 4. Apply Rounding Rule
    const roundedPrice = this.applyRounding(rawConsumerPrice, rule.roundingRule)
    const retailPriceMinor = Math.round(roundedPrice * 100)

    return {
      canSell: true,
      retailPrice: roundedPrice,
      retailPriceMinor,
      displayCurrency: targetCurrency,
      taxInclusive: market === 'GB',
      taxRate,
      _internal: {
        landedCost: Math.round(landedCostTarget * 100) / 100,
        grossMarginAmount: Math.round((exTaxPrice - landedCostTarget) * 100) / 100,
        grossMarginPercentage: Math.round(actualMarginPct * 10) / 10,
      },
    }
  }

  private applyRounding(price: number, rule: string): number {
    switch (rule) {
      case 'ROUND_WHOLE':
        return Math.round(price)
      case 'ROUND_99':
        return Math.floor(price) + 0.99
      case 'ROUND_50':
        return Math.round(price * 2) / 2
      case 'NONE':
      default:
        return Math.round(price * 100) / 100
    }
  }
}
