// Drizzle schema: CMS pages, homepage config, navigation config

import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { recordStatusEnum, cmsPageTypeEnum, homepageSectionTypeEnum } from './enums'

// ─── CMS Pages ───────────────────────────────────────────────────────────────

export const cmsPages = pgTable('cms_pages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  status: recordStatusEnum('status').notNull().default('DRAFT'),
  pageType: cmsPageTypeEnum('page_type').notNull().default('EDITORIAL'),
  heroHeading: text('hero_heading'),
  heroSubheading: text('hero_subheading'),
  contentJson: jsonb('content_json').notNull().$defaultFn(() => []),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  canonicalUrl: text('canonical_url'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImageUrl: text('og_image_url'),
  indexPage: boolean('index_page').notNull().default(true),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedBy: text('published_by'),
  authorId: text('author_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('cms_pages_slug_idx').on(t.slug),
  index('cms_pages_status_idx').on(t.status),
  index('cms_pages_type_idx').on(t.pageType),
])

// ─── CMS Homepage Configuration ──────────────────────────────────────────────

export const cmsHomepageConfig = pgTable('cms_homepage_config', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sectionKey: text('section_key').notNull().unique(),
  sectionType: homepageSectionTypeEnum('section_type').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  contentJson: jsonb('content_json').notNull().$defaultFn(() => ({})),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updated_by'),
}, (t) => [
  index('cms_homepage_active_sort_idx').on(t.active, t.sortOrder),
])

// ─── Navigation Configuration ────────────────────────────────────────────────

export const navigationConfig = pgTable('navigation_config', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  navKey: text('nav_key').notNull().unique(),
  label: text('label').notNull(),
  href: text('href').notNull(),
  parentId: text('parent_id'),
  badge: text('badge'),
  subText: text('sub_text'),
  sortOrder: integer('sort_order').notNull().default(0),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('navigation_parent_sort_idx').on(t.parentId, t.sortOrder),
])

// ─── Relations ───────────────────────────────────────────────────────────────

export const navigationConfigRelations = relations(navigationConfig, ({ one, many }) => ({
  parent: one(navigationConfig, {
    fields: [navigationConfig.parentId],
    references: [navigationConfig.id],
    relationName: 'navChildren',
  }),
  children: many(navigationConfig, { relationName: 'navChildren' }),
}))
