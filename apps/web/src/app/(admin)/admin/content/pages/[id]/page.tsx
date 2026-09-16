import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminCmsPage } from '@halo-rc/db'
import {
  updateCmsPageAction,
  publishCmsPageAction,
  unpublishCmsPageAction,
} from '@/actions/admin'
import {
  AdminPageHeader,
  AdminPanel,
  AdminFormSection,
  AdminSection,
  AdminAction,
  AdminStatus,
} from '@/components/admin'

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--space-3)',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E2DE',
    borderRadius: 5,
    color: '#111317',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6875rem',
    color: '#767A85',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 6,
  }

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'CMS Pages', href: '/admin/content/pages' },
          { label: page.title },
        ]}
        title={page.title}
        description={`Public Route: /${page.slug} · Updated: ${new Date(page.updatedAt).toLocaleDateString()}`}
        status={<AdminStatus status={page.status === 'PUBLISHED' ? 'published' : 'draft'} />}
        actions={
          <form action={handleTogglePublish} style={{ display: 'inline' }}>
            <AdminAction
              type="submit"
              variant={page.status === 'PUBLISHED' ? 'secondary' : 'primary'}
            >
              {page.status === 'PUBLISHED' ? 'Unpublish to Draft' : 'Publish to Live Storefront'}
            </AdminAction>
          </form>
        }
      />

      <AdminSection>
        <form action={handleUpdate}>
          <AdminPanel padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Page Title *</label>
                <input type="text" name="title" defaultValue={page.title} required style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Page Archetype</label>
                  <select name="pageType" defaultValue={page.pageType} style={inputStyle}>
                    <option value="EDITORIAL">Editorial / Feature</option>
                    <option value="BUYING_GUIDE">Buying Guide</option>
                    <option value="BRAND">Brand Overview</option>
                    <option value="ABOUT">About Avorria RC</option>
                    <option value="SHIPPING">Shipping &amp; Duties</option>
                    <option value="RETURNS">Warranty &amp; Returns</option>
                    <option value="CONTACT">Contact &amp; Concierge</option>
                    <option value="OTHER">Other Technical Document</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>URL Slug (read-only)</label>
                  <input type="text" value={page.slug} readOnly disabled style={{ ...inputStyle, fontFamily: 'var(--font-mono)', color: '#767A85', backgroundColor: '#EFEFED' }} />
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

              <div style={{ borderTop: '1px solid #E2E2DE', paddingTop: 16 }}>
                <h3 style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: '#111317', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', marginBottom: 16, marginTop: 0 }}>
                  SEO &amp; Social Graph
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Custom SEO Title</label>
                    <input type="text" name="seoTitle" defaultValue={page.seoTitle || ''} placeholder={`${page.title} | Avorria RC`} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Meta Description</label>
                    <textarea name="seoDescription" rows={3} defaultValue={page.seoDescription || ''} style={inputStyle} placeholder="Short overview for search engine discovery..." />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #E2E2DE' }}>
                <AdminAction href="/admin/content/pages" variant="secondary">
                  Cancel
                </AdminAction>
                <AdminAction type="submit" variant="primary">
                  Save Page
                </AdminAction>
              </div>
            </div>
          </AdminPanel>
        </form>
      </AdminSection>
    </>
  )
}
