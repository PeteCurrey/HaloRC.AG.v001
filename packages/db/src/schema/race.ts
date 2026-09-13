// Drizzle schema: Race Department & Halo Builds domain
// Authoritative tables for engineered vehicle configurations, versioning, and immutable snapshots.

import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { products, productVariants, vehiclePlatforms } from './products'
import { brands } from './brands'
import {
  haloBuildTypeEnum,
  haloBuildStatusEnum,
  haloBuildProvenanceEnum,
  raceDisciplineEnum,
  haloBuildSubsystemEnum,
  buildSlotRoleEnum,
  slotRequirementEnum,
} from './enums'

// ─── Halo Builds (Master Record) ─────────────────────────────────────────────

export const haloBuilds = pgTable('halo_builds', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  buildType: haloBuildTypeEnum('build_type').notNull().default('HALO_BUILD'),
  provenance: haloBuildProvenanceEnum('provenance').notNull().default('HALO_ENGINEERED'),
  discipline: raceDisciplineEnum('discipline').notNull().default('TOURING'),
  scale: text('scale').notNull(),
  platformId: text('platform_id').notNull().references(() => vehiclePlatforms.id),
  baseProductId: text('base_product_id').notNull().references(() => products.id),
  status: haloBuildStatusEnum('status').notNull().default('DRAFT'),
  published: boolean('published').notNull().default(false),
  heroImageUrl: text('hero_image_url'),
  engineeringSummary: text('engineering_summary').notNull(),
  trackConditions: text('track_conditions'),
  currentVersion: text('current_version').notNull().default('1.0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('halo_builds_discipline_idx').on(t.discipline),
  index('halo_builds_platform_idx').on(t.platformId),
  index('halo_builds_status_idx').on(t.status),
  index('halo_builds_published_idx').on(t.published),
  uniqueIndex('halo_builds_slug_idx').on(t.slug),
])

// ─── Halo Build Versions (Immutable Releases) ────────────────────────────────

export const haloBuildVersions = pgTable('halo_build_versions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  buildId: text('build_id').notNull().references(() => haloBuilds.id, { onDelete: 'cascade' }),
  version: text('version').notNull(), // e.g. "1.0", "1.1"
  status: haloBuildStatusEnum('status').notNull().default('DRAFT'),
  changelogNotes: text('changelog_notes'),
  engineeringNotes: text('engineering_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
}, (t) => [
  index('halo_build_versions_build_idx').on(t.buildId),
  index('halo_build_versions_status_idx').on(t.status),
])

// ─── Halo Build Components (Configuration Truth) ─────────────────────────────

export const haloBuildComponents = pgTable('halo_build_components', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  buildVersionId: text('build_version_id').notNull().references(() => haloBuildVersions.id, { onDelete: 'cascade' }),
  role: buildSlotRoleEnum('role').notNull(),
  subsystem: haloBuildSubsystemEnum('subsystem').notNull(),
  productId: text('product_id').notNull().references(() => products.id),
  productVariantId: text('product_variant_id').references(() => productVariants.id),
  sku: text('sku').notNull(),
  productName: text('product_name').notNull(),
  brandName: text('brand_name').notNull(),
  brandId: text('brand_id').notNull().references(() => brands.id),
  requirement: slotRequirementEnum('requirement').notNull().default('REQUIRED'),
  notes: text('notes'),
  compatibilityRuleId: text('compatibility_rule_id'),
  compatibilityRuleDescription: text('compatibility_rule_description'),
  verified: boolean('verified').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
}, (t) => [
  index('halo_build_components_version_idx').on(t.buildVersionId),
  index('halo_build_components_product_idx').on(t.productId),
])

// ─── Halo Build Audit Logs ───────────────────────────────────────────────────

export const haloBuildAuditLogs = pgTable('halo_build_audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  buildId: text('build_id').notNull().references(() => haloBuilds.id, { onDelete: 'cascade' }),
  buildVersion: text('build_version'),
  action: text('action').notNull(), // CREATED, EDITED, VALIDATED, PUBLISHED, VERSION_BUMPED, RETIRED
  details: jsonb('details').notNull().default({}),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('halo_build_audit_build_idx').on(t.buildId),
])

// ─── Relations ───────────────────────────────────────────────────────────────

export const haloBuildsRelations = relations(haloBuilds, ({ one, many }) => ({
  platform: one(vehiclePlatforms, {
    fields: [haloBuilds.platformId],
    references: [vehiclePlatforms.id],
  }),
  baseProduct: one(products, {
    fields: [haloBuilds.baseProductId],
    references: [products.id],
  }),
  versions: many(haloBuildVersions),
  auditLogs: many(haloBuildAuditLogs),
}))

export const haloBuildVersionsRelations = relations(haloBuildVersions, ({ one, many }) => ({
  build: one(haloBuilds, {
    fields: [haloBuildVersions.buildId],
    references: [haloBuilds.id],
  }),
  components: many(haloBuildComponents),
}))

export const haloBuildComponentsRelations = relations(haloBuildComponents, ({ one }) => ({
  version: one(haloBuildVersions, {
    fields: [haloBuildComponents.buildVersionId],
    references: [haloBuildVersions.id],
  }),
  product: one(products, {
    fields: [haloBuildComponents.productId],
    references: [products.id],
  }),
  brand: one(brands, {
    fields: [haloBuildComponents.brandId],
    references: [brands.id],
  }),
}))

export const haloBuildAuditLogsRelations = relations(haloBuildAuditLogs, ({ one }) => ({
  build: one(haloBuilds, {
    fields: [haloBuildAuditLogs.buildId],
    references: [haloBuilds.id],
  }),
}))
