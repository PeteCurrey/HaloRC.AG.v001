import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import { getImportJobs } from '@halo-rc/db'

/**
 * GET /api/suppliers/[supplierId]/import/jobs
 * Returns import history for a supplier (most recent first).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params

    const authHeader = req.headers.get('authorization')
    const user = await getSessionUser(authHeader)
    if (!user || !hasRequiredRole(user.role, STAFF_ROLES)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const jobs = await getImportJobs(supplierId)
    return NextResponse.json({ jobs })
  } catch (err) {
    console.error('[Import Jobs Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
