import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import { AdminSidebarNav } from './admin-nav'

export const metadata: Metadata = {
  title: 'Halo RC Operations | Administration',
  robots: {
    index: false,
    follow: false,
  },
}



export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  const user = await getSessionUser(authHeader)

  // Server-side RBAC boundary: enforce staff or admin role
  const isAuthorized = user && hasRequiredRole(user.role, STAFF_ROLES)

  if (!isAuthorized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--colour-void)',
          paddingTop: 'calc(var(--nav-height) + var(--space-10))',
          paddingInline: 'var(--gutter-md)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--colour-carbon)',
            border: '1px solid var(--colour-steel)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: 'var(--colour-race-10)',
              border: '1px solid var(--colour-race)',
              color: 'var(--colour-race)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            !
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--colour-race)',
            }}
          >
            403 Forbidden — Access Denied
          </span>

          <h1
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              color: 'var(--colour-white)',
              margin: 'var(--space-2) 0 var(--space-3)',
            }}
          >
            Staff & Engineering Authorization Required
          </h1>

          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--colour-ash)',
              lineHeight: 'var(--leading-relaxed)',
              marginBottom: 'var(--space-6)',
            }}
          >
            This administrative area manages verified commercial contracts, supplier terms, and product graph provenance.
            Access is restricted to authorized roles.
          </p>

          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: 'var(--space-3) var(--space-6)',
              backgroundColor: 'var(--colour-off-white)',
              color: 'var(--colour-void)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--colour-void)',
        paddingTop: 'var(--nav-height)',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          borderRight: '1px solid var(--colour-steel)',
          backgroundColor: 'var(--colour-carbon)',
          padding: 'var(--space-6) var(--space-4)',
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: 'var(--space-6)', paddingLeft: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
            System Architecture
          </span>
          <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-off-white)', marginTop: 'var(--space-1)' }}>
            Halo RC Admin
          </h2>
          <div style={{ marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--colour-verified)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-ash)' }}>
              {user.role} ({user.email})
            </span>
          </div>
        </div>

        <AdminSidebarNav />
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 'var(--space-8) var(--gutter-md)' }}>
        {children}
      </main>
    </div>
  )
}
