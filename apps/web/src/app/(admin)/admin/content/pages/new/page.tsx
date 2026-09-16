import { redirect } from 'next/navigation'
import { createCmsPageAction } from '@/actions/admin'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminAction,
} from '@/components/admin'

export const revalidate = 0

export default function NewCmsPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createCmsPageAction(formData)
    if (result.success && result.id) {
      redirect(`/admin/content/pages/${result.id}`)
    }
  }

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
          { label: 'New Page' },
        ]}
        title="Create CMS Document"
        description="Pages start in DRAFT status and are not publicly routeable until reviewed and published."
      />

      <AdminSection>
        <form action={handleSubmit} style={{ maxWidth: 800 }}>
          <AdminPanel padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Document Title *</label>
                <input type="text" name="title" required placeholder="e.g. Competition Battery Maintenance Guide" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>URL Slug *</label>
                  <input type="text" name="slug" required placeholder="e.g. battery-maintenance-guide" style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} />
                </div>
                <div>
                  <label style={labelStyle}>Page Archetype</label>
                  <select name="pageType" defaultValue="EDITORIAL" style={inputStyle}>
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
              </div>

              <div>
                <label style={labelStyle}>Hero Heading</label>
                <input type="text" name="heroHeading" placeholder="Primary display header on storefront" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Hero Subheading</label>
                <input type="text" name="heroSubheading" placeholder="Secondary positioning subtitle" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Body Content</label>
                <textarea
                  name="content"
                  rows={8}
                  placeholder="Write the initial draft of the editorial piece..."
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #E2E2DE' }}>
                <AdminAction href="/admin/content/pages" variant="secondary">
                  Cancel
                </AdminAction>
                <AdminAction type="submit" variant="primary">
                  Create Draft Document →
                </AdminAction>
              </div>
            </div>
          </AdminPanel>
        </form>
      </AdminSection>
    </>
  )
}
