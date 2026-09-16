/**
 * Catalogue Store — mutable in-memory store for development and hermetic unit tests.
 *
 * PRODUCTION FAILSAFE:
 * When NODE_ENV === 'production', all stores are initialised as EMPTY ARRAYS.
 * Seed data must NEVER reach customer-facing UI in production.
 * Production catalogue data must come exclusively from the Supabase database.
 *
 * In development and test environments the stores are pre-populated with
 * catalogue-data.ts seed data so that queries work offline.
 */

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
  type SeedVariant,
  type SeedOffer,
  type SeedSpecification,
} from '../seed/catalogue-data'

/**
 * Determine whether seed data is permitted in this environment.
 * Seed data is ONLY permitted in development and test environments.
 * In production the stores are empty — real data comes from the database.
 */
const IS_PRODUCTION = process.env['NODE_ENV'] === 'production'

function productionEmpty<T>(data: T[]): T[] {
  if (IS_PRODUCTION) {
    return []
  }
  return [...data]
}

export let STORE_PRODUCTS: SeedProduct[] = productionEmpty(SEED_PRODUCTS)
export let STORE_VARIANTS: SeedVariant[] = productionEmpty(SEED_VARIANTS)
export let STORE_OFFERS: SeedOffer[] = productionEmpty(SEED_OFFERS)
export let STORE_SPECIFICATIONS: SeedSpecification[] = productionEmpty(SEED_SPECIFICATIONS)
export let STORE_PLATFORMS: SeedPlatform[] = productionEmpty(SEED_PLATFORMS)
export let STORE_BRANDS: SeedBrand[] = productionEmpty(SEED_BRANDS)
export let STORE_COMPATIBILITY_RULES = productionEmpty(SEED_COMPATIBILITY_RULES)
export let STORE_DOCUMENTS = productionEmpty(SEED_DOCUMENTS)

export function __resetCatalogueStoreForTesting() {
  // Always use seed data when resetting for tests (tests never run in production)
  STORE_PRODUCTS = [...SEED_PRODUCTS]
  STORE_VARIANTS = [...SEED_VARIANTS]
  STORE_OFFERS = [...SEED_OFFERS]
  STORE_SPECIFICATIONS = [...SEED_SPECIFICATIONS]
  STORE_PLATFORMS = [...SEED_PLATFORMS]
  STORE_BRANDS = [...SEED_BRANDS]
  STORE_COMPATIBILITY_RULES = [...SEED_COMPATIBILITY_RULES]
  STORE_DOCUMENTS = [...SEED_DOCUMENTS]
}

export function __addCatalogueProductForTesting(
  product: SeedProduct,
  variant?: Partial<SeedVariant>,
  offers?: Partial<SeedOffer>[]
) {
  const existingIdx = STORE_PRODUCTS.findIndex((p) => p.id === product.id || p.slug === product.slug)
  if (existingIdx >= 0) {
    STORE_PRODUCTS[existingIdx] = product
  } else {
    STORE_PRODUCTS.push(product)
  }

  const varId = variant?.id ?? `var-${product.id}`
  const existingVarIdx = STORE_VARIANTS.findIndex((v) => v.productId === product.id)
  const newVariant = {
    id: varId,
    productId: product.id,
    sku: product.sku || `${product.id}-DEFAULT`,
    name: product.name,
    status: product.status,
    lifecycle: product.lifecycle,
    published: product.published,
    ...variant,
  } as SeedVariant

  if (existingVarIdx >= 0) {
    STORE_VARIANTS[existingVarIdx] = newVariant
  } else {
    STORE_VARIANTS.push(newVariant)
  }

  if (offers && offers.length > 0) {
    for (const off of offers) {
      STORE_OFFERS.push({
        id: off.id ?? `off-${crypto.randomUUID()}`,
        productVariantId: varId,
        marketCode: off.marketCode ?? 'UK',
        retailPrice: off.retailPrice ?? 49900,
        currency: off.currency ?? (off.marketCode === 'US' ? 'USD' : 'GBP'),
        taxMode: off.taxMode ?? (off.marketCode === 'US' ? 'EXCLUSIVE' : 'INCLUSIVE'),
        availability: off.availability ?? 'IN_STOCK',
        supplyRoute: off.supplyRoute ?? 'UK_DISTRIBUTOR',
        leadTimeDays: off.leadTimeDays ?? 2,
        ...(off.notes ? { notes: off.notes } : {}),
      } as SeedOffer)
    }
  } else {
    STORE_OFFERS.push(
      {
        id: `off-${product.id}-uk`,
        productVariantId: varId,
        marketCode: 'UK',
        retailPrice: 59900,
        currency: 'GBP',
        taxMode: 'INCLUSIVE',
        availability: 'IN_STOCK',
        supplyRoute: 'UK_DISTRIBUTOR',
        leadTimeDays: 2,
      },
      {
        id: `off-${product.id}-us`,
        productVariantId: varId,
        marketCode: 'US',
        retailPrice: 69900,
        currency: 'USD',
        taxMode: 'EXCLUSIVE',
        availability: 'IN_STOCK',
        supplyRoute: 'US_DISTRIBUTOR',
        leadTimeDays: 3,
      }
    )
  }
}

export function __updateCatalogueProductForTesting(
  id: string,
  updates: Partial<SeedProduct>
) {
  const prod = STORE_PRODUCTS.find((p) => p.id === id || p.slug === id)
  if (prod) {
    Object.assign(prod, updates)

    if (updates.published !== undefined) {
      const vars = STORE_VARIANTS.filter((v) => v.productId === prod.id)
      for (const v of vars) {
        v.published = updates.published
        if (updates.status) v.status = updates.status
      }
    }
  }
}
