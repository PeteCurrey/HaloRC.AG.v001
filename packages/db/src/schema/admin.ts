// Drizzle schema: product content, product SEO, product relationships, audit log, AI suggestions

import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  index,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import {
  auditActionEnum,
  aiSuggestionTypeEnum,
  aiSuggestionStatusEnum,
} from './enums'
import { products } from './products'

// ─── Product Content (Structured Editorial) ──────────────────────────────────

export const productContent = pgTable('product_content', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  shortDescription: text('short_description'),
  longDescription: text('long_description'),
  keyFeatures: text('key_features').array().notNull().default(sql`'{}'::text[]`),
  whatsIncluded: text('whats_included').array().notNull().default(sql`'{}'::text[]`),
  requirements: text('requirements').array().notNull().default(sql`'{}'::text[]`),
  compatibilityNotes: text('compatibility_notes'),
  manufacturerInfo: text('manufacturer_info'),
  editorialNotes: text('editorial_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('product_content_product_idx').on(t.productId),
])

// ─── Product SEO ─────────────────────────────────────────────────────────────

export const productSeo = pgTable('product_seo', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().unique().references(() => products.id, { onDelete: 'cascade' }),
  seoTitle: text('seo_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImageUrl: text('og_image_url'),
  indexPage: boolean('index_page').notNull().default(true),
  primaryKeyword: text('primary_keyword'),
  seoNotes: text('seo_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('product_seo_product_idx').on(t.productId),
])

// ─── Product Relationships ───────────────────────────────────────────────────

export const productRelationships = pgTable('product_relationships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  relatedProductId: text('related_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull(), // 'ACCESSORY', 'UPGRADE', 'REPLACEMENT', 'COMPATIBLE', 'RELATED', 'FREQUENTLY_BOUGHT_TOGETHER'
  sortOrder: integer('sort_order').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('prod_rel_product_idx').on(t.productId),
  index('prod_rel_related_idx').on(t.relatedProductId),
  uniqueIndex('uq_product_relationship').on(t.productId, t.relatedProductId, t.relationshipType),
])

// ─── Audit Log ───────────────────────────────────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'),
  userEmail: text('user_email'),
  action: auditActionEnum('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('audit_log_entity_idx').on(t.entityType, t.entityId),
  index('audit_log_created_at_idx').on(t.createdAt),
  index('audit_log_user_idx').on(t.userId),
])

// ─── AI Suggestions (Staff Review Gate) ──────────────────────────────────────

export const aiSuggestions = pgTable('ai_suggestions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').references(() => products.id, { onDelete: 'cascade' }),
  suggestionType: aiSuggestionTypeEnum('suggestion_type').notNull(),
  draftContent: text('draft_content').notNull(),
  modelProvider: text('model_provider').notNull().default('google-gemini'),
  modelId: text('model_id').notNull().default('gemini-1.5-pro'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  status: aiSuggestionStatusEnum('status').notNull().default('PENDING'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('ai_suggestions_product_idx').on(t.productId),
  index('ai_suggestions_status_idx').on(t.status),
])

// ─── Relations ───────────────────────────────────────────────────────────────

export const productContentRelations = relations(productContent, ({ one }) => ({
  product: one(products, {
    fields: [productContent.productId],
    references: [products.id],
  }),
}))

export const productSeoRelations = relations(productSeo, ({ one }) => ({
  product: one(products, {
    fields: [productSeo.productId],
    references: [products.id],
  }),
}))

export const productRelationshipsRelations = relations(productRelationships, ({ one }) => ({
  product: one(products, {
    fields: [productRelationships.productId],
    references: [products.id],
    relationName: 'outgoingRelations',
  }),
  relatedProduct: one(products, {
    fields: [productRelationships.relatedProductId],
    references: [products.id],
    relationName: 'incomingRelations',
  }),
}))

export const aiSuggestionsRelations = relations(aiSuggestions, ({ one }) => ({
  product: one(products, {
    fields: [aiSuggestions.productId],
    references: [products.id],
  }),
}))
