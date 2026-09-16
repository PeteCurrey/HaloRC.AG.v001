import Link from 'next/link'
import { getAdminNavigationItems } from '@halo-rc/db'

export const revalidate = 0

export default async function AdminNavigationPage() {
  const items = await getAdminNavigationItems()

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
            Site Navigation Hierarchy
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
            Authoritative menu structure, dropdown links, and featured header promotions.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Label</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Route / Link</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Key</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Order</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
                  Default navigation hierarchy active. Database custom menu items will override once configured.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-white)', fontWeight: 600 }}>
                    {item.label}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                    {item.href}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                    {item.navKey}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                    {item.sortOrder}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: item.active ? 'rgba(0,200,100,0.15)' : 'var(--colour-graphite)',
                      color: item.active ? 'var(--colour-verified)' : 'var(--colour-smoke)',
                    }}>
                      {item.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
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
