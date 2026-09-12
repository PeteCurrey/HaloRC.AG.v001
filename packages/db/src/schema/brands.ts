// Drizzle schema: brands, manufacturers, markets

import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import {
  brandTierEnum,
  brandStatusEnum,
  marketCodeEnum,
  currencyEnum,
  taxModeEnum,
} from './enums'

// ─── Markets ──────────────────────────────────────────────────────────────────

export const markets = pgTable('markets', {
  code: marketCodeEnum('code').primaryKey(),
  name: text('name').notNull(),
  currency: currencyEnum('currency').notNull(),
  taxMode: taxModeEnum('tax_mode').notNull(),
  active: boolean('active').notNull().default(true),
})

export const marketTaxRules = pgTable('market_tax_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  marketCode: marketCodeEnum('market_code').notNull().references(() => markets.code),
  taxType: text('tax_type').notNull(), // VAT | SALES_TAX
  rate: integer('rate').notNull(), // basis points e.g. 2000 = 20%
  appliesToAll: boolean('applies_to_all').notNull().default(true),
  notes: text('notes'),
})

export const marketShippingRules = pgTable('market_shipping_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  marketCode: marketCodeEnum('market_code').notNull().references(() => markets.code),
  carrier: text('carrier').notNull(),
  serviceLevel: text('service_level').notNull(),
  weightFromG: integer('weight_from_g').notNull().default(0),
  weightToG: integer('weight_to_g'),
  pricePence: integer('price_pence').notNull(),
  leadTimeDays: integer('lead_time_days'),
  active: boolean('active').notNull().default(true),
})

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  tier: brandTierEnum('tier').notNull(),
  status: brandStatusEnum('status').notNull().default('TARGET'),
  countryOfOrigin: text('country_of_origin'),
  foundedYear: integer('founded_year'),
  description: text('description'),
  website: text('website'),
  logoStoragePath: text('logo_storage_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const manufacturers = pgTable('manufacturers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  brandId: text('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  legalName: text('legal_name').notNull(),
  country: text('country').notNull(),
  headquarters: text('headquarters'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Brand market presence (which markets a brand is available in) ────────────

export const brandMarkets = pgTable('brand_markets', {
  brandId: text('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  marketCode: marketCodeEnum('market_code').notNull().references(() => markets.code),
  active: boolean('active').notNull().default(true),
  notes: text('notes'),
}, (t) => [primaryKey({ columns: [t.brandId, t.marketCode] })])

// ─── Relations ────────────────────────────────────────────────────────────────

export const brandsRelations = relations(brands, ({ many, one }) => ({
  manufacturer: one(manufacturers, {
    fields: [brands.id],
    references: [manufacturers.brandId],
  }),
  brandMarkets: many(brandMarkets),
}))

export const manufacturersRelations = relations(manufacturers, ({ one }) => ({
  brand: one(brands, {
    fields: [manufacturers.brandId],
    references: [brands.id],
  }),
}))

export const marketsRelations = relations(markets, ({ many }) => ({
  taxRules: many(marketTaxRules),
  shippingRules: many(marketShippingRules),
  brandMarkets: many(brandMarkets),
}))
