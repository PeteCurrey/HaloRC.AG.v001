'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { MarketCode, ConfiguredBuild } from '@halo-rc/types'
import {
  getOrCreateBasket,
  getBasket,
  addToBasket,
  updateBasketItemQuantity,
  clearBasket,
  detectBasketPriceChanges,
  createCheckoutSnapshot,
  createPendingOrder,
  associateOrderItemWithGarageVehicle,
  resolveBuildConfiguration,
  getHaloBuildById,
  getHaloBuildVersion,
  resolveCurrentBuildPricing,
} from '@halo-rc/db'
import { getSessionUser } from '@/lib/auth'
import { createStripeCheckoutSession } from '@/lib/stripe'

const BASKET_COOKIE = 'halo_basket_id'
const MARKET_COOKIE = 'halo_market'

/**
 * Helper to get the active market code from cookie, defaulting to UK.
 */
async function getActiveMarket(): Promise<MarketCode> {
  const cookieStore = await cookies()
  const marketCookie = cookieStore.get(MARKET_COOKIE)
  if (marketCookie?.value === 'US' || marketCookie?.value === 'UK') {
    return marketCookie.value as MarketCode
  }
  return 'UK'
}

/**
 * Helper to get or initialize customer's active basket.
 */
export async function getActiveBasket() {
  const cookieStore = await cookies()
  const basketId = cookieStore.get(BASKET_COOKIE)?.value || null
  const marketCode = await getActiveMarket()
  const user = await getSessionUser()

  const basket = await getOrCreateBasket({
    basketId,
    userId: user?.id ?? null,
    marketCode,
  })

  // Ensure cookie is set
  if (cookieStore.get(BASKET_COOKIE)?.value !== basket.id) {
    cookieStore.set(BASKET_COOKIE, basket.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: process.env['NODE_ENV'] === 'production',
    })
  }

  return basket
}

/**
 * Add a catalogue product to the basket.
 * Server resolves target market and authoritative price independently.
 */
export async function addToCartAction(formData: FormData): Promise<never> {
  const productId = formData.get('productId') as string | null
  const variantId = (formData.get('variantId') as string | null) || null
  const quantity = parseInt(formData.get('quantity') as string, 10) || 1

  if (!productId) {
    redirect('/cart?error=' + encodeURIComponent('Product ID is required'))
  }

  const basket = await getActiveBasket()

  try {
    await addToBasket(basket.id, {
      productId,
      variantId,
      quantity,
      marketCode: basket.marketCode,
    })
    redirect('/cart')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to add item to basket'
    redirect('/cart?error=' + encodeURIComponent(msg))
  }
}

/**
 * Update item quantity in basket.
 */
export async function updateCartQuantityAction(formData: FormData): Promise<never> {
  const itemId = formData.get('itemId') as string | null
  const quantity = parseInt(formData.get('quantity') as string, 10)

  if (!itemId || isNaN(quantity)) {
    redirect('/cart?error=' + encodeURIComponent('Invalid item or quantity'))
  }

  const basket = await getActiveBasket()
  await updateBasketItemQuantity(basket.id, itemId, quantity)
  redirect('/cart')
}

/**
 * Remove an item from the basket.
 */
export async function removeFromCartAction(formData: FormData): Promise<never> {
  const itemId = formData.get('itemId') as string | null
  if (!itemId) {
    redirect('/cart')
  }

  const basket = await getActiveBasket()
  await updateBasketItemQuantity(basket.id, itemId, 0)
  redirect('/cart')
}

/**
 * Clear all items from the basket.
 */
export async function clearCartAction(): Promise<never> {
  const basket = await getActiveBasket()
  await clearBasket(basket.id)
  redirect('/cart')
}

/**
 * Add a complete validated Build My Rig configuration to the basket.
 * Revalidates the build before adding components to guard against stale state.
 */
export async function addBuildToCartAction(formData: FormData): Promise<never> {
  const machineId = formData.get('machineId') as string | null
  const componentsJson = formData.get('components') as string | null
  const selectedComponents = componentsJson ? JSON.parse(componentsJson) : {}

  if (!machineId) {
    redirect('/build?error=' + encodeURIComponent('Machine ID is required'))
  }

  const basket = await getActiveBasket()

  // 1. Re-validate build with current live catalogue rules
  const liveBuild: ConfiguredBuild = await resolveBuildConfiguration({
    machineId,
    marketCode: basket.marketCode,
    selectedComponents,
  })

  if (liveBuild.status === 'INVALID' || !liveBuild.machine) {
    redirect(
      '/build?error=' +
        encodeURIComponent('Build configuration is invalid or has incompatible components.')
    )
  }

  // 2. Add base machine to basket
  try {
    await addToBasket(basket.id, {
      productId: liveBuild.machine!.id,
      quantity: 1,
      marketCode: basket.marketCode,
    })

    // 3. Add each selected component
    for (const slot of liveBuild.slots) {
      if (slot.selectedProduct && slot.selectedProduct.offer) {
        await addToBasket(basket.id, {
          productId: slot.selectedProduct.id,
          quantity: 1,
          marketCode: basket.marketCode,
        })
      }
    }

    redirect('/cart')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to add build to basket'
    redirect('/build?error=' + encodeURIComponent(msg))
  }
}

/**
 * Initiate Stripe Checkout from basket.
 * Enforces authenticated user, price-change checks, and snapshot generation.
 */
export async function initiateCheckoutAction(formData?: FormData): Promise<never> {
  const user = await getSessionUser()
  if (!user) {
    // Authenticated checkout mandate
    redirect('/auth/sign-in?next=' + encodeURIComponent('/checkout'))
  }

  const basket = await getActiveBasket()
  if (basket.items.length === 0) {
    redirect('/cart?error=' + encodeURIComponent('Basket is empty'))
  }

  const shippingMethodId = formData ? (formData.get('shippingMethodId') as string | null) : null

  // 1. Detect stale prices
  const priceCheck = await detectBasketPriceChanges(basket.id)
  if (priceCheck.hasChanges) {
    redirect(
      '/cart?error=' +
        encodeURIComponent(
          'One or more item prices have changed. Please review your updated totals before proceeding.'
        )
    )
  }

  // 2. Create authoritative checkout snapshot
  const snapshot = await createCheckoutSnapshot(basket.id, user.id, shippingMethodId)

  // 3. Determine base URL
  const headerList = await headers()
  const host = headerList.get('host') || 'localhost:3000'
  const protocol = process.env['NODE_ENV'] === 'production' ? 'https' : 'http'
  const origin = `${protocol}://${host}`

  // 4. Create pending order
  const order = await createPendingOrder(snapshot, user.id)

  // 5. Create Stripe Checkout Session
  const session = await createStripeCheckoutSession({
    snapshot,
    orderReference: order.orderReference,
    successUrl: `${origin}/checkout/success?order_ref=${order.orderReference}&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${origin}/checkout/cancel?order_ref=${order.orderReference}`,
  })

  // 6. Clear basket on successful session creation
  await clearBasket(basket.id)

  // 7. Redirect to Stripe
  redirect(session.sessionUrl)
}

/**
 * Associate a purchased order item with a customer's garage vehicle.
 */
export async function associateOrderWithGarageAction(formData: FormData): Promise<never> {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const orderItemId = formData.get('orderItemId') as string
  const vehicleId = formData.get('vehicleId') as string
  const orderId = formData.get('orderId') as string

  if (!orderItemId || !vehicleId || !orderId) {
    redirect('/account/orders?error=' + encodeURIComponent('Missing parameters for vehicle association'))
  }

  await associateOrderItemWithGarageVehicle(user.id, orderItemId, vehicleId)
  redirect(`/account/orders/${orderId}?success=associated`)
}

/**
 * Add a complete engineered Halo Build to the customer's basket.
 * Strictly resolves current market offers and validates availability.
 * If any component is unavailable in the active market, the purchase halts with a clear notice.
 */
export async function addHaloBuildToCartAction(formData: FormData): Promise<never> {
  const buildId = formData.get('buildId') as string | null
  const version = (formData.get('version') as string | null) || '1.0'

  if (!buildId) {
    redirect('/race?error=' + encodeURIComponent('Build ID is required.'))
  }

  const basket = await getActiveBasket()
  const build = await getHaloBuildById(buildId)

  if (!build || build.status !== 'PUBLISHED') {
    redirect('/race?error=' + encodeURIComponent('Halo Build is not available.'))
  }

  const buildVersion = await getHaloBuildVersion(buildId, version)
  if (!buildVersion || buildVersion.status !== 'PUBLISHED') {
    redirect(`/race/${build.slug}?error=` + encodeURIComponent(`Version ${version} is not published.`))
  }

  // Authoritatively verify pricing and market availability
  const pricing = resolveCurrentBuildPricing(build, basket.marketCode)

  if (!pricing.isPurchasable) {
    redirect(
      `/race/${build.slug}?error=` +
        encodeURIComponent(
          `This configuration cannot be purchased complete in the ${basket.marketCode} market (${pricing.unavailableCount} items unavailable or requiring review).`
        )
    )
  }

  // Add all verified components to the basket with build provenance
  for (const comp of buildVersion.components) {
    await addToBasket(basket.id, {
      productId: comp.productId,
      quantity: 1,
      marketCode: basket.marketCode,
      buildProvenance: {
        buildId: build.id,
        buildVersion: version,
        buildSlug: build.slug,
        buildRole: comp.role,
      },
    })
  }

  redirect('/cart')
}

