import Link from 'next/link'
import { getAdminOrders, getAdminOrderStats } from '@halo-rc/db'
import type { OrderPaymentStatus, OrderFulfilmentStatus } from '@halo-rc/types'
import {
  AdminPageHeader,
  AdminPanel,
  AdminToolbar,
  AdminSearch,
  AdminFilter,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminPagination,
  AdminAction,
} from '@/components/admin'

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

  const columns = [
    { header: 'Order Ref', width: '14%' },
    { header: 'Customer', width: '22%' },
    { header: 'Market', width: '8%' },
    { header: 'Items', width: '6%' },
    { header: 'Payment', width: '12%' },
    { header: 'Fulfilment', width: '14%' },
    { header: 'Total', width: '10%' },
    { header: 'Date', width: '8%' },
    { header: 'Actions', width: '6%', align: 'right' as const },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        category="Commerce Ledger & Fulfilment"
        title="Customer Orders & Dispatch"
        description="Authoritative order states, market taxation records, and warehouse dispatch logs."
      />

      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Total Orders
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.totalOrders}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Paid &amp; Cleared
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-dot-online, #1A6E34)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.paidOrders}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Pending Fulfilment
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.pendingFulfilment > 0 ? 'var(--admin-accent, #B8935A)' : 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.pendingFulfilment}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Unfulfilled
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.unfulfilledOrders > 0 ? 'var(--admin-dot-warning, #B86818)' : 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.unfulfilledOrders}
          </div>
        </AdminPanel>
      </div>

      {/* Filter Bar */}
      <form method="get">
        <AdminToolbar
          rightActions={
            (search || paymentStatus || fulfilmentStatus) && (
              <AdminAction variant="ghost" size="sm" href="/admin/orders">
                Clear
              </AdminAction>
            )
          }
        >
          <AdminSearch
            name="search"
            defaultValue={search}
            placeholder="Search by order ref, email, or name..."
            width={280}
          />

          <AdminFilter name="paymentStatus" defaultValue={paymentStatus || ''}>
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="AUTHORIZED">Authorized</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </AdminFilter>

          <AdminFilter name="fulfilmentStatus" defaultValue={fulfilmentStatus || ''}>
            <option value="">All Fulfilment Statuses</option>
            <option value="UNFULFILLED">Unfulfilled</option>
            <option value="PROCESSING">Processing</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </AdminFilter>

          <button
            type="submit"
            style={{
              height: '30px',
              padding: '0 12px',
              backgroundColor: 'var(--admin-surface, #FFFFFF)',
              border: '1px solid var(--admin-border, #E2E2DE)',
              borderRadius: 'var(--admin-radius-sm, 3px)',
              color: 'var(--admin-text-primary, #111317)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Filter
          </button>
        </AdminToolbar>
      </form>

      {/* Table */}
      <AdminTable columns={columns} emptyMessage="No orders in the ledger.">
        {items.map((order) => (
          <AdminTableRow key={order.id}>
            <td style={{ padding: '10px 14px' }}>
              <Link
                href={`/admin/orders/${order.id}`}
                style={{
                  color: 'var(--admin-text-primary, #111317)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.8125rem',
                }}
              >
                {order.orderReference || order.id.slice(0, 8)}
              </Link>
            </td>

            <td style={{ padding: '10px 14px' }}>
              <div style={{ color: 'var(--admin-text-primary, #111317)', fontWeight: 500 }}>
                {order.userName || 'Guest User'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                {order.userEmail || '—'}
              </div>
            </td>

            <td style={{ padding: '10px 14px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.6875rem',
                  padding: '2px 5px',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                  color: 'var(--admin-text-primary, #111317)',
                  border: '1px solid var(--admin-border, #E2E2DE)',
                }}
              >
                {order.marketCode}
              </span>
            </td>

            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-secondary, #494D55)' }}>
              {order.itemCount}
            </td>

            <td style={{ padding: '10px 14px' }}>
              <AdminStatus
                status={order.paymentStatus}
                label={order.paymentStatus.replace('_', ' ')}
              />
            </td>

            <td style={{ padding: '10px 14px' }}>
              <AdminStatus
                status={order.fulfilmentStatus}
                label={order.fulfilmentStatus}
              />
            </td>

            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
              {formatPrice(order.totalMinorUnits, order.currency)}
            </td>

            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-tertiary, #767A85)', fontSize: '0.6875rem' }}>
              {new Date(order.createdAt).toLocaleDateString('en-GB')}
            </td>

            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
              <AdminAction
                variant="subtle"
                size="sm"
                href={`/admin/orders/${order.id}`}
              >
                View &rarr;
              </AdminAction>
            </td>
          </AdminTableRow>
        ))}
      </AdminTable>

      {/* Pagination */}
      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        createPageUrl={(p) =>
          `/admin/orders?page=${p}&search=${search}&paymentStatus=${paymentStatus || ''}&fulfilmentStatus=${fulfilmentStatus || ''}`
        }
      />
    </div>
  )
}
