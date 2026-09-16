import Link from 'next/link'
import { getAdminSeoStats, getAdminProducts } from '@halo-rc/db'

export const revalidate = 0

export default async function AdminSeoAuditPage() {
  const [stats, productsData] = await Promise.all([
    getAdminSeoStats(),
    getAdminProducts({ published: true }, { page: 1, perPage: 50 }),
  ])

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
            Intelligence &amp; Search Governance
          </span>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
          SEO &amp; Discoverability Audit
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
          Halo RC non-negotiable: every published product must have verified metadata before indexation.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Published Products</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-white)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.totalPublishedProducts}</p>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Missing Meta Description</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stats.missingDescriptionCount > 0 ? 'var(--colour-amber)' : 'var(--colour-verified)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>
            {stats.missingDescriptionCount}
          </p>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Missing Custom SEO Title</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stats.missingTitleCount > 0 ? 'var(--colour-amber)' : 'var(--colour-verified)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>
            {stats.missingTitleCount}
          </p>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>No SEO Record Initialized</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stats.noSeoRecordCount > 0 ? '#ef4444' : 'var(--colour-verified)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>
            {stats.noSeoRecordCount}
          </p>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>NOINDEX Exclusions</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-ash)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>
            {stats.noIndexCount}
          </p>
        </div>
      </div>

      {/* Published Products SEO Roster */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', margin: 0 }}>
            Published Products Roster
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
            Showing {productsData.items.length} of {productsData.total} published products
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Product</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Brand</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Tier</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Markets</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {productsData.items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
                  No published products currently in registry.
                </td>
              </tr>
            ) : (
              productsData.items.map((prod) => (
                <tr key={prod.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link href={`/admin/products/${prod.id}/edit?tab=seo`} style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none' }}>
                      {prod.name}
                    </Link>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontSize: '0.6875rem', marginTop: '2px' }}>
                      /{prod.slug}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>
                    {prod.brandName}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--colour-graphite)',
                      color: prod.tier === 'HALO' ? 'var(--colour-halo)' : 'var(--colour-ash)',
                    }}>
                      {prod.tier}
                    </span>
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
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link
                      href={`/admin/products/${prod.id}/edit?tab=seo`}
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        backgroundColor: 'var(--colour-graphite)',
                        color: 'var(--colour-halo)',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: 'var(--radius-xs)',
                        textDecoration: 'none',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Audit SEO &rarr;
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
