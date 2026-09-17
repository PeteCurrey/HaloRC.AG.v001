import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import {
  getSupplierById,
  getFieldMap,
  getSupplierMappings,
  getSupplierProducts,
  processCsvUpload,
} from '@halo-rc/db'
import type { CanonicalImportField } from '@halo-rc/types'

/**
 * POST /api/suppliers/[supplierId]/import/upload
 * Accepts multipart CSV files, creates an import job, stages all rows through the pipeline.
 * Returns the created job and per-file stats.
 *
 * Server-side only. Never trusts client-provided supplierId for auth.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params

    // Auth guard: must be authenticated staff
    const authHeader = req.headers.get('authorization')
    const user = await getSessionUser(authHeader)
    if (!user || !hasRequiredRole(user.role, STAFF_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Server-side supplier validation — never trust the client-provided ID alone
    const supplier = await getSupplierById(supplierId)
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    // Validate file types server-side
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        return NextResponse.json(
          { error: `File "${file.name}" is not a CSV file` },
          { status: 400 }
        )
      }
    }

    // Convert Web API File objects to Buffers
    const csvBuffers: Array<{ filename: string; buffer: Buffer }> = []
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      csvBuffers.push({
        filename: file.name,
        buffer: Buffer.from(arrayBuffer),
      })
    }

    // Load the supplier's active field map (if one exists)
    const savedFieldMap = await getFieldMap(supplierId)
    const fieldMap: Record<string, CanonicalImportField> = savedFieldMap?.mappings ?? {}

    // Load existing data for SKU matching
    const [existingMappings, existingProducts] = await Promise.all([
      getSupplierMappings(supplierId),
      getSupplierProducts(supplierId),
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

    // Run the full import pipeline (parse → normalise → validate → stage)
    const result = await processCsvUpload(
      supplier.id, // Use server-validated supplier ID
      user.id ?? user.email ?? null,
      csvBuffers,
      fieldMap,
      mappingsForMatching,
      productsForMatching
    )

    return NextResponse.json({
      jobId: result.job.id,
      status: result.job.status,
      files: result.files.map((f) => ({
        id: f.id,
        filename: f.originalFilename,
        encoding: f.detectedEncoding,
        delimiter: f.detectedDelimiter,
        rowCount: f.rowCount,
        columnNames: f.columnNames,
      })),
      stats: result.stats,
      malformedRows: result.malformedRows,
    })
  } catch (err) {
    console.error('[CSV Upload Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
