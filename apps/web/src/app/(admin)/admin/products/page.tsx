import Link from 'next/link'
import { getAdminProducts, getAdminBrands } from '@halo-rc/db'

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
  const page = parseInt(params.page || '1', 10)
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

  const [productsData, brands] = await Promise.all([
    getAdminProducts(filters, { page, perPage: 25 }),
    getAdminBrands(),
  ])

  const { items, total } = productsData
  const totalPages = Math.ceil(total / 25)

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
              Authoritative Catalogue
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Product Inventory &amp; SKUs
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
            Showing {items.length} of {total} products in authoritative registry
          </p>
        </div>

        <Link
          href="/admin/products/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--colour-halo)',
            color: 'var(--colour-void)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textDecoration: 'none',
          }}
        >
          + Create Product
        </Link>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          backgroundColor: 'var(--colour-carbon)',
          border: '1px solid var(--colour-steel)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', width: '100%' }}>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, SKU, or slug..."
            style={{
              flex: '1 1 240px',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-sans)',
            }}
          />

          <select
            name="brandId"
            defaultValue={brandId}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={status}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Review</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            name="tier"
            defaultValue={tier}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="">All Tiers</option>
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
            <option value="HALO">Halo</option>
            <option value="COLLECTOR">Collector</option>
          </select>

          <button
            type="submit"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-halo)',
              color: 'var(--colour-halo)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Filter
          </button>

          {(search || brandId || status || tier) && (
            <Link
              href="/admin/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--colour-ash)',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
              }}
            >
              Clear filters
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: 'var(--colour-carbon)',
          border: '1px solid var(--colour-steel)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Product / SKU</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Brand</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Tier</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Lifecycle</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Markets</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
                  No products match the selected criteria.
                </td>
              </tr>
            ) : (
              items.map((prod) => (
                <tr
                  key={prod.id}
                  style={{
                    borderBottom: '1px solid var(--colour-steel)',
                    transition: 'background-color 100ms ease',
                  }}
                >
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link
                      href={`/admin/products/${prod.id}`}
                      style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {prod.name}
                    </Link>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontSize: '0.6875rem', marginTop: '2px' }}>
                      SKU: {prod.sku || 'None'} &bull; /{prod.slug}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>
                    {prod.brandName}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: prod.tier === 'HALO' ? 'rgba(230, 180, 0, 0.15)' : 'var(--colour-graphite)',
                        color: prod.tier === 'HALO' ? 'var(--colour-halo)' : 'var(--colour-ash)',
                        border: `1px solid ${prod.tier === 'HALO' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                      }}
                    >
                      {prod.tier}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-ash)' }}>
                    {prod.lifecycle}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', padding: '1px 4px', borderRadius: '2px', backgroundColor: prod.hasUkOffer ? 'rgba(0,200,100,0.1)' : 'var(--colour-graphite)', color: prod.hasUkOffer ? 'var(--colour-verified)' : 'var(--colour-smoke)' }}>
                        UK
                      </span>
                      <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', padding: '1px 4px', borderRadius: '2px', backgroundColor: prod.hasUsOffer ? 'rgba(0,200,100,0.1)' : 'var(--colour-graphite)', color: prod.hasUsOffer ? 'var(--colour-verified)' : 'var(--colour-smoke)' }}>
                        US
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: prod.published ? 'rgba(0, 200, 100, 0.15)' : 'rgba(255, 180, 0, 0.15)',
                        color: prod.published ? 'var(--colour-verified)' : 'var(--colour-amber)',
                      }}
                    >
                      {prod.published ? 'PUBLISHED' : prod.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                      <Link
                        href={`/admin/products/${prod.id}/edit`}
                        style={{
                          padding: 'var(--space-1) var(--space-2)',
                          backgroundColor: 'var(--colour-graphite)',
                          color: 'var(--colour-off-white)',
                          borderRadius: 'var(--radius-xs)',
                          textDecoration: 'none',
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/products/${prod.id}`}
                        style={{
                          padding: 'var(--space-1) var(--space-2)',
                          backgroundColor: 'var(--colour-graphite)',
                          color: 'var(--colour-smoke)',
                          borderRadius: 'var(--radius-xs)',
                          textDecoration: 'none',
                          fontSize: '0.6875rem',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {page > 1 && (
                <Link
                  href={`/admin/products?page=${page - 1}&search=${search}&brandId=${brandId}&status=${status}&tier=${tier}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)', textDecoration: 'none', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}
                >
                  &larr; Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/products?page=${page + 1}&search=${search}&brandId=${brandId}&status=${status}&tier=${tier}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)', textDecoration: 'none', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
