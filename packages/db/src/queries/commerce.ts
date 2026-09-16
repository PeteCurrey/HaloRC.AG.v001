import type {
  MarketCode,
  Currency,
  TaxMode,
  TaxDisplayMode,
  BasketStatus,
  OrderPaymentStatus,
  BasketRecord,
  BasketItemRecord,
  CheckoutLineSnapshot,
  CheckoutSnapshot,
  OrderRecord,
  OrderItemRecord,
  PaymentEventRecord,
  AddToBasketInput,
  AvailabilityStatus,
} from '@halo-rc/types'
import {
  STORE_PRODUCTS as SEED_PRODUCTS,
  STORE_VARIANTS as SEED_VARIANTS,
  STORE_OFFERS as SEED_OFFERS,
} from './catalogue-store'
import { db, isDbConfigured } from '../client'
import { orders, orderItems } from '../schema'
import { eq, and, desc } from 'drizzle-orm'
import { getMarketConfig, getShippingMethodsForMarket } from './markets'

// ── In-Memory Database Stores ──────────────────────────────────────────────────

interface DbBasketItem {
  id: string
  basketId: string
  productId: string
  variantId: string | null
  marketOfferId: string | null
  sku: string
  productName: string
  quantity: number
  unitPriceMinorUnits: number
  currency: Currency
  taxMode: TaxMode
  availability: AvailabilityStatus
  imageUrl: string | null
  buildId?: string | null
  buildVersion?: string | null
  buildSlug?: string | null
  buildRole?: string | null
  createdAt: string
  updatedAt: string
}

interface DbBasket {
  id: string
  userId: string | null
  marketCode: MarketCode
  currency: Currency
  status: BasketStatus
  createdAt: string
  updatedAt: string
}

interface DbOrderItem {
  id: string
  orderId: string
  productId: string | null
  variantId: string | null
  marketOfferId: string | null
  sku: string
  productName: string
  quantity: number
  unitPriceMinorUnits: number
  taxMinorUnits: number
  lineTotalMinorUnits: number
  currency: Currency
  taxMode: TaxMode
  snapshot: CheckoutLineSnapshot
  garageVehicleId: string | null
}

interface DbOrder {
  id: string
  orderReference: string
  userId: string | null
  marketCode: MarketCode
  currency: Currency
  taxMode: TaxMode
  taxDisplayMode?: TaxDisplayMode
  paymentStatus: OrderPaymentStatus
  subtotalMinorUnits: number
  taxMinorUnits: number
  totalMinorUnits: number
  shippingMethodId?: string | null
  shippingCostMinorUnits?: number
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  buildId?: string | null
  buildVersion?: string | null
  createdAt: string
  updatedAt: string
}

interface DbPaymentEvent {
  id: string
  stripeEventId: string
  eventType: string
  orderId: string | null
  status: string
  payload: Record<string, unknown>
  createdAt: string
}

// Initial Fixtures
let BASKETS: DbBasket[] = []
let BASKET_ITEMS: DbBasketItem[] = []
let ORDERS: DbOrder[] = [
  {
    id: 'ord-customer-001',
    orderReference: 'HALO-2026-X488',
    userId: 'usr-customer',
    marketCode: 'UK',
    currency: 'GBP',
    taxMode: 'INCLUSIVE',
    taxDisplayMode: 'TAX_INCLUDED',
    paymentStatus: 'PAID',
    subtotalMinorUnits: 72900,
    taxMinorUnits: 12150,
    totalMinorUnits: 72900,
    shippingMethodId: 'ship-uk-std',
    shippingCostMinorUnits: 0,
    stripeCheckoutSessionId: 'cs_test_initial_001',
    stripePaymentIntentId: 'pi_test_initial_001',
    createdAt: '2026-01-15T12:00:00Z',
    updatedAt: '2026-01-15T12:05:00Z',
  },
  {
    id: 'ord-adversary-001',
    orderReference: 'HALO-2026-ADV9',
    userId: 'usr-adversary',
    marketCode: 'US',
    currency: 'USD',
    taxMode: 'EXCLUSIVE',
    taxDisplayMode: 'TAX_EXCLUDED',
    paymentStatus: 'PAID',
    subtotalMinorUnits: 114900,
    taxMinorUnits: 0,
    totalMinorUnits: 114900,
    shippingMethodId: 'ship-us-std',
    shippingCostMinorUnits: 0,
    stripeCheckoutSessionId: 'cs_test_adversary_001',
    stripePaymentIntentId: 'pi_test_adversary_001',
    createdAt: '2026-02-10T14:00:00Z',
    updatedAt: '2026-02-10T14:05:00Z',
  },
]

let ORDER_ITEMS: DbOrderItem[] = [
  {
    id: 'item-ord-001',
    orderId: 'ord-customer-001',
    productId: 'prod-xray-x4-2026',
    variantId: 'var-xray-x4-2026-kit',
    marketOfferId: 'offer-xray-x4-uk',
    sku: 'XRAY-300040',
    productName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
    quantity: 1,
    unitPriceMinorUnits: 72900,
    taxMinorUnits: 12150,
    lineTotalMinorUnits: 72900,
    currency: 'GBP',
    taxMode: 'INCLUSIVE',
    snapshot: {
      productId: 'prod-xray-x4-2026',
      variantId: 'var-xray-x4-2026-kit',
      marketOfferId: 'offer-xray-x4-uk',
      sku: 'XRAY-300040',
      productName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      quantity: 1,
      unitPriceMinorUnits: 72900,
      lineTotalMinorUnits: 72900,
      currency: 'GBP',
      taxMode: 'INCLUSIVE',
      lifecycleAtCheckout: 'ACTIVE',
    },
    garageVehicleId: 'veh-x4-customer',
  },
  {
    id: 'item-ord-adv-001',
    orderId: 'ord-adversary-001',
    productId: 'prod-traxxas-xmaxx-8s',
    variantId: 'var-xmaxx-8s-red',
    marketOfferId: 'offer-xmaxx-us',
    sku: 'TRX-77086-4',
    productName: 'Traxxas X-Maxx 8S Brushless Monster Truck',
    quantity: 1,
    unitPriceMinorUnits: 114900,
    taxMinorUnits: 0,
    lineTotalMinorUnits: 114900,
    currency: 'USD',
    taxMode: 'EXCLUSIVE',
    snapshot: {
      productId: 'prod-traxxas-xmaxx-8s',
      variantId: 'var-xmaxx-8s-red',
      marketOfferId: 'offer-xmaxx-us',
      sku: 'TRX-77086-4',
      productName: 'Traxxas X-Maxx 8S Brushless Monster Truck',
      quantity: 1,
      unitPriceMinorUnits: 114900,
      lineTotalMinorUnits: 114900,
      currency: 'USD',
      taxMode: 'EXCLUSIVE',
      lifecycleAtCheckout: 'ACTIVE',
    },
    garageVehicleId: null,
  },
]

let PAYMENT_EVENTS: DbPaymentEvent[] = []

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateOrderReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let random = ''
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `HALO-${new Date().getFullYear()}-${random}`
}

function resolveMarketCurrency(marketCode: MarketCode): Currency {
  return marketCode === 'UK' ? 'GBP' : 'USD'
}

function resolveMarketTaxMode(marketCode: MarketCode): TaxMode {
  return marketCode === 'UK' ? 'INCLUSIVE' : 'EXCLUSIVE'
}

function enrichBasket(basket: DbBasket): BasketRecord {
  const items = BASKET_ITEMS.filter((i) => i.basketId === basket.id)
  const enrichedItems: BasketItemRecord[] = items.map((item) => ({
    id: item.id,
    basketId: item.basketId,
    productId: item.productId,
    variantId: item.variantId,
    marketOfferId: item.marketOfferId,
    sku: item.sku,
    productName: item.productName,
    quantity: item.quantity,
    unitPriceMinorUnits: item.unitPriceMinorUnits,
    currency: item.currency,
    taxMode: item.taxMode,
    availability: item.availability,
    imageUrl: item.imageUrl,
    buildId: item.buildId ?? null,
    buildVersion: item.buildVersion ?? null,
    buildSlug: item.buildSlug ?? null,
    buildRole: item.buildRole ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))

  const subtotal = enrichedItems.reduce(
    (sum, item) => sum + item.unitPriceMinorUnits * item.quantity,
    0
  )
  const tax = basket.marketCode === 'UK' ? Math.round((subtotal * 20) / 120) : 0
  const total = subtotal

  return {
    id: basket.id,
    userId: basket.userId,
    marketCode: basket.marketCode,
    currency: basket.currency,
    status: basket.status,
    items: enrichedItems,
    subtotalMinorUnits: subtotal,
    taxMinorUnits: tax,
    totalMinorUnits: total,
    createdAt: basket.createdAt,
    updatedAt: basket.updatedAt,
  }
}

function enrichOrder(order: DbOrder): OrderRecord {
  const items = ORDER_ITEMS.filter((i) => i.orderId === order.id).map((item) => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    variantId: item.variantId,
    marketOfferId: item.marketOfferId,
    sku: item.sku,
    productName: item.productName,
    quantity: item.quantity,
    unitPriceMinorUnits: item.unitPriceMinorUnits,
    taxMinorUnits: item.taxMinorUnits,
    lineTotalMinorUnits: item.lineTotalMinorUnits,
    currency: item.currency,
    taxMode: item.taxMode,
    snapshot: item.snapshot,
    garageVehicleId: item.garageVehicleId,
  }))

  return {
    id: order.id,
    orderReference: order.orderReference,
    userId: order.userId,
    marketCode: order.marketCode,
    currency: order.currency,
    taxMode: order.taxMode,
    taxDisplayMode: order.taxDisplayMode ?? null,
    paymentStatus: order.paymentStatus,
    subtotalMinorUnits: order.subtotalMinorUnits,
    taxMinorUnits: order.taxMinorUnits,
    totalMinorUnits: order.totalMinorUnits,
    shippingMethodId: order.shippingMethodId ?? null,
    shippingCostMinorUnits: order.shippingCostMinorUnits ?? 0,
    stripeCheckoutSessionId: order.stripeCheckoutSessionId,
    stripePaymentIntentId: order.stripePaymentIntentId,
    buildId: order.buildId ?? null,
    buildVersion: order.buildVersion ?? null,
    items,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

function mapDbOrderToRecord(
  orderRow: typeof orders.$inferSelect,
  itemRows: (typeof orderItems.$inferSelect)[]
): OrderRecord {
  const items: OrderItemRecord[] = itemRows.map((item) => ({
    id: item.id,
    orderId: item.orderId,
    productId: item.productId,
    variantId: item.productVariantId,
    marketOfferId: item.marketOfferId,
    sku: item.sku ?? '',
    productName: item.productName ?? '',
    quantity: item.quantity,
    unitPriceMinorUnits: item.unitPriceMinorUnits,
    taxMinorUnits: item.taxMinorUnits,
    lineTotalMinorUnits: item.lineTotalMinorUnits ?? item.unitPriceMinorUnits * item.quantity,
    currency: (item.currency ?? orderRow.currency) as Currency,
    taxMode: (item.taxMode ?? orderRow.taxMode) as TaxMode,
    snapshot: (item.snapshot as CheckoutLineSnapshot) ?? {
      productId: item.productId ?? '',
      variantId: item.productVariantId,
      marketOfferId: item.marketOfferId ?? '',
      sku: item.sku ?? '',
      productName: item.productName ?? '',
      quantity: item.quantity,
      unitPriceMinorUnits: item.unitPriceMinorUnits,
      lineTotalMinorUnits: item.lineTotalMinorUnits ?? item.unitPriceMinorUnits * item.quantity,
      currency: (item.currency ?? orderRow.currency) as Currency,
      taxMode: (item.taxMode ?? orderRow.taxMode) as TaxMode,
      lifecycleAtCheckout: 'ACTIVE',
    },
    garageVehicleId: item.garageVehicleId,
  }))

  return {
    id: orderRow.id,
    orderReference: orderRow.orderReference ?? '',
    userId: orderRow.userId,
    marketCode: orderRow.marketCode as MarketCode,
    currency: orderRow.currency as Currency,
    taxMode: orderRow.taxMode as TaxMode,
    taxDisplayMode: orderRow.marketCode === 'UK' ? 'TAX_INCLUDED' : 'TAX_EXCLUDED',
    paymentStatus: orderRow.paymentStatus as OrderPaymentStatus,
    subtotalMinorUnits: orderRow.subtotalMinorUnits ?? 0,
    taxMinorUnits: orderRow.taxMinorUnits ?? 0,
    totalMinorUnits: orderRow.totalMinorUnits,
    shippingMethodId: orderRow.shippingMethodId ?? null,
    shippingCostMinorUnits:
      orderRow.totalMinorUnits - (orderRow.subtotalMinorUnits ?? orderRow.totalMinorUnits) || 0,
    stripeCheckoutSessionId: orderRow.stripeCheckoutSessionId,
    stripePaymentIntentId: orderRow.stripePaymentIntentId,
    buildId: null,
    buildVersion: null,
    items,
    createdAt: orderRow.createdAt ? new Date(orderRow.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: orderRow.updatedAt ? new Date(orderRow.updatedAt).toISOString() : new Date().toISOString(),
  }
}

// ── Basket Operations ─────────────────────────────────────────────────────────

export async function getOrCreateBasket(params: {
  basketId?: string | null
  userId?: string | null
  marketCode: MarketCode
}): Promise<BasketRecord> {
  const currency = resolveMarketCurrency(params.marketCode)

  if (params.basketId) {
    const existing = BASKETS.find((b) => b.id === params.basketId && b.status === 'ACTIVE')
    if (existing) {
      if (existing.marketCode !== params.marketCode) {
        // Market mismatch: Cannot mix UK and US items in one basket.
        // Return existing basket in its own market, or clear if user switches market.
        return enrichBasket(existing)
      }
      if (params.userId && !existing.userId) {
        existing.userId = params.userId
        existing.updatedAt = new Date().toISOString()
      }
      return enrichBasket(existing)
    }
  }

  if (params.userId) {
    const userBasket = BASKETS.find(
      (b) => b.userId === params.userId && b.status === 'ACTIVE' && b.marketCode === params.marketCode
    )
    if (userBasket) {
      return enrichBasket(userBasket)
    }
  }

  const newBasket: DbBasket = {
    id: `bsk-${crypto.randomUUID()}`,
    userId: params.userId ?? null,
    marketCode: params.marketCode,
    currency,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  BASKETS.push(newBasket)
  return enrichBasket(newBasket)
}

export async function getBasket(basketId: string): Promise<BasketRecord | null> {
  const basket = BASKETS.find((b) => b.id === basketId && b.status === 'ACTIVE')
  if (!basket) return null
  return enrichBasket(basket)
}

/**
 * Handle market switching when customer has an active basket.
 * Invariant: Never mix UK/US items, never silently convert currency, never delete baskets silently.
 */
export async function handleMarketSwitchBasket(params: {
  basketId: string
  targetMarket: MarketCode
  action: 'KEEP_CURRENT' | 'START_NEW'
  userId?: string | null
}): Promise<{
  basket: BasketRecord
  switched: boolean
  message: string
}> {
  const currentBasket = BASKETS.find((b) => b.id === params.basketId && b.status === 'ACTIVE')
  if (!currentBasket) {
    const newBasket = await getOrCreateBasket({
      userId: params.userId ?? null,
      marketCode: params.targetMarket,
    })
    return {
      basket: newBasket,
      switched: true,
      message: `New ${params.targetMarket} basket initialized.`,
    }
  }

  if (currentBasket.marketCode === params.targetMarket) {
    return {
      basket: enrichBasket(currentBasket),
      switched: false,
      message: `Basket is already in ${params.targetMarket}.`,
    }
  }

  if (params.action === 'KEEP_CURRENT') {
    return {
      basket: enrichBasket(currentBasket),
      switched: false,
      message: `Retained current ${currentBasket.marketCode} basket (${currentBasket.currency}). Switch back to ${currentBasket.marketCode} to complete checkout.`,
    }
  }

  // START_NEW: Retain previous basket intact in memory so customer never loses items.
  const newBasket = await getOrCreateBasket({
    userId: (params.userId ?? currentBasket.userId) ?? null,
    marketCode: params.targetMarket,
  })

  return {
    basket: newBasket,
    switched: true,
    message: `Initialized new ${params.targetMarket} basket (${newBasket.currency}). Previous ${currentBasket.marketCode} basket preserved.`,
  }
}

export async function addToBasket(
  basketId: string,
  input: AddToBasketInput
): Promise<BasketRecord> {
  const basket = BASKETS.find((b) => b.id === basketId)
  if (!basket) {
    throw new Error('Basket not found')
  }

  if (basket.status !== 'ACTIVE') {
    throw new Error(`Cannot add to basket with status ${basket.status}`)
  }

  // Strict Market Isolation: Cross-market addition prohibited
  if (input.marketCode && input.marketCode !== basket.marketCode) {
    throw new Error(
      `Market mismatch: Cannot add ${input.marketCode} offer to ${basket.marketCode} basket`
    )
  }

  // 1. Authoritative Product Validation
  const product = SEED_PRODUCTS.find((p) => p.id === input.productId)
  if (!product || !product.published) {
    throw new Error(`Product ${input.productId} not found or unpublished`)
  }

  if (product.lifecycle === 'DISCONTINUED') {
    throw new Error(`Product ${product.name} is discontinued and cannot be purchased`)
  }

  if (product.lifecycle === 'REPLACED') {
    throw new Error(
      `Product ${product.name} has been replaced. Please select the replacement model.`
    )
  }

  // 2. Authoritative Variant Resolution
  const variant = input.variantId
    ? SEED_VARIANTS.find((v) => v.id === input.variantId)
    : SEED_VARIANTS.find((v) => v.productId === product.id)

  const variantId = variant?.id ?? null
  const sku = variant?.sku ?? product.sku

  // 3. Authoritative Market Offer Resolution
  const offer = SEED_OFFERS.find(
    (o) =>
      o.marketCode === basket.marketCode &&
      (variantId ? o.productVariantId === variantId : false)
  )

  if (!offer) {
    throw new Error(
      `Product "${product.name}" has no commercial offer available in ${basket.marketCode}.`
    )
  }

  if (offer.availability === 'NOT_AVAILABLE') {
    throw new Error(`Product "${product.name}" is currently unavailable in ${basket.marketCode}.`)
  }

  // Strict Market Isolation: Never mix currencies
  if (offer.currency !== basket.currency) {
    throw new Error(
      `Market currency mismatch: Offer currency ${offer.currency} does not match basket currency ${basket.currency}`
    )
  }

  // 4. Update or Insert Basket Item
  const quantityToAdd = input.quantity && input.quantity > 0 ? input.quantity : 1
  const existingItem = BASKET_ITEMS.find(
    (i) => i.basketId === basket.id && i.productId === product.id && i.variantId === variantId
  )

  if (existingItem) {
    existingItem.quantity += quantityToAdd
    // Re-resolve authoritative price in case it changed
    existingItem.unitPriceMinorUnits = offer.retailPrice
    existingItem.updatedAt = new Date().toISOString()
  } else {
    const newItem: DbBasketItem = {
      id: `bi-${crypto.randomUUID()}`,
      basketId: basket.id,
      productId: product.id,
      variantId,
      marketOfferId: offer.id,
      sku,
      productName: product.name,
      quantity: quantityToAdd,
      unitPriceMinorUnits: offer.retailPrice,
      currency: offer.currency,
      taxMode: offer.taxMode,
      availability: offer.availability,
      imageUrl: null,
      buildId: input.buildProvenance?.buildId ?? null,
      buildVersion: input.buildProvenance?.buildVersion ?? null,
      buildSlug: input.buildProvenance?.buildSlug ?? null,
      buildRole: input.buildProvenance?.buildRole ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    BASKET_ITEMS.push(newItem)
  }

  basket.updatedAt = new Date().toISOString()
  return enrichBasket(basket)
}

export async function updateBasketItemQuantity(
  basketId: string,
  itemId: string,
  quantity: number
): Promise<BasketRecord> {
  const basket = BASKETS.find((b) => b.id === basketId)
  if (!basket) throw new Error('Basket not found')

  const itemIndex = BASKET_ITEMS.findIndex((i) => i.id === itemId && i.basketId === basketId)
  if (itemIndex === -1) throw new Error('Item not found in basket')

  if (quantity <= 0) {
    BASKET_ITEMS.splice(itemIndex, 1)
  } else {
    BASKET_ITEMS[itemIndex]!.quantity = quantity
    BASKET_ITEMS[itemIndex]!.updatedAt = new Date().toISOString()
  }

  basket.updatedAt = new Date().toISOString()
  return enrichBasket(basket)
}

export async function removeFromBasket(
  basketId: string,
  itemId: string
): Promise<BasketRecord> {
  return updateBasketItemQuantity(basketId, itemId, 0)
}

export async function clearBasket(basketId: string): Promise<BasketRecord> {
  const basket = BASKETS.find((b) => b.id === basketId)
  if (!basket) throw new Error('Basket not found')

  BASKET_ITEMS = BASKET_ITEMS.filter((i) => i.basketId !== basketId)
  basket.updatedAt = new Date().toISOString()
  return enrichBasket(basket)
}

// ── Price Resolution & Stale Change Detection ─────────────────────────────────

export async function detectBasketPriceChanges(
  basketId: string
): Promise<{
  hasChanges: boolean
  changedItems: Array<{ id: string; name: string; oldPrice: number; newPrice: number }>
}> {
  const items = BASKET_ITEMS.filter((i) => i.basketId === basketId)
  const basket = BASKETS.find((b) => b.id === basketId)
  if (!basket) return { hasChanges: false, changedItems: [] }

  const changedItems: Array<{ id: string; name: string; oldPrice: number; newPrice: number }> = []

  for (const item of items) {
    const offer = SEED_OFFERS.find(
      (o) =>
        o.marketCode === basket.marketCode &&
        (item.variantId ? o.productVariantId === item.variantId : false)
    )

    if (offer && offer.retailPrice !== item.unitPriceMinorUnits) {
      changedItems.push({
        id: item.id,
        name: item.productName,
        oldPrice: item.unitPriceMinorUnits,
        newPrice: offer.retailPrice,
      })
    }
  }

  return {
    hasChanges: changedItems.length > 0,
    changedItems,
  }
}

// ── Checkout Snapshot ─────────────────────────────────────────────────────────

export async function createCheckoutSnapshot(
  basketId: string,
  userId?: string | null,
  shippingMethodId?: string | null
): Promise<CheckoutSnapshot> {
  const basket = BASKETS.find((b) => b.id === basketId)
  if (!basket) throw new Error('Basket not found')

  const items = BASKET_ITEMS.filter((i) => i.basketId === basketId)
  if (items.length === 0) {
    throw new Error('Cannot checkout an empty basket')
  }

  const lines: CheckoutLineSnapshot[] = []
  let subtotal = 0

  for (const item of items) {
    // 1. Authoritative catalogue re-check
    const product = SEED_PRODUCTS.find((p) => p.id === item.productId)
    if (!product || !product.published) {
      throw new Error(`Product "${item.productName}" is no longer available.`)
    }

    if (product.lifecycle === 'DISCONTINUED' || product.lifecycle === 'REPLACED') {
      throw new Error(
        `Product "${item.productName}" status changed to ${product.lifecycle}. Checkout halted.`
      )
    }

    // 2. Authoritative market offer re-check
    const offer = SEED_OFFERS.find(
      (o) =>
        o.marketCode === basket.marketCode &&
        (item.variantId ? o.productVariantId === item.variantId : false)
    )

    if (!offer) {
      throw new Error(`No valid ${basket.marketCode} offer found for "${item.productName}".`)
    }

    // Server-Side Price Authority: We strictly use the authoritative offer price, not client input
    const authoritativeUnitPrice = offer.retailPrice
    const lineTotal = authoritativeUnitPrice * item.quantity
    subtotal += lineTotal

    lines.push({
      productId: item.productId,
      variantId: item.variantId,
      marketOfferId: offer.id,
      sku: item.sku,
      productName: item.productName,
      quantity: item.quantity,
      unitPriceMinorUnits: authoritativeUnitPrice,
      lineTotalMinorUnits: lineTotal,
      currency: offer.currency,
      taxMode: offer.taxMode,
      lifecycleAtCheckout: product.lifecycle,
      buildId: item.buildId ?? null,
      buildVersion: item.buildVersion ?? null,
      buildSlug: item.buildSlug ?? null,
      buildRole: item.buildRole ?? null,
    })
  }

  const marketConfig = getMarketConfig(basket.marketCode)
  const availableShipping = getShippingMethodsForMarket(basket.marketCode, subtotal)

  let selectedShipping = shippingMethodId
    ? availableShipping.find((m) => m.id === shippingMethodId)
    : null

  if (!selectedShipping && availableShipping.length > 0) {
    selectedShipping = availableShipping[0]
  }

  const shippingCostMinorUnits = selectedShipping ? selectedShipping.costMinorUnits : 0
  const taxMode = resolveMarketTaxMode(basket.marketCode)
  const tax = basket.marketCode === 'UK' ? Math.round((subtotal * 20) / 120) : 0
  const total = subtotal + shippingCostMinorUnits

  return {
    basketId,
    userId: userId ?? basket.userId,
    marketCode: basket.marketCode,
    currency: basket.currency,
    taxMode,
    taxDisplayMode: marketConfig.taxDisplayMode,
    lines,
    subtotalMinorUnits: subtotal,
    taxMinorUnits: tax,
    totalMinorUnits: total,
    shippingMethodId: selectedShipping?.id ?? null,
    shippingCostMinorUnits,
    buildId: lines.find((l) => l.buildId)?.buildId ?? null,
    buildVersion: lines.find((l) => l.buildVersion)?.buildVersion ?? null,
    createdAt: new Date().toISOString(),
  }
}

// ── Order Creation & Payment State Machine ───────────────────────────────────

export async function createPendingOrder(
  snapshot: CheckoutSnapshot,
  userId?: string | null,
  stripeSessionId?: string | null
): Promise<OrderRecord> {
  const orderId = `ord-${crypto.randomUUID()}`
  const orderReference = generateOrderReference()

  const newOrder: DbOrder = {
    id: orderId,
    orderReference,
    userId: userId ?? snapshot.userId ?? null,
    marketCode: snapshot.marketCode,
    currency: snapshot.currency,
    taxMode: snapshot.taxMode,
    taxDisplayMode: snapshot.taxDisplayMode ?? (snapshot.marketCode === 'UK' ? 'TAX_INCLUDED' : 'TAX_EXCLUDED'),
    paymentStatus: 'PENDING_PAYMENT',
    subtotalMinorUnits: snapshot.subtotalMinorUnits,
    taxMinorUnits: snapshot.taxMinorUnits,
    totalMinorUnits: snapshot.totalMinorUnits,
    shippingMethodId: snapshot.shippingMethodId ?? null,
    shippingCostMinorUnits: snapshot.shippingCostMinorUnits ?? 0,
    stripeCheckoutSessionId: stripeSessionId ?? null,
    stripePaymentIntentId: null,
    buildId: snapshot.buildId ?? null,
    buildVersion: snapshot.buildVersion ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const itemsToInsert: DbOrderItem[] = snapshot.lines.map((line) => ({
    id: `oi-${crypto.randomUUID()}`,
    orderId,
    productId: line.productId,
    variantId: line.variantId ?? null,
    marketOfferId: line.marketOfferId ?? null,
    sku: line.sku,
    productName: line.productName,
    quantity: line.quantity,
    unitPriceMinorUnits: line.unitPriceMinorUnits,
    taxMinorUnits: line.taxMode === 'INCLUSIVE' ? Math.round((line.lineTotalMinorUnits * 20) / 120) : 0,
    lineTotalMinorUnits: line.lineTotalMinorUnits,
    currency: line.currency,
    taxMode: line.taxMode,
    snapshot: line,
    garageVehicleId: null,
  }))

  if (isDbConfigured) {
    await db.transaction(async (tx) => {
      await tx.insert(orders).values({
        id: newOrder.id,
        orderReference: newOrder.orderReference,
        userId: newOrder.userId,
        marketCode: newOrder.marketCode as any,
        stripeCheckoutSessionId: newOrder.stripeCheckoutSessionId,
        stripePaymentIntentId: newOrder.stripePaymentIntentId,
        paymentStatus: 'PENDING_PAYMENT',
        fulfilmentStatus: 'PENDING',
        subtotalMinorUnits: newOrder.subtotalMinorUnits,
        taxMinorUnits: newOrder.taxMinorUnits,
        taxMode: newOrder.taxMode,
        totalMinorUnits: newOrder.totalMinorUnits,
        currency: newOrder.currency,
        shippingMethodId: newOrder.shippingMethodId,
        createdAt: new Date(newOrder.createdAt),
        updatedAt: new Date(newOrder.updatedAt),
      })

      for (const item of itemsToInsert) {
        await tx.insert(orderItems).values({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productVariantId: item.variantId,
          marketOfferId: item.marketOfferId,
          sku: item.sku,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceMinorUnits: item.unitPriceMinorUnits,
          taxMinorUnits: item.taxMinorUnits,
          lineTotalMinorUnits: item.lineTotalMinorUnits,
          currency: item.currency,
          taxMode: item.taxMode,
          snapshot: item.snapshot as any,
          garageVehicleId: item.garageVehicleId,
        })
      }
    })
  }

  // Always keep in-memory store synchronized (for hermetic test execution and cache)
  ORDERS.push(newOrder)
  for (const item of itemsToInsert) {
    ORDER_ITEMS.push(item)
  }

  return enrichOrder(newOrder)
}

export async function markOrderPaid(params: {
  orderId?: string | null
  stripeSessionId?: string | null
  stripePaymentIntentId?: string | null
}): Promise<OrderRecord> {
  if (isDbConfigured) {
    const whereCond = params.orderId
      ? eq(orders.id, params.orderId)
      : params.stripeSessionId
        ? eq(orders.stripeCheckoutSessionId, params.stripeSessionId)
        : undefined

    if (whereCond) {
      const dbRows = await db.select().from(orders).where(whereCond).limit(1)
      if (dbRows[0]) {
        if (dbRows[0].paymentStatus !== 'PAID') {
          await db
            .update(orders)
            .set({
              paymentStatus: 'PAID',
              ...(params.stripePaymentIntentId ? { stripePaymentIntentId: params.stripePaymentIntentId } : {}),
              updatedAt: new Date(),
            })
            .where(whereCond)
        }
        const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, dbRows[0].id))
        const updatedRow = {
          ...dbRows[0],
          paymentStatus: 'PAID' as const,
          stripePaymentIntentId: params.stripePaymentIntentId ?? dbRows[0].stripePaymentIntentId,
          updatedAt: new Date(),
        }

        const mem = ORDERS.find((o) => o.id === dbRows[0]!.id)
        if (mem) {
          mem.paymentStatus = 'PAID'
          if (params.stripePaymentIntentId) mem.stripePaymentIntentId = params.stripePaymentIntentId
          mem.updatedAt = new Date().toISOString()
        }

        return mapDbOrderToRecord(updatedRow, itemRows)
      }
    }
  }

  let order = ORDERS.find((o) => {
    if (params.orderId && o.id === params.orderId) return true
    if (params.stripeSessionId && o.stripeCheckoutSessionId === params.stripeSessionId) return true
    return false
  })

  if (!order) {
    throw new Error('Order not found for payment confirmation')
  }

  // Idempotency: If already paid, return intact without double-processing
  if (order.paymentStatus === 'PAID') {
    return enrichOrder(order)
  }

  order.paymentStatus = 'PAID'
  if (params.stripePaymentIntentId) {
    order.stripePaymentIntentId = params.stripePaymentIntentId
  }
  order.updatedAt = new Date().toISOString()

  return enrichOrder(order)
}

export async function markOrderPaymentFailed(params: {
  orderId?: string | null
  stripeSessionId?: string | null
}): Promise<OrderRecord> {
  if (isDbConfigured) {
    const whereCond = params.orderId
      ? eq(orders.id, params.orderId)
      : params.stripeSessionId
        ? eq(orders.stripeCheckoutSessionId, params.stripeSessionId)
        : undefined

    if (whereCond) {
      const dbRows = await db.select().from(orders).where(whereCond).limit(1)
      if (dbRows[0]) {
        await db
          .update(orders)
          .set({
            paymentStatus: 'PAYMENT_FAILED',
            updatedAt: new Date(),
          })
          .where(whereCond)

        const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, dbRows[0].id))
        const updatedRow = {
          ...dbRows[0],
          paymentStatus: 'PAYMENT_FAILED' as const,
          updatedAt: new Date(),
        }

        const mem = ORDERS.find((o) => o.id === dbRows[0]!.id)
        if (mem) {
          mem.paymentStatus = 'PAYMENT_FAILED'
          mem.updatedAt = new Date().toISOString()
        }

        return mapDbOrderToRecord(updatedRow, itemRows)
      }
    }
  }

  const order = ORDERS.find((o) => {
    if (params.orderId && o.id === params.orderId) return true
    if (params.stripeSessionId && o.stripeCheckoutSessionId === params.stripeSessionId) return true
    return false
  })

  if (!order) {
    throw new Error('Order not found for payment failure update')
  }

  order.paymentStatus = 'PAYMENT_FAILED'
  order.updatedAt = new Date().toISOString()

  return enrichOrder(order)
}

// ── Customer Order Queries & Privacy Isolation ────────────────────────────────

export async function getOrderById(
  orderId: string,
  requestingUserId?: string | null
): Promise<OrderRecord | null> {
  if (isDbConfigured) {
    const rows = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    const orderRow = rows[0]
    if (orderRow) {
      // Strict Tenant Isolation: Only owner or authenticated staff can access
      if (orderRow.userId && requestingUserId && orderRow.userId !== requestingUserId) {
        return null // Unauthorized
      }

      const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, orderRow.id))
      return mapDbOrderToRecord(orderRow, itemRows)
    }
  }

  const order = ORDERS.find((o) => o.id === orderId)
  if (!order) return null

  // Strict Tenant Isolation: Only owner or authenticated staff can access
  if (order.userId && requestingUserId && order.userId !== requestingUserId) {
    return null // Unauthorized
  }

  return enrichOrder(order)
}

export async function getOrderByReference(
  orderReference: string,
  requestingUserId?: string | null
): Promise<OrderRecord | null> {
  if (isDbConfigured) {
    const rows = await db.select().from(orders).where(eq(orders.orderReference, orderReference)).limit(1)
    const orderRow = rows[0]
    if (orderRow) {
      if (orderRow.userId && requestingUserId && orderRow.userId !== requestingUserId) {
        return null
      }

      const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, orderRow.id))
      return mapDbOrderToRecord(orderRow, itemRows)
    }
  }

  const order = ORDERS.find((o) => o.orderReference === orderReference)
  if (!order) return null

  if (order.userId && requestingUserId && order.userId !== requestingUserId) {
    return null
  }

  return enrichOrder(order)
}

export async function getCustomerOrders(userId: string): Promise<OrderRecord[]> {
  if (!userId) return []

  if (isDbConfigured) {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))

    if (rows.length > 0) {
      const results: OrderRecord[] = []
      for (const orderRow of rows) {
        const itemRows = await db.select().from(orderItems).where(eq(orderItems.orderId, orderRow.id))
        results.push(mapDbOrderToRecord(orderRow, itemRows))
      }
      return results
    }
  }

  const userOrders = ORDERS.filter((o) => o.userId === userId)
  userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return userOrders.map(enrichOrder)
}

// ── Garage Order Association ──────────────────────────────────────────────────

export async function associateOrderItemWithGarageVehicle(
  userId: string,
  orderItemId: string,
  garageVehicleId: string
): Promise<boolean> {
  const item = ORDER_ITEMS.find((i) => i.id === orderItemId)
  if (!item) return false

  const order = ORDERS.find((o) => o.id === item.orderId)
  if (!order || order.userId !== userId) {
    return false // Tenant isolation: Cannot associate another customer's order item
  }

  item.garageVehicleId = garageVehicleId
  return true
}

// ── Webhook Idempotency & Ledger ──────────────────────────────────────────────

export async function recordPaymentEvent(event: {
  stripeEventId: string
  eventType: string
  orderId?: string | null
  status: string
  payload: Record<string, unknown>
}): Promise<PaymentEventRecord> {
  const existing = PAYMENT_EVENTS.find((e) => e.stripeEventId === event.stripeEventId)
  if (existing) {
    return existing
  }

  const newEvent: DbPaymentEvent = {
    id: `pe-${crypto.randomUUID()}`,
    stripeEventId: event.stripeEventId,
    eventType: event.eventType,
    orderId: event.orderId ?? null,
    status: event.status,
    payload: event.payload,
    createdAt: new Date().toISOString(),
  }

  PAYMENT_EVENTS.push(newEvent)
  return newEvent
}

export async function isPaymentEventProcessed(stripeEventId: string): Promise<boolean> {
  return PAYMENT_EVENTS.some((e) => e.stripeEventId === stripeEventId)
}

// ── Testing & Inspection Helpers ──────────────────────────────────────────────

export function __resetCommerceStoreForTesting() {
  BASKETS = []
  BASKET_ITEMS = []
  PAYMENT_EVENTS = []
  ORDERS = [
    {
      id: 'ord-customer-001',
      orderReference: 'HALO-2026-X488',
      userId: 'usr-customer',
      marketCode: 'UK',
      currency: 'GBP',
      taxMode: 'INCLUSIVE',
      taxDisplayMode: 'TAX_INCLUDED',
      paymentStatus: 'PAID',
      subtotalMinorUnits: 72900,
      taxMinorUnits: 12150,
      totalMinorUnits: 72900,
      shippingMethodId: 'ship-uk-std',
      shippingCostMinorUnits: 0,
      stripeCheckoutSessionId: 'cs_test_initial_001',
      stripePaymentIntentId: 'pi_test_initial_001',
      createdAt: '2026-01-15T12:00:00Z',
      updatedAt: '2026-01-15T12:05:00Z',
    },
    {
      id: 'ord-adversary-001',
      orderReference: 'HALO-2026-ADV9',
      userId: 'usr-adversary',
      marketCode: 'US',
      currency: 'USD',
      taxMode: 'EXCLUSIVE',
      taxDisplayMode: 'TAX_EXCLUDED',
      paymentStatus: 'PAID',
      subtotalMinorUnits: 114900,
      taxMinorUnits: 0,
      totalMinorUnits: 114900,
      shippingMethodId: 'ship-us-std',
      shippingCostMinorUnits: 0,
      stripeCheckoutSessionId: 'cs_test_adversary_001',
      stripePaymentIntentId: 'pi_test_adversary_001',
      createdAt: '2026-02-10T14:00:00Z',
      updatedAt: '2026-02-10T14:05:00Z',
    },
  ]
  ORDER_ITEMS = [
    {
      id: 'item-ord-001',
      orderId: 'ord-customer-001',
      productId: 'prod-xray-x4-2026',
      variantId: 'var-xray-x4-2026-kit',
      marketOfferId: 'offer-xray-x4-uk',
      sku: 'XRAY-300040',
      productName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      quantity: 1,
      unitPriceMinorUnits: 72900,
      taxMinorUnits: 12150,
      lineTotalMinorUnits: 72900,
      currency: 'GBP',
      taxMode: 'INCLUSIVE',
      snapshot: {
        productId: 'prod-xray-x4-2026',
        variantId: 'var-xray-x4-2026-kit',
        marketOfferId: 'offer-xray-x4-uk',
        sku: 'XRAY-300040',
        productName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
        quantity: 1,
        unitPriceMinorUnits: 72900,
        lineTotalMinorUnits: 72900,
        currency: 'GBP',
        taxMode: 'INCLUSIVE',
        lifecycleAtCheckout: 'ACTIVE',
      },
      garageVehicleId: 'veh-x4-customer',
    },
    {
      id: 'item-ord-adv-001',
      orderId: 'ord-adversary-001',
      productId: 'prod-traxxas-xmaxx-8s',
      variantId: 'var-xmaxx-8s-red',
      marketOfferId: 'offer-xmaxx-us',
      sku: 'TRX-77086-4',
      productName: 'Traxxas X-Maxx 8S Brushless Monster Truck',
      quantity: 1,
      unitPriceMinorUnits: 114900,
      taxMinorUnits: 0,
      lineTotalMinorUnits: 114900,
      currency: 'USD',
      taxMode: 'EXCLUSIVE',
      snapshot: {
        productId: 'prod-traxxas-xmaxx-8s',
        variantId: 'var-xmaxx-8s-red',
        marketOfferId: 'offer-xmaxx-us',
        sku: 'TRX-77086-4',
        productName: 'Traxxas X-Maxx 8S Brushless Monster Truck',
        quantity: 1,
        unitPriceMinorUnits: 114900,
        lineTotalMinorUnits: 114900,
        currency: 'USD',
        taxMode: 'EXCLUSIVE',
        lifecycleAtCheckout: 'ACTIVE',
      },
      garageVehicleId: null,
    },
  ]
}

export function __getRawCommerceCounts() {
  return {
    totalBaskets: BASKETS.length,
    totalBasketItems: BASKET_ITEMS.length,
    totalOrders: ORDERS.length,
    paidOrders: ORDERS.filter((o) => o.paymentStatus === 'PAID').length,
    pendingOrders: ORDERS.filter((o) => o.paymentStatus === 'PENDING_PAYMENT').length,
    totalOrderItems: ORDER_ITEMS.length,
    totalPaymentEvents: PAYMENT_EVENTS.length,
  }
}

export function __getRawOrdersAndBaskets() {
  return {
    orders: ORDERS,
    baskets: BASKETS,
  }
}

export function __getRawOrderItems() {
  return ORDER_ITEMS
}
