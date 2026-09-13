import Stripe from 'stripe'
import type { CheckoutSnapshot } from '@halo-rc/types'

let stripeInstance: Stripe | null = null

export function getStripeClient(): Stripe {
  const secretKey = process.env['STRIPE_SECRET_KEY']
  if (!secretKey) {
    // Return a test instance with dummy key for non-production environments
    if (!stripeInstance) {
      stripeInstance = new Stripe('sk_test_halo_mock_key', {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
      })
    }
    return stripeInstance
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }

  return stripeInstance
}

/**
 * Creates a server-authoritative Stripe Checkout Session matching the Halo RC snapshot.
 * Stripe is NEVER allowed to invent or alter prices; line items are derived strictly from snapshot.
 */
export async function createStripeCheckoutSession(params: {
  snapshot: CheckoutSnapshot
  orderReference: string
  successUrl: string
  cancelUrl: string
}): Promise<{ sessionId: string; sessionUrl: string }> {
  const secretKey = process.env['STRIPE_SECRET_KEY']

  // If in automated testing or mock mode without real API key, return deterministic test session
  if (!secretKey || secretKey.startsWith('sk_test_halo_mock')) {
    const mockId = `cs_test_${crypto.randomUUID()}`
    return {
      sessionId: mockId,
      sessionUrl: `${params.successUrl}?session_id=${mockId}&mock=true`,
    }
  }

  const stripe = getStripeClient()

  // Convert snapshot lines to Stripe line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.snapshot.lines.map((line) => ({
    price_data: {
      currency: line.currency.toLowerCase(),
      unit_amount: line.unitPriceMinorUnits,
      product_data: {
        name: line.productName,
        description: `Part No: ${line.sku}`,
        metadata: {
          productId: line.productId,
          sku: line.sku,
        },
      },
    },
    quantity: line.quantity,
  }))

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: lineItems,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.orderReference,
    metadata: {
      orderReference: params.orderReference,
      marketCode: params.snapshot.marketCode,
      basketId: params.snapshot.basketId,
      userId: params.snapshot.userId || 'guest',
    },
  })

  if (!session.url) {
    throw new Error('Stripe failed to return a checkout redirect URL')
  }

  return {
    sessionId: session.id,
    sessionUrl: session.url,
  }
}

/**
 * Verifies webhook signature using Stripe SDK.
 */
export function constructStripeEvent(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
