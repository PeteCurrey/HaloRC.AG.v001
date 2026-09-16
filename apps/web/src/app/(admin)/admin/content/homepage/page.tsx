import Link from 'next/link'
import { getAdminHomepageSections } from '@halo-rc/db'

export const revalidate = 0

export default async function AdminHomepageConfigPage() {
  const sections = await getAdminHomepageSections()

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
              Content Management System
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Homepage Layout &amp; Sections
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
            Configure active modules, featured machines, brand carousels, and value propositions.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--colour-graphite)',
            border: '1px solid var(--colour-steel)',
            color: 'var(--colour-off-white)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textDecoration: 'none',
          }}
        >
          View Live Homepage &nearr;
        </Link>
      </div>

      {/* Sections List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {sections.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
              No custom homepage sections initialized in database.
            </p>
            <p style={{ color: 'var(--colour-smoke)', fontSize: 'var(--text-xs)' }}>
              The storefront homepage is currently rendering default high-fidelity layout components. Run seed scripts or insert sections to enable dynamic ordering.
            </p>
          </div>
        ) : (
          sections.map((sec) => (
            <div
              key={sec.id}
              style={{
                padding: 'var(--space-5)',
                backgroundColor: 'var(--colour-carbon)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '1px 5px', borderRadius: '2px', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-halo)' }}>
                    {sec.sectionType}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>
                    Order: {sec.sortOrder}
                  </span>
                </div>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)' }}>
                  {sec.title}
                </h3>
                {sec.subtitle && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
                    {sec.subtitle}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  backgroundColor: sec.active ? 'rgba(0,200,100,0.15)' : 'var(--colour-graphite)',
                  color: sec.active ? 'var(--colour-verified)' : 'var(--colour-smoke)',
                }}>
                  {sec.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
