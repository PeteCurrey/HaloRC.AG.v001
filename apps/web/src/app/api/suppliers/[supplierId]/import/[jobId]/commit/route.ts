import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import {
  getImportJob,
  commitImportJob,
  getSupplierById,
} from '@halo-rc/db'
import {
  SUPPLIER_PRODUCTS_STORE_FOR_IMPORT,
  onCreateSupplierProductFromImport,
  onUpdateSupplierProductFromImport,
} from '@halo-rc/db'

/**
 * POST /api/suppliers/[supplierId]/import/[jobId]/commit
 * Commits all valid/warning rows in the import job.
 * Creates/updates supplier_products and supplier_offers.
 * Records rollback snapshots for every change.
 *
 * Server-side only. Never trusts client-provided IDs.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ supplierId: string; jobId: string }> }
) {
  try {
    const { supplierId, jobId } = await params

    const authHeader = req.headers.get('authorization')
    const user = await getSessionUser(authHeader)
    if (!user || !hasRequiredRole(user.role, STAFF_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supplier = await getSupplierById(supplierId)
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

    const job = await getImportJob(jobId)
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.supplierId !== supplier.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const result = await commitImportJob(
      jobId,
      user.id ?? user.email ?? null,
      SUPPLIER_PRODUCTS_STORE_FOR_IMPORT,
      onCreateSupplierProductFromImport,
      onUpdateSupplierProductFromImport
    )

    return NextResponse.json({
      committed: result.committed,
      created: result.created,
      updated: result.updated,
      priceChanges: result.priceChanges,
      stockChanges: result.stockChanges,
      skipped: result.skipped,
    })
  } catch (err) {
    console.error('[Commit Error]', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
