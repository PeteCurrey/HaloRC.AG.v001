// Drizzle schema: builds (editorial, race, recommended, customer)

import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { products } from './products'
import { productVariants } from './products'
import { vehiclePlatforms } from './products'
import { marketCodeEnum } from './enums'
import {
  buildTypeEnum,
  buildSlotRoleEnum,
  slotRequirementEnum,
  recordStatusEnum,
} from './enums'

// ─── Builds ───────────────────────────────────────────────────────────────────

export const builds = pgTable('builds', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  buildType: buildTypeEnum('build_type').notNull(),
  platformId: text('platform_id').references(() => vehiclePlatforms.id),
  baseProductId: text('base_product_id').references(() => products.id),
  marketCode: marketCodeEnum('market_code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  status: recordStatusEnum('status').notNull().default('DRAFT'),
  // Calculated totals in minor units (updated by DB function or application layer)
  totalMinorUnits: integer('total_minor_units'),
  userId: text('user_id'), // null for editorial/recommended builds
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('builds_type_idx').on(t.buildType),
  index('builds_platform_idx').on(t.platformId),
  index('builds_user_idx').on(t.userId),
])

// ─── Build Slots ──────────────────────────────────────────────────────────────

export const buildSlots = pgTable('build_slots', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  buildId: text('build_id').notNull().references(() => builds.id, { onDelete: 'cascade' }),
  role: buildSlotRoleEnum('role').notNull(),
  requirement: slotRequirementEnum('requirement').notNull(),
  selectedProductId: text('selected_product_id').references(() => products.id),
  selectedVariantId: text('selected_variant_id').references(() => productVariants.id),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [
  index('build_slots_build_idx').on(t.buildId),
])

// ─── Build Alternatives ───────────────────────────────────────────────────────

export const buildAlternatives = pgTable('build_alternatives', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  buildSlotId: text('build_slot_id').notNull().references(() => buildSlots.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  sortOrder: integer('sort_order').notNull().default(0),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const buildsRelations = relations(builds, ({ one, many }) => ({
  platform: one(vehiclePlatforms, {
    fields: [builds.platformId],
    references: [vehiclePlatforms.id],
  }),
  baseProduct: one(products, {
    fields: [builds.baseProductId],
    references: [products.id],
  }),
  slots: many(buildSlots),
}))

export const buildSlotsRelations = relations(buildSlots, ({ one, many }) => ({
  build: one(builds, {
    fields: [buildSlots.buildId],
    references: [builds.id],
  }),
  selectedProduct: one(products, {
    fields: [buildSlots.selectedProductId],
    references: [products.id],
  }),
  alternatives: many(buildAlternatives),
}))
