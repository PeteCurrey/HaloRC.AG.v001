// packages/db/src/importers/mugen-canonical-promoter.ts
// Reusable Production Promotion Engine for MUGEN Seiki Europe supplier catalog to canonical Avorria catalogue

import { createHash } from 'crypto'
import { db, isDbConfigured } from '../client'
import {
  products,
  productVariants,
  marketOffers,
} from '../schema/products'
import { supplierOffers } from '../schema/suppliers'
import { supplierItems } from '../schema/supplier-ingestion'
import { fxRates } from '../schema/supplier-ingestion'
import {
  STORE_PRODUCTS,
  STORE_VARIANTS,
  STORE_OFFERS,
} from '../queries/catalogue-store'
import { eq, inArray, sql } from 'drizzle-orm'

export const KNOWN_ZERO_PRICE_SKUS = new Set([
  'H2120',
  'H2126',
  'H2202',
  'H2205',
  'H2306',
  'H2307',
  'H2309',
  'H2803',
  'H2807',
])

export const CONTROLLED_PUBLISHED_SKUS = new Set([
  // Machines (4 kits)
  'A2006',
  'B2001',
  'E2027',
  'H2009',
  // Parts (5 parts across multiple categories)
  'A2101L', // REPLACEMENT_PART (Front Upper Bulkhead Left)
  'A2102',  // REPLACEMENT_PART (Rear Upper Bulkhead)
  'B0554a', // TOOLS (Ritzel Montage Werkzeug / Pinion Tool)
  'B0562',  // REPLACEMENT_PART (Offset Servo Horn 23T)
  'H0755',  // PART / ENGINE (Kupplungs-Einstellmutter / Clutch Adjusting Nut)
])

export const MUGEN_PLATFORM_MAP: Record<string, string> = {
  A2006: 'plat-mugen-mtc3',
  B2001: 'plat-mugen-msb1',
  E2027: 'plat-mugen-mbx8r',
  'E2027-PREMIUM': 'plat-mugen-mbx8r',
  E2028: 'plat-mugen-mbx8r',
  'E2028-PREMIUM': 'plat-mugen-mbx8r',
  E2029: 'plat-mugen-mbx8tr',
  E2030: 'plat-mugen-mbx8tr',
  H2009: 'plat-mugen-mrx7',
  T2006: 'plat-mugen-mtx7r',
}

/**
 * Returns the appropriate existing category ID in Avorria schema.
 */
export function resolveAvorriaCategoryId(productType: string, category: string, sku: string, title: string): string {
  const upperSku = sku.toUpperCase().trim()
  const upperTitle = title.toUpperCase().trim()

  if (productType === 'KIT') {
    if (upperTitle.includes('TOURING') || upperSku.startsWith('A') || upperSku.startsWith('T')) {
      return 'cat-110-touring'
    }
    if (upperTitle.includes('ON-ROAD') || upperTitle.includes('FAHRZEUG') || upperSku.startsWith('H')) {
      return 'cat-15-onroad'
    }
    return 'cat-18-buggy'
  }

  if (category === 'ENGINE' || productType === 'ENGINE' || upperTitle.includes('ENGINE') || upperTitle.includes('MOTOR') || upperTitle.includes('CLUTCH') || upperTitle.includes('KUPPLUNG') || upperTitle.includes('RESO')) {
    return 'cat-race-engines'
  }

  if (category === 'TOOLS' || productType === 'TOOLS' || category === 'ACCESSORY' || productType === 'ACCESSORY') {
    return 'cat-garage-culture'
  }

  return 'cat-parts'
}

/**
 * Deterministically generates a unique, URL-safe slug and IDs.
 */
export function generateDeterministicIdentifiers(sku: string) {
  const cleanBase = sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  // Hash suffix ensures complete uniqueness even if punctuation differences normalize to the same string
  const hashSuffix = createHash('sha256').update(sku).digest('hex').slice(0, 6)

  return {
    slug: `mugen-${cleanBase}-${hashSuffix}`,
    prodId: `prod-mugen-${cleanBase}-${hashSuffix}`,
    varId: `var-mugen-${cleanBase}-${hashSuffix}`,
    soffId: `soff-mugen-${cleanBase}-${hashSuffix}`,
    offUkId: `off-mugen-${cleanBase}-${hashSuffix}-uk`,
    offUsId: `off-mugen-${cleanBase}-${hashSuffix}-us`,
  }
}

/**
 * Calculate customer retail price from EUR wholesale cost.
 */
export function calculateRetailPrices(costEurMinor: number, productType: string, fx: { gbp: number; usd: number }) {
  const marginDivisor = productType === 'KIT' ? 0.65 : 0.60
  
  // Base retail in EUR
  const retailEur = costEurMinor / marginDivisor

  // Convert to GBP (minor units / pence)
  const rawGbp = retailEur * fx.gbp
  let retailGbp = Math.round(rawGbp / 100) * 100
  if (retailGbp === 0 && costEurMinor > 0) retailGbp = 100

  // Convert to USD (minor units / cents)
  const rawUsd = retailEur * fx.usd
  let retailUsd = Math.round(rawUsd / 100) * 100
  if (retailUsd === 0 && costEurMinor > 0) retailUsd = 100

  return {
    retailGbp,
    retailUsd,
  }
}

export interface PromotionReport {
  totalProcessed: number
  canonicalProductsCreated: number
  canonicalProductsUpdated: number
  variantsCreated: number
  supplierOffersCreated: number
  marketOffersCreated: number
  publishedCount: number
  stagedReviewCount: number
  zeroPriceBlockedCount: number
  breakdown: {
    machines: number
    replacementParts: number
    optionParts: number
    electronics: number
    tools: number
    other: number
  }
}

export class MugenCanonicalPromoter {
  private supplierId = 'sup-mugen-europe'
  private brandId = 'brand-mugen-seiki'

  /**
   * Promotes all valid MUGEN supplier items into PostgreSQL canonical products, variants, and offers.
   */
  public async promoteAll(): Promise<PromotionReport> {
    // 1. Fetch FX rates from DB
    let fxGbp = 0.8542
    let fxUsd = 1.0825

    if (isDbConfigured) {
      try {
        const rates = await db.select().from(fxRates)
        for (const r of rates) {
          if (r.baseCurrency === 'EUR' && r.targetCurrency === 'GBP') fxGbp = parseFloat(r.rate)
          if (r.baseCurrency === 'EUR' && r.targetCurrency === 'USD') fxUsd = parseFloat(r.rate)
        }
      } catch (err) {
        console.warn('Could not read fx_rates, using fallbacks:', err)
      }
    }

    // 2. Fetch all supplier_items for MUGEN
    let rawItems: Array<{
      sku: string
      englishName: string | null
      rawName: string
      rawDescription: string | null
      netPrice: string
      currency: string
      ean: string | null
      productType: string
      category: string
      sourceFile: string
    }> = []

    if (isDbConfigured) {
      rawItems = await db
        .select({
          sku: supplierItems.sku,
          englishName: supplierItems.englishName,
          rawName: supplierItems.rawName,
          rawDescription: supplierItems.rawDescription,
          netPrice: supplierItems.netPrice,
          currency: supplierItems.currency,
          ean: supplierItems.ean,
          productType: supplierItems.productType,
          category: supplierItems.category,
          sourceFile: supplierItems.sourceFile,
        })
        .from(supplierItems)
        .where(eq(supplierItems.supplierId, this.supplierId))
    }

    // 3. Pre-fetch existing products by SKU to preserve stable IDs
    const existingProductsMap = new Map<string, { id: string; slug: string }>()
    const existingVariantsMap = new Map<string, { id: string }>()

    if (isDbConfigured) {
      const existingProds = await db
        .select({ id: products.id, sku: products.sku, slug: products.slug })
        .from(products)
        .where(eq(products.brandId, this.brandId))
      for (const p of existingProds) {
        if (p.sku) existingProductsMap.set(p.sku, { id: p.id, slug: p.slug })
      }

      const existingVars = await db
        .select({ id: productVariants.id, sku: productVariants.sku })
        .from(productVariants)
      for (const v of existingVars) {
        if (v.sku) existingVariantsMap.set(v.sku, { id: v.id })
      }
    }

    const report: PromotionReport = {
      totalProcessed: rawItems.length,
      canonicalProductsCreated: 0,
      canonicalProductsUpdated: 0,
      variantsCreated: 0,
      supplierOffersCreated: 0,
      marketOffersCreated: 0,
      publishedCount: 0,
      stagedReviewCount: 0,
      zeroPriceBlockedCount: 0,
      breakdown: {
        machines: 0,
        replacementParts: 0,
        optionParts: 0,
        electronics: 0,
        tools: 0,
        other: 0,
      },
    }

    const batchSize = 50
    for (let i = 0; i < rawItems.length; i += batchSize) {
      const chunk = rawItems.slice(i, i + batchSize)

      for (const item of chunk) {
        const upperSku = item.sku.trim().toUpperCase()
        const costEur = parseFloat(item.netPrice)
        const costEurMinor = Math.round(costEur * 100)

        // Block known zero price records or zero cost
        if (KNOWN_ZERO_PRICE_SKUS.has(upperSku) || costEurMinor <= 0) {
          report.zeroPriceBlockedCount++
          continue
        }

        const cleanName = (item.englishName || item.rawName).trim()
        const ids = generateDeterministicIdentifiers(item.sku)

        // Use existing ID and slug if product already existed
        const existingProd = existingProductsMap.get(item.sku)
        const prodId = existingProd ? existingProd.id : ids.prodId
        const cleanSlug = existingProd ? existingProd.slug : ids.slug

        const existingVar = existingVariantsMap.get(item.sku)
        const varId = existingVar ? existingVar.id : ids.varId

        const isKit = item.productType === 'KIT'
        const isControlledPublished = CONTROLLED_PUBLISHED_SKUS.has(upperSku)
        const status = isControlledPublished ? 'PUBLISHED' : 'REVIEW'
        const published = isControlledPublished

        if (published) {
          report.publishedCount++
        } else {
          report.stagedReviewCount++
        }

        // Category & Platform mapping
        const categoryId = resolveAvorriaCategoryId(item.productType, item.category, upperSku, cleanName)
        const platformId = isKit ? (MUGEN_PLATFORM_MAP[upperSku] || null) : null

        // Update category breakdown
        if (isKit) report.breakdown.machines++
        else if (item.productType === 'REPLACEMENT_PART') report.breakdown.replacementParts++
        else if (item.productType === 'OPTION_PART') report.breakdown.optionParts++
        else if (item.productType === 'TOOLS') report.breakdown.tools++
        else if (categoryId === 'cat-race-engines') report.breakdown.electronics++
        else report.breakdown.other++

        // Retail pricing
        const { retailGbp, retailUsd } = calculateRetailPrices(costEurMinor, item.productType, { gbp: fxGbp, usd: fxUsd })

        if (isDbConfigured) {
          // 1. Upsert Canonical Product
          const [savedProduct] = await db
            .insert(products)
            .values({
              id: prodId,
              slug: cleanSlug,
              sku: item.sku,
              manufacturerSku: item.sku,
              brandId: this.brandId,
              platformId,
              name: cleanName,
              shortName: item.sku,
              categoryId,
              productType: item.productType as any,
              tier: isKit ? 'PREMIUM' : 'STANDARD',
              status: status as any,
              lifecycle: 'ACTIVE',
              editorialSummary: item.rawDescription ? `${cleanName}. Technical note: ${item.rawDescription}` : cleanName,
              discipline: 'RACE' as any,
              published,
            })
            .onConflictDoUpdate({
              target: products.sku,
              set: {
                name: cleanName,
                platformId,
                categoryId,
                productType: item.productType as any,
                tier: isKit ? 'PREMIUM' : 'STANDARD',
                status: status as any,
                editorialSummary: item.rawDescription ? `${cleanName}. Technical note: ${item.rawDescription}` : cleanName,
                published,
                updatedAt: new Date(),
              },
            })
            .returning({ id: products.id })
          report.canonicalProductsCreated++

          const actualProductId = savedProduct?.id || prodId

          // 2. Upsert Product Variant
          const [savedVariant] = await db
            .insert(productVariants)
            .values({
              id: varId,
              productId: actualProductId,
              sku: item.sku,
              name: cleanName,
              status: status as any,
              lifecycle: 'ACTIVE',
              published,
            })
            .onConflictDoUpdate({
              target: productVariants.sku,
              set: {
                productId: actualProductId,
                name: cleanName,
                status: status as any,
                published,
                updatedAt: new Date(),
              },
            })
            .returning({ id: productVariants.id })
          report.variantsCreated++

          const actualVariantId = savedVariant?.id || varId

          // 3. Upsert Supplier Offer (Wholesale net cost in EUR)
          const soffId = ids.soffId
          await db
            .insert(supplierOffers)
            .values({
              id: soffId,
              canonicalProductId: actualProductId,
              canonicalVariantId: actualVariantId,
              supplierId: this.supplierId,
              supplierSku: item.sku,
              costMinorUnits: costEurMinor,
              currency: 'EUR',
              availability: 'IN_STOCK',
              inventoryAuthority: 'SUPPLIER_STOCK',
              quantity: 10,
              leadTimeDays: 5,
              leadTimeText: 'Factory warehouse dispatch 3–5 business days',
              marketCode: 'UK',
              freshnessState: 'FRESH',
              status: 'ACTIVE',
            })
            .onConflictDoUpdate({
              target: supplierOffers.id,
              set: {
                canonicalProductId: actualProductId,
                canonicalVariantId: actualVariantId,
                costMinorUnits: costEurMinor,
                currency: 'EUR',
                availability: 'IN_STOCK',
                lastCheckedAt: new Date(),
                updatedAt: new Date(),
              },
            })
          report.supplierOffersCreated++

          // 4. Upsert Commercial Market Offers (Retail prices in GBP and USD)
          // UK Market
          const offUkId = ids.offUkId
          await db
            .insert(marketOffers)
            .values({
              id: offUkId,
              productVariantId: actualVariantId,
              marketCode: 'UK',
              retailPrice: retailGbp,
              currency: 'GBP',
              taxMode: 'INCLUSIVE',
              availability: 'IN_STOCK',
              supplierId: this.supplierId,
              supplyRoute: 'DIRECT_MANUFACTURER',
              leadTimeDays: 5,
              notes: `Authoritative MUGEN import. Supplier cost: €${costEur.toFixed(2)} ex-VAT.`,
            })
            .onConflictDoUpdate({
              target: marketOffers.id,
              set: {
                productVariantId: actualVariantId,
                retailPrice: retailGbp,
                currency: 'GBP',
                taxMode: 'INCLUSIVE',
                availability: 'IN_STOCK',
                notes: `Authoritative MUGEN import. Supplier cost: €${costEur.toFixed(2)} ex-VAT.`,
                updatedAt: new Date(),
              },
            })

          // US Market
          const offUsId = ids.offUsId
          await db
            .insert(marketOffers)
            .values({
              id: offUsId,
              productVariantId: actualVariantId,
              marketCode: 'US',
              retailPrice: retailUsd,
              currency: 'USD',
              taxMode: 'EXCLUSIVE',
              availability: 'IN_STOCK',
              supplierId: this.supplierId,
              supplyRoute: 'DIRECT_MANUFACTURER',
              leadTimeDays: 7,
              notes: `Authoritative MUGEN import. Supplier cost: €${costEur.toFixed(2)} ex-VAT.`,
            })
            .onConflictDoUpdate({
              target: marketOffers.id,
              set: {
                productVariantId: actualVariantId,
                retailPrice: retailUsd,
                currency: 'USD',
                taxMode: 'EXCLUSIVE',
                availability: 'IN_STOCK',
                notes: `Authoritative MUGEN import. Supplier cost: €${costEur.toFixed(2)} ex-VAT.`,
                updatedAt: new Date(),
              },
            })
          report.marketOffersCreated += 2
        }
      }
    }

    return report
  }
}
