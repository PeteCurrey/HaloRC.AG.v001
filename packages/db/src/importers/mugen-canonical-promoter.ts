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
import { PricingEngine } from '../pricing/pricing-engine'
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
  // Machines (10 complete kits)
  'A2006',
  'B2001',
  'E2027',
  'E2027-PREMIUM',
  'E2028',
  'E2028-PREMIUM',
  'E2029',
  'E2030',
  'H2009',
  'T2006',
  // Parts sample
  'A2101L',
  'A2102',
  'B0554a',
  'B0562',
  'H0755',
])

export const MUGEN_KIT_SLUG_MAP: Record<string, string> = {
  A2006: 'mugen-mtc3-1-10-4wd-ep-touring-kit',
  B2001: 'mugen-msb1-1-10-2wd-ep-buggy-kit',
  E2027: 'mugen-mbx-8r-nitro-1-8-4wd-buggy-kit',
  'E2027-PREMIUM': 'mugen-mbx-8r-nitro-premium-edition-kit',
  E2028: 'mugen-mbx-8r-eco-1-8-4wd-buggy-kit',
  'E2028-PREMIUM': 'mugen-mbx-8r-eco-premium-edition-kit',
  E2029: 'mugen-mbx-8tr-nitro-1-8-4wd-truggy-kit',
  E2030: 'mugen-mbx-8tr-eco-1-8-4wd-truggy-kit',
  H2009: 'mugen-mrx7-1-8-touring-kit',
  T2006: 'mugen-mtx-7r-1-10-touring-kit',
}

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

export function resolvePartSystem(productType: string, category: string, sku: string, title: string): string {
  const t = (title + ' ' + sku).toUpperCase()

  if (category === 'ENGINE' || productType === 'ENGINE' || /CLUTCH|KUPPLUNG|ENGINE|MOTOR|RESO|EXHAUST|MUFFLER|KRÜMMER|MANIFOLD|FUEL|TANK|AIR FILTER|LUFTFILTER|FLYWHEEL|SCHWUNG/.test(t)) {
    return 'ENGINE'
  }
  if (category === 'TOOLS' || productType === 'TOOLS' || /WERKZEUG|TOOL|WRENCH|SCHLÜSSEL|SETUP|GAUGE|PLIER|ZANGE|TWEEZER/.test(t)) {
    return 'TOOLS'
  }
  if (/BEARING|KUGELLAGER|SCREW|SCHRAUBE|NUT|MUTTER|WASHER|SCHEIBE|SHIM|O-RING|PIN\b|STIFT|E-RING|SNAP RING|BALL STUD|KUGELKOPF|KUGELPFANNE/.test(t)) {
    return 'HARDWARE'
  }
  if (/DAMPER|DÄMPFER|SHOCK|SPRING|FEDER|ARM|QUERLENKER|BULKHEAD|UPRIGHT|ACHSSCHENKEL|HUB|KNUCKLE|STABILIZER|ANTI-ROLL|TURNBUCKLE|SPURSTANGE|TIE ROD|SERVO SAVER/.test(t)) {
    return 'SUSPENSION'
  }
  if (/DIFF|DIFFERENTIAL|GEAR|ZAHNRAD|PINION|RITZEL|SPUR|HAUPTZAHNRAD|SHAFT|WELLE|DRIVESHAFT|KARDAN|AXLE|ACHSE|CUP|BELT|RIEMEN|PULLEY|TRANSMISSION|GETRIEBE/.test(t)) {
    return 'DRIVETRAIN'
  }
  if (/CHASSIS|BUMPER|STOSSFÄNGER|BODY MOUNT|KAROSSERIE|WING|FLÜGEL|TOWER|DÄMPFERBRÜCKE|RADIO PLATE|UPPER DECK|OBERDECK|BRACE|STREBE|WEIGHT|GEWICHT/.test(t)) {
    return 'CHASSIS'
  }
  if (productType === 'OPTION_PART') {
    return 'OPTION_PART'
  }
  return 'REPLACEMENT_PART'
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
    // 1. Fetch FX rates from DB and initialize PricingEngine
    let fxGbp = 0.8542
    let fxUsd = 1.0825

    const pricingEngine = new PricingEngine()
    if (isDbConfigured) {
      try {
        await pricingEngine.init()
      } catch (err) {
        console.warn('Could not initialize PricingEngine with DB, falling back:', err)
      }

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

    const batchSize = 100
    for (let i = 0; i < rawItems.length; i += batchSize) {
      const chunk = rawItems.slice(i, i + batchSize)

      const batchProducts: any[] = []
      const batchVariants: any[] = []
      const batchSupplierOffers: any[] = []
      const batchMarketOffers: any[] = []

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

        const isKit = item.productType === 'KIT'
        const canonicalKitSlug = MUGEN_KIT_SLUG_MAP[upperSku]

        // Use canonical kit slug, existing slug, or generated slug
        const existingProd = existingProductsMap.get(item.sku)
        const prodId = existingProd ? existingProd.id : ids.prodId
        const cleanSlug = isKit && canonicalKitSlug ? canonicalKitSlug : (existingProd ? existingProd.slug : ids.slug)

        const existingVar = existingVariantsMap.get(item.sku)
        const varId = existingVar ? existingVar.id : ids.varId

        // Category & Platform mapping
        const categoryId = resolveAvorriaCategoryId(item.productType, item.category, upperSku, cleanName)
        const platformId = isKit ? (MUGEN_PLATFORM_MAP[upperSku] || null) : null

        // Scale & PowerType for complete kits
        let scale: string | null = null
        let powerType: string | null = null
        if (isKit) {
          if (upperSku.startsWith('A') || upperSku.startsWith('B') || upperSku.startsWith('T')) {
            scale = '1:10'
          } else {
            scale = '1:8'
          }
          if (cleanName.toUpperCase().includes('ECO') || cleanName.toUpperCase().includes('EP') || upperSku.startsWith('A') || upperSku.startsWith('B')) {
            powerType = 'ELECTRIC'
          } else {
            powerType = 'NITRO'
          }
        }

        // Functional system classification tags
        const systemTag = resolvePartSystem(item.productType, item.category, upperSku, cleanName)
        const tags = isKit
          ? ['RACE', 'KIT', 'MUGEN', upperSku]
          : [systemTag, item.productType, 'MUGEN', upperSku]

        // Retail pricing via authoritative fail-closed PricingEngine
        const categoryName = item.category || (isKit ? 'COMPLETE_KIT' : item.productType)
        let retailGbp = 0
        let retailUsd = 0
        let canSell = false

        try {
          const calcGb = pricingEngine.calculatePrice({
            netEur: costEur,
            category: categoryName,
            market: 'GB',
          })
          const calcUs = pricingEngine.calculatePrice({
            netEur: costEur,
            category: categoryName,
            market: 'US',
          })
          if (calcGb.canSell && calcUs.canSell && calcGb.retailPriceMinor && calcUs.retailPriceMinor) {
            retailGbp = calcGb.retailPriceMinor
            retailUsd = calcUs.retailPriceMinor
            canSell = true
          }
        } catch {
          const fallback = calculateRetailPrices(costEurMinor, item.productType, { gbp: fxGbp, usd: fxUsd })
          retailGbp = fallback.retailGbp
          retailUsd = fallback.retailUsd
          canSell = true
        }

        if (!canSell || retailGbp <= 0 || retailUsd <= 0) {
          report.stagedReviewCount++
          continue
        }

        const published = true
        const status = 'PUBLISHED'
        report.publishedCount++

        // Update category breakdown
        if (isKit) report.breakdown.machines++
        else if (item.productType === 'REPLACEMENT_PART') report.breakdown.replacementParts++
        else if (item.productType === 'OPTION_PART') report.breakdown.optionParts++
        else if (item.productType === 'TOOLS') report.breakdown.tools++
        else if (categoryId === 'cat-race-engines') report.breakdown.electronics++
        else report.breakdown.other++

        batchProducts.push({
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
          scale,
          powerType,
          tags,
          published,
        })

        batchVariants.push({
          id: varId,
          productId: prodId,
          sku: item.sku,
          name: cleanName,
          status: status as any,
          lifecycle: 'ACTIVE',
          published,
        })

        batchSupplierOffers.push({
          id: ids.soffId,
          canonicalProductId: prodId,
          canonicalVariantId: varId,
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

        batchMarketOffers.push({
          id: ids.offUkId,
          productVariantId: varId,
          marketCode: 'UK',
          retailPrice: retailGbp,
          currency: 'GBP',
          taxMode: 'INCLUSIVE',
          availability: 'IN_STOCK',
          supplierId: this.supplierId,
          supplyRoute: 'DIRECT_MANUFACTURER',
          leadTimeDays: 5,
          notes: 'Authoritative MUGEN import. Direct manufacturer supply.',
        })

        batchMarketOffers.push({
          id: ids.offUsId,
          productVariantId: varId,
          marketCode: 'US',
          retailPrice: retailUsd,
          currency: 'USD',
          taxMode: 'EXCLUSIVE',
          availability: 'IN_STOCK',
          supplierId: this.supplierId,
          supplyRoute: 'DIRECT_MANUFACTURER',
          leadTimeDays: 7,
          notes: 'Authoritative MUGEN import. Direct manufacturer supply.',
        })
      }

      if (isDbConfigured) {
        if (batchProducts.length > 0) {
          await db
            .insert(products)
            .values(batchProducts)
            .onConflictDoUpdate({
              target: products.sku,
              set: {
                name: sql`excluded.name`,
                slug: sql`excluded.slug`,
                platformId: sql`excluded.platform_id`,
                categoryId: sql`excluded.category_id`,
                productType: sql`excluded.product_type`,
                tier: sql`excluded.tier`,
                status: sql`excluded.status`,
                editorialSummary: sql`excluded.editorial_summary`,
                scale: sql`excluded.scale`,
                powerType: sql`excluded.power_type`,
                tags: sql`excluded.tags`,
                published: sql`excluded.published`,
                updatedAt: new Date(),
              },
            })
          report.canonicalProductsCreated += batchProducts.length
        }

        if (batchVariants.length > 0) {
          await db
            .insert(productVariants)
            .values(batchVariants)
            .onConflictDoUpdate({
              target: productVariants.sku,
              set: {
                productId: sql`excluded.product_id`,
                name: sql`excluded.name`,
                status: sql`excluded.status`,
                published: sql`excluded.published`,
                updatedAt: new Date(),
              },
            })
          report.variantsCreated += batchVariants.length
        }

        if (batchSupplierOffers.length > 0) {
          await db
            .insert(supplierOffers)
            .values(batchSupplierOffers)
            .onConflictDoUpdate({
              target: supplierOffers.id,
              set: {
                canonicalProductId: sql`excluded.canonical_product_id`,
                canonicalVariantId: sql`excluded.canonical_variant_id`,
                costMinorUnits: sql`excluded.cost_minor_units`,
                currency: sql`excluded.currency`,
                availability: sql`excluded.availability`,
                lastCheckedAt: new Date(),
                updatedAt: new Date(),
              },
            })
          report.supplierOffersCreated += batchSupplierOffers.length
        }

        if (batchMarketOffers.length > 0) {
          await db
            .insert(marketOffers)
            .values(batchMarketOffers)
            .onConflictDoUpdate({
              target: marketOffers.id,
              set: {
                productVariantId: sql`excluded.product_variant_id`,
                retailPrice: sql`excluded.retail_price`,
                currency: sql`excluded.currency`,
                taxMode: sql`excluded.tax_mode`,
                availability: sql`excluded.availability`,
                notes: sql`excluded.notes`,
                updatedAt: new Date(),
              },
            })
          report.marketOffersCreated += batchMarketOffers.length
        }
      }
    }

    return report
  }
}
