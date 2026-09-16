import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createCmsPageAction } from '@/actions/admin'

export const revalidate = 0

export default function NewCmsPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    const result = await createCmsPageAction(formData)
    if (result.success && result.id) {
      redirect(`/admin/content/pages/${result.id}`)
    }
  }

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
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
        <Link href="/admin/content/pages" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          CMS Pages
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--colour-white)' }}>New Page</span>
      </div>

      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)', marginBottom: 'var(--space-2)' }}>
        Create CMS Document
      </h1>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', marginBottom: 'var(--space-8)' }}>
        Pages start in DRAFT status and are not publicly routeable until reviewed and published.
      </p>

      <form
        action={handleSubmit}
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
          <label style={labelStyle}>Document Title *</label>
          <input type="text" name="title" required placeholder="e.g. Competition Battery Maintenance Guide" style={inputStyle} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
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
              <option value="ABOUT">About Halo RC</option>
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
            Create Draft Document &rarr;
          </button>
        </div>
      </form>
    </div>
  )
}
