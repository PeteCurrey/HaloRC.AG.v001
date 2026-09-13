/**
 * Seed script — Phase 2 Authoritative Catalogue & Product Graph.
 *
 * All confidence levels explicitly set (VERIFIED, KNOWN, INFERRED, UNKNOWN).
 * Contains full product graph:
 *   Brand -> Platform -> Vehicle -> Variant -> Product/Part -> Compatibility -> Market Offer
 * Contains independent dual-market commercial offers (UK GBP / US USD).
 *
 * Run: pnpm db:seed
 */

import { db } from '../client'
import {
  brands,
  markets,
  categories,
  vehiclePlatforms,
  products,
  productVariants,
  marketOffers,
  specifications,
  compatibilityRules,
  documents,
  suppliers,
  builds,
  buildSlots,
  buildAlternatives,
} from '../schema'
import {
  SEED_BRANDS,
  SEED_PLATFORMS,
  SEED_PRODUCTS,
  SEED_VARIANTS,
  SEED_OFFERS,
  SEED_SPECIFICATIONS,
  SEED_COMPATIBILITY_RULES,
  SEED_DOCUMENTS,
} from './catalogue-data'

export async function seed() {
  console.log('🌱 Starting Phase 2 verified catalogue seed...')

  // ── Markets ──────────────────────────────────────────────────────────────
  console.log('  → Markets')
  await db.insert(markets).values([
    { code: 'UK', name: 'United Kingdom', currency: 'GBP', taxMode: 'INCLUSIVE', active: true },
    { code: 'US', name: 'United States', currency: 'USD', taxMode: 'EXCLUSIVE', active: true },
  ]).onConflictDoNothing()

  // ── Categories ───────────────────────────────────────────────────────────
  console.log('  → Categories')
  const categoryData = [
    { id: 'cat-machines', slug: 'machines', name: 'The Machines', parentId: null, sortOrder: 1 },
    { id: 'cat-race', slug: 'race', name: 'Race Department', parentId: null, sortOrder: 2 },
    { id: 'cat-parts', slug: 'parts', name: 'Parts & Upgrades', parentId: null, sortOrder: 3 },
    { id: 'cat-electronics', slug: 'electronics', name: 'Electronics', parentId: null, sortOrder: 4 },
    { id: 'cat-garage-culture', slug: 'garage', name: 'The Garage', parentId: null, sortOrder: 5 },
    { id: 'cat-bash', slug: 'bash', name: 'Bash', parentId: 'cat-machines', sortOrder: 1 },
    { id: 'cat-race-machines', slug: 'race-machines', name: 'Race', parentId: 'cat-machines', sortOrder: 2 },
    { id: 'cat-drift', slug: 'drift', name: 'Drift', parentId: 'cat-machines', sortOrder: 3 },
    { id: 'cat-crawl', slug: 'crawl', name: 'Crawl', parentId: 'cat-machines', sortOrder: 4 },
    { id: 'cat-scale', slug: 'scale', name: 'Scale', parentId: 'cat-machines', sortOrder: 5 },
    { id: 'cat-large-scale', slug: 'large-scale', name: 'Large Scale / 1:5', parentId: 'cat-machines', sortOrder: 6 },
    { id: 'cat-15-onroad', slug: '1-5-on-road', name: '1/5 On-Road', parentId: 'cat-race', sortOrder: 1 },
    { id: 'cat-110-touring', slug: '1-10-touring', name: '1/10 Touring', parentId: 'cat-race', sortOrder: 2 },
    { id: 'cat-18-buggy', slug: '1-8-buggy', name: '1/8 Buggy', parentId: 'cat-race', sortOrder: 3 },
    { id: 'cat-18-gt', slug: '1-8-gt', name: '1/8 GT', parentId: 'cat-race', sortOrder: 4 },
    { id: 'cat-f1', slug: 'f1', name: 'F1', parentId: 'cat-race', sortOrder: 5 },
    { id: 'cat-112', slug: '1-12', name: '1/12 Pan Car', parentId: 'cat-race', sortOrder: 6 },
    { id: 'cat-race-engines', slug: 'race-engines', name: 'Competition Engines', parentId: 'cat-race', sortOrder: 7 },
    { id: 'cat-race-electronics', slug: 'race-electronics', name: 'Competition Electronics', parentId: 'cat-race', sortOrder: 8 },
  ]

  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onConflictDoNothing()
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────
  console.log('  → Suppliers')
  await db.insert(suppliers).values([
    {
      id: 'sup-cml',
      slug: 'cml-distribution',
      name: 'CML Distribution',
      type: 'DISTRIBUTOR',
      country: 'GB',
      website: 'https://cmldistribution.co.uk',
      status: 'ACTIVE',
      notes: 'Authoritative UK distributor for premium race chassis and electronics',
    },
    {
      id: 'sup-rcmart',
      slug: 'rc-mart',
      name: 'RC Mart',
      type: 'DISTRIBUTOR',
      country: 'HK',
      website: 'https://rcmart.com',
      status: 'ACTIVE',
      notes: 'Direct Asia-Pacific competition specialist',
    },
  ]).onConflictDoNothing()

  // ── Brands ───────────────────────────────────────────────────────────────
  console.log('  → Brands')
  for (const brand of SEED_BRANDS) {
    await db.insert(brands).values({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      tier: brand.tier,
      status: brand.status,
      countryOfOrigin: brand.countryOfOrigin,
      foundedYear: brand.foundedYear,
      description: brand.description,
      website: brand.website,
    }).onConflictDoNothing()
  }

  // ── Vehicle Platforms ────────────────────────────────────────────────────
  console.log('  → Vehicle Platforms')
  for (const plat of SEED_PLATFORMS) {
    await db.insert(vehiclePlatforms).values({
      id: plat.id,
      slug: plat.slug,
      name: plat.name,
      brandId: plat.brandId,
      chassisMaterial: plat.chassisMaterial,
      driveConfig: plat.driveConfig,
      wheelbaseMm: plat.wheelbaseMm,
      description: plat.description,
      status: plat.status,
      published: plat.published,
    }).onConflictDoNothing()
  }

  // ── Products ─────────────────────────────────────────────────────────────
  console.log('  → Products')
  for (const prod of SEED_PRODUCTS) {
    await db.insert(products).values({
      id: prod.id,
      slug: prod.slug,
      sku: prod.sku,
      brandId: prod.brandId,
      platformId: prod.platformId,
      name: prod.name,
      shortName: prod.shortName,
      categoryId: prod.categoryId,
      subcategoryId: prod.subcategoryId,
      scale: prod.scale,
      powerType: prod.powerType,
      productType: prod.productType,
      tier: prod.tier,
      status: prod.status,
      lifecycle: prod.lifecycle,
      replacementProductId: prod.replacementProductId,
      haloClassification: prod.haloClassification,
      editorialSummary: prod.editorialSummary,
      published: prod.published,
    }).onConflictDoNothing()
  }

  // ── Product Variants ─────────────────────────────────────────────────────
  console.log('  → Product Variants')
  for (const v of SEED_VARIANTS) {
    await db.insert(productVariants).values(v).onConflictDoNothing()
  }

  // ── Market Offers ────────────────────────────────────────────────────────
  console.log('  → Market Offers (Dual-Market Architecture)')
  for (const offer of SEED_OFFERS) {
    await db.insert(marketOffers).values({
      id: offer.id,
      productVariantId: offer.productVariantId,
      marketCode: offer.marketCode,
      retailPrice: offer.retailPrice,
      currency: offer.currency,
      taxMode: offer.taxMode,
      availability: offer.availability,
      supplyRoute: offer.supplyRoute,
      leadTimeDays: offer.leadTimeDays,
      notes: offer.notes,
    }).onConflictDoNothing()
  }

  // ── Specifications with Provenance ───────────────────────────────────────
  console.log('  → Specifications (Provenance & Confidence)')
  for (const spec of SEED_SPECIFICATIONS) {
    await db.insert(specifications).values({
      id: spec.id,
      entityType: spec.entityType,
      entityId: spec.entityId,
      key: spec.key,
      value: spec.value,
      unit: spec.unit,
      confidence: spec.confidence,
      sourceType: spec.sourceType,
      sourceUrl: spec.sourceUrl,
      sourceDocument: spec.sourceDocument,
      verifiedAt: spec.verifiedAt ? new Date(spec.verifiedAt) : null,
      notes: spec.notes,
    }).onConflictDoNothing()
  }

  // ── Compatibility Rules ──────────────────────────────────────────────────
  console.log('  → Compatibility Rules (Structured Non-AI Graph)')
  for (const rule of SEED_COMPATIBILITY_RULES) {
    await db.insert(compatibilityRules).values({
      id: rule.id,
      sourceEntityType: rule.sourceEntityType,
      sourceEntityId: rule.sourceEntityId,
      targetEntityType: rule.targetEntityType,
      targetEntityId: rule.targetEntityId,
      ruleType: rule.ruleType,
      verified: rule.verified,
      sourceType: rule.sourceType,
      sourceUrl: rule.sourceUrl,
      notes: rule.notes,
    }).onConflictDoNothing()
  }

  // ── Documents ────────────────────────────────────────────────────────────
  console.log('  → Documents')
  for (const doc of SEED_DOCUMENTS) {
    await db.insert(documents).values({
      id: doc.id,
      entityType: doc.entityType,
      entityId: doc.entityId,
      documentType: doc.documentType,
      title: doc.title,
      version: doc.version,
      sourceUrl: doc.sourceUrl,
      approvedForUse: doc.approvedForUse,
      published: doc.published,
    }).onConflictDoNothing()
  }

  // ── Configurator / Build My Rig Slots Foundation ─────────────────────────
  console.log('  → Build My Rig Foundation Slots')
  const x4BuildId = 'build-xray-x4-spec'
  await db.insert(builds).values({
    id: x4BuildId,
    slug: 'xray-x4-2026-factory-spec-build',
    buildType: 'RECOMMENDED_BUILD',
    platformId: 'plat-xray-x4',
    baseProductId: 'prod-xray-x4-2026',
    marketCode: 'UK',
    name: 'XRAY X4 2026 Factory Team Carpet Build',
    description: 'Reference factory team configuration for indoor carpet competition.',
    status: 'PUBLISHED',
    published: true,
  }).onConflictDoNothing()

  const x4Slots = [
    { id: 'slot-x4-esc', buildId: x4BuildId, role: 'ESC' as const, requirement: 'REQUIRED' as const, selectedProductId: 'prod-hw-xr10-pro-g3', sortOrder: 1 },
    { id: 'slot-x4-servo', buildId: x4BuildId, role: 'SERVO_STEERING' as const, requirement: 'REQUIRED' as const, selectedProductId: 'prod-savox-sb2292sg', sortOrder: 2 },
    { id: 'slot-x4-radio', buildId: x4BuildId, role: 'RADIO' as const, requirement: 'RECOMMENDED' as const, selectedProductId: 'prod-sanwa-m17', sortOrder: 3 },
  ]

  for (const slot of x4Slots) {
    await db.insert(buildSlots).values(slot).onConflictDoNothing()
  }

  console.log('✅ Complete Phase 2 verified seed finished successfully.')
}

// Run automatically when executed directly via tsx
seed().catch((err) => {
  if (process.env['NODE_ENV'] !== 'test') {
    console.error('❌ Seed failed:', err)
  }
})
