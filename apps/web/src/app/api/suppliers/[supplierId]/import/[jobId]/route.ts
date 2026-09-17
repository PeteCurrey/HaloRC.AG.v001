import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import { getImportJob, getImportPreview } from '@halo-rc/db'

/**
 * GET /api/suppliers/[supplierId]/import/[jobId]
 * Returns job status and full import preview for administrator review.
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

    // Scoped: job must belong to the requested supplier
    if (job.supplierId !== supplierId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const previewData = await getImportPreview(jobId)

    return NextResponse.json({ job, preview: previewData?.preview ?? null })
  } catch (err) {
    console.error('[Job Status Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
