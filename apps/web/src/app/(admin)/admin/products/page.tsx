import Link from 'next/link'
import { getAdminProducts, getAdminBrands } from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminToolbar,
  AdminSearch,
  AdminFilter,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminPagination,
  AdminAction,
} from '@/components/admin'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    search?: string
    brandId?: string
    status?: string
    tier?: string
    page?: string
  }>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const search = params.search || ''
  const brandId = params.brandId || ''
  const status = params.status || ''
  const tier = params.tier || ''

  const filters = {
    ...(search ? { search } : {}),
    ...(brandId ? { brandId } : {}),
    ...(status ? { status } : {}),
    ...(tier ? { tier } : {}),
  }

  let productsData = { items: [] as any[], total: 0 }
  let brands: Array<{ id: string; name: string }> = []

  try {
    const [pData, bData] = await Promise.all([
      getAdminProducts(filters, { page, perPage: 25 }),
      getAdminBrands(),
    ])
    productsData = pData || { items: [], total: 0 }
    brands = bData || []
  } catch (error) {
    console.error('[AdminProductsPage] Error loading products data:', error)
  }

  const { items, total } = productsData
  const totalPages = Math.max(1, Math.ceil((total || 0) / 25))

  const columns = [
    { header: 'Product / SKU', width: '32%' },
    { header: 'Brand', width: '15%' },
    { header: 'Tier', width: '10%' },
    { header: 'Lifecycle', width: '12%' },
    { header: 'Markets', width: '10%' },
    { header: 'Status', width: '11%' },
    { header: 'Actions', width: '10%', align: 'right' as const },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        category="Authoritative Catalogue"
        title="Product Inventory & SKUs"
        description={`Showing ${items.length} of ${total} products in authoritative registry.`}
        actions={
          <AdminAction variant="primary" href="/admin/products/new">
            + Create Product
          </AdminAction>
        }
      />

      {/* Filter Toolbar */}
      <form method="get">
        <AdminToolbar
          rightActions={
            (search || brandId || status || tier) && (
              <AdminAction variant="ghost" size="sm" href="/admin/products">
                Clear filters
              </AdminAction>
            )
          }
        >
          <AdminSearch
            name="search"
            defaultValue={search}
            placeholder="Search by name, SKU, or slug..."
            width={280}
          />

          <AdminFilter name="brandId" defaultValue={brandId}>
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </AdminFilter>

          <AdminFilter name="status" defaultValue={status}>
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Review</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </AdminFilter>

          <AdminFilter name="tier" defaultValue={tier}>
            <option value="">All Tiers</option>
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
            <option value="HALO">Halo</option>
            <option value="COLLECTOR">Collector</option>
          </AdminFilter>

          <button
            type="submit"
            style={{
              height: '30px',
              padding: '0 12px',
              backgroundColor: 'var(--admin-surface, #FFFFFF)',
              border: '1px solid var(--admin-border, #E2E2DE)',
              borderRadius: 'var(--admin-radius-sm, 3px)',
              color: 'var(--admin-text-primary, #111317)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Apply
          </button>
        </AdminToolbar>
      </form>

      {/* Table */}
      <AdminTable columns={columns} emptyMessage="No products match the selected criteria.">
        {items.map((prod) => (
          <AdminTableRow key={prod.id}>
            <td style={{ padding: '10px 14px' }}>
              <Link
                href={`/admin/products/${prod.id}`}
                style={{
                  color: 'var(--admin-text-primary, #111317)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                }}
              >
                {prod.name}
              </Link>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--admin-text-tertiary, #767A85)',
                  fontSize: '0.6875rem',
                  marginTop: '2px',
                }}
              >
                SKU: {prod.sku || 'None'} &bull; /{prod.slug}
              </div>
            </td>

            <td style={{ padding: '10px 14px', color: 'var(--admin-text-secondary, #494D55)' }}>
              {prod.brandName}
            </td>

            <td style={{ padding: '10px 14px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.6875rem',
                  padding: '2px 6px',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  backgroundColor:
                    prod.tier === 'HALO'
                      ? 'rgba(184, 147, 90, 0.1)'
                      : 'var(--admin-surface-well, #EFEFED)',
                  color:
                    prod.tier === 'HALO'
                      ? 'var(--admin-accent, #B8935A)'
                      : 'var(--admin-text-secondary, #494D55)',
                  border: `1px solid ${
                    prod.tier === 'HALO'
                      ? 'var(--admin-accent-border, rgba(184, 147, 90, 0.28))'
                      : 'var(--admin-border, #E2E2DE)'
                  }`,
                }}
              >
                {prod.tier}
              </span>
            </td>

            <td style={{ padding: '10px 14px', color: 'var(--admin-text-tertiary, #767A85)' }}>
              {prod.lifecycle}
            </td>

            <td style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    padding: '1px 5px',
                    borderRadius: '2px',
                    backgroundColor: prod.hasUkOffer ? 'rgba(26, 110, 52, 0.08)' : 'var(--admin-surface-well, #EFEFED)',
                    color: prod.hasUkOffer ? 'var(--admin-dot-online, #1A6E34)' : 'var(--admin-text-muted, #9EA2AB)',
                    border: `1px solid ${prod.hasUkOffer ? 'rgba(26, 110, 52, 0.2)' : 'transparent'}`,
                  }}
                >
                  UK
                </span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    padding: '1px 5px',
                    borderRadius: '2px',
                    backgroundColor: prod.hasUsOffer ? 'rgba(26, 110, 52, 0.08)' : 'var(--admin-surface-well, #EFEFED)',
                    color: prod.hasUsOffer ? 'var(--admin-dot-online, #1A6E34)' : 'var(--admin-text-muted, #9EA2AB)',
                    border: `1px solid ${prod.hasUsOffer ? 'rgba(26, 110, 52, 0.2)' : 'transparent'}`,
                  }}
                >
                  US
                </span>
              </div>
            </td>

            <td style={{ padding: '10px 14px' }}>
              <AdminStatus
                status={prod.published ? 'published' : prod.status}
                label={prod.published ? 'PUBLISHED' : prod.status}
              />
            </td>

            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <AdminAction
                  variant="secondary"
                  size="sm"
                  href={`/admin/products/${prod.id}/edit`}
                >
                  Edit
                </AdminAction>
                <AdminAction
                  variant="subtle"
                  size="sm"
                  href={`/admin/products/${prod.id}`}
                >
                  View
                </AdminAction>
              </div>
            </td>
          </AdminTableRow>
        ))}
      </AdminTable>

      {/* Pagination */}
      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        createPageUrl={(p) =>
          `/admin/products?page=${p}&search=${search}&brandId=${brandId}&status=${status}&tier=${tier}`
        }
      />
    </div>
  )
}
