import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminOrder } from '@halo-rc/db'
import {
  updateOrderFulfilmentAction,
  updateOrderPaymentAction,
  addOrderNoteAction,
} from '@/actions/admin'
import type { OrderFulfilmentStatus, OrderPaymentStatus } from '@halo-rc/types'
import {
  AdminPageHeader,
  AdminPanel,
  AdminAction,
  AdminStatus,
  AdminTable,
  AdminTableRow,
  AdminField,
} from '@/components/admin'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

function formatPrice(minorUnits?: number | null, currency?: string | null) {
  if (minorUnits == null || !currency) return '—'
  const symbol = currency === 'USD' ? '$' : '£'
  return `${symbol}${(minorUnits / 100).toFixed(2)}`
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await getAdminOrder(id)

  if (!order) notFound()

  async function handleFulfilmentUpdate(formData: FormData) {
    'use server'
    const status = formData.get('fulfilmentStatus') as OrderFulfilmentStatus
    const note = (formData.get('note') as string) || undefined
    await updateOrderFulfilmentAction(id, status, note)
  }

  async function handlePaymentUpdate(formData: FormData) {
    'use server'
    const status = formData.get('paymentStatus') as OrderPaymentStatus
    await updateOrderPaymentAction(id, status)
  }

  async function handleAddNote(formData: FormData) {
    'use server'
    const note = formData.get('note') as string
    if (note && note.trim()) {
      await addOrderNoteAction(id, note.trim())
    }
  }

  const shippingAddr = order.shippingAddress as Record<string, string> | null

  const itemColumns = [
    { header: 'Item', width: '40%' },
    { header: 'SKU', width: '20%' },
    { header: 'Qty', width: '10%' },
    { header: 'Unit Price', width: '15%' },
    { header: 'Line Total', width: '15%', align: 'right' as const },
  ]

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '32px',
    padding: '0 10px',
    backgroundColor: 'var(--admin-surface, #FFFFFF)',
    border: '1px solid var(--admin-border, #E2E2DE)',
    borderRadius: 'var(--admin-radius-sm, 3px)',
    color: 'var(--admin-text-primary, #111317)',
    fontSize: '0.8125rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Commerce', href: '/admin/orders' },
          { label: 'Orders', href: '/admin/orders' },
          { label: order.orderReference || order.id },
        ]}
        title={`Order ${order.orderReference || order.id.slice(0, 8)}`}
        description={`Placed on ${new Date(order.createdAt).toLocaleString('en-GB')} · Customer: ${order.userName || 'Guest'} (${order.userEmail || 'No email'})`}
        status={
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <AdminStatus status={order.paymentStatus} label={order.paymentStatus} />
            <AdminStatus status={order.fulfilmentStatus} label={order.fulfilmentStatus} />
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.6875rem',
                padding: '2px 5px',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                border: '1px solid var(--admin-border, #E2E2DE)',
                color: 'var(--admin-text-secondary, #494D55)',
              }}
            >
              {order.marketCode} MARKET
            </span>
          </div>
        }
        actions={
          <AdminAction variant="subtle" size="sm" href="/admin/orders">
            &larr; Back to Orders
          </AdminAction>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Main Column: Line Items & Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Order Items Table */}
          <AdminPanel
            title={`Purchased Line Items (${order.items.length})`}
            subtitle="Verified order basket inventory"
            padding="none"
          >
            <AdminTable columns={itemColumns} style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              {order.items.map((item) => (
                <AdminTableRow key={item.id}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
                    {item.productName}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-tertiary, #767A85)' }}>
                    {item.sku || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-secondary, #494D55)' }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-secondary, #494D55)' }}>
                    {formatPrice(item.unitPriceMinorUnits, item.currency)}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--admin-text-primary, #111317)', textAlign: 'right' }}>
                    {formatPrice(item.lineTotalMinorUnits, item.currency)}
                  </td>
                </AdminTableRow>
              ))}
            </AdminTable>

            {/* Financial Summary */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--admin-border, #E2E2DE)',
                backgroundColor: 'var(--admin-surface-subtle, #FAFAF9)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                alignItems: 'flex-end',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              <div style={{ display: 'flex', gap: '24px', color: 'var(--admin-text-secondary, #494D55)' }}>
                <span>Subtotal:</span>
                <span>{formatPrice(order.subtotalMinorUnits, order.currency)}</span>
              </div>
              <div style={{ display: 'flex', gap: '24px', color: 'var(--admin-text-secondary, #494D55)' }}>
                <span>Tax ({order.taxMode}):</span>
                <span>{formatPrice(order.taxMinorUnits, order.currency)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '24px',
                  color: 'var(--admin-text-primary, #111317)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  borderTop: '1px solid var(--admin-border, #E2E2DE)',
                  paddingTop: '6px',
                  marginTop: '4px',
                }}
              >
                <span>Total:</span>
                <span>{formatPrice(order.totalMinorUnits, order.currency)}</span>
              </div>
            </div>
          </AdminPanel>

          {/* Internal Notes */}
          <AdminPanel title="Internal Staff Notes" subtitle="Dispatch and customer operations history" padding="md">
            {order.internalNotes ? (
              <div
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  fontSize: '0.75rem',
                  color: 'var(--admin-text-secondary, #494D55)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  marginBottom: '14px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {order.internalNotes}
              </div>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary, #767A85)', marginBottom: '14px' }}>
                No internal notes recorded.
              </p>
            )}

            <form action={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <textarea
                name="note"
                required
                rows={3}
                placeholder="Add dispatch tracking number, stock reserve note, or customer support memo..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--admin-surface, #FFFFFF)',
                  border: '1px solid var(--admin-border, #E2E2DE)',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  color: 'var(--admin-text-primary, #111317)',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <AdminAction type="submit" variant="secondary" size="sm">
                  + Append Note
                </AdminAction>
              </div>
            </form>
          </AdminPanel>
        </div>

        {/* Sidebar Controls: Fulfilment & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Fulfilment State Machine */}
          <AdminPanel title="Fulfilment Dispatch" subtitle="Warehouse & logistics workflow" padding="md">
            <form action={handleFulfilmentUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                  Dispatch Status
                </label>
                <select name="fulfilmentStatus" defaultValue={order.fulfilmentStatus} style={inputStyle}>
                  <option value="UNFULFILLED">Unfulfilled</option>
                  <option value="PROCESSING">Processing (Picking)</option>
                  <option value="PACKED">Packed (Awaiting Courier)</option>
                  <option value="SHIPPED">Shipped (Dispatched)</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                  Courier Tracking # / Memo
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="e.g. DPD Tracking # 12345678"
                  style={inputStyle}
                />
              </div>

              <AdminAction type="submit" variant="primary" size="sm" style={{ width: '100%' }}>
                Update Fulfilment
              </AdminAction>
            </form>
          </AdminPanel>

          {/* Payment Status State Machine */}
          <AdminPanel title="Payment State" subtitle="Transactional clearance" padding="md">
            <form action={handlePaymentUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select name="paymentStatus" defaultValue={order.paymentStatus} style={inputStyle}>
                <option value="PAID">Paid</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <AdminAction type="submit" variant="secondary" size="sm" style={{ width: '100%' }}>
                Update Payment Status
              </AdminAction>
            </form>
          </AdminPanel>

          {/* Shipping Address */}
          <AdminPanel title="Shipping Address" subtitle="Delivery destination" padding="md">
            {shippingAddr ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)', lineHeight: 1.6 }}>
                {Object.entries(shippingAddr).map(([k, v]) => (
                  <div key={k}>{v}</div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                No shipping address captured.
              </div>
            )}
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
