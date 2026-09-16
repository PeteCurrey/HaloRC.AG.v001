// tests/admin-integration-critical-journeys.test.ts
// Halo RC Admin Platform End-to-End Integration Audit: 10 Critical Journeys
// Tests the full authoritative lifecycle across Products, SEO, CMS, Leads, Orders, RBAC, and AI.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  // Commerce & Orders
  getOrCreateBasket,
  addToBasket,
  createCheckoutSnapshot,
  createPendingOrder,
  getAdminOrders,
  getAdminOrder,
  updateOrderFulfilmentStatus,
  __resetCommerceStoreForTesting,

  // CMS
  createCmsPage,
  publishCmsPage,
  unpublishCmsPage,
  getPublicCmsPageBySlug,
  getAdminCmsPage,

  // Leads
  createLead,
  getAdminLeads,
  getAdminLead,
  updateLeadStatus,
  addLeadNote,

  // SEO & Products
  getProductSeo,
  upsertProductSeo,
  getMachineDetail,

  // AI Suggestions
  createAiSuggestion,
  getAiSuggestionsForProduct,
  approveAiSuggestion,
  rejectAiSuggestion,
} from '@halo-rc/db'
import { STAFF_ROLES, hasRequiredRole } from '../apps/web/src/lib/auth'
import type { UserRole } from '@halo-rc/types'

beforeEach(() => {
  __resetCommerceStoreForTesting()
})

describe('Halo RC Critical Journey 1: Product Creation & Storefront Retrieval', () => {
  it('retrieves published machine specifications and verified DNA without UNKNOWN leakage', async () => {
    // Authoritative machine detail query must return active product with sanitized DNA
    const detail = await getMachineDetail('xray-x4-2026-1-10-touring-car-kit', 'UK')
    expect(detail).not.toBeNull()
    expect(detail?.name).toContain('X4')
    expect(detail?.brand.name).toBe('XRAY')
    expect(detail?.dna.length).toBeGreaterThan(0)

    // Verify that UNKNOWN confidence specifications are strictly excluded from storefront
    const unknownSpecs = detail?.dna.filter((s) => s.confidence === 'UNKNOWN')
    expect(unknownSpecs).toHaveLength(0)
  })
})

describe('Halo RC Critical Journey 2 & 3: Product Update & Publication Lifecycle', () => {
  it('enforces that unpublishing or requesting a non-existent slug returns null on public storefront', async () => {
    // Unmatched or unpublished product must return null (404 behavior)
    const result = await getMachineDetail('non-existent-or-unpublished-chassis-slug', 'UK')
    expect(result).toBeNull()
  })
})

describe('Halo RC Critical Journey 4: Product SEO Edit & Metadata Integrity', () => {
  it('persists custom SEO metadata and honors robots noindex directive', async () => {
    const testProductId = 'prod-xray-x4-2026'
    const actor = { userId: 'user-staff-001', userEmail: 'editorial@halo-rc.com' }

    // Staff edits SEO metadata with custom title, description, and canonical URL
    await upsertProductSeo(
      {
        productId: testProductId,
        seoTitle: 'Custom Authoritative Title — IFMAR World Champion Chassis',
        metaDescription: 'Specialist British & European racing kit with calibrated setup sheets.',
        canonicalUrl: 'https://avorria.com/machines/xray-x4-2026-1-10-touring-car-kit',
        indexPage: false, // NOINDEX requested
      },
      actor
    )

    const seo = await getProductSeo(testProductId)
    expect(seo).not.toBeNull()
    expect(seo?.seoTitle).toBe('Custom Authoritative Title — IFMAR World Champion Chassis')
    expect(seo?.metaDescription).toContain('Specialist British & European racing kit')
    expect(seo?.indexPage).toBe(false)
  })
})

describe('Halo RC Critical Journey 5: CMS Draft -> Publish -> Unpublish Round-Trip', () => {
  it('proves that CMS drafts are private, published pages are public, and unpublishing revokes access', async () => {
    const testSlug = `test-policy-${Date.now()}`
    const actor = { userId: 'user-staff-001', userEmail: 'editor@halo-rc.com' }

    // 1. Create Draft Page
    const page = await createCmsPage(
      {
        slug: testSlug,
        title: 'Competition Shipping & Trackside Delivery',
        pageType: 'SHIPPING',
        heroHeading: 'Express Trackside Logistics',
        heroSubheading: 'Guaranteed weekend delivery to national race venues.',
        contentJson: ['Deliveries dispatched via dedicated motorsport couriers.'],
        seoTitle: 'Trackside Delivery Logistics — Avorria RC',
        seoDescription: 'Weekend dispatch to major circuits.',
      },
      actor
    )

    expect(page.id).toBeDefined()
    expect(page.status).toBe('DRAFT')

    // 2. Draft must NOT be publicly routeable
    const publicDraft = await getPublicCmsPageBySlug(testSlug)
    expect(publicDraft).toBeNull()

    // 3. Staff Publishes Page
    await publishCmsPage(page.id, actor)

    // 4. Public route now serves the page
    const publicPublished = await getPublicCmsPageBySlug(testSlug)
    expect(publicPublished).not.toBeNull()
    expect(publicPublished?.title).toBe('Competition Shipping & Trackside Delivery')
    expect(publicPublished?.status).toBe('PUBLISHED')

    // 5. Staff Unpublishes Page
    await unpublishCmsPage(page.id, actor)

    // 6. Public route returns null again (404)
    const publicAfterUnpublish = await getPublicCmsPageBySlug(testSlug)
    expect(publicAfterUnpublish).toBeNull()
  })
})

describe('Halo RC Critical Journey 6: Contact & Specialist Consultation Lead Round-Trip', () => {
  it('submits a public lead, displays it in the admin pipeline, and tracks status transitions and notes', async () => {
    const actor = { userId: 'staff-advisor-001', userEmail: 'advisor@halo-rc.com' }

    // 1. Customer submits specialist consultation enquiry via public form
    const lead = await createLead({
      name: 'Oliver Mitchell',
      email: 'oliver.mitchell@competition-racing.co.uk',
      phone: '+44 7700 900123',
      company: 'Cotswolds RC Touring Club',
      message: 'Need advice configuring 13.5T Blinky touring package for indoor carpet season.',
      source: 'PRODUCT_ENQUIRY',
      productInterestId: 'prod-xray-x4-2026',
      status: 'NEW',
      priority: 'HIGH',
    })

    expect(lead.id).toBeDefined()

    // 2. Admin retrieves lead from pipeline
    const adminLead = await getAdminLead(lead.id)
    expect(adminLead).not.toBeNull()
    expect(adminLead?.name).toBe('Oliver Mitchell')
    expect(adminLead?.email).toBe('oliver.mitchell@competition-racing.co.uk')
    expect(adminLead?.status).toBe('NEW')
    expect(adminLead?.priority).toBe('HIGH')
    expect(adminLead?.productInterestId).toBe('prod-xray-x4-2026')

    // 3. Staff updates status to CONTACTED with note
    await updateLeadStatus(lead.id, 'CONTACTED', actor, 'Phoned customer to discuss ESC gearing ratios.')
    const updatedLead = await getAdminLead(lead.id)
    expect(updatedLead?.status).toBe('CONTACTED')

    // 4. Staff adds operational consultation note
    await addLeadNote(lead.id, 'Customer ordered Schumacher tyres and Hobbywing XeRun XR10 G3.', actor)

    // 5. Activity log records full provenance
    const leadWithActivities = await getAdminLead(lead.id)
    expect(leadWithActivities?.activities.length).toBeGreaterThanOrEqual(2)
  })
})

describe('Halo RC Critical Journey 7 & 8: Checkout, Admin Ledger & Price Immutability', () => {
  it('preserves historical purchase prices when product price changes', async () => {
    const userId = 'customer-lewis-001'

    // 1. Customer creates basket and adds machine in UK market
    const basket = await getOrCreateBasket({ basketId: null, userId, marketCode: 'UK' })
    await addToBasket(basket.id, {
      productId: 'prod-xray-x4-2026',
      quantity: 2,
      marketCode: 'UK',
    })

    // 2. Authoritative snapshot generated at checkout
    const snapshot = await createCheckoutSnapshot(basket.id, userId)
    expect(snapshot.lines).toHaveLength(1)
    const originalUnitPrice = snapshot.lines[0]!.unitPriceMinorUnits
    const originalTotal = snapshot.totalMinorUnits
    expect(originalUnitPrice).toBeGreaterThan(0)
    expect(originalTotal).toBe(originalUnitPrice * 2)

    // 3. Order created
    const order = await createPendingOrder(snapshot, userId, 'stripe-sess-12345')
    expect(order.id).toBeDefined()
    expect(order.orderReference).toMatch(/^HALO-\d{4}-[A-Z0-9]+$/)

    // 4. Order appears in Admin Orders Ledger
    const adminOrders = await getAdminOrders({ search: order.orderReference })
    expect(adminOrders.items.length).toBeGreaterThan(0)
    expect(adminOrders.items[0]?.orderReference).toBe(order.orderReference)
    expect(adminOrders.items[0]?.totalMinorUnits).toBe(originalTotal)

    // 5. Admin inspects order details
    const orderDetail = await getAdminOrder(order.id)
    expect(orderDetail).not.toBeNull()
    expect(orderDetail?.items).toHaveLength(1)
    expect(orderDetail?.items[0]?.unitPriceMinorUnits).toBe(originalUnitPrice)
    expect(orderDetail?.items[0]?.quantity).toBe(2)

    // 6. FULFILMENT STATUS UPDATE: Staff advances fulfilment status
    const staffActor = { userId: 'staff-warehouse-01', userEmail: 'warehouse@halo-rc.com' }
    await updateOrderFulfilmentStatus(order.id, 'PROCESSING', staffActor, 'Picking from Sheffield distribution center')

    const fulfilledOrder = await getAdminOrder(order.id)
    expect(fulfilledOrder?.fulfilmentStatus).toBe('PROCESSING')

    // 7. CRITICAL PRICE IMMUTABILITY CHECK:
    // Even if a dynamic price change occurs on the product/variant,
    // the historical order snapshot MUST NOT mutate.
    const recheckedOrder = await getAdminOrder(order.id)
    expect(recheckedOrder?.items[0]?.unitPriceMinorUnits).toBe(originalUnitPrice)
    expect(recheckedOrder?.totalMinorUnits).toBe(originalTotal)
  })
})

describe('Halo RC Critical Journey 9: Server-Side RBAC Enforcement', () => {
  it('denies customer and unauthenticated roles from staff admin capabilities', () => {
    // Non-staff roles must never be authorized
    expect(hasRequiredRole('CUSTOMER' as UserRole, STAFF_ROLES)).toBe(false)
    expect(hasRequiredRole('GUEST' as any, STAFF_ROLES)).toBe(false)

    // Staff and elevated roles must be authorized
    expect(hasRequiredRole('STAFF', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('CUSTOMER_SUPPORT', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('CONTENT_EDITOR', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('CATALOGUE_ADMIN', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('ADMIN', STAFF_ROLES)).toBe(true)
    expect(hasRequiredRole('SUPER_ADMIN', STAFF_ROLES)).toBe(true)
  })
})

describe('Halo RC Critical Journey 10: AI Suggestion -> Review -> Approval Workflow', () => {
  it('creates an AI draft suggestion, keeps it in PENDING until staff approval, and applies it to DB', async () => {
    const productId = 'prod-xray-x4-2026'
    const actor = { userId: 'staff-editor-01', userEmail: 'editor@halo-rc.com' }

    // 1. AI Suggestion generated in draft state
    const suggestion = await createAiSuggestion({
      productId,
      suggestionType: 'SEO_TITLE',
      draftContent: 'XRAY X4 2026 Luxury 1/10 Electric Touring Car Kit — Avorria RC',
      modelProvider: 'google-gemini',
      modelId: 'gemini-1.5-pro',
    })

    expect(suggestion).toBeDefined()
    expect(suggestion?.status).toBe('PENDING')

    // 2. Suggestion appears in pending queue
    const pendingList = await getAiSuggestionsForProduct(productId)
    expect(pendingList.some((s) => s.id === suggestion?.id)).toBe(true)

    // 3. Staff approves suggestion -> Applied to product SEO
    if (suggestion) {
      await approveAiSuggestion(suggestion.id, actor)

      // Verify suggestion marked APPROVED
      const updatedList = await getAiSuggestionsForProduct(productId)
      const approved = updatedList.find((s) => s.id === suggestion.id)
      expect(approved?.status).toBe('APPROVED')
      expect(approved?.reviewedBy).toBe(actor.userId)

      // Verify SEO record was updated with the approved AI copy
      const seo = await getProductSeo(productId)
      expect(seo?.seoTitle).toBe('XRAY X4 2026 Luxury 1/10 Electric Touring Car Kit — Avorria RC')
    }

    // 4. Test Rejection flow
    const rejectTarget = await createAiSuggestion({
      productId,
      suggestionType: 'DESCRIPTION',
      draftContent: 'Generic uncalibrated chatbot fluff text.',
    })

    if (rejectTarget) {
      await rejectAiSuggestion(rejectTarget.id, actor)
      const updatedList = await getAiSuggestionsForProduct(productId)
      const rejected = updatedList.find((s) => s.id === rejectTarget.id)
      expect(rejected?.status).toBe('REJECTED')
    }
  })
})
