import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getSessionUser, STAFF_ROLES, hasRequiredRole } from '@/lib/auth'
import { AdminShell } from '@/components/admin'

export const metadata: Metadata = {
  title: 'Avorria RC Operations | Administration',
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

  // If user is not authenticated at all, redirect to admin auth / sign-in page
  if (!user) {
    redirect('/auth/sign-in?redirectTo=/admin')
  }

  // Server-side RBAC boundary: enforce staff or admin role
  const isAuthorized = hasRequiredRole(user.role, STAFF_ROLES)

  if (!isAuthorized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--admin-canvas, #F5F5F3)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          fontFamily: 'var(--font-primary, system-ui, sans-serif)',
        }}
      >
        <div
          style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: 'var(--admin-surface, #FFFFFF)',
            border: '1px solid var(--admin-border, #E2E2DE)',
            borderRadius: 'var(--admin-radius-md, 5px)',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: 'var(--admin-shadow-card)',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: 'rgba(200, 0, 26, 0.08)',
              border: '1px solid rgba(200, 0, 26, 0.25)',
              color: 'var(--admin-dot-alert, #C8001A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.25rem',
              fontWeight: 700,
            }}
          >
            !
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.6875rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--admin-dot-alert, #C8001A)',
              fontWeight: 600,
            }}
          >
            403 Forbidden — Authorization Required
          </span>

          <h1
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--admin-text-primary, #111317)',
              margin: '8px 0 10px',
            }}
          >
            Staff & Engineering Authorization Required
          </h1>

          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--admin-text-secondary, #494D55)',
              lineHeight: 1.5,
              marginBottom: '24px',
            }}
          >
            This administrative area governs verified commercial contracts, supplier terms, and product graph provenance.
            Access is restricted to verified administrative roles.
          </p>

          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '8px 18px',
              backgroundColor: 'var(--admin-text-primary, #111317)',
              color: '#FFFFFF',
              borderRadius: 'var(--admin-radius-sm, 3px)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'none',
              letterSpacing: '0.02em',
            }}
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AdminShell userRole={user.role} userEmail={user.email ?? ''}>
      {children}
    </AdminShell>
  )
}
