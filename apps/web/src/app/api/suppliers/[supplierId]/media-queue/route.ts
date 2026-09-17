import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import { getMediaEnrichmentQueue } from '@halo-rc/db'

/**
 * GET /api/suppliers/[supplierId]/media-queue
 * Returns the media enrichment queue for a supplier.
 * Supports ?status=PENDING filter.
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

    const url = new URL(req.url)
    const status = url.searchParams.get('status') as 'PENDING' | 'MATCHED' | 'UNMATCHED' | undefined
    const items = await getMediaEnrichmentQueue(supplierId, status)

    return NextResponse.json({ items, total: items.length })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
