// Drizzle schema: suppliers, supplier CRM, distributor relationships

import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { brands } from './brands'
import { markets } from './brands'
import { marketCodeEnum } from './enums'
import { supplierTypeEnum, supplierStatusEnum, supplyRouteEnum } from './enums'

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  type: supplierTypeEnum('type').notNull(),
  country: text('country').notNull(),
  website: text('website'),
  status: supplierStatusEnum('status').notNull().default('PROSPECT'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Supplier Contacts ────────────────────────────────────────────────────────

export const supplierContacts = pgTable('supplier_contacts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role'),
  email: text('email'), // encrypted at application layer before storage
  phone: text('phone'), // encrypted at application layer before storage
  isPrimary: boolean('is_primary').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_contacts_supplier_idx').on(t.supplierId),
])

// ─── Supplier Brand Relationships ─────────────────────────────────────────────

export const supplierBrandRelationships = pgTable('supplier_brand_relationships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  brandId: text('brand_id').notNull().references(() => brands.id),
  marketCode: marketCodeEnum('market_code').notNull().references(() => markets.code),
  exclusive: boolean('exclusive').notNull().default(false),
  supplyRoute: supplyRouteEnum('supply_route'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | INACTIVE | NEGOTIATING
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_brand_supplier_idx').on(t.supplierId),
  index('supplier_brand_brand_idx').on(t.brandId),
])

// ─── Supplier Terms ───────────────────────────────────────────────────────────
// COMMERCIALLY SENSITIVE — service_role access only via RLS
// Never exposed to public API under any circumstances

export const supplierTerms = pgTable('supplier_terms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  brandId: text('brand_id').references(() => brands.id),
  marketCode: marketCodeEnum('market_code').references(() => markets.code),
  openingOrderMin: integer('opening_order_min'), // in minor units
  minimumOrderQty: integer('minimum_order_qty'),
  creditTermsDays: integer('credit_terms_days'),
  paymentMethod: text('payment_method'),
  mapPolicy: boolean('map_policy').notNull().default(false), // minimum advertised price
  dropshipAvailable: boolean('dropship_available').notNull().default(false),
  preorderAvailable: boolean('preorder_available').notNull().default(false),
  allocationModel: text('allocation_model'),
  notes: text('notes'),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Supplier Documents ───────────────────────────────────────────────────────

export const supplierDocuments = pgTable('supplier_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(), // PRICE_LIST | TERMS | CATALOGUE | AGREEMENT
  title: text('title').notNull(),
  version: text('version'),
  storagePath: text('storage_path'),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Supplier Activity Log ────────────────────────────────────────────────────

export const supplierActivityLog = pgTable('supplier_activity_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
  activityType: text('activity_type').notNull(), // CALL | EMAIL | MEETING | ORDER | NOTE
  summary: text('summary').notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_activity_supplier_idx').on(t.supplierId),
])

// ─── Relations ────────────────────────────────────────────────────────────────

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  contacts: many(supplierContacts),
  brandRelationships: many(supplierBrandRelationships),
  terms: many(supplierTerms),
  documents: many(supplierDocuments),
  activityLog: many(supplierActivityLog),
}))
