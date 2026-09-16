import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminOrder } from '@halo-rc/db'
import {
  updateOrderFulfilmentAction,
  updateOrderPaymentAction,
  addOrderNoteAction,
} from '@/actions/admin'
import type { OrderFulfilmentStatus, OrderPaymentStatus } from '@halo-rc/types'

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
  const billingAddr = order.billingAddress as Record<string, string> | null

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
        <Link href="/admin/orders" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          Orders
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--colour-white)' }}>{order.orderReference || order.id}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--colour-graphite)',
              color: 'var(--colour-verified)',
              border: '1px solid var(--colour-verified)',
            }}>
              {order.paymentStatus}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--colour-graphite)',
              color: 'var(--colour-halo)',
            }}>
              {order.fulfilmentStatus}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--colour-graphite)',
              color: 'var(--colour-smoke)',
            }}>
              {order.marketCode} MARKET
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Order {order.orderReference || order.id}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: 'var(--space-1)' }}>
            Placed {new Date(order.createdAt).toLocaleString()} &bull; Customer: {order.userName || 'Guest'} ({order.userEmail || 'No email recorded'})
          </p>
        </div>

        <Link
          href="/admin/orders"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--colour-graphite)',
            border: '1px solid var(--colour-steel)',
            color: 'var(--colour-off-white)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to Orders
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Main: Line Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Order Items Table */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--colour-steel)' }}>
              <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', margin: 0 }}>
                Purchased Line Items ({order.items.length})
              </h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Item</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>SKU</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Qty</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>Unit Price</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-white)', fontWeight: 600 }}>
                      {item.productName}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
                      {item.sku || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-ash)' }}>
                      {formatPrice(item.unitPriceMinorUnits, item.currency)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-white)', fontWeight: 600, textAlign: 'right' }}>
                      {formatPrice(item.lineTotalMinorUnits, item.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
            <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--colour-steel)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-6)', color: 'var(--colour-ash)' }}>
                <span>Subtotal:</span>
                <span>{formatPrice(order.subtotalMinorUnits, order.currency)}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', color: 'var(--colour-ash)' }}>
                <span>Tax ({order.taxMode}):</span>
                <span>{formatPrice(order.taxMinorUnits, order.currency)}</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', color: 'var(--colour-white)', fontWeight: 700, fontSize: 'var(--text-sm)', borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-2)' }}>
                <span>Total:</span>
                <span>{formatPrice(order.totalMinorUnits, order.currency)}</span>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
              Internal Staff Notes
            </h2>

            {order.internalNotes ? (
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-mono)' }}>
                {order.internalNotes}
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', marginBottom: 'var(--space-4)' }}>No internal notes recorded.</p>
            )}

            <form action={handleAddNote}>
              <textarea
                name="note"
                required
                rows={3}
                placeholder="Add dispatch tracking, stock reserve note, or customer support memo..."
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--colour-graphite)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--colour-white)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-sans)',
                  marginBottom: 'var(--space-2)',
                }}
              />
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
                + Append Note
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Fulfilment State Machine */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
              Fulfilment Dispatch
            </h2>

            <form action={handleFulfilmentUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                  State
                </label>
                <select
                  name="fulfilmentStatus"
                  defaultValue={order.fulfilmentStatus}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <option value="UNFULFILLED">Unfulfilled</option>
                  <option value="PROCESSING">Processing (Picking)</option>
                  <option value="PACKED">Packed (Awaiting Courier)</option>
                  <option value="SHIPPED">Shipped (Dispatched)</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                  Dispatch Note / Courier Tracking
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="e.g. DPD Tracking # 12345678"
                  style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--colour-halo)',
                  color: 'var(--colour-void)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Update Fulfilment
              </button>
            </form>
          </div>

          {/* Payment Status State Machine */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
              Payment State
            </h2>

            <form action={handlePaymentUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <select
                name="paymentStatus"
                defaultValue={order.paymentStatus}
                style={{
                  width: '100%',
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--colour-graphite)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--colour-white)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                <option value="PAID">Paid</option>
                <option value="AUTHORIZED">Authorized</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <button
                type="submit"
                style={{
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--colour-graphite)',
                  border: '1px solid var(--colour-steel)',
                  color: 'var(--colour-off-white)',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Update Payment Status
              </button>
            </form>
          </div>

          {/* Shipping & Billing Address */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
              Shipping Address
            </h2>
            {shippingAddr ? (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)' }}>
                {Object.entries(shippingAddr).map(([k, v]) => (
                  <div key={k}>{v}</div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>No shipping address captured.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
