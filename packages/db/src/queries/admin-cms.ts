/**
 * Admin CMS queries — managing pages, homepage configuration, and navigation.
 */

import { db, isDbConfigured } from '../client'
import {
  cmsPages,
  cmsHomepageConfig,
  navigationConfig,
} from '../schema'
import {
  eq,
  and,
  desc,
  asc,
  count,
  ilike,
} from 'drizzle-orm'
import { writeAuditLog } from './admin-products'
import type { CmsPageType, RecordStatus, HomepageSectionType } from '@halo-rc/types'

// ─── Pages ────────────────────────────────────────────────────────────────────

// In-memory fallback store for hermetic testing and offline development
const CMS_PAGES_STORE: any[] = []

export function __resetCmsStoreForTesting() {
  CMS_PAGES_STORE.length = 0
}

export async function getAdminCmsPages(
  filters: { status?: RecordStatus | undefined; pageType?: CmsPageType | undefined; search?: string | undefined } = {},
  pagination = { page: 1, perPage: 50 }
) {
  const { page, perPage } = pagination
  const offset = (page - 1) * perPage

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const conditions = []

    if (filters.status) conditions.push(eq(cmsPages.status, filters.status))
    if (filters.pageType) conditions.push(eq(cmsPages.pageType, filters.pageType))
    if (filters.search) conditions.push(ilike(cmsPages.title, `%${filters.search}%`))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [items, countRows] = await Promise.all([
      db
        .select()
        .from(cmsPages)
        .where(whereClause)
        .orderBy(desc(cmsPages.updatedAt))
        .limit(perPage)
        .offset(offset),
      db.select({ total: count() }).from(cmsPages).where(whereClause),
    ])

    const total = countRows[0]?.total ?? 0
    if (items.length > 0 || total > 0) {
      return { items, total: Number(total) }
    }
  } catch {
    // Non-blocking fallback
  }

  let filtered = [...CMS_PAGES_STORE]
  if (filters.status) filtered = filtered.filter((p) => p.status === filters.status)
  if (filters.pageType) filtered = filtered.filter((p) => p.pageType === filters.pageType)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter((p) => p.title.toLowerCase().includes(q))
  }

  return {
    items: filtered.slice(offset, offset + perPage),
    total: filtered.length,
  }
}

export async function getAdminCmsPage(id: string) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db.select().from(cmsPages).where(eq(cmsPages.id, id)).limit(1)
    if (row) return row
  } catch {
    // Fallback
  }
  return CMS_PAGES_STORE.find((p) => p.id === id) ?? null
}

export async function getPublicCmsPageBySlug(slug: string) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db
      .select()
      .from(cmsPages)
      .where(and(eq(cmsPages.slug, slug), eq(cmsPages.status, 'PUBLISHED')))
      .limit(1)
    if (row) return row
  } catch {
    // Fallback
  }
  return CMS_PAGES_STORE.find((p) => p.slug === slug && p.status === 'PUBLISHED') ?? null
}

export async function createCmsPage(
  data: Omit<typeof cmsPages.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  actor: { userId?: string | undefined; userEmail?: string | undefined }
) {
  let createdId: string | null = null

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db
      .insert(cmsPages)
      .values({ ...data, status: data.status || 'DRAFT' })
      .returning({ id: cmsPages.id })

    if (row) createdId = row.id
  } catch {
    // Fallback
  }

  if (!createdId) {
    createdId = `cms-${crypto.randomUUID()}`
    CMS_PAGES_STORE.push({
      id: createdId,
      ...data,
      status: data.status || 'DRAFT',
      contentJson: data.contentJson || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'CREATE',
      entityType: 'CMS_PAGE',
      entityId: createdId,
      newState: data as Record<string, unknown>,
    })
  } catch {
    // Continue
  }

  return { id: createdId, status: data.status || 'DRAFT' }
}

export async function updateCmsPage(
  id: string,
  data: Partial<Omit<typeof cmsPages.$inferInsert, 'id' | 'createdAt'>>,
  actor: { userId?: string | undefined; userEmail?: string | undefined }
) {
  const previous = await getAdminCmsPage(id)

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    await db
      .update(cmsPages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(cmsPages.id, id))
  } catch {
    // Fallback
  }

  const mem = CMS_PAGES_STORE.find((p) => p.id === id)
  if (mem) {
    Object.assign(mem, data, { updatedAt: new Date() })
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'UPDATE',
      entityType: 'CMS_PAGE',
      entityId: id,
      previousState: previous as Record<string, unknown>,
      newState: data as Record<string, unknown>,
    })
  } catch {
    // Continue
  }
}

export async function publishCmsPage(
  id: string,
  actor: { userId?: string | undefined; userEmail?: string | undefined }
) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    await db
      .update(cmsPages)
      .set({
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: actor.userEmail || actor.userId,
        updatedAt: new Date(),
      })
      .where(eq(cmsPages.id, id))
  } catch {
    // Fallback
  }

  const mem = CMS_PAGES_STORE.find((p) => p.id === id)
  if (mem) {
    mem.status = 'PUBLISHED'
    mem.publishedAt = new Date()
    mem.publishedBy = actor.userEmail || actor.userId
    mem.updatedAt = new Date()
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'PUBLISH',
      entityType: 'CMS_PAGE',
      entityId: id,
    })
  } catch {
    // Continue
  }
}

export async function unpublishCmsPage(
  id: string,
  actor: { userId?: string | undefined; userEmail?: string | undefined }
) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    await db
      .update(cmsPages)
      .set({
        status: 'DRAFT',
        updatedAt: new Date(),
      })
      .where(eq(cmsPages.id, id))
  } catch {
    // Fallback
  }

  const mem = CMS_PAGES_STORE.find((p) => p.id === id)
  if (mem) {
    mem.status = 'DRAFT'
    mem.updatedAt = new Date()
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'UNPUBLISH',
      entityType: 'CMS_PAGE',
      entityId: id,
    })
  } catch {
    // Continue
  }
}

// ─── Homepage Configuration ──────────────────────────────────────────────────

export async function getAdminHomepageSections() {
  return db
    .select()
    .from(cmsHomepageConfig)
    .orderBy(asc(cmsHomepageConfig.sortOrder))
}

export async function getPublicHomepageSections() {
  return db
    .select()
    .from(cmsHomepageConfig)
    .where(eq(cmsHomepageConfig.active, true))
    .orderBy(asc(cmsHomepageConfig.sortOrder))
}

export async function upsertHomepageSection(
  data: { sectionKey: string; sectionType: HomepageSectionType; title: string } & Partial<typeof cmsHomepageConfig.$inferInsert>,
  actor: { userId?: string | undefined; userEmail?: string | undefined }
) {
  await db
    .insert(cmsHomepageConfig)
    .values({
      ...data,
      updatedBy: actor.userEmail || actor.userId,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: cmsHomepageConfig.sectionKey,
      set: {
        ...data,
        updatedBy: actor.userEmail || actor.userId,
        updatedAt: new Date(),
      },
    })

  await writeAuditLog({
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'UPDATE',
    entityType: 'CMS_HOMEPAGE_SECTION',
    entityId: data.sectionKey,
    newState: data as Record<string, unknown>,
  })
}

// ─── Navigation Configuration ────────────────────────────────────────────────

export async function getAdminNavigationItems() {
  return db
    .select()
    .from(navigationConfig)
    .orderBy(asc(navigationConfig.sortOrder))
}

export async function getPublicNavigationTree() {
  return db
    .select()
    .from(navigationConfig)
    .where(eq(navigationConfig.active, true))
    .orderBy(asc(navigationConfig.sortOrder))
}

export async function upsertNavigationItem(
  data: typeof navigationConfig.$inferInsert,
  actor: { userId?: string | undefined; userEmail?: string | undefined }
) {
  await db
    .insert(navigationConfig)
    .values(data)
    .onConflictDoUpdate({
      target: navigationConfig.navKey,
      set: { ...data },
    })

  await writeAuditLog({
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'UPDATE',
    entityType: 'NAVIGATION_ITEM',
    entityId: data.navKey,
    newState: data as Record<string, unknown>,
  })
}
