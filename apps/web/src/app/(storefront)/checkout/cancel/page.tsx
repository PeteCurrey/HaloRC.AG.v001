// apps/web/src/app/(storefront)/checkout/cancel/page.tsx
// Checkout cancellation page.

import Link from 'next/link'

export default function CheckoutCancelPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-3)' }}>
          Checkout Cancelled
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-6)' }}>
          Your transaction was not completed. No charges were made. You can return to your basket and make changes at any time.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <Link
            href="/cart"
            style={{
              padding: 'var(--space-3) var(--space-5)',
              backgroundColor: 'var(--colour-halo)',
              color: 'var(--colour-void)',
              fontWeight: 600,
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Return to Basket
          </Link>
          <Link
            href="/machines"
            style={{
              padding: 'var(--space-3) var(--space-5)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              color: 'var(--colour-off-white)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  )
}
