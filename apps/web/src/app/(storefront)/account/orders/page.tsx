// apps/web/src/app/(storefront)/account/orders/page.tsx
// Customer order history page. Strictly protected by customer authentication.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getCustomerOrders } from '@halo-rc/db'

export default async function CustomerOrdersPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/auth/sign-in?next=/account/orders')
  }

  const orders = await getCustomerOrders(user.id)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--colour-halo)' }}>
            Account
          </span>
        </div>

        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-6)' }}>
          Order History
        </h1>

        {orders.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', border: '1px dashed var(--colour-steel)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', marginBottom: 'var(--space-4)' }}>
              No orders found for this account.
            </p>
            <Link
              href="/machines"
              style={{
                display: 'inline-block',
                padding: 'var(--space-3) var(--space-6)',
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
              Explore Catalogue →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {orders.map((order) => {
              const currencySymbol = order.currency === 'GBP' ? '£' : '$'
              const isPaid = order.paymentStatus === 'PAID'

              return (
                <div
                  key={order.id}
                  style={{
                    padding: 'var(--space-5)',
                    backgroundColor: 'var(--colour-carbon)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
                        {order.orderReference}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.625rem',
                          padding: '2px 6px',
                          borderRadius: 3,
                          backgroundColor: isPaid ? 'rgba(0, 200, 100, 0.2)' : 'rgba(255, 180, 0, 0.2)',
                          color: isPaid ? 'var(--colour-verified)' : 'var(--colour-caution)',
                        }}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', margin: 0 }}>
                      Placed: {new Date(order.createdAt).toLocaleDateString()} | Market: {order.marketCode}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--colour-halo)' }}>
                      {currencySymbol}{(order.totalMinorUnits / 100).toFixed(2)}
                    </span>
                    <Link
                      href={`/account/orders/${order.id}`}
                      style={{
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: 'var(--colour-graphite)',
                        border: '1px solid var(--colour-steel)',
                        color: 'var(--colour-off-white)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
