import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import { getFieldMap, saveFieldMap } from '@halo-rc/db'
import type { CanonicalImportField } from '@halo-rc/types'

const VALID_CANONICAL_FIELDS = new Set<CanonicalImportField>([
  'supplier_sku', 'manufacturer_sku', 'ean', 'product_name', 'description',
  'brand', 'category', 'net_price', 'rrp', 'currency', 'stock_quantity',
  'availability', 'product_url', 'image_url', 'weight_grams', 'notes', 'IGNORE',
])

/**
 * GET /api/suppliers/[supplierId]/field-map
 * Returns the active field map for a supplier.
 *
 * POST /api/suppliers/[supplierId]/field-map
 * Saves a new field map for a supplier.
 * Body: { mapName: string, mappings: Record<string, CanonicalImportField> }
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

    const fieldMap = await getFieldMap(supplierId)
    return NextResponse.json({ fieldMap })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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

    const body = await req.json()
    const { mapName, mappings } = body

    if (!mapName || typeof mapName !== 'string') {
      return NextResponse.json({ error: 'mapName is required' }, { status: 400 })
    }

    if (!mappings || typeof mappings !== 'object') {
      return NextResponse.json({ error: 'mappings is required' }, { status: 400 })
    }

    // Validate all canonical field values server-side
    for (const [col, field] of Object.entries(mappings)) {
      if (!VALID_CANONICAL_FIELDS.has(field as CanonicalImportField)) {
        return NextResponse.json(
          { error: `Invalid canonical field "${field}" for column "${col}"` },
          { status: 400 }
        )
      }
    }

    const savedMap = await saveFieldMap(
      supplierId,
      mappings as Record<string, CanonicalImportField>,
      mapName,
      user.id ?? user.email ?? null
    )

    return NextResponse.json({ fieldMap: savedMap })
  } catch (err) {
    console.error('[Field Map Save Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
