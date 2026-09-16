import Link from 'next/link'
import { getAdminSeoStats, getAdminProducts } from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminAction,
} from '@/components/admin'

export const revalidate = 0

export default async function AdminSeoAuditPage() {
  const [stats, productsData] = await Promise.all([
    getAdminSeoStats(),
    getAdminProducts({ published: true }, { page: 1, perPage: 50 }),
  ])

  const columns = [
    { header: 'Product', width: '35%' },
    { header: 'Brand', width: '20%' },
    { header: 'Tier', width: '15%' },
    { header: 'Markets', width: '15%' },
    { header: 'Actions', width: '15%', align: 'right' as const },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        category="Intelligence & Search Governance"
        title="SEO & Discoverability Audit"
        description="Avorria RC authoritative policy: every published product must have verified metadata before indexation."
      />

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Published Products
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.totalPublishedProducts}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Missing Meta Description
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: stats.missingDescriptionCount > 0 ? 'var(--admin-dot-warning, #B86818)' : 'var(--admin-dot-online, #1A6E34)',
              fontFamily: 'var(--font-mono, monospace)',
              marginTop: '2px',
            }}
          >
            {stats.missingDescriptionCount}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Missing Custom SEO Title
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: stats.missingTitleCount > 0 ? 'var(--admin-dot-warning, #B86818)' : 'var(--admin-dot-online, #1A6E34)',
              fontFamily: 'var(--font-mono, monospace)',
              marginTop: '2px',
            }}
          >
            {stats.missingTitleCount}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            No SEO Record Initialized
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: stats.noSeoRecordCount > 0 ? 'var(--admin-dot-alert, #C8001A)' : 'var(--admin-dot-online, #1A6E34)',
              fontFamily: 'var(--font-mono, monospace)',
              marginTop: '2px',
            }}
          >
            {stats.noSeoRecordCount}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            NOINDEX Exclusions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-secondary, #494D55)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.noIndexCount}
          </div>
        </AdminPanel>
      </div>

      {/* Published Products SEO Roster */}
      <AdminTable
        columns={columns}
        emptyMessage="No published products currently in registry."
      >
        {productsData.items.map((prod) => (
          <AdminTableRow key={prod.id}>
            <td style={{ padding: '10px 14px' }}>
              <Link
                href={`/admin/products/${prod.id}/edit?tab=seo`}
                style={{ color: 'var(--admin-text-primary, #111317)', fontWeight: 600, textDecoration: 'none' }}
              >
                {prod.name}
              </Link>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-tertiary, #767A85)', fontSize: '0.6875rem', marginTop: '2px' }}>
                /{prod.slug}
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

            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
              <AdminAction
                variant="subtle"
                size="sm"
                href={`/admin/products/${prod.id}/edit?tab=seo`}
              >
                Audit SEO &rarr;
              </AdminAction>
            </td>
          </AdminTableRow>
        ))}
      </AdminTable>
    </div>
  )
}
