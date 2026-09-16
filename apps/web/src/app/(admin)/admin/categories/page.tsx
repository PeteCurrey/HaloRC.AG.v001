import Link from 'next/link'
import { getAdminCategories } from '@halo-rc/db'

export const revalidate = 0

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories()

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
              Taxonomy &amp; Hierarchy
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Product Categories &amp; Disciplines
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
            Catalogue taxonomy organizing machines, chassis kits, electronics, and accessories.
          </p>
        </div>
      </div>

      {/* Categories Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Category Name</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Slug</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Sort Order</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
                  No categories recorded.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-white)', fontWeight: 600 }}>
                    {c.name}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                    /{c.slug}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                    {c.sortOrder}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link
                      href={`/admin/products?categoryId=${c.id}`}
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
                      Browse Products &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
