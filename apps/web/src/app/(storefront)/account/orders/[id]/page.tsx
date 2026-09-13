// apps/web/src/app/(storefront)/account/orders/[id]/page.tsx
// Order detail view with historical snapshots and Garage vehicle association form.

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getOrderById, getCustomerGarage, getGarageVehicles } from '@halo-rc/db'
import { associateOrderWithGarageAction } from '@/actions/commerce'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = await params
  const orderId = resolvedParams.id

  const user = await getSessionUser()
  if (!user) {
    redirect(`/auth/sign-in?next=/account/orders/${orderId}`)
  }

  // Strictly verifies tenant ownership — returns null for foreign orders
  const order = await getOrderById(orderId, user.id)
  if (!order) {
    redirect('/account/orders?error=' + encodeURIComponent('Order not found'))
  }

  const garage = await getCustomerGarage(user.id)
  const vehicles = await getGarageVehicles(garage.id, user.id)

  const currencySymbol = order.currency === 'GBP' ? '£' : '$'
  const isPaid = order.paymentStatus === 'PAID'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Link href="/account/orders" style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', textDecoration: 'none' }}>
            ← Back to Orders
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              Order {order.orderReference}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: 'var(--space-1)' }}>
              Placed: {new Date(order.createdAt).toLocaleString()} | Market: {order.marketCode}
            </p>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              padding: '4px 10px',
              borderRadius: 4,
              backgroundColor: isPaid ? 'rgba(0, 200, 100, 0.2)' : 'rgba(255, 180, 0, 0.2)',
              color: isPaid ? 'var(--colour-verified)' : 'var(--colour-caution)',
            }}
          >
            {order.paymentStatus}
          </span>
        </div>

        {/* Build Provenance Notice */}
        {order.buildId && (
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Halo Build Order Provenance
            </span>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-off-white)', margin: 'var(--space-1) 0 0 0' }}>
              Originating Build: <strong>{order.buildId}</strong> (v{order.buildVersion ?? '1.0'})
            </p>
          </div>
        )}

        {/* Order Items Table */}
        <div
          style={{
            border: '1px solid var(--colour-steel)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--colour-carbon)',
            overflow: 'hidden',
            marginBottom: 'var(--space-8)',
          }}
        >
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
            <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', margin: 0 }}>
              Purchased Components (Historical Snapshot)
            </h2>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)' }}>Item</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)' }}>Qty</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)' }}>Unit Price</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)' }}>Line Total</th>
                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)' }}>Garage Association</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', display: 'block' }}>
                      {item.sku}
                    </span>
                    <strong style={{ color: 'var(--colour-white)' }}>{item.productName}</strong>
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--colour-ash)' }}>{item.quantity}</td>
                  <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                    {currencySymbol}{(item.unitPriceMinorUnits / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-white)', fontWeight: 600 }}>
                    {currencySymbol}{(item.lineTotalMinorUnits / 100).toFixed(2)}
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    {item.garageVehicleId ? (
                      <span style={{ color: 'var(--colour-verified)' }}>✓ Linked to Vehicle</span>
                    ) : vehicles.length > 0 ? (
                      <form action={associateOrderWithGarageAction} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <input type="hidden" name="orderItemId" value={item.id} />
                        <select
                          name="vehicleId"
                          style={{
                            padding: 'var(--space-1) var(--space-2)',
                            backgroundColor: 'var(--colour-graphite)',
                            border: '1px solid var(--colour-mist)',
                            color: 'var(--colour-off-white)',
                            fontSize: 'var(--text-xs)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {vehicles.map((veh) => (
                            <option key={veh.id} value={veh.id}>
                              {veh.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          style={{
                            padding: 'var(--space-1) var(--space-3)',
                            backgroundColor: 'var(--colour-halo)',
                            color: 'var(--colour-void)',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Attach
                        </button>
                      </form>
                    ) : (
                      <span style={{ color: 'var(--colour-smoke)' }}>No garage vehicles</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
