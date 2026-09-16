/**
 * Admin product queries — all operations use the Drizzle DB directly.
 *
 * Halo RC rules:
 * - Prices stored as minor units (integers). Never as decimals.
 * - Draft products are NOT visible to the storefront. RLS enforces this.
 * - All admin mutations write to audit_log via writeAuditLog().
 * - UNKNOWN confidence specs are never promoted to published product data.
 */

import { db, isDbConfigured } from '../client'
import {
  products,
  brands,
  vehiclePlatforms,
  categories,
  productVariants,
  marketOffers,
  specifications,
  mediaAssets,
  productContent,
  productSeo,
  productRelationships,
  auditLog,
  aiSuggestions,
} from '../schema'
import {
  STORE_PRODUCTS,
  STORE_BRANDS,
  __addCatalogueProductForTesting,
  __updateCatalogueProductForTesting,
} from './catalogue-store'
import {
  eq,
  and,
  like,
  ilike,
  isNull,
  isNotNull,
  desc,
  asc,
  count,
  sql,
  or,
} from 'drizzle-orm'
import type { AuditAction } from '@halo-rc/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminProductListItem {
  id: string
  slug: string
  sku: string | null
  name: string
  shortName: string | null
  brandId: string
  brandName: string
  brandSlug: string
  tier: string
  status: string
  lifecycle: string
  productType: string
  discipline: string | null
  published: boolean
  manufacturerSku: string | null
  internalCode: string | null
  createdAt: Date
  updatedAt: Date
  // Computed from related data
  variantCount: number
  hasUkOffer: boolean
  hasUsOffer: boolean
}

export interface AdminProductDetail {
  id: string
  slug: string
  sku: string | null
  manufacturerSku: string | null
  internalCode: string | null
  brandId: string
  platformId: string | null
  name: string
  shortName: string | null
  categoryId: string | null
  subcategoryId: string | null
  scale: string | null
  powerType: string | null
  productType: string
  tier: string
  status: string
  lifecycle: string
  replacementProductId: string | null
  haloClassification: string | null
  editorialSummary: string | null
  discipline: string | null
  tags: string[]
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AdminProductFilters {
  search?: string | undefined
  brandId?: string | undefined
  status?: string | undefined
  tier?: string | undefined
  lifecycle?: string | undefined
  productType?: string | undefined
  published?: boolean | undefined
  hasNoSeo?: boolean | undefined
  hasNoContent?: boolean | undefined
  hasMissingUkOffer?: boolean | undefined
  hasMissingUsOffer?: boolean | undefined
}

export interface PaginationParams {
  page: number
  perPage: number
}

// ─── Audit Log Writer ─────────────────────────────────────────────────────────

export async function writeAuditLog({
  userId,
  userEmail,
  action,
  entityType,
  entityId,
  previousState,
  newState,
  notes,
}: {
  userId?: string | null
  userEmail?: string | null
  action: AuditAction
  entityType: string
  entityId: string
  previousState?: Record<string, unknown> | null
  newState?: Record<string, unknown> | null
  notes?: string | null
}) {
  if (!isDbConfigured) return

  try {
    await db.insert(auditLog).values({
      userId: userId ?? null,
      userEmail: userEmail ?? null,
      action,
      entityType,
      entityId,
      previousState: previousState ?? null,
      newState: newState ?? null,
      notes: notes ?? null,
    })
  } catch (err) {
    // Audit log failures must not block the primary operation — log and continue
    console.error('[audit_log] Failed to write audit log entry:', err)
  }
}

// ─── Product List ─────────────────────────────────────────────────────────────

export async function getAdminProducts(
  filters: AdminProductFilters = {},
  pagination: PaginationParams = { page: 1, perPage: 50 }
): Promise<{ items: AdminProductListItem[]; total: number }> {
  const { page, perPage } = pagination
  const offset = (page - 1) * perPage

  if (!isDbConfigured) {
    let filtered = [...STORE_PRODUCTS]
    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          p.slug.toLowerCase().includes(q)
      )
    }
    if (filters.brandId) filtered = filtered.filter((p) => p.brandId === filters.brandId)
    if (filters.status) filtered = filtered.filter((p) => p.status === filters.status)
    if (filters.tier) filtered = filtered.filter((p) => p.tier === filters.tier)
    if (filters.lifecycle) filtered = filtered.filter((p) => p.lifecycle === filters.lifecycle)
    if (filters.productType) filtered = filtered.filter((p) => p.productType === filters.productType)
    if (filters.published !== undefined) filtered = filtered.filter((p) => p.published === filters.published)

    const total = filtered.length
    const paged = filtered.slice(offset, offset + perPage)
    const items: AdminProductListItem[] = paged.map((p) => {
      const b = STORE_BRANDS.find((br) => br.id === p.brandId)
      return {
        id: p.id,
        slug: p.slug,
        sku: p.sku ?? null,
        name: p.name,
        shortName: p.shortName ?? null,
        brandId: p.brandId,
        brandName: b?.name ?? '',
        brandSlug: b?.slug ?? '',
        tier: p.tier,
        status: p.status,
        lifecycle: p.lifecycle,
        productType: p.productType,
        published: p.published,
        manufacturerSku: null,
        internalCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        discipline: p.discipline,
        variantCount: 1,
        hasUkOffer: true,
        hasUsOffer: true,
      }
    })
    return { items, total }
  }

  const conditions = []

  if (filters.search) {
    const q = `%${filters.search}%`
    conditions.push(
      or(
        ilike(products.name, q),
        ilike(products.sku, q),
        ilike(products.manufacturerSku, q),
        ilike(products.internalCode, q),
        ilike(products.slug, q)
      )
    )
  }

  if (filters.brandId) {
    conditions.push(eq(products.brandId, filters.brandId))
  }

  if (filters.status) {
    conditions.push(eq(products.status, filters.status as never))
  }

  if (filters.tier) {
    conditions.push(eq(products.tier, filters.tier as never))
  }

  if (filters.lifecycle) {
    conditions.push(eq(products.lifecycle, filters.lifecycle as never))
  }

  if (filters.productType) {
    conditions.push(eq(products.productType, filters.productType as never))
  }

  if (filters.published !== undefined) {
    conditions.push(eq(products.published, filters.published))
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        sku: products.sku,
        name: products.name,
        shortName: products.shortName,
        brandId: products.brandId,
        brandName: brands.name,
        brandSlug: brands.slug,
        tier: products.tier,
        status: products.status,
        lifecycle: products.lifecycle,
        productType: products.productType,
        published: products.published,
        manufacturerSku: products.manufacturerSku,
        internalCode: products.internalCode,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .where(whereClause)
      .orderBy(desc(products.updatedAt))
      .limit(perPage)
      .offset(offset),

    db
      .select({ total: count() })
      .from(products)
      .innerJoin(brands, eq(products.brandId, brands.id))
      .where(whereClause),
  ])

  const total = countRows[0]?.total ?? 0

  // Fetch variant counts and offer presence for these product IDs
  const productIds = rows.map((r) => r.id)

  const variantCountMap = new Map<string, number>()
  const ukOfferMap = new Map<string, boolean>()
  const usOfferMap = new Map<string, boolean>()

  if (productIds.length > 0) {
    const variantRows = await db
      .select({
        productId: productVariants.productId,
        cnt: count(),
      })
      .from(productVariants)
      .where(sql`${productVariants.productId} = ANY(${sql`ARRAY[${sql.join(productIds.map((id) => sql`${id}`), sql`, `)}]::text[]`})`)
      .groupBy(productVariants.productId)

    for (const r of variantRows) {
      variantCountMap.set(r.productId, Number(r.cnt))
    }

    const offerRows = await db
      .select({
        productId: productVariants.productId,
        marketCode: marketOffers.marketCode,
      })
      .from(marketOffers)
      .innerJoin(productVariants, eq(marketOffers.productVariantId, productVariants.id))
      .where(sql`${productVariants.productId} = ANY(${sql`ARRAY[${sql.join(productIds.map((id) => sql`${id}`), sql`, `)}]::text[]`})`)

    for (const r of offerRows) {
      if (r.marketCode === 'UK') ukOfferMap.set(r.productId, true)
      if (r.marketCode === 'US') usOfferMap.set(r.productId, true)
    }
  }

  const items: AdminProductListItem[] = rows.map((r) => ({
    ...r,
    brandName: r.brandName ?? '',
    brandSlug: r.brandSlug ?? '',
    discipline: null,
    manufacturerSku: r.manufacturerSku ?? null,
    internalCode: r.internalCode ?? null,
    shortName: r.shortName ?? null,
    variantCount: variantCountMap.get(r.id) ?? 0,
    hasUkOffer: ukOfferMap.get(r.id) ?? false,
    hasUsOffer: usOfferMap.get(r.id) ?? false,
  }))

  return { items, total: Number(total) }
}

// ─── Single Product Detail ────────────────────────────────────────────────────

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  if (!isDbConfigured) {
    const p = STORE_PRODUCTS.find((prod) => prod.id === id || prod.slug === id)
    if (!p) return null
    return {
      id: p.id,
      slug: p.slug,
      sku: p.sku ?? null,
      manufacturerSku: null,
      internalCode: null,
      brandId: p.brandId,
      platformId: p.platformId ?? null,
      name: p.name,
      shortName: p.shortName ?? null,
      categoryId: p.categoryId ?? null,
      subcategoryId: p.subcategoryId ?? null,
      scale: p.scale ?? null,
      powerType: p.powerType ?? null,
      productType: p.productType,
      tier: p.tier,
      status: p.status,
      lifecycle: p.lifecycle,
      replacementProductId: p.replacementProductId ?? null,
      haloClassification: p.haloClassification ?? null,
      editorialSummary: p.editorialSummary ?? null,
      discipline: p.discipline,
      tags: [],
      published: p.published,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)

  if (!row) return null

  return {
    ...row,
    sku: row.sku ?? null,
    manufacturerSku: row.manufacturerSku ?? null,
    internalCode: row.internalCode ?? null,
    shortName: row.shortName ?? null,
    platformId: row.platformId ?? null,
    categoryId: row.categoryId ?? null,
    subcategoryId: row.subcategoryId ?? null,
    scale: row.scale ?? null,
    powerType: row.powerType ?? null,
    replacementProductId: row.replacementProductId ?? null,
    haloClassification: row.haloClassification ?? null,
    editorialSummary: row.editorialSummary ?? null,
    discipline: null,
    tags: row.tags ?? [],
  }
}

// ─── Create Product ───────────────────────────────────────────────────────────

export async function createProduct(
  data: Omit<typeof products.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>,
  actor: { userId?: string; userEmail?: string }
): Promise<{ id: string }> {
  let createdId: string | null = null

  if (isDbConfigured) {
    const [row] = await db
      .insert(products)
      .values({
        ...data,
        published: false, // New products always start as unpublished drafts
      })
      .returning({ id: products.id })

    if (!row) {
      throw new Error('Failed to create product')
    }
    createdId = row.id
  } else {
    createdId = `prod-${crypto.randomUUID()}`
  }

  __addCatalogueProductForTesting({
    id: createdId,
    slug: data.slug,
    sku: data.sku ?? '',
    brandId: data.brandId,
    platformId: data.platformId ?? null,
    name: data.name,
    shortName: data.shortName ?? data.name,
    categoryId: data.categoryId ?? 'cat-machines',
    productType: (data.productType as any) ?? 'VEHICLE',
    tier: (data.tier as any) ?? 'STANDARD',
    status: (data.status as any) ?? 'DRAFT',
    lifecycle: (data.lifecycle as any) ?? 'ACTIVE',
    editorialSummary: data.editorialSummary ?? '',
    discipline: ((data as any).discipline as any) ?? 'RACE',
    published: false,
    ...(data.subcategoryId ? { subcategoryId: data.subcategoryId } : {}),
    ...(data.scale ? { scale: data.scale } : {}),
    ...(data.powerType ? { powerType: data.powerType as any } : {}),
    ...(data.replacementProductId ? { replacementProductId: data.replacementProductId } : {}),
    ...(data.haloClassification ? { haloClassification: data.haloClassification } : {}),
  } as any)

  await writeAuditLog({
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'CREATE',
    entityType: 'PRODUCT',
    entityId: createdId,
    newState: data as Record<string, unknown>,
  })

  return { id: createdId }
}

// ─── Update Product ───────────────────────────────────────────────────────────

export async function updateProduct(
  id: string,
  data: Partial<Omit<typeof products.$inferInsert, 'id' | 'createdAt'>>,
  actor: { userId?: string; userEmail?: string }
): Promise<void> {
  const previous = await getAdminProduct(id)

  if (isDbConfigured) {
    await db
      .update(products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
  }

  __updateCatalogueProductForTesting(id, data as any)

  await writeAuditLog({
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'UPDATE',
    entityType: 'PRODUCT',
    entityId: id,
    previousState: (previous as unknown) as Record<string, unknown>,
    newState: data as Record<string, unknown>,
  })
}

// ─── Publish / Unpublish ──────────────────────────────────────────────────────

export async function publishProduct(
  id: string,
  actor: { userId?: string; userEmail?: string }
): Promise<void> {
  if (isDbConfigured) {
    await db
      .update(products)
      .set({ status: 'PUBLISHED', published: true, updatedAt: new Date() })
      .where(eq(products.id, id))
  }

  __updateCatalogueProductForTesting(id, { status: 'PUBLISHED', published: true })

  await writeAuditLog({
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'PUBLISH',
    entityType: 'PRODUCT',
    entityId: id,
  })
}

export async function unpublishProduct(
  id: string,
  actor: { userId?: string; userEmail?: string }
): Promise<void> {
  if (isDbConfigured) {
    await db
      .update(products)
      .set({ status: 'DRAFT', published: false, updatedAt: new Date() })
      .where(eq(products.id, id))
  }

  __updateCatalogueProductForTesting(id, { status: 'DRAFT', published: false })

  await writeAuditLog({
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'UNPUBLISH',
    entityType: 'PRODUCT',
    entityId: id,
  })
}

// ─── Product Content ──────────────────────────────────────────────────────────

export async function getProductContent(productId: string) {
  const [row] = await db
    .select()
    .from(productContent)
    .where(eq(productContent.productId, productId))
    .limit(1)
  return row ?? null
}

export async function upsertProductContent(
  data: { productId: string } & Partial<Omit<typeof productContent.$inferInsert, 'id' | 'createdAt'>>,
  actor: { userId?: string; userEmail?: string }
): Promise<void> {
  const { productId, ...rest } = data

  await db
    .insert(productContent)
    .values({ productId, ...rest })
    .onConflictDoUpdate({
      target: productContent.productId,
      set: { ...rest, updatedAt: new Date() },
    })

  await writeAuditLog({
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'UPDATE',
    entityType: 'PRODUCT_CONTENT',
    entityId: productId,
    newState: rest as Record<string, unknown>,
  })
}

// ─── Product SEO ──────────────────────────────────────────────────────────────

const PRODUCT_SEO_STORE: any[] = []

export function __resetProductSeoStoreForTesting() {
  PRODUCT_SEO_STORE.length = 0
}

export async function getProductSeo(productId: string) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db
      .select()
      .from(productSeo)
      .where(eq(productSeo.productId, productId))
      .limit(1)
    if (row) return row
  } catch {
    // Fallback
  }
  return PRODUCT_SEO_STORE.find((s) => s.productId === productId) ?? null
}

export async function upsertProductSeo(
  data: { productId: string } & Partial<Omit<typeof productSeo.$inferInsert, 'id' | 'createdAt'>>,
  actor: { userId?: string; userEmail?: string }
): Promise<void> {
  const { productId, ...rest } = data

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    await db
      .insert(productSeo)
      .values({ productId, ...rest })
      .onConflictDoUpdate({
        target: productSeo.productId,
        set: { ...rest, updatedAt: new Date() },
      })
  } catch {
    // Fallback
  }

  const existing = PRODUCT_SEO_STORE.find((s) => s.productId === productId)
  if (existing) {
    Object.assign(existing, rest, { updatedAt: new Date() })
  } else {
    PRODUCT_SEO_STORE.push({
      id: `seo-${crypto.randomUUID()}`,
      productId,
      indexPage: true,
      ...rest,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'UPDATE',
      entityType: 'PRODUCT_SEO',
      entityId: productId,
      newState: rest as Record<string, unknown>,
    })
  } catch {
    // Continue
  }
}

// ─── SEO Audit Stats ──────────────────────────────────────────────────────────

export async function getAdminSeoStats() {
  const [
    totalProductsRows,
    missingTitleRows,
    missingDescriptionRows,
    noIndexRows,
    noSeoRows,
  ] = await Promise.all([
    db.select({ totalProducts: count() }).from(products).where(eq(products.published, true)),
    db
      .select({ missingTitle: count() })
      .from(products)
      .leftJoin(productSeo, eq(productSeo.productId, products.id))
      .where(and(eq(products.published, true), or(isNull(productSeo.seoTitle), sql`${productSeo.seoTitle} = ''`))),
    db
      .select({ missingDescription: count() })
      .from(products)
      .leftJoin(productSeo, eq(productSeo.productId, products.id))
      .where(and(eq(products.published, true), or(isNull(productSeo.metaDescription), sql`${productSeo.metaDescription} = ''`))),
    db
      .select({ noIndexCount: count() })
      .from(productSeo)
      .where(eq(productSeo.indexPage, false)),
    db
      .select({ noSeoRecord: count() })
      .from(products)
      .leftJoin(productSeo, eq(productSeo.productId, products.id))
      .where(and(eq(products.published, true), isNull(productSeo.id))),
  ])

  return {
    totalPublishedProducts: Number(totalProductsRows[0]?.totalProducts ?? 0),
    missingTitleCount: Number(missingTitleRows[0]?.missingTitle ?? 0),
    missingDescriptionCount: Number(missingDescriptionRows[0]?.missingDescription ?? 0),
    noIndexCount: Number(noIndexRows[0]?.noIndexCount ?? 0),
    noSeoRecordCount: Number(noSeoRows[0]?.noSeoRecord ?? 0),
  }
}

// ─── Brand List (for dropdowns) ───────────────────────────────────────────────

export async function getAdminBrands() {
  return db
    .select({
      id: brands.id,
      slug: brands.slug,
      name: brands.name,
      tier: brands.tier,
      status: brands.status,
      countryOfOrigin: brands.countryOfOrigin,
    })
    .from(brands)
    .orderBy(asc(brands.name))
}

// ─── Category List (for dropdowns) ───────────────────────────────────────────

export async function getAdminCategories() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      parentId: categories.parentId,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

// ─── AI Suggestions Workflow ──────────────────────────────────────────────────

const AI_SUGGESTIONS_STORE: any[] = []

export function __resetAiSuggestionsStoreForTesting() {
  AI_SUGGESTIONS_STORE.length = 0
}

export async function createAiSuggestion(data: {
  productId: string
  suggestionType: 'DESCRIPTION' | 'SHORT_DESCRIPTION' | 'SEO_TITLE' | 'META_DESCRIPTION' | 'FEATURES' | 'COLLECTION_DESCRIPTION'
  draftContent: string
  modelProvider?: string
  modelId?: string
}) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db
      .insert(aiSuggestions)
      .values({
        productId: data.productId,
        suggestionType: data.suggestionType,
        draftContent: data.draftContent,
        modelProvider: data.modelProvider ?? 'google-gemini',
        modelId: data.modelId ?? 'gemini-1.5-pro',
        status: 'PENDING',
      })
      .returning()

    if (row) return row
  } catch {
    // Fallback
  }

  const newSuggestion = {
    id: `ai-${crypto.randomUUID()}`,
    productId: data.productId,
    suggestionType: data.suggestionType,
    draftContent: data.draftContent,
    modelProvider: data.modelProvider ?? 'google-gemini',
    modelId: data.modelId ?? 'gemini-1.5-pro',
    status: 'PENDING' as const,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(),
  }

  AI_SUGGESTIONS_STORE.push(newSuggestion)
  return newSuggestion
}

export async function getAiSuggestionsForProduct(productId: string) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const rows = await db
      .select()
      .from(aiSuggestions)
      .where(eq(aiSuggestions.productId, productId))
      .orderBy(desc(aiSuggestions.createdAt))
    if (rows.length > 0) return rows
  } catch {
    // Fallback
  }

  return AI_SUGGESTIONS_STORE.filter((s) => s.productId === productId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function approveAiSuggestion(
  id: string,
  actor: { userId?: string; userEmail?: string }
) {
  let suggestion: any = null

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db
      .select()
      .from(aiSuggestions)
      .where(eq(aiSuggestions.id, id))
      .limit(1)
    if (row) suggestion = row
  } catch {
    // Fallback
  }

  if (!suggestion) {
    suggestion = AI_SUGGESTIONS_STORE.find((s) => s.id === id)
  }

  if (!suggestion) throw new Error('AI suggestion not found')
  if (suggestion.status !== 'PENDING') throw new Error('AI suggestion has already been reviewed')

  // Apply suggestion to target field
  if (suggestion.productId) {
    if (suggestion.suggestionType === 'SEO_TITLE') {
      await upsertProductSeo(
        { productId: suggestion.productId, seoTitle: suggestion.draftContent },
        actor
      )
    } else if (suggestion.suggestionType === 'META_DESCRIPTION') {
      await upsertProductSeo(
        { productId: suggestion.productId, metaDescription: suggestion.draftContent },
        actor
      )
    } else if (suggestion.suggestionType === 'DESCRIPTION') {
      try {
        if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
        await db
          .update(products)
          .set({ editorialSummary: suggestion.draftContent, updatedAt: new Date() })
          .where(eq(products.id, suggestion.productId))
      } catch {
        // Fallback
      }
    }
  }

  // Mark suggestion APPROVED
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    await db
      .update(aiSuggestions)
      .set({
        status: 'APPROVED',
        reviewedBy: actor.userId ?? 'STAFF',
        reviewedAt: new Date(),
      })
      .where(eq(aiSuggestions.id, id))
  } catch {
    // Fallback
  }

  const mem = AI_SUGGESTIONS_STORE.find((s) => s.id === id)
  if (mem) {
    mem.status = 'APPROVED'
    mem.reviewedBy = actor.userId ?? 'STAFF'
    mem.reviewedAt = new Date()
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'UPDATE',
      entityType: 'AI_SUGGESTION',
      entityId: id,
      previousState: { status: 'PENDING' },
      newState: { status: 'APPROVED', appliedContent: suggestion.draftContent },
      notes: `Approved AI suggestion for ${suggestion.suggestionType}`,
    })
  } catch {
    // Continue
  }
}

export async function rejectAiSuggestion(
  id: string,
  actor: { userId?: string; userEmail?: string }
) {
  let suggestion: any = null

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db
      .select()
      .from(aiSuggestions)
      .where(eq(aiSuggestions.id, id))
      .limit(1)
    if (row) suggestion = row
  } catch {
    // Fallback
  }

  if (!suggestion) {
    suggestion = AI_SUGGESTIONS_STORE.find((s) => s.id === id)
  }

  if (!suggestion) throw new Error('AI suggestion not found')

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    await db
      .update(aiSuggestions)
      .set({
        status: 'REJECTED',
        reviewedBy: actor.userId ?? 'STAFF',
        reviewedAt: new Date(),
      })
      .where(eq(aiSuggestions.id, id))
  } catch {
    // Fallback
  }

  const mem = AI_SUGGESTIONS_STORE.find((s) => s.id === id)
  if (mem) {
    mem.status = 'REJECTED'
    mem.reviewedBy = actor.userId ?? 'STAFF'
    mem.reviewedAt = new Date()
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'UPDATE',
      entityType: 'AI_SUGGESTION',
      entityId: id,
      previousState: { status: suggestion.status },
      newState: { status: 'REJECTED' },
      notes: `Rejected AI suggestion for ${suggestion.suggestionType}`,
    })
  } catch {
    // Continue
  }
}
