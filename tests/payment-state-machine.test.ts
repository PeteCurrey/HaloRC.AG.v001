// tests/payment-state-machine.test.ts
// Phase 31 & 32: Authoritative Order Payment State Machine & Stripe Webhook Integration Test Suite.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateBasket,
  addToBasket,
  createCheckoutSnapshot,
  createPendingOrder,
  getOrderById,
  getOrderByReference,
  markOrderPaid,
  markOrderPaymentFailed,
  cancelOrder,
  retryOrderPayment,
  recordPaymentEvent,
  isPaymentEventProcessed,
  __resetCommerceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetCommerceStoreForTesting()
})

async function createTestOrder(userId = 'user-psm-001', customProps?: { sessionId?: string }) {
  const basket = await getOrCreateBasket({ basketId: null, userId, marketCode: 'UK' })
  await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
  const snapshot = await createCheckoutSnapshot(basket.id, userId)
  const order = await createPendingOrder(snapshot, userId, {
    stripeSessionId: customProps?.sessionId ?? `cs_test_${crypto.randomUUID()}`,
  })
  return order
}

describe('Phase 32 — Authoritative Payment State Machine', () => {
  describe('Initial State', () => {
    it('initial order payment status is strictly PENDING_PAYMENT', async () => {
      const order = await createTestOrder()
      expect(order.paymentStatus).toBe('PENDING_PAYMENT')
    })
  })

  describe('Permitted Transition: PENDING_PAYMENT → PAID', () => {
    it('transitions to PAID via markOrderPaid with Stripe session ID', async () => {
      const order = await createTestOrder()
      const paid = await markOrderPaid({
        orderId: order.id,
        stripePaymentIntentId: 'pi_test_valid_001',
      })
      expect(paid.paymentStatus).toBe('PAID')
      expect(paid.stripePaymentIntentId).toBe('pi_test_valid_001')

      const fetched = await getOrderById(order.id, order.userId)
      expect(fetched?.paymentStatus).toBe('PAID')
    })
  })

  describe('Permitted Transition: PENDING_PAYMENT → PAYMENT_FAILED', () => {
    it('transitions to PAYMENT_FAILED via markOrderPaymentFailed', async () => {
      const order = await createTestOrder()
      const failed = await markOrderPaymentFailed({ orderId: order.id })
      expect(failed.paymentStatus).toBe('PAYMENT_FAILED')

      const fetched = await getOrderById(order.id, order.userId)
      expect(fetched?.paymentStatus).toBe('PAYMENT_FAILED')
    })
  })

  describe('Permitted Transition: PAYMENT_FAILED → PENDING_PAYMENT (Retry)', () => {
    it('allows retry transition from PAYMENT_FAILED back to PENDING_PAYMENT', async () => {
      const order = await createTestOrder()
      await markOrderPaymentFailed({ orderId: order.id })

      const retried = await retryOrderPayment({
        orderId: order.id,
        newStripeSessionId: 'cs_test_retry_002',
      })
      expect(retried.paymentStatus).toBe('PENDING_PAYMENT')
      expect(retried.stripeCheckoutSessionId).toBe('cs_test_retry_002')
    })

    it('rejects retry transition if order is NOT in PAYMENT_FAILED state', async () => {
      const order = await createTestOrder()
      await expect(retryOrderPayment({ orderId: order.id })).rejects.toThrow(/must be PAYMENT_FAILED/)
    })
  })

  describe('Permitted Transition: Cancellation (Terminal)', () => {
    it('transitions PENDING_PAYMENT → PAYMENT_CANCELLED', async () => {
      const order = await createTestOrder()
      const cancelled = await cancelOrder({ orderId: order.id, reason: 'Customer requested cancellation' })
      expect(cancelled.paymentStatus).toBe('PAYMENT_CANCELLED')
    })

    it('transitions PAYMENT_FAILED → PAYMENT_CANCELLED', async () => {
      const order = await createTestOrder()
      await markOrderPaymentFailed({ orderId: order.id })
      const cancelled = await cancelOrder({ orderId: order.id, reason: 'Session expired after failure' })
      expect(cancelled.paymentStatus).toBe('PAYMENT_CANCELLED')
    })
  })

  describe('Terminal State Protection: PAID cannot regress', () => {
    it('PAID → PAYMENT_FAILED is strictly prevented (late webhook failure ignored)', async () => {
      const order = await createTestOrder()
      await markOrderPaid({ orderId: order.id, stripePaymentIntentId: 'pi_test_terminal_001' })

      const result = await markOrderPaymentFailed({ orderId: order.id })
      expect(result.paymentStatus).toBe('PAID')

      const fetched = await getOrderById(order.id, order.userId)
      expect(fetched?.paymentStatus).toBe('PAID')
    })

    it('PAID → PAYMENT_CANCELLED is strictly prohibited', async () => {
      const order = await createTestOrder()
      await markOrderPaid({ orderId: order.id })

      await expect(cancelOrder({ orderId: order.id })).rejects.toThrow(/Cannot cancel an already PAID order/)
    })
  })

  describe('Terminal State Protection: PAYMENT_CANCELLED cannot be paid', () => {
    it('PAYMENT_CANCELLED → PAID is rejected', async () => {
      const order = await createTestOrder()
      await cancelOrder({ orderId: order.id })

      await expect(markOrderPaid({ orderId: order.id })).rejects.toThrow(/Cannot mark cancelled order .* as PAID/)
    })
  })
})

describe('Phase 31 — Webhook Idempotency & Replay Safety', () => {
  it('records a new payment event and tracks it as processed', async () => {
    const eventId = 'evt_test_unique_001'
    expect(await isPaymentEventProcessed(eventId)).toBe(false)

    await recordPaymentEvent({
      stripeEventId: eventId,
      eventType: 'checkout.session.completed',
      orderId: 'ord-test-001',
      status: 'PAID',
      payload: { test: true },
    })

    expect(await isPaymentEventProcessed(eventId)).toBe(true)
  })

  it('repeated event recording is idempotent and does not create duplicates', async () => {
    const eventId = 'evt_test_replay_002'

    const first = await recordPaymentEvent({
      stripeEventId: eventId,
      eventType: 'payment_intent.succeeded',
      orderId: 'ord-test-002',
      status: 'PAID',
      payload: { id: eventId },
    })

    const second = await recordPaymentEvent({
      stripeEventId: eventId,
      eventType: 'payment_intent.succeeded',
      orderId: 'ord-test-002',
      status: 'PAID',
      payload: { id: eventId },
    })

    expect(first.id).toBe(second.id)
  })

  it('repeated markOrderPaid calls are idempotent and return current order', async () => {
    const order = await createTestOrder()
    const firstPaid = await markOrderPaid({
      orderId: order.id,
      stripePaymentIntentId: 'pi_test_dup_001',
    })
    expect(firstPaid.paymentStatus).toBe('PAID')

    const secondPaid = await markOrderPaid({
      orderId: order.id,
      stripePaymentIntentId: 'pi_test_dup_001',
    })
    expect(secondPaid.paymentStatus).toBe('PAID')
  })
})

describe('Price Immutability & Fulfilment Independence', () => {
  it('order pricing remains completely unchanged after payment', async () => {
    const order = await createTestOrder()
    const initialTotal = order.totalMinorUnits

    const paid = await markOrderPaid({ orderId: order.id, stripePaymentIntentId: 'pi_immut_001' })
    expect(paid.totalMinorUnits).toBe(initialTotal)
  })

  it('payment status transitions do NOT alter fulfilment status', async () => {
    const order = await createTestOrder()
    const initialFulfilment = order.fulfilmentStatus

    const paid = await markOrderPaid({ orderId: order.id, stripePaymentIntentId: 'pi_fulfil_001' })
    expect(paid.fulfilmentStatus).toBe(initialFulfilment)
  })
})
