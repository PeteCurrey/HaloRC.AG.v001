// apps/web/src/app/(storefront)/checkout/success/page.tsx
// Order success and truthful status page.
// The browser URL does NOT mark orders paid; authoritative payment status comes solely from the Stripe webhook.

import Link from 'next/link'
import { getOrderByReference } from '@halo-rc/db'

interface CheckoutSuccessProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessProps) {
  const params = await searchParams
  const orderRef = typeof params['order_ref'] === 'string' ? params['order_ref'] : null

  const order = orderRef ? await getOrderByReference(orderRef) : null

  const isPaid = order?.paymentStatus === 'PAID'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: isPaid ? 'rgba(0, 200, 100, 0.2)' : 'rgba(255, 180, 0, 0.2)', color: isPaid ? 'var(--colour-verified)' : 'var(--colour-caution)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)', fontSize: '1.5rem' }}>
          {isPaid ? '✓' : '⏱'}
        </div>

        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
          {isPaid ? 'Order Confirmed & Paid' : 'Payment Processing'}
        </h1>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-6)' }}>
          {isPaid
            ? `Thank you for your order. Reference: ${order?.orderReference}. Your order record is durably preserved.`
            : `We have received your checkout session. Payment reconciliation is in progress via the authoritative Stripe webhook.`}
        </p>

        {order && (
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>Order Reference</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-white)', fontWeight: 600 }}>
                {order.orderReference}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>Status</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: isPaid ? 'var(--colour-verified)' : 'var(--colour-caution)' }}>
                {order.paymentStatus}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--colour-halo)', fontWeight: 600 }}>
                {order.currency === 'GBP' ? '£' : '$'}
                {(order.totalMinorUnits / 100).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center' }}>
          <Link
            href="/account/orders"
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
            View Order History
          </Link>
          <Link
            href="/garage"
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
            Go to My Garage
          </Link>
        </div>
      </div>
    </div>
  )
}
