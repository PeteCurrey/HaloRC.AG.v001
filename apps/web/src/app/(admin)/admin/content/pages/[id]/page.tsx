import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminCmsPage } from '@halo-rc/db'
import {
  updateCmsPageAction,
  publishCmsPageAction,
  unpublishCmsPageAction,
} from '@/actions/admin'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCmsPage({ params }: PageProps) {
  const { id } = await params
  const page = await getAdminCmsPage(id)

  if (!page) notFound()

  async function handleUpdate(formData: FormData) {
    'use server'
    await updateCmsPageAction(id, formData)
  }

  async function handleTogglePublish() {
    'use server'
    if (page?.status === 'PUBLISHED') {
      await unpublishCmsPageAction(id)
    } else {
      await publishCmsPageAction(id)
    }
  }

  const rawContent = Array.isArray(page.contentJson)
    ? (page.contentJson as any[]).map((b) => b.body || '').join('\n\n')
    : ''

  const inputStyle = {
    width: '100%',
    padding: 'var(--space-3)',
    backgroundColor: 'var(--colour-graphite)',
    border: '1px solid var(--colour-steel)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--colour-white)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
  }

  const labelStyle = {
    display: 'block' as const,
    fontFamily: 'var(--font-mono)' as const,
    fontSize: '0.6875rem',
    color: 'var(--colour-smoke)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: 'var(--space-2)',
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
        <Link href="/admin/content/pages" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          CMS Pages
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--colour-white)' }}>{page.title}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: page.status === 'PUBLISHED' ? 'rgba(0,200,100,0.15)' : 'rgba(255,180,0,0.15)',
              color: page.status === 'PUBLISHED' ? 'var(--colour-verified)' : 'var(--colour-amber)',
              border: `1px solid ${page.status === 'PUBLISHED' ? 'var(--colour-verified)' : 'var(--colour-amber)'}`,
            }}>
              {page.status}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--colour-graphite)',
              color: 'var(--colour-smoke)',
            }}>
              {page.pageType}
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            {page.title}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: 'var(--space-1)' }}>
            Public Route: /{page.slug} &bull; Updated: {new Date(page.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <form action={handleTogglePublish}>
            <button
              type="submit"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: page.status === 'PUBLISHED' ? 'transparent' : 'var(--colour-verified)',
                border: `1px solid ${page.status === 'PUBLISHED' ? 'var(--colour-amber)' : 'transparent'}`,
                color: page.status === 'PUBLISHED' ? 'var(--colour-amber)' : 'var(--colour-void)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {page.status === 'PUBLISHED' ? 'Unpublish to Draft' : 'Publish to Live Storefront'}
            </button>
          </form>
        </div>
      </div>

      <form
        action={handleUpdate}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          backgroundColor: 'var(--colour-carbon)',
          border: '1px solid var(--colour-steel)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-6)',
        }}
      >
        <div>
          <label style={labelStyle}>Page Title *</label>
          <input type="text" name="title" defaultValue={page.title} required style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Page Archetype</label>
            <select name="pageType" defaultValue={page.pageType} style={inputStyle}>
              <option value="EDITORIAL">Editorial / Feature</option>
              <option value="BUYING_GUIDE">Buying Guide</option>
              <option value="BRAND">Brand Overview</option>
              <option value="ABOUT">About Halo RC</option>
              <option value="SHIPPING">Shipping &amp; Duties</option>
              <option value="RETURNS">Warranty &amp; Returns</option>
              <option value="CONTACT">Contact &amp; Concierge</option>
              <option value="OTHER">Other Technical Document</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>URL Slug (read-only)</label>
            <input type="text" value={page.slug} readOnly disabled style={{ ...inputStyle, fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Hero Display Heading</label>
          <input type="text" name="heroHeading" defaultValue={page.heroHeading || ''} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Hero Subheading</label>
          <input type="text" name="heroSubheading" defaultValue={page.heroSubheading || ''} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Article Body Content</label>
          <textarea
            name="content"
            rows={10}
            defaultValue={rawContent}
            style={inputStyle}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
            SEO &amp; Social Graph
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={labelStyle}>Custom SEO Title</label>
              <input type="text" name="seoTitle" defaultValue={page.seoTitle || ''} placeholder={`${page.title} | Halo RC`} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Meta Description</label>
              <textarea name="seoDescription" rows={3} defaultValue={page.seoDescription || ''} style={inputStyle} placeholder="Short overview for search engine discovery..." />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--colour-steel)' }}>
          <Link
            href="/admin/content/pages"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'transparent',
              border: '1px solid var(--colour-steel)',
              color: 'var(--colour-ash)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            style={{
              padding: 'var(--space-2) var(--space-6)',
              backgroundColor: 'var(--colour-halo)',
              border: 'none',
              color: 'var(--colour-void)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Save Page
          </button>
        </div>
      </form>
    </div>
  )
}
