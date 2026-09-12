// Drizzle schema: products, platforms, variants, market offers, inventory

import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { brands } from './brands'
import { markets } from './brands'
import {
  productTierEnum,
  recordStatusEnum,
  lifecycleStatusEnum,
  productTypeEnum,
  powerTypeEnum,
  driveConfigEnum,
  availabilityStatusEnum,
  supplyRouteEnum,
  taxModeEnum,
  currencyEnum,
  marketCodeEnum,
} from './enums'

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  parentId: text('parent_id'), // self-reference for subcategories
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
})

// ─── Vehicle Platforms ────────────────────────────────────────────────────────

export const vehiclePlatforms = pgTable('vehicle_platforms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  brandId: text('brand_id').notNull().references(() => brands.id),
  chassisMaterial: text('chassis_material'),
  driveConfig: driveConfigEnum('drive_config'),
  wheelbaseMm: integer('wheelbase_mm'),
  description: text('description'),
  status: recordStatusEnum('status').notNull().default('DRAFT'),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('vehicle_platforms_brand_idx').on(t.brandId),
  index('vehicle_platforms_slug_idx').on(t.slug),
])

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  sku: text('sku'),
  brandId: text('brand_id').notNull().references(() => brands.id),
  platformId: text('platform_id').references(() => vehiclePlatforms.id),
  name: text('name').notNull(),
  shortName: text('short_name'),
  categoryId: text('category_id').references(() => categories.id),
  subcategoryId: text('subcategory_id').references(() => categories.id),
  scale: text('scale'), // e.g. "1:5", "1:10", "1:8"
  powerType: powerTypeEnum('power_type'),
  productType: productTypeEnum('product_type').notNull().default('VEHICLE'),
  tier: productTierEnum('tier').notNull().default('STANDARD'),
  status: recordStatusEnum('status').notNull().default('DRAFT'),
  lifecycle: lifecycleStatusEnum('lifecycle').notNull().default('ACTIVE'),
  replacementProductId: text('replacement_product_id'), // self-ref, set on REPLACED
  haloClassification: text('halo_classification'), // e.g. "1:5 COMPETITION"
  editorialSummary: text('editorial_summary'),
  published: boolean('published').notNull().default(false),
  // Full-text search vector — maintained by DB trigger in migration
  // searchVector: tsvector generated always
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('products_brand_idx').on(t.brandId),
  index('products_platform_idx').on(t.platformId),
  index('products_category_idx').on(t.categoryId),
  index('products_tier_idx').on(t.tier),
  index('products_lifecycle_idx').on(t.lifecycle),
  index('products_slug_idx').on(t.slug),
  uniqueIndex('products_sku_unique').on(t.sku),
])

// ─── Product Variants ─────────────────────────────────────────────────────────

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku').unique(),
  name: text('name').notNull(),
  colour: text('colour'),
  configuration: text('configuration'),
  weightG: integer('weight_g'),
  status: recordStatusEnum('status').notNull().default('DRAFT'),
  lifecycle: lifecycleStatusEnum('lifecycle').notNull().default('ACTIVE'),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('product_variants_product_idx').on(t.productId),
])

// ─── Market Offers ────────────────────────────────────────────────────────────
// The commercial record for a variant in a specific market.
// No prices or stock on products or variants directly.

export const marketOffers = pgTable('market_offers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productVariantId: text('product_variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  marketCode: marketCodeEnum('market_code').notNull().references(() => markets.code),
  // Retail price in minor units (pence for GBP, cents for USD)
  retailPrice: integer('retail_price').notNull(),
  currency: currencyEnum('currency').notNull(),
  taxMode: taxModeEnum('tax_mode').notNull(),
  availability: availabilityStatusEnum('availability').notNull().default('NOT_AVAILABLE'),
  supplierId: text('supplier_id'), // FK added in suppliers.ts migration
  supplyRoute: supplyRouteEnum('supply_route'),
  leadTimeDays: integer('lead_time_days'),
  preorderDate: date('preorder_date'),
  allocationQty: integer('allocation_qty'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('market_offers_variant_market_idx').on(t.productVariantId, t.marketCode),
  index('market_offers_market_idx').on(t.marketCode),
  index('market_offers_availability_idx').on(t.availability),
])

// ─── Inventory Sources ────────────────────────────────────────────────────────

export const inventorySources = pgTable('inventory_sources', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  marketOfferId: text('market_offer_id').notNull().references(() => marketOffers.id, { onDelete: 'cascade' }),
  source: text('source').notNull(), // WAREHOUSE | SUPPLIER | DROPSHIP | ESTIMATED
  quantity: integer('quantity').notNull().default(0),
  reservedQty: integer('reserved_qty').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const vehiclePlatformsRelations = relations(vehiclePlatforms, ({ one, many }) => ({
  brand: one(brands, {
    fields: [vehiclePlatforms.brandId],
    references: [brands.id],
  }),
  products: many(products),
}))

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  platform: one(vehiclePlatforms, {
    fields: [products.platformId],
    references: [vehiclePlatforms.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  replacedBy: one(products, {
    fields: [products.replacementProductId],
    references: [products.id],
    relationName: 'replacement',
  }),
}))

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  marketOffers: many(marketOffers),
}))

export const marketOffersRelations = relations(marketOffers, ({ one, many }) => ({
  variant: one(productVariants, {
    fields: [marketOffers.productVariantId],
    references: [productVariants.id],
  }),
  inventorySources: many(inventorySources),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'subcategories',
  }),
  children: many(categories, { relationName: 'subcategories' }),
}))
