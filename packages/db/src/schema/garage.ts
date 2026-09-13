// Drizzle schema: My Garage — user vehicles, builds, service, QR/serial

import {
  pgTable,
  text,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { products, productVariants, vehiclePlatforms } from './products'
import { builds } from './builds'
import { documents, mediaAssets } from './content'
import { vehicleStatusEnum, serviceTypeEnum } from './enums'

// ─── Garages ──────────────────────────────────────────────────────────────────

export const garages = pgTable('garages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(), // FK to auth.users via RLS
  name: text('name').notNull().default('My Garage'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('garages_user_idx').on(t.userId),
])

// ─── Garage Vehicles ──────────────────────────────────────────────────────────

export const garageVehicles = pgTable('garage_vehicles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  garageId: text('garage_id').notNull().references(() => garages.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id), // the specific vehicle product
  platformId: text('platform_id').references(() => vehiclePlatforms.id), // for parts filtering
  variantId: text('variant_id').references(() => productVariants.id), // specific variant
  name: text('name').notNull().default('My RC Vehicle'),
  nickname: text('nickname'),
  colour: text('colour'),
  purchaseDate: date('purchase_date'),
  // QR/serial registration
  serialNumber: text('serial_number'),
  qrCodeToken: text('qr_code_token').unique().$defaultFn(() => crypto.randomUUID()),
  isPublic: boolean('is_public').notNull().default(false),
  status: vehicleStatusEnum('status').notNull().default('ACTIVE'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('garage_vehicles_garage_idx').on(t.garageId),
  index('garage_vehicles_platform_idx').on(t.platformId),
  index('garage_vehicles_qr_idx').on(t.qrCodeToken),
  index('garage_vehicles_status_idx').on(t.status),
  index('garage_vehicles_public_idx').on(t.isPublic),
])

// ─── Garage Builds ────────────────────────────────────────────────────────────

export const garageBuilds = pgTable('garage_builds', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  garageVehicleId: text('garage_vehicle_id').notNull().references(() => garageVehicles.id, { onDelete: 'cascade' }),
  buildId: text('build_id').references(() => builds.id),
  name: text('name').notNull(),
  status: text('status').notNull().default('CONCEPT'), // CONCEPT | ACTIVE | RETIRED
  configurationSnapshot: jsonb('configuration_snapshot'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Service Log ──────────────────────────────────────────────────────────────

export const garageServiceLog = pgTable('garage_service_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  garageVehicleId: text('garage_vehicle_id').notNull().references(() => garageVehicles.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  serviceType: serviceTypeEnum('service_type').notNull().default('MAINTENANCE'),
  title: text('title').notNull().default('Maintenance Entry'),
  description: text('description').notNull(),
  partsUsed: text('parts_used'), // JSON array of product IDs or objects
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('service_log_vehicle_idx').on(t.garageVehicleId),
])

// ─── Garage Documents ─────────────────────────────────────────────────────────

export const garageDocuments = pgTable('garage_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  garageVehicleId: text('garage_vehicle_id').notNull().references(() => garageVehicles.id, { onDelete: 'cascade' }),
  documentId: text('document_id').references(() => documents.id),
  mediaAssetId: text('media_asset_id').references(() => mediaAssets.id),
  userNote: text('user_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const garagesRelations = relations(garages, ({ many }) => ({
  vehicles: many(garageVehicles),
}))

export const garageVehiclesRelations = relations(garageVehicles, ({ one, many }) => ({
  garage: one(garages, {
    fields: [garageVehicles.garageId],
    references: [garages.id],
  }),
  product: one(products, {
    fields: [garageVehicles.productId],
    references: [products.id],
  }),
  platform: one(vehiclePlatforms, {
    fields: [garageVehicles.platformId],
    references: [vehiclePlatforms.id],
  }),
  variant: one(productVariants, {
    fields: [garageVehicles.variantId],
    references: [productVariants.id],
  }),
  builds: many(garageBuilds),
  serviceLog: many(garageServiceLog),
  documents: many(garageDocuments),
}))
