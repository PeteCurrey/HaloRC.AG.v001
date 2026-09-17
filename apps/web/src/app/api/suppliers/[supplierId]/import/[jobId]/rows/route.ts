import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import { getImportJob, getImportRows } from '@halo-rc/db'
import type { ImportRowStatus, ImportRowAction } from '@halo-rc/types'

/**
 * GET /api/suppliers/[supplierId]/import/[jobId]/rows
 * Returns paginated row-level staging records.
 * Supports ?status=INVALID&action=CREATE&limit=50&offset=0
 */
export async function GET(
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

    const job = await getImportJob(jobId)
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    if (job.supplierId !== supplierId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status') as ImportRowStatus | null
    const action = url.searchParams.get('action') as ImportRowAction | null
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500)
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)

    const rows = await getImportRows(jobId, {
      status: status ?? undefined,
      action: action ?? undefined,
      limit,
      offset,
    })

    return NextResponse.json({ rows, total: rows.length })
  } catch (err) {
    console.error('[Import Rows Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
