'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import {
  getSupplierById,
  createSupplier,
  updateSupplier,
  ingestSupplierFeed,
  manuallyMapSupplierProduct,
  rejectSupplierMapping,
  handleProductDisappearance,
  createTradeAccountApplication,
  updateTradeAccountApplicationStatus,
  updateTradeAccountRequirement,
  verifyBrandSupplierRelationship,
  setSupplierCommercialTerms,
  logSupplierCommunication,
  createProcurementTask,
  updateProcurementTask,
  setSupplierTerritoryCoverage,
} from '@halo-rc/db'
import type {
  SupplierRecord,
  SupplierType,
  SupplierRelationshipStatus,
  SupplierIntegrationType,
  RawSupplierFeedItem,
  Currency,
  TradeAccountApplicationStatus,
  TradeAccountRequirementStatus,
  ProcurementPipelineStage,
  ProcurementTerritory,
  TerritorySupportState,
  TerritoryRestrictionReason,
  BrandSupplierRelationshipType,
  CommercialRelationshipVerificationStatus,
  RelationshipEvidenceSourceType,
  ExclusivityScope,
  PaymentTermsType,
  CommunicationType,
  ProcurementTaskType,
} from '@halo-rc/types'

/**
 * Enforce RBAC guard for procurement administration actions.
 */
async function requireProcurementAuth() {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  const user = await getSessionUser(authHeader)

  if (!user || !hasRequiredRole(user.role, STAFF_ROLES)) {
    throw new Error('403 Forbidden: Insufficient permissions for procurement operations.')
  }

  return user
}

export async function triggerSupplierSyncAction(supplierId: string) {
  const user = await requireProcurementAuth()
  const supplier = await getSupplierById(supplierId)
  if (!supplier) throw new Error(`Supplier "${supplierId}" not found.`)

  // Create representative sync batch for the supplier based on their profile
  const sampleFeed: RawSupplierFeedItem[] = [
    {
      supplierSku: 'XRAY-300040',
      manufacturerSku: 'XRAY-300040',
      title: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      brandName: 'XRAY',
      cost: supplier.country === 'US' ? 62000 : 49500,
      rrp: supplier.country === 'US' ? 84900 : 72900,
      currency: supplier.currency,
      availability: 'in stock',
      quantity: 12,
      leadTimeDays: supplier.country === 'US' ? 5 : 1,
      leadTimeText: supplier.country === 'US' ? '3–5 days standard freight' : 'Next-day courier dispatch',
    },
    {
      supplierSku: 'HW-30401140',
      manufacturerSku: 'HW-30401140',
      title: 'Hobbywing XeRun V10 G4 13.5T Brushless Motor',
      brandName: 'Hobbywing',
      cost: supplier.currency === 'USD' ? 8500 : 6500,
      rrp: supplier.currency === 'USD' ? 12000 : 9900,
      currency: supplier.currency,
      availability: 'in stock',
      quantity: 28,
      leadTimeDays: 1,
      leadTimeText: 'Immediate warehouse dispatch',
    },
  ]

  const syncRun = await ingestSupplierFeed(supplierId, sampleFeed, user.id)
  revalidatePath('/admin/procurement')
  revalidatePath(`/admin/procurement/suppliers/${supplierId}`)
  return { success: true, syncRun }
}

export async function manuallyMapSupplierProductAction(
  mappingId: string,
  canonicalProductId: string,
  variantId?: string | null,
  notes?: string
) {
  const user = await requireProcurementAuth()
  const mapping = await manuallyMapSupplierProduct(
    mappingId,
    canonicalProductId,
    variantId ?? null,
    user.id,
    notes
  )

  revalidatePath('/admin/procurement')
  revalidatePath('/admin/procurement/unmatched')
  return { success: true, mapping }
}

export async function rejectSupplierMappingAction(mappingId: string, reason: string) {
  const user = await requireProcurementAuth()
  const mapping = await rejectSupplierMapping(mappingId, user.id, reason)

  revalidatePath('/admin/procurement')
  revalidatePath('/admin/procurement/unmatched')
  return { success: true, mapping }
}

export async function createSupplierAction(formData: FormData) {
  const user = await requireProcurementAuth()

  const name = String(formData.get('name') || '').trim()
  const slug = String(formData.get('slug') || '').trim().toLowerCase()
  const supplierType = (formData.get('supplierType') as SupplierType) || 'UK_DISTRIBUTOR'
  const country = String(formData.get('country') || 'GB').trim().toUpperCase()
  const currency = (formData.get('currency') as Currency) || 'GBP'
  const relationshipStatus =
    (formData.get('relationshipStatus') as SupplierRelationshipStatus) || 'ACTIVE'
  const integrationType =
    (formData.get('integrationType') as SupplierIntegrationType) || 'MANUAL'
  const website = String(formData.get('website') || '').trim() || null
  const accountReference = String(formData.get('accountReference') || '').trim() || null
  const contactEmail = String(formData.get('contactEmail') || '').trim() || null
  const contactPhone = String(formData.get('contactPhone') || '').trim() || null
  const notes = String(formData.get('notes') || '').trim() || null

  if (!name || !slug) {
    throw new Error('Supplier name and slug are required.')
  }

  const supplier = await createSupplier(
    {
      name,
      slug,
      supplierType,
      country,
      currency,
      relationshipStatus,
      integrationType,
      website,
      accountReference,
      contactEmail,
      contactPhone,
      notes,
    },
    user.id
  )

  revalidatePath('/admin/procurement')
  return { success: true, supplier }
}

export async function updateSupplierAction(id: string, formData: FormData) {
  const user = await requireProcurementAuth()

  const name = String(formData.get('name') || '').trim()
  const relationshipStatus = formData.get('relationshipStatus') as SupplierRelationshipStatus | null
  const integrationType = formData.get('integrationType') as SupplierIntegrationType | null
  const website = String(formData.get('website') || '').trim() || null
  const accountReference = String(formData.get('accountReference') || '').trim() || null
  const contactEmail = String(formData.get('contactEmail') || '').trim() || null
  const contactPhone = String(formData.get('contactPhone') || '').trim() || null
  const notes = String(formData.get('notes') || '').trim() || null

  const updates: Partial<SupplierRecord> = {}
  if (name) updates.name = name
  if (relationshipStatus) updates.relationshipStatus = relationshipStatus
  if (integrationType) updates.integrationType = integrationType
  if (website !== undefined) updates.website = website
  if (accountReference !== undefined) updates.accountReference = accountReference
  if (contactEmail !== undefined) updates.contactEmail = contactEmail
  if (contactPhone !== undefined) updates.contactPhone = contactPhone
  if (notes !== undefined) updates.notes = notes

  const supplier = await updateSupplier(id, updates, user.id)
  revalidatePath('/admin/procurement')
  revalidatePath(`/admin/procurement/suppliers/${id}`)
  return { success: true, supplier }
}

export async function importSupplierCsvFeedAction(supplierId: string, csvContent: string) {
  const user = await requireProcurementAuth()
  const supplier = await getSupplierById(supplierId)
  if (!supplier) throw new Error(`Supplier "${supplierId}" not found.`)

  const lines = csvContent.trim().split(/\r?\n/)
  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data row.')
  }

  const headerLine = lines[0]!.toLowerCase()
  const headers = headerLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''))

  const skuIndex = headers.findIndex((h) => h === 'sku' || h === 'supplier_sku' || h === 'part_number')
  const mfrSkuIndex = headers.findIndex((h) => h === 'mfr_sku' || h === 'manufacturer_sku')
  const titleIndex = headers.findIndex((h) => h === 'title' || h === 'name' || h === 'product_name')
  const brandIndex = headers.findIndex((h) => h === 'brand' || h === 'brand_name')
  const costIndex = headers.findIndex((h) => h === 'cost' || h === 'price' || h === 'wholesale_price')
  const rrpIndex = headers.findIndex((h) => h === 'rrp' || h === 'retail_price')
  const availIndex = headers.findIndex((h) => h === 'availability' || h === 'stock' || h === 'status')
  const qtyIndex = headers.findIndex((h) => h === 'qty' || h === 'quantity' || h === 'stock_level')
  const leadTimeIndex = headers.findIndex((h) => h === 'lead_time' || h === 'lead_time_days')

  if (skuIndex === -1) {
    throw new Error('CSV must contain a SKU, supplier_sku, or part_number column.')
  }

  const rawItems: RawSupplierFeedItem[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i]?.trim()
    if (!row) continue

    // Basic CSV cell parsing
    const cells = row.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''))
    const supplierSku = cells[skuIndex]
    if (!supplierSku) continue

    const manufacturerSku = mfrSkuIndex >= 0 && cells[mfrSkuIndex] ? cells[mfrSkuIndex]! : null
    const title = titleIndex >= 0 && cells[titleIndex] ? cells[titleIndex]! : `Item ${supplierSku}`
    const brandName = brandIndex >= 0 && cells[brandIndex] ? cells[brandIndex]! : null
    const costRaw = costIndex >= 0 && cells[costIndex] ? parseFloat(cells[costIndex]!) : 0
    const cost = Math.round(costRaw * 100) // Convert decimal currency to minor units
    const rrpRaw = rrpIndex >= 0 && cells[rrpIndex] ? parseFloat(cells[rrpIndex]!) : null
    const rrp = rrpRaw !== null && !isNaN(rrpRaw) ? Math.round(rrpRaw * 100) : null
    const availability = availIndex >= 0 && cells[availIndex] ? cells[availIndex]! : 'in stock'
    const quantity = qtyIndex >= 0 && cells[qtyIndex] ? parseInt(cells[qtyIndex]!, 10) : null
    const leadTimeDays = leadTimeIndex >= 0 && cells[leadTimeIndex] ? parseInt(cells[leadTimeIndex]!, 10) : null

    rawItems.push({
      supplierSku,
      manufacturerSku,
      title,
      brandName,
      cost,
      rrp,
      currency: supplier.currency,
      availability,
      quantity,
      leadTimeDays,
    })
  }

  const syncRun = await ingestSupplierFeed(supplierId, rawItems, user.id)
  revalidatePath('/admin/procurement')
  revalidatePath(`/admin/procurement/suppliers/${supplierId}`)
  revalidatePath('/admin/procurement/unmatched')
  return { success: true, syncRun }
}

export async function disappearProductFromFeedAction(supplierId: string, supplierSku: string) {
  await requireProcurementAuth()
  await handleProductDisappearance(supplierId, supplierSku)
  revalidatePath('/admin/procurement')
  revalidatePath(`/admin/procurement/suppliers/${supplierId}`)
  return { success: true }
}

// ─── Phase 11 Server Actions ──────────────────────────────────────────────────

export async function createTradeAccountApplicationAction(input: {
  supplierId: string
  notes?: string | null
  assignedTo?: string | null
}) {
  const user = await requireProcurementAuth()
  const app = await createTradeAccountApplication({
    supplierId: input.supplierId,
    notes: input.notes ?? null,
    assignedTo: input.assignedTo ?? user.email ?? user.id,
  })
  revalidatePath('/admin/procurement')
  revalidatePath('/admin/procurement/applications')
  revalidatePath(`/admin/procurement/suppliers/${input.supplierId}`)
  return { success: true, application: app }
}

export async function updateTradeAccountStatusAction(
  id: string,
  status: TradeAccountApplicationStatus,
  stage?: ProcurementPipelineStage,
  details?: {
    accountReference?: string | null
    creditLimitMinorUnits?: number | null
    creditCurrency?: Currency | null
    notes?: string | null
  }
) {
  const user = await requireProcurementAuth()
  const updated = await updateTradeAccountApplicationStatus(id, status, stage, {
    accountReference: details?.accountReference ?? null,
    creditLimitMinorUnits: details?.creditLimitMinorUnits ?? null,
    creditCurrency: details?.creditCurrency ?? null,
    notes: details?.notes ?? null,
    reviewedBy: user.id,
  })
  revalidatePath('/admin/procurement')
  revalidatePath('/admin/procurement/applications')
  revalidatePath(`/admin/procurement/applications/${id}`)
  revalidatePath(`/admin/procurement/suppliers/${updated.supplierId}`)
  return { success: true, application: updated }
}

export async function updateTradeAccountRequirementAction(
  id: string,
  status: TradeAccountRequirementStatus,
  details?: {
    documentId?: string | null
  }
) {
  const user = await requireProcurementAuth()
  const updated = await updateTradeAccountRequirement(id, status, {
    documentId: details?.documentId ?? null,
    verifiedBy: user.email ?? user.id,
  })
  revalidatePath('/admin/procurement/applications')
  return { success: true, requirement: updated }
}

export async function verifyBrandSupplierRelationshipAction(input: {
  brandId: string
  supplierId: string
  territory: ProcurementTerritory
  relationshipType: BrandSupplierRelationshipType
  verificationStatus: CommercialRelationshipVerificationStatus
  isExclusive?: boolean | undefined
  exclusivityScope?: ExclusivityScope | null | undefined
  evidenceSourceType: RelationshipEvidenceSourceType
  evidenceUrl?: string | null | undefined
  evidenceNotes?: string | null | undefined
}) {
  const user = await requireProcurementAuth()
  const relationship = await verifyBrandSupplierRelationship({
    brandId: input.brandId,
    supplierId: input.supplierId,
    territory: input.territory,
    relationshipType: input.relationshipType,
    verificationStatus: input.verificationStatus,
    isExclusive: input.isExclusive ?? false,
    exclusivityScope: input.exclusivityScope ?? 'NONE',
    evidenceSourceType: input.evidenceSourceType,
    evidenceUrl: input.evidenceUrl ?? null,
    evidenceNotes: input.evidenceNotes ?? null,
    verifiedBy: user.email ?? user.id,
  })
  revalidatePath('/admin/procurement')
  revalidatePath('/admin/procurement/brands')
  revalidatePath('/admin/procurement/relationships')
  revalidatePath(`/admin/procurement/suppliers/${input.supplierId}`)
  return { success: true, relationship }
}

export async function setSupplierCommercialTermsAction(input: {
  supplierId: string
  currency: Currency
  paymentTerms: PaymentTermsType
  paymentTermsDays?: number | null
  earlyPaymentDiscountPercent?: number | null
  minimumOrderQuantityUnits?: number | null
  minimumOrderValueMinorUnits?: number | null
  freeFreightThresholdMinorUnits?: number | null
  standardDiscountTierPercent?: number | null
  dropShipAvailable: boolean
  dropShipFeeMinorUnits?: number | null
  orderingMethod?: string | null
  isVerified: boolean
  notes?: string | null
}) {
  const user = await requireProcurementAuth()
  const terms = await setSupplierCommercialTerms({
    ...input,
    verifiedBy: input.isVerified ? (user.email ?? user.id) : null,
  })
  revalidatePath('/admin/procurement')
  revalidatePath(`/admin/procurement/suppliers/${input.supplierId}`)
  return { success: true, terms }
}

export async function logSupplierCommunicationAction(input: {
  supplierId: string
  contactId?: string | null
  type: CommunicationType
  subject: string
  summary: string
  occurredAt?: string
  nextFollowUpDate?: string | null
}) {
  const user = await requireProcurementAuth()
  const comm = await logSupplierCommunication({
    supplierId: input.supplierId,
    contactId: input.contactId ?? null,
    type: input.type,
    subject: input.subject,
    summary: input.summary,
    loggedBy: user.email ?? user.id,
    occurredAt: input.occurredAt || new Date().toISOString(),
    nextFollowUpDate: input.nextFollowUpDate ?? null,
  })
  revalidatePath(`/admin/procurement/suppliers/${input.supplierId}`)
  return { success: true, communication: comm }
}

export async function createProcurementTaskAction(input: {
  supplierId: string
  taskType: ProcurementTaskType
  title: string
  description?: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  assignedTo?: string | null
}) {
  const user = await requireProcurementAuth()
  const task = await createProcurementTask({
    supplierId: input.supplierId,
    taskType: input.taskType,
    title: input.title,
    description: input.description ?? null,
    status: 'OPEN',
    priority: input.priority,
    dueDate: input.dueDate ?? null,
    assignedTo: input.assignedTo ?? user.email ?? user.id,
  })
  revalidatePath('/admin/procurement')
  revalidatePath(`/admin/procurement/suppliers/${input.supplierId}`)
  return { success: true, task }
}

export async function updateProcurementTaskStatusAction(
  id: string,
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
) {
  await requireProcurementAuth()
  const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null
  const updated = await updateProcurementTask(id, {
    status,
    completedAt,
  })
  revalidatePath('/admin/procurement')
  return { success: true, task: updated }
}

export async function setSupplierTerritoryCoverageAction(input: {
  supplierId: string
  territory: ProcurementTerritory
  state: TerritorySupportState
  restrictionReason?: TerritoryRestrictionReason | null
  notes?: string | null
}) {
  const user = await requireProcurementAuth()
  const coverage = await setSupplierTerritoryCoverage({
    supplierId: input.supplierId,
    territory: input.territory,
    state: input.state,
    restrictionReason: input.restrictionReason ?? null,
    notes: input.notes ?? null,
    verifiedAt: new Date().toISOString(),
    verifiedBy: user.email ?? user.id,
  })
  revalidatePath('/admin/procurement')
  revalidatePath(`/admin/procurement/suppliers/${input.supplierId}`)
  return { success: true, coverage }
}

