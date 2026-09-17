import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import {
  getImportJob,
  rollbackImportJob,
  getSupplierById,
} from '@halo-rc/db'
import {
  onDeleteSupplierProductFromImport,
  onRestoreSupplierProductFromImport,
} from '@halo-rc/db'

/**
 * POST /api/suppliers/[supplierId]/import/[jobId]/rollback
 * Rolls back a committed import job.
 * Body: { reason: string }
 *
 * Only affects records introduced or changed by that specific import.
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

    const body = await req.json().catch(() => ({}))
    const reason: string = body.reason || 'No reason provided'

    const result = await rollbackImportJob(
      jobId,
      user.id ?? user.email ?? null,
      reason,
      onDeleteSupplierProductFromImport,
      onRestoreSupplierProductFromImport
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('[Rollback Error]', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
