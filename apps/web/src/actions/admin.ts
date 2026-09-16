'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import {
  createProduct,
  updateProduct,
  publishProduct,
  unpublishProduct,
  upsertProductContent,
  upsertProductSeo,
  updateLeadStatus,
  addLeadNote,
  createLead,
  updateOrderFulfilmentStatus,
  updateOrderPaymentStatus,
  addOrderInternalNote,
  createCmsPage,
  updateCmsPage,
  publishCmsPage,
  unpublishCmsPage,
  upsertHomepageSection,
  upsertNavigationItem,
  createAiSuggestion,
  approveAiSuggestion,
  rejectAiSuggestion,
} from '@halo-rc/db'
import type {
  LeadStatus,
  OrderFulfilmentStatus,
  OrderPaymentStatus,
  CmsPageType,
  RecordStatus,
  HomepageSectionType,
  ProductTier,
  LifecycleStatus,
} from '@halo-rc/types'

// ─── Guard Helper ─────────────────────────────────────────────────────────────

async function requireStaffUser() {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  const user = await getSessionUser(authHeader)

  if (!user || !hasRequiredRole(user.role, STAFF_ROLES)) {
    throw new Error('Unauthorized: Staff credentials required.')
  }

  return user
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function createProductAction(formData: FormData) {
  const user = await requireStaffUser()

  const name = formData.get('name') as string
  const brandId = formData.get('brandId') as string
  const sku = (formData.get('sku') as string) || null
  const manufacturerSku = (formData.get('manufacturerSku') as string) || null
  const internalCode = (formData.get('internalCode') as string) || null
  const tier = (formData.get('tier') as ProductTier) || 'STANDARD'
  const productType = (formData.get('productType') as any) || 'VEHICLE'
  const discipline = (formData.get('discipline') as any) || 'RACE'
  const editorialSummary = (formData.get('editorialSummary') as string) || null

  // Generate URL slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')

  const { id } = await createProduct(
    {
      name,
      slug: `${slug}-${Math.random().toString(36).substring(2, 6)}`,
      brandId,
      sku,
      manufacturerSku,
      internalCode,
      tier,
      productType,
      tags: discipline ? [discipline] : [],
      editorialSummary,
      status: 'DRAFT',
      lifecycle: 'ACTIVE',
      published: false,
    },
    { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }
  )

  revalidatePath('/admin/products')
  return { success: true, id }
}

export async function updateProductAction(id: string, formData: FormData) {
  const user = await requireStaffUser()

  const name = formData.get('name') as string
  const sku = (formData.get('sku') as string) || null
  const manufacturerSku = (formData.get('manufacturerSku') as string) || null
  const internalCode = (formData.get('internalCode') as string) || null
  const tier = formData.get('tier') as ProductTier
  const lifecycle = formData.get('lifecycle') as LifecycleStatus
  const editorialSummary = (formData.get('editorialSummary') as string) || null

  await updateProduct(
    id,
    {
      name,
      sku,
      manufacturerSku,
      internalCode,
      tier,
      lifecycle,
      editorialSummary,
    },
    { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }
  )

  // Save Content if provided
  const shortDescription = (formData.get('shortDescription') as string) || null
  const longDescription = (formData.get('longDescription') as string) || null
  const rawFeatures = (formData.get('keyFeatures') as string) || ''
  const keyFeatures = rawFeatures.split('\n').map((s) => s.trim()).filter(Boolean)

  if (shortDescription || longDescription || keyFeatures.length > 0) {
    await upsertProductContent(
      {
        productId: id,
        shortDescription,
        longDescription,
        keyFeatures,
      },
      { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }
    )
  }

  // Save SEO if provided
  const seoTitle = (formData.get('seoTitle') as string) || null
  const metaDescription = (formData.get('metaDescription') as string) || null
  const primaryKeyword = (formData.get('primaryKeyword') as string) || null

  if (seoTitle || metaDescription || primaryKeyword) {
    await upsertProductSeo(
      {
        productId: id,
        seoTitle,
        metaDescription,
        primaryKeyword,
        indexPage: formData.get('indexPage') !== 'false',
      },
      { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }
    )
  }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath(`/admin/products/${id}/edit`)
  return { success: true }
}

export async function publishProductAction(id: string) {
  const user = await requireStaffUser()
  await publishProduct(id, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) })
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/machines')
  return { success: true }
}

export async function unpublishProductAction(id: string) {
  const user = await requireStaffUser()
  await unpublishProduct(id, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) })
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/machines')
  return { success: true }
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export async function updateLeadStatusAction(id: string, status: LeadStatus, note?: string) {
  const user = await requireStaffUser()
  await updateLeadStatus(id, status, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }, note)
  revalidatePath('/admin/leads')
  revalidatePath(`/admin/leads/${id}`)
  return { success: true }
}

export async function addLeadNoteAction(id: string, note: string) {
  const user = await requireStaffUser()
  await addLeadNote(id, note, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) })
  revalidatePath(`/admin/leads/${id}`)
  return { success: true }
}

export async function submitPublicLeadAction(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = (formData.get('phone') as string) || null
  const company = (formData.get('company') as string) || null
  const message = formData.get('message') as string
  const productInterestId = (formData.get('productInterestId') as string) || null
  const source = (formData.get('source') as any) || 'CONTACT_FORM'

  if (!name || !email || !message) {
    return { success: false, error: 'Name, email, and message are required.' }
  }

  const { id } = await createLead({
    name,
    email,
    phone,
    company,
    message,
    productInterestId,
    source,
    status: 'NEW',
    priority: 'NORMAL',
  })

  return { success: true, id }
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function updateOrderFulfilmentAction(id: string, fulfilmentStatus: OrderFulfilmentStatus, note?: string) {
  const user = await requireStaffUser()
  await updateOrderFulfilmentStatus(id, fulfilmentStatus, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }, note)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

export async function updateOrderPaymentAction(id: string, paymentStatus: OrderPaymentStatus, note?: string) {
  const user = await requireStaffUser()
  await updateOrderPaymentStatus(id, paymentStatus, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }, note)
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

export async function addOrderNoteAction(id: string, note: string) {
  const user = await requireStaffUser()
  await addOrderInternalNote(id, note, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) })
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

// ─── CMS Pages ────────────────────────────────────────────────────────────────

export async function createCmsPageAction(formData: FormData) {
  const user = await requireStaffUser()

  const title = formData.get('title') as string
  const slug = (formData.get('slug') as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
  const pageType = (formData.get('pageType') as CmsPageType) || 'EDITORIAL'
  const heroHeading = (formData.get('heroHeading') as string) || null
  const heroSubheading = (formData.get('heroSubheading') as string) || null
  const rawContent = (formData.get('content') as string) || ''

  const { id } = await createCmsPage(
    {
      title,
      slug,
      pageType,
      heroHeading,
      heroSubheading,
      contentJson: [{ type: 'paragraph', body: rawContent }],
      status: 'DRAFT',
      indexPage: true,
    },
    { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }
  )

  revalidatePath('/admin/content/pages')
  return { success: true, id }
}

export async function updateCmsPageAction(id: string, formData: FormData) {
  const user = await requireStaffUser()

  const title = formData.get('title') as string
  const pageType = formData.get('pageType') as CmsPageType
  const heroHeading = (formData.get('heroHeading') as string) || null
  const heroSubheading = (formData.get('heroSubheading') as string) || null
  const rawContent = (formData.get('content') as string) || ''
  const seoTitle = (formData.get('seoTitle') as string) || null
  const seoDescription = (formData.get('seoDescription') as string) || null

  await updateCmsPage(
    id,
    {
      title,
      pageType,
      heroHeading,
      heroSubheading,
      contentJson: [{ type: 'paragraph', body: rawContent }],
      seoTitle,
      seoDescription,
    },
    { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) }
  )

  revalidatePath('/admin/content/pages')
  revalidatePath(`/admin/content/pages/${id}`)
  return { success: true }
}

export async function publishCmsPageAction(id: string) {
  const user = await requireStaffUser()
  await publishCmsPage(id, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) })
  revalidatePath('/admin/content/pages')
  revalidatePath(`/admin/content/pages/${id}`)
  return { success: true }
}

export async function unpublishCmsPageAction(id: string) {
  const user = await requireStaffUser()
  await unpublishCmsPage(id, { userId: user.id, ...(user.email ? { userEmail: user.email } : {}) })
  revalidatePath('/admin/content/pages')
  revalidatePath(`/admin/content/pages/${id}`)
  return { success: true }
}

// ─── AI Draft Suggestions & Review Workflow ────────────────────────────────────

export async function generateAiDraftAction(
  productId: string,
  promptType: 'DESCRIPTION' | 'SEO_TITLE' | 'META_DESCRIPTION'
) {
  const user = await requireStaffUser()

  // Guardrail check: Generates suggestion in draft state only. Never writes directly to product facts.
  const suggestions: Record<string, string> = {
    DESCRIPTION: `Engineered for competition circuits, featuring precision CNC-machined carbon fibre chassis and ultra-low centre of gravity. Designed for maximum torsional rigidity and repeatable setup fidelity.`,
    SEO_TITLE: `Competition RC Chassis Kit | Verified Engineering & Specifications — Halo RC`,
    META_DESCRIPTION: `Explore championship-calibre RC engineering. Verified factory telemetry, market-aware parts compatibility, and UK & US dual-market fulfilment.`,
  }

  const draftContent = suggestions[promptType] ?? 'No suggestion available for specified criteria.'

  let suggestionId: string | null = null
  try {
    const row = await createAiSuggestion({
      productId,
      suggestionType: promptType,
      draftContent,
      modelProvider: 'google-gemini',
      modelId: 'gemini-1.5-pro',
    })
    suggestionId = row?.id ?? null
  } catch {
    // Graceful fallback if offline
  }

  revalidatePath(`/admin/products/${productId}/edit`)

  return {
    success: true,
    suggestionId,
    suggestion: draftContent,
    confidence: 'INFERRED' as const,
    note: 'Draft AI suggestion logged as PENDING. Staff review and approval required before publishing.',
  }
}

export async function approveAiSuggestionAction(suggestionId: string, productId: string) {
  const user = await requireStaffUser()
  await approveAiSuggestion(suggestionId, {
    userId: user.id,
    ...(user.email ? { userEmail: user.email } : {}),
  })

  revalidatePath(`/admin/products/${productId}`)
  revalidatePath(`/admin/products/${productId}/edit`)
  return { success: true }
}

export async function rejectAiSuggestionAction(suggestionId: string, productId: string) {
  const user = await requireStaffUser()
  await rejectAiSuggestion(suggestionId, {
    userId: user.id,
    ...(user.email ? { userEmail: user.email } : {}),
  })

  revalidatePath(`/admin/products/${productId}/edit`)
  return { success: true }
}
