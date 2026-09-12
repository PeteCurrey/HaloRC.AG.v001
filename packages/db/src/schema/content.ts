// Drizzle schema: specifications, media, documents, compatibility

import {
  pgTable,
  text,
  boolean,
  integer,
  real,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import {
  dataConfidenceEnum,
  sourceTypeEnum,
  mediaTypeEnum,
  licenceTypeEnum,
  storageProviderEnum,
  usageScopeEnum,
  recordStatusEnum,
  documentTypeEnum,
  compatibilityRuleTypeEnum,
} from './enums'

// ─── Specifications ───────────────────────────────────────────────────────────
// Polymorphic: attaches to products, platforms, or variants.
// Full data provenance on every row.
// UNKNOWN confidence is never rendered on the frontend.

export const specifications = pgTable('specifications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text('entity_type').notNull(), // 'product' | 'platform' | 'variant'
  entityId: text('entity_id').notNull(),
  key: text('key').notNull(), // e.g. 'chassis_material', 'weight_g', 'wheelbase_mm'
  value: text('value').notNull(),
  unit: text('unit'), // e.g. 'g', 'mm', 'rpm'
  confidence: dataConfidenceEnum('confidence').notNull().default('UNKNOWN'),
  sourceType: sourceTypeEnum('source_type'),
  sourceUrl: text('source_url'),
  sourceDocument: text('source_document'),
  sourceDate: date('source_date'),
  verifiedBy: text('verified_by'), // user id
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
}, (t) => [
  index('specs_entity_idx').on(t.entityType, t.entityId),
  index('specs_confidence_idx').on(t.confidence),
  index('specs_key_idx').on(t.key),
])

// ─── Media Assets ─────────────────────────────────────────────────────────────
// Polymorphic media with full licensing data.
// approvedForCommercialUse must be explicitly set — never assumed true.

export const mediaAssets = pgTable('media_assets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text('entity_type').notNull(), // 'product' | 'platform' | 'brand' | 'guide'
  entityId: text('entity_id').notNull(),
  mediaType: mediaTypeEnum('media_type').notNull(),
  storageProvider: storageProviderEnum('storage_provider').notNull().default('SUPABASE'),
  storagePath: text('storage_path'), // path within provider
  sourceUrl: text('source_url'), // original URL if externally sourced
  altText: text('alt_text').notNull(),
  caption: text('caption'),
  credit: text('credit'), // photographer / brand credit
  licenceType: licenceTypeEnum('licence_type').notNull(),
  licenceSource: text('licence_source'),
  usageScope: usageScopeEnum('usage_scope').notNull().default('INTERNAL'),
  // Explicitly set — never defaulted to true
  approvedForCommercialUse: boolean('approved_for_commercial_use').notNull().default(false),
  focalPointX: real('focal_point_x').notNull().default(0.5),
  focalPointY: real('focal_point_y').notNull().default(0.5),
  widthPx: integer('width_px'),
  heightPx: integer('height_px'),
  sortOrder: integer('sort_order').notNull().default(0),
  status: recordStatusEnum('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('media_entity_idx').on(t.entityType, t.entityId),
  index('media_type_idx').on(t.mediaType),
  index('media_approved_idx').on(t.approvedForCommercialUse),
])

// ─── Documents ────────────────────────────────────────────────────────────────
// Distinct from media. Manuals, exploded diagrams, setup sheets, etc.
// These enable the manual → diagram → part → buy traversal.

export const documents = pgTable('documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  entityType: text('entity_type').notNull(), // 'product' | 'platform' | 'brand'
  entityId: text('entity_id').notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  title: text('title').notNull(),
  version: text('version'),
  language: text('language').notNull().default('en'),
  storageProvider: storageProviderEnum('storage_provider').notNull().default('SUPABASE'),
  storagePath: text('storage_path'),
  sourceUrl: text('source_url'),
  licenceType: licenceTypeEnum('licence_type'),
  approvedForUse: boolean('approved_for_use').notNull().default(false),
  published: boolean('published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('docs_entity_idx').on(t.entityType, t.entityId),
  index('docs_type_idx').on(t.documentType),
])

// ─── Compatibility Rules ──────────────────────────────────────────────────────
// Lives primarily at the platform level for maximum reuse across SKUs.
// Verified rules only are exposed publicly.

export const compatibilityRules = pgTable('compatibility_rules', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sourceEntityType: text('source_entity_type').notNull(),
  sourceEntityId: text('source_entity_id').notNull(),
  targetEntityType: text('target_entity_type').notNull(),
  targetEntityId: text('target_entity_id').notNull(),
  ruleType: compatibilityRuleTypeEnum('rule_type').notNull(),
  verified: boolean('verified').notNull().default(false),
  sourceType: sourceTypeEnum('source_type'),
  sourceUrl: text('source_url'),
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('compat_source_idx').on(t.sourceEntityType, t.sourceEntityId),
  index('compat_target_idx').on(t.targetEntityType, t.targetEntityId),
  index('compat_rule_type_idx').on(t.ruleType),
  index('compat_verified_idx').on(t.verified),
])
