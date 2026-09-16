import Link from 'next/link'
import { getAdminCmsPages } from '@halo-rc/db'
import type { CmsPageType, RecordStatus } from '@halo-rc/types'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    status?: string
    pageType?: string
    search?: string
    page?: string
  }>
}

export default async function AdminCmsPagesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const status = params.status as RecordStatus | undefined
  const pageType = params.pageType as CmsPageType | undefined
  const search = params.search || ''

  const { items, total } = await getAdminCmsPages(
    { status, pageType, search: search || undefined },
    { page, perPage: 25 }
  )

  const totalPages = Math.ceil(total / 25)

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
              Content Management System
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Authoritative Website Pages
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
            Editorial storytelling, brand biographies, buying guides, and legal policies.
          </p>
        </div>

        <Link
          href="/admin/content/pages/new"
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
          + Create CMS Page
        </Link>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Page Title / Slug</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Type</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Updated</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
                  No CMS pages created yet. Click "+ Create CMS Page" to create the first editorial document.
                </td>
              </tr>
            ) : (
              items.map((cms) => (
                <tr key={cms.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link href={`/admin/content/pages/${cms.id}`} style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none' }}>
                      {cms.title}
                    </Link>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontSize: '0.6875rem', marginTop: '2px' }}>
                      /{cms.slug}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '1px 5px', borderRadius: '2px', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)' }}>
                      {cms.pageType}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: cms.status === 'PUBLISHED' ? 'rgba(0,200,100,0.15)' : 'rgba(255,180,0,0.15)',
                      color: cms.status === 'PUBLISHED' ? 'var(--colour-verified)' : 'var(--colour-amber)',
                      border: `1px solid ${cms.status === 'PUBLISHED' ? 'var(--colour-verified)' : 'var(--colour-amber)'}`,
                    }}>
                      {cms.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontSize: '0.6875rem' }}>
                    {new Date(cms.updatedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link
                      href={`/admin/content/pages/${cms.id}`}
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
                      Edit &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {page > 1 && (
                <Link
                  href={`/admin/content/pages?page=${page - 1}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)', textDecoration: 'none', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}
                >
                  &larr; Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/content/pages?page=${page + 1}`}
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
