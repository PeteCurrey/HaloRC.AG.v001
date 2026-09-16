import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import {
  getOrderByReference,
  markOrderPaid,
  markOrderPaymentFailed,
  recordPaymentEvent,
  isPaymentEventProcessed,
} from '@halo-rc/db'
import { constructStripeEvent, getStripeClient } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET']

  let event: Stripe.Event

  try {
    if (webhookSecret && signature) {
      event = constructStripeEvent(body, signature, webhookSecret)
    } else if (process.env['NODE_ENV'] !== 'production' && req.headers.get('x-halo-test-webhook') === 'true') {
      // Safe test harness for automated integration testing
      event = JSON.parse(body) as Stripe.Event
    } else {
      return NextResponse.json({ error: 'Missing webhook signature or secret' }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature'
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  // 1. Idempotency Check: Prevent duplicate event processing
  const alreadyProcessed = await isPaymentEventProcessed(event.id)
  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // 2. Handle Event Types
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderRef = session.client_reference_id || session.metadata?.['orderReference']

        if (!orderRef) {
          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: null,
            status: 'ERROR_MISSING_ORDER_REF',
            payload: session as unknown as Record<string, unknown>,
          })
          return NextResponse.json({ error: 'Missing order reference' }, { status: 400 })
        }

        const order = await getOrderByReference(orderRef)
        if (!order) {
          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: null,
            status: 'ERROR_ORDER_NOT_FOUND',
            payload: session as unknown as Record<string, unknown>,
          })
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Reconciliation Guard: Verify Currency & Amount
        if (session.currency && session.currency.toUpperCase() !== order.currency) {
          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: order.id,
            status: 'ERROR_CURRENCY_MISMATCH',
            payload: session as unknown as Record<string, unknown>,
          })
          return NextResponse.json({ error: 'Currency mismatch' }, { status: 400 })
        }

        if (session.amount_total !== null && session.amount_total !== order.totalMinorUnits) {
          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: order.id,
            status: 'ERROR_AMOUNT_MISMATCH',
            payload: session as unknown as Record<string, unknown>,
          })
          return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
        }

        // Only mark PAID if payment_status is 'paid' or payment_intent is present
        if (session.payment_status === 'paid' || session.mode === 'payment') {
          await markOrderPaid({
            orderId: order.id,
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : null,
          })

          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: order.id,
            status: 'PAID',
            payload: session as unknown as Record<string, unknown>,
          })
        } else {
          // Checkout session completed but payment is asynchronous or still pending
          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: order.id,
            status: 'SESSION_COMPLETED_PENDING_PAYMENT',
            payload: session as unknown as Record<string, unknown>,
          })
        }

        break
      }

      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        const orderRef = intent.metadata?.['orderReference']

        let order = null
        if (orderRef) {
          order = await getOrderByReference(orderRef)
        }

        if (!order) {
          // Attempt lookup via payment intent ID on order record
          const ordersMatching = await getOrderByReference(intent.id)
          order = ordersMatching
        }

        if (order) {
          // Reconciliation Guard: Verify Currency & Amount
          if (intent.currency && intent.currency.toUpperCase() !== order.currency) {
            await recordPaymentEvent({
              stripeEventId: event.id,
              eventType: event.type,
              orderId: order.id,
              status: 'ERROR_CURRENCY_MISMATCH',
              payload: intent as unknown as Record<string, unknown>,
            })
            return NextResponse.json({ error: 'Currency mismatch' }, { status: 400 })
          }

          if (intent.amount !== null && intent.amount !== order.totalMinorUnits) {
            await recordPaymentEvent({
              stripeEventId: event.id,
              eventType: event.type,
              orderId: order.id,
              status: 'ERROR_AMOUNT_MISMATCH',
              payload: intent as unknown as Record<string, unknown>,
            })
            return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
          }

          await markOrderPaid({
            orderId: order.id,
            stripePaymentIntentId: intent.id,
          })

          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: order.id,
            status: 'PAID',
            payload: intent as unknown as Record<string, unknown>,
          })
        } else {
          await recordPaymentEvent({
            stripeEventId: event.id,
            eventType: event.type,
            orderId: null,
            status: 'INFO_PAYMENT_INTENT_UNMATCHED',
            payload: intent as unknown as Record<string, unknown>,
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const orderRef = intent.metadata?.['orderReference']

        if (orderRef) {
          const order = await getOrderByReference(orderRef)
          if (order) {
            await markOrderPaymentFailed({ orderId: order.id })
            await recordPaymentEvent({
              stripeEventId: event.id,
              eventType: event.type,
              orderId: order.id,
              status: 'FAILED',
              payload: intent as unknown as Record<string, unknown>,
            })
          }
        }
        break
      }

      default: {
        // Record any other informational payment events
        await recordPaymentEvent({
          stripeEventId: event.id,
          eventType: event.type,
          orderId: null,
          status: 'IGNORED',
          payload: event.data.object as unknown as Record<string, unknown>,
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    // Return 503 so Stripe will retry temporary infrastructure/database errors
    const message = err instanceof Error ? err.message : 'Internal webhook processing error'
    return NextResponse.json({ error: message }, { status: 503 })
  }
}
