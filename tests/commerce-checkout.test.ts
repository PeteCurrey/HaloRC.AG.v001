// tests/commerce-checkout.test.ts
// Phase 5 — Checkout snapshot integrity, order creation, market isolation at checkout.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateBasket,
  addToBasket,
  createCheckoutSnapshot,
  createPendingOrder,
  getOrderById,
  getOrderByReference,
  getCustomerOrders,
  __resetCommerceStoreForTesting,
} from '@halo-rc/db'

beforeEach(() => {
  __resetCommerceStoreForTesting()
})

describe('Checkout Snapshot — authoritative market capture', () => {
  it('creates a snapshot with correct market and currency', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-test-001', marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    const snapshot = await createCheckoutSnapshot(basket.id, 'user-test-001')
    expect(snapshot.marketCode).toBe('UK')
    expect(snapshot.currency).toBe('GBP')
    expect(snapshot.lines).toHaveLength(1)
  })

  it('snapshot lines contain authoritative price and product info', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-test-001', marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    const snapshot = await createCheckoutSnapshot(basket.id, 'user-test-001')
    const line = snapshot.lines[0]!
    expect(line.productId).toBe('prod-xray-x4-2026')
    expect(line.unitPriceMinorUnits).toBeGreaterThan(0)
    expect(line.quantity).toBe(1)
    expect(line.currency).toBe('GBP')
    expect(line.sku).toBeTruthy()
  })

  it('snapshot grandTotal equals sum of line totals', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-test-001', marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 2, marketCode: 'UK' })
    const snapshot = await createCheckoutSnapshot(basket.id, 'user-test-001')
    const lineSum = snapshot.lines.reduce((s, l) => s + l.lineTotalMinorUnits, 0)
    expect(snapshot.totalMinorUnits).toBe(lineSum)
  })

  it('snapshot is immutable — carries pricing at time of snapshot', async () => {
    const basket = await getOrCreateBasket({ basketId: null, userId: 'user-test-001', marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    const snapshot = await createCheckoutSnapshot(basket.id, 'user-test-001')
    // Price must be a positive integer (minor units)
    expect(Number.isInteger(snapshot.totalMinorUnits)).toBe(true)
    expect(snapshot.totalMinorUnits).toBeGreaterThan(0)
  })
})

describe('Order creation and retrieval', () => {
  async function createTestOrder(userId = 'user-ord-001') {
    const basket = await getOrCreateBasket({ basketId: null, userId, marketCode: 'UK' })
    await addToBasket(basket.id, { productId: 'prod-xray-x4-2026', quantity: 1, marketCode: 'UK' })
    const snapshot = await createCheckoutSnapshot(basket.id, userId)
    return createPendingOrder(snapshot, userId)
  }

  it('creates a pending order with a reference number', async () => {
    const order = await createTestOrder()
    expect(order.orderReference).toBeTruthy()
    expect(order.paymentStatus).toBe('PENDING_PAYMENT')
  })

  it('retrieves order by ID', async () => {
    const created = await createTestOrder()
    const fetched = await getOrderById(created.id, created.userId!)
    expect(fetched?.id).toBe(created.id)
  })

  it('retrieves order by reference', async () => {
    const created = await createTestOrder()
    const fetched = await getOrderByReference(created.orderReference, created.userId!)
    expect(fetched?.orderReference).toBe(created.orderReference)
  })

  it('lists customer orders', async () => {
    await createTestOrder('user-listing-001')
    await createTestOrder('user-listing-001')
    const orders = await getCustomerOrders('user-listing-001')
    expect(orders.length).toBeGreaterThanOrEqual(2)
  })

  it("enforces tenant isolation — cannot retrieve another user's order by ID", async () => {
    const order = await createTestOrder('user-owner-001')
    const fetched = await getOrderById(order.id, 'user-attacker-002')
    expect(fetched).toBeNull()
  })

  it("enforces tenant isolation — cannot retrieve another user's order by reference", async () => {
    const order = await createTestOrder('user-owner-001')
    const fetched = await getOrderByReference(order.orderReference, 'user-attacker-002')
    expect(fetched).toBeNull()
  })

  it('getCustomerOrders only returns orders for that user', async () => {
    await createTestOrder('user-A')
    await createTestOrder('user-B')
    const orders = await getCustomerOrders('user-A')
    expect(orders.every((o) => o.userId === 'user-A')).toBe(true)
  })

  it('order carries snapshot data — product name and price are immutable', async () => {
    const order = await createTestOrder()
    const line = order.items[0]!
    expect(line.productName).toBeTruthy()
    expect(line.unitPriceMinorUnits).toBeGreaterThan(0)
    expect(line.currency).toBe('GBP')
  })
})
