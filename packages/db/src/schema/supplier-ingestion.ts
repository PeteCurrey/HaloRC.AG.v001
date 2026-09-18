// packages/db/src/schema/supplier-ingestion.ts
// Supplier Ingestion and Pricing Engine Tables

import {
  pgTable,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { suppliers } from './suppliers'

// ─── Supplier Price Lists ───────────────────────────────────────────────────

export const supplierPriceLists = pgTable('supplier_price_lists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  effectiveDate: date('effective_date').notNull(),
  currency: text('currency').notNull().default('EUR'),
  rowCount: integer('row_count').notNull().default(0),
  ingestRunId: text('ingest_run_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('spl_supplier_idx').on(t.supplierId),
  index('spl_date_idx').on(t.effectiveDate),
])

// ─── Supplier Items ─────────────────────────────────────────────────────────

export const supplierItems = pgTable('supplier_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  priceListId: text('price_list_id').references(() => supplierPriceLists.id, { onDelete: 'set null' }),
  supplierItemCode: text('supplier_item_code').notNull(),
  sku: text('sku').notNull(),
  rawName: text('raw_name').notNull(),
  rawDescription: text('raw_description'),
  englishName: text('english_name'),
  nameConfidence: text('name_confidence').notNull().default('VERIFIED'),
  netPrice: numeric('net_price', { precision: 10, scale: 4 }).notNull(),
  currency: text('currency').notNull().default('EUR'),
  ean: text('ean'),
  productType: text('product_type').notNull(),
  category: text('category').notNull(),
  sourceFile: text('source_file').notNull(),
  sourceDate: date('source_date').notNull(),
  exceptionFlags: jsonb('exception_flags').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('si_supplier_sku_idx').on(t.supplierId, t.sku),
  index('si_supplier_code_idx').on(t.supplierItemCode),
  index('si_source_date_idx').on(t.sourceDate),
  index('si_product_type_idx').on(t.productType),
])

// ─── Ingest Exceptions ──────────────────────────────────────────────────────

export const ingestExceptions = pgTable('ingest_exceptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').references(() => suppliers.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  rowNumber: integer('row_number').notNull(),
  reason: text('reason').notNull(),
  rawPayload: jsonb('raw_payload').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  resolutionNotes: text('resolution_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('ie_file_idx').on(t.fileName),
  index('ie_reason_idx').on(t.reason),
])

// ─── Pricing Rules ──────────────────────────────────────────────────────────

export const pricingRules = pgTable('pricing_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  category: text('category').notNull().unique(),
  markupPercentage: numeric('markup_percentage', { precision: 5, scale: 2 }),
  roundingRule: text('rounding_rule'),
  minimumMarginPercentage: numeric('minimum_margin_percentage', { precision: 5, scale: 2 }),
  configured: boolean('configured').notNull().default(false),
  updatedBy: text('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── FX Rates ───────────────────────────────────────────────────────────────

export const fxRates = pgTable('fx_rates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  baseCurrency: text('base_currency').notNull(),
  targetCurrency: text('target_currency').notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  source: text('source').notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('fx_pair_idx').on(t.baseCurrency, t.targetCurrency),
])
