import Link from 'next/link'
import { getAdminOrders, getAdminOrderStats } from '@halo-rc/db'
import type { OrderPaymentStatus, OrderFulfilmentStatus } from '@halo-rc/types'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    paymentStatus?: string
    fulfilmentStatus?: string
    search?: string
    page?: string
  }>
}

function formatPrice(minorUnits: number | null, currency: string | null) {
  if (minorUnits === null || currency === null) return '—'
  const symbol = currency === 'USD' ? '$' : '£'
  return `${symbol}${(minorUnits / 100).toFixed(2)}`
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const paymentStatus = params.paymentStatus as OrderPaymentStatus | undefined
  const fulfilmentStatus = params.fulfilmentStatus as OrderFulfilmentStatus | undefined
  const search = params.search || ''

  const [ordersData, stats] = await Promise.all([
    getAdminOrders({ paymentStatus, fulfilmentStatus, search: search || undefined }, { page, perPage: 25 }),
    getAdminOrderStats(),
  ])

  const { items, total } = ordersData
  const totalPages = Math.ceil(total / 25)

  const paymentColor: Record<string, string> = {
    PAID: 'var(--colour-verified)',
    AUTHORIZED: 'var(--colour-halo)',
    PENDING_PAYMENT: 'var(--colour-amber)',
    PENDING: 'var(--colour-amber)',
    FAILED: '#ef4444',
    REFUNDED: 'var(--colour-smoke)',
    CANCELLED: 'var(--colour-smoke)',
  }

  const fulfilmentColor: Record<string, string> = {
    DELIVERED: 'var(--colour-verified)',
    SHIPPED: 'var(--colour-halo)',
    PACKED: 'var(--colour-white)',
    PROCESSING: 'var(--colour-amber)',
    UNFULFILLED: '#ef4444',
    PENDING: 'var(--colour-smoke)',
  }

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
              Commerce Ledger &amp; Fulfilment
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Customer Orders &amp; Dispatch
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
            Authoritative order states, market taxation records, and warehouse dispatch logs.
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Total Orders</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-white)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.totalOrders}</p>
        </div>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Paid &amp; Cleared</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-verified)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.paidOrders}</p>
        </div>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Pending Fulfilment</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stats.pendingFulfilment > 0 ? 'var(--colour-halo)' : 'var(--colour-ash)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.pendingFulfilment}</p>
        </div>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Unfulfilled</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stats.unfulfilledOrders > 0 ? 'var(--colour-amber)' : 'var(--colour-ash)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.unfulfilledOrders}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by order ref, email, or name..."
            style={{
              flex: '1 1 240px',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          />

          <select
            name="paymentStatus"
            defaultValue={paymentStatus || ''}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="AUTHORIZED">Authorized</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            name="fulfilmentStatus"
            defaultValue={fulfilmentStatus || ''}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="">All Fulfilment Statuses</option>
            <option value="UNFULFILLED">Unfulfilled</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            type="submit"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-halo)',
              color: 'var(--colour-halo)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Filter
          </button>

          {(search || paymentStatus || fulfilmentStatus) && (
            <Link
              href="/admin/orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--colour-ash)',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
              }}
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Order Ref</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Customer</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Market</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Items</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Payment</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Fulfilment</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Total</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Date</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
                  No orders in the ledger.
                </td>
              </tr>
            ) : (
              items.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link href={`/admin/orders/${order.id}`} style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                      {order.orderReference || order.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <div style={{ color: 'var(--colour-off-white)' }}>{order.userName || 'Guest User'}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>{order.userEmail || '—'}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '1px 4px', borderRadius: '2px', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)' }}>
                      {order.marketCode}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                    {order.itemCount}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--colour-graphite)',
                      color: paymentColor[order.paymentStatus] || 'var(--colour-smoke)',
                      border: `1px solid ${paymentColor[order.paymentStatus] || 'var(--colour-steel)'}`,
                    }}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--colour-graphite)',
                      color: fulfilmentColor[order.fulfilmentStatus] || 'var(--colour-smoke)',
                    }}>
                      {order.fulfilmentStatus}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    {formatPrice(order.totalMinorUnits, order.currency)}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontSize: '0.6875rem' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        backgroundColor: 'var(--colour-graphite)',
                        color: 'var(--colour-off-white)',
                        borderRadius: 'var(--radius-xs)',
                        textDecoration: 'none',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {page > 1 && (
                <Link
                  href={`/admin/orders?page=${page - 1}&search=${search}&paymentStatus=${paymentStatus || ''}&fulfilmentStatus=${fulfilmentStatus || ''}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)', textDecoration: 'none', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}
                >
                  &larr; Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/orders?page=${page + 1}&search=${search}&paymentStatus=${paymentStatus || ''}&fulfilmentStatus=${fulfilmentStatus || ''}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)', textDecoration: 'none', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
