'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import {
  getSupplierById,
  getImportJob,
  commitImportJob,
  rollbackImportJob,
  rejectImportJob,
  saveFieldMap,
  getFieldMap,
  getSupplierMappings,
  getSupplierProducts,
  processCsvUpload,
  SUPPLIER_PRODUCTS_STORE_FOR_IMPORT,
  onCreateSupplierProductFromImport,
  onUpdateSupplierProductFromImport,
  onDeleteSupplierProductFromImport,
  onRestoreSupplierProductFromImport,
} from '@halo-rc/db'
import type { CanonicalImportField } from '@halo-rc/types'

/**
 * Enforce RBAC guard for CSV import administration actions.
 */
async function requireImportAuth() {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  const user = await getSessionUser(authHeader)

  if (!user || !hasRequiredRole(user.role, STAFF_ROLES)) {
    throw new Error('403 Forbidden: Insufficient permissions for supplier import operations.')
  }

  return user
}

export async function uploadSupplierCsvAction(supplierId: string, formData: FormData) {
  const user = await requireImportAuth()
  const supplier = await getSupplierById(supplierId)
  if (!supplier) {
    throw new Error('Supplier not found')
  }

  const files = formData.getAll('files') as File[]
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }

  const csvBuffers: Array<{ filename: string; buffer: Buffer }> = []
  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    csvBuffers.push({
      filename: file.name,
      buffer: Buffer.from(arrayBuffer),
    })
  }

  const savedFieldMap = await getFieldMap(supplier.id)
  const fieldMap: Record<string, CanonicalImportField> = savedFieldMap?.mappings ?? {}

  const [existingMappings, existingProducts] = await Promise.all([
    getSupplierMappings(supplier.id),
    getSupplierProducts(supplier.id),
  ])

  const mappingsForMatching = existingMappings.map((m) => ({
    supplierId: m.supplierId,
    supplierSku: m.supplierSku,
    canonicalProductId: m.canonicalProductId ?? null,
    canonicalVariantId: m.canonicalVariantId ?? null,
    status: m.status,
  }))

  const productsForMatching = existingProducts.map((p) => ({
    supplierId: p.supplierId,
    supplierSku: p.supplierSku,
    id: p.id,
    manufacturerSku: p.manufacturerSku ?? null,
    eanGtin: p.eanGtin ?? null,
  }))

  const result = await processCsvUpload(
    supplier.id,
    user.id ?? user.email ?? null,
    csvBuffers,
    fieldMap,
    mappingsForMatching,
    productsForMatching
  )

  revalidatePath(`/admin/suppliers/${supplier.slug}`)
  return {
    jobId: result.job.id,
    status: result.job.status,
    stats: result.stats,
  }
}

export async function commitImportJobAction(supplierId: string, jobId: string) {
  const user = await requireImportAuth()
  const supplier = await getSupplierById(supplierId)
  if (!supplier) throw new Error('Supplier not found')

  const job = await getImportJob(jobId)
  if (!job) throw new Error('Job not found')
  if (job.supplierId !== supplier.id) throw new Error('Forbidden: Job does not belong to supplier')

  const result = await commitImportJob(
    jobId,
    user.id ?? user.email ?? null,
    SUPPLIER_PRODUCTS_STORE_FOR_IMPORT,
    onCreateSupplierProductFromImport,
    onUpdateSupplierProductFromImport
  )

  revalidatePath(`/admin/suppliers/${supplier.slug}`)
  return result
}

export async function rollbackImportJobAction(supplierId: string, jobId: string, reason: string) {
  const user = await requireImportAuth()
  const supplier = await getSupplierById(supplierId)
  if (!supplier) throw new Error('Supplier not found')

  const job = await getImportJob(jobId)
  if (!job) throw new Error('Job not found')
  if (job.supplierId !== supplier.id) throw new Error('Forbidden: Job does not belong to supplier')

  const result = await rollbackImportJob(
    jobId,
    user.id ?? user.email ?? null,
    reason,
    onDeleteSupplierProductFromImport,
    onRestoreSupplierProductFromImport
  )

  revalidatePath(`/admin/suppliers/${supplier.slug}`)
  return result
}

export async function rejectImportJobAction(supplierId: string, jobId: string) {
  const user = await requireImportAuth()
  const supplier = await getSupplierById(supplierId)
  if (!supplier) throw new Error('Supplier not found')

  const job = await getImportJob(jobId)
  if (!job) throw new Error('Job not found')
  if (job.supplierId !== supplier.id) throw new Error('Forbidden: Job does not belong to supplier')

  const result = await rejectImportJob(jobId, user.id ?? user.email ?? null)

  revalidatePath(`/admin/suppliers/${supplier.slug}`)
  return result
}

export async function saveFieldMappingAction(
  supplierId: string,
  mapName: string,
  mappings: Record<string, CanonicalImportField>
) {
  const user = await requireImportAuth()
  const supplier = await getSupplierById(supplierId)
  if (!supplier) throw new Error('Supplier not found')

  const result = await saveFieldMap(
    supplier.id,
    mappings,
    mapName,
    user.id ?? user.email ?? null
  )

  revalidatePath(`/admin/suppliers/${supplier.slug}`)
  return result
}
