import { describe, it, expect, beforeEach } from 'vitest'
import {
  getMachineDetail,
  getMachinesList,
  searchCatalogue,
  createProduct,
  updateProduct,
  publishProduct,
  unpublishProduct,
  getAdminProduct,
  createPendingOrder,
  getOrderById,
  getOrderByReference,
  getCustomerOrders,
  markOrderPaid,
  updateOrderFulfilmentStatus,
  getAdminOrder,
  __resetCatalogueStoreForTesting,
  __resetCommerceStoreForTesting,
} from '@halo-rc/db'
import type { CheckoutSnapshot } from '@halo-rc/types'

describe('Phase 29: PostgreSQL-First Catalogue, Storefront & Order Integration', () => {
  beforeEach(() => {
    __resetCatalogueStoreForTesting()
    __resetCommerceStoreForTesting()
  })

  describe('1. Critical Negative Test: Product NOT in SEED_PRODUCTS is retrievable on Storefront', () => {
    it('creates a new product via admin and immediately retrieves it on storefront catalogue and search', async () => {
      // 1. Admin creates a completely new machine chassis that is absent from SEED_PRODUCTS
      const staffActor = { userId: 'staff-admin-01', userEmail: 'admin@halo-rc.com' }
      const newProduct = await createProduct(
        {
          name: 'Schumacher Mi9 1/10 Touring Car Kit',
          slug: 'schumacher-mi9-touring-kit',
          sku: 'SCH-K198',
          brandId: 'brand-xray', // Existing brand reference
          tier: 'HALO',
          status: 'DRAFT',
          productType: 'CHASSIS',
          scale: '1/10',
          discipline: 'RACE',
          description: 'Ultra-competitive touring car chassis kit from Schumacher Racing.',
          shortDescription: '1/10 competition touring car kit.',
          primaryImageUrl: '/images/machines/schumacher-mi9.jpg',
          metaTitle: 'Schumacher Mi9 1/10 Electric Touring Car | Halo RC',
          metaDescription: 'Shop the championship-winning Schumacher Mi9 1/10 touring car kit at Halo RC.',
        },
        staffActor
      )

      expect(newProduct.id).toBeDefined()
      const adminProduct = await getAdminProduct(newProduct.id)
      expect(adminProduct?.slug).toBe('schumacher-mi9-touring-kit')

      // While in DRAFT, storefront getMachineDetail must NOT return it
      const draftStorefront = await getMachineDetail('schumacher-mi9-touring-kit', 'UK')
      expect(draftStorefront).toBeNull()

      // 2. Admin publishes the product
      await publishProduct(newProduct.id, staffActor)
      const publishedAdmin = await getAdminProduct(newProduct.id)
      expect(publishedAdmin?.published).toBe(true)

      // 3. CRITICAL TEST: Storefront getMachineDetail must now retrieve it directly!
      const storefrontMachine = await getMachineDetail('schumacher-mi9-touring-kit', 'UK')
      expect(storefrontMachine).not.toBeNull()
      expect(storefrontMachine?.name).toBe('Schumacher Mi9 1/10 Touring Car Kit')
      expect(storefrontMachine?.sku).toBe('SCH-K198')
      expect(storefrontMachine?.tier).toBe('HALO')
      expect(storefrontMachine?.discipline).toBe('RACE')

      // 4. Storefront getMachinesList must include it in RACE discipline list
      const raceMachines = await getMachinesList({ discipline: 'RACE', marketCode: 'UK' })
      const foundInList = raceMachines.find((m) => m.slug === 'schumacher-mi9-touring-kit')
      expect(foundInList).toBeDefined()
      expect(foundInList?.name).toBe('Schumacher Mi9 1/10 Touring Car Kit')

      // 5. Storefront searchCatalogue must discover it
      const searchResults = await searchCatalogue({ query: 'Schumacher', marketCode: 'UK' })
      const foundInSearch = searchResults.find((m) => m.slug === 'schumacher-mi9-touring-kit')
      expect(foundInSearch).toBeDefined()
      expect(foundInSearch?.name).toBe('Schumacher Mi9 1/10 Touring Car Kit')
    })
  })

  describe('2. Admin Product Mutation & Immediate Storefront Propagation', () => {
    it('propagates product updates immediately and returns 404/null upon unpublishing', async () => {
      const staffActor = { userId: 'staff-admin-01', userEmail: 'admin@halo-rc.com' }

      // Create and publish product
      const product = await createProduct(
        {
          name: 'Yokomo BD12 Competition Kit',
          slug: 'yokomo-bd12-competition-kit',
          sku: 'YOK-MSR-BD12',
          brandId: 'brand-yokomo',
          tier: 'STANDARD',
          status: 'DRAFT',
          productType: 'CHASSIS',
          scale: '1/10',
          discipline: 'RACE',
          description: 'Yokomo factory racing touring chassis.',
        },
        staffActor
      )

      await publishProduct(product.id, staffActor)

      // Storefront retrieves it
      let machine = await getMachineDetail('yokomo-bd12-competition-kit', 'UK')
      expect(machine).not.toBeNull()
      expect(machine?.tier).toBe('STANDARD')

      // Admin updates tier and title
      await updateProduct(
        product.id,
        {
          name: 'Yokomo BD12 Factory Team Edition',
          tier: 'HALO',
        },
        staffActor
      )

      // Storefront immediately reflects the updated attributes
      machine = await getMachineDetail('yokomo-bd12-competition-kit', 'UK')
      expect(machine).not.toBeNull()
      expect(machine?.name).toBe('Yokomo BD12 Factory Team Edition')
      expect(machine?.tier).toBe('HALO')

      // Admin unpublishes the product
      await unpublishProduct(product.id, staffActor)

      // Storefront must immediately treat it as 404 / null
      const unpublishedMachine = await getMachineDetail('yokomo-bd12-competition-kit', 'UK')
      expect(unpublishedMachine).toBeNull()

      const listAfterUnpublish = await getMachinesList({ marketCode: 'UK' })
      expect(listAfterUnpublish.some((m) => m.slug === 'yokomo-bd12-competition-kit')).toBe(false)
    })
  })

  describe('3. Order State Machine Validation & Lifecycle Transitions', () => {
    it('enforces legal progression (UNFULFILLED -> PROCESSING -> PACKED -> SHIPPED -> DELIVERED) and rejects illegal state jumps', async () => {
      const snapshot: CheckoutSnapshot = {
        basketId: 'bkt-state-test-01',
        userId: 'usr-state-customer',
        marketCode: 'UK',
        currency: 'GBP',
        taxMode: 'INCLUSIVE',
        taxDisplayMode: 'TAX_INCLUDED',
        lines: [
          {
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
            buildId: null,
            buildVersion: null,
            buildSlug: null,
            buildRole: null,
          },
        ],
        subtotalMinorUnits: 72900,
        taxMinorUnits: 12150,
        totalMinorUnits: 72900,
        shippingMethodId: 'ship-uk-std',
        shippingCostMinorUnits: 0,
        buildId: null,
        buildVersion: null,
        createdAt: new Date().toISOString(),
      }

      const order = await createPendingOrder(snapshot, 'usr-state-customer')
      expect(order.id).toBeDefined()
      expect(order.paymentStatus).toBe('PENDING_PAYMENT')

      const staffActor = { userId: 'staff-ops-01', userEmail: 'ops@halo-rc.com' }

      // ILLEGAL JUMP: Attempting to advance straight from UNFULFILLED/PENDING to DELIVERED
      await expect(
        updateOrderFulfilmentStatus(order.id, 'DELIVERED', staffActor)
      ).rejects.toThrow(/Invalid order fulfilment transition/i)

      // ILLEGAL JUMP: Attempting to jump directly to SHIPPED
      await expect(
        updateOrderFulfilmentStatus(order.id, 'SHIPPED', staffActor)
      ).rejects.toThrow(/Invalid order fulfilment transition/i)

      // LEGAL STEP 1: UNFULFILLED/PENDING -> PROCESSING
      await updateOrderFulfilmentStatus(order.id, 'PROCESSING', staffActor, 'Allocated to pack station')
      let adminOrder = await getAdminOrder(order.id)
      expect(adminOrder?.fulfilmentStatus).toBe('PROCESSING')

      // ILLEGAL JUMP: Attempting to jump from PROCESSING to DELIVERED
      await expect(
        updateOrderFulfilmentStatus(order.id, 'DELIVERED', staffActor)
      ).rejects.toThrow(/Invalid order fulfilment transition/i)

      // LEGAL STEP 2: PROCESSING -> PACKED
      await updateOrderFulfilmentStatus(order.id, 'PACKED', staffActor, 'Box sealed with security tape')
      adminOrder = await getAdminOrder(order.id)
      expect(adminOrder?.fulfilmentStatus).toBe('PACKED')

      // LEGAL STEP 3: PACKED -> SHIPPED
      await updateOrderFulfilmentStatus(order.id, 'SHIPPED', staffActor, 'Handed to DPD tracking #DPD99812')
      adminOrder = await getAdminOrder(order.id)
      expect(adminOrder?.fulfilmentStatus).toBe('SHIPPED')

      // LEGAL STEP 4: SHIPPED -> DELIVERED
      await updateOrderFulfilmentStatus(order.id, 'DELIVERED', staffActor, 'Signed for by customer')
      adminOrder = await getAdminOrder(order.id)
      expect(adminOrder?.fulfilmentStatus).toBe('DELIVERED')

      // TERMINAL STATE: DELIVERED is terminal, cannot transition backwards
      await expect(
        updateOrderFulfilmentStatus(order.id, 'PROCESSING', staffActor)
      ).rejects.toThrow(/Invalid order fulfilment transition/i)
    })
  })

  describe('4. Order Creation, Price Snapshot Immutability & Tenant Isolation', () => {
    it('persists order with frozen price snapshots and enforces strict tenant isolation', async () => {
      const customerUserId = 'usr-genuine-customer-88'
      const adversaryUserId = 'usr-adversary-hacker-99'

      const snapshot: CheckoutSnapshot = {
        basketId: 'bkt-frozen-price-01',
        userId: customerUserId,
        marketCode: 'UK',
        currency: 'GBP',
        taxMode: 'INCLUSIVE',
        taxDisplayMode: 'TAX_INCLUDED',
        lines: [
          {
            productId: 'prod-traxxas-xmaxx-8s',
            variantId: 'var-xmaxx-8s-orange',
            marketOfferId: 'offer-xmaxx-uk',
            sku: 'TRX-77086-4-ORG',
            productName: 'Traxxas X-Maxx 8S 4WD Brushless Monster Truck (Solar Flare)',
            quantity: 2,
            unitPriceMinorUnits: 104900,
            lineTotalMinorUnits: 209800,
            currency: 'GBP',
            taxMode: 'INCLUSIVE',
            lifecycleAtCheckout: 'ACTIVE',
            buildId: null,
            buildVersion: null,
            buildSlug: null,
            buildRole: null,
          },
        ],
        subtotalMinorUnits: 209800,
        taxMinorUnits: 34967,
        totalMinorUnits: 209800,
        shippingMethodId: 'ship-uk-express',
        shippingCostMinorUnits: 0,
        buildId: null,
        buildVersion: null,
        createdAt: new Date().toISOString(),
      }

      const order = await createPendingOrder(snapshot, customerUserId, 'cs_stripe_test_session_123')
      expect(order.id).toBeDefined()
      expect(order.orderReference).toMatch(/^HALO-\d{4}-[A-Z0-9]+$/)
      expect(order.totalMinorUnits).toBe(209800)
      expect(order.items[0]?.unitPriceMinorUnits).toBe(104900)
      expect(order.items[0]?.quantity).toBe(2)

      // Payment Confirmation
      const paidOrder = await markOrderPaid({ orderId: order.id, stripePaymentIntentId: 'pi_test_live_999' })
      expect(paidOrder.paymentStatus).toBe('PAID')
      expect(paidOrder.stripePaymentIntentId).toBe('pi_test_live_999')

      // Idempotent payment call
      const paidAgain = await markOrderPaid({ orderId: order.id })
      expect(paidAgain.paymentStatus).toBe('PAID')

      // Customer retrieval
      const customerOrders = await getCustomerOrders(customerUserId)
      expect(customerOrders.some((o) => o.id === order.id)).toBe(true)

      // TENANT ISOLATION: Authenticated customer query
      const legitimateView = await getOrderById(order.id, customerUserId)
      expect(legitimateView).not.toBeNull()
      expect(legitimateView?.id).toBe(order.id)

      // TENANT ISOLATION: Adversary query must be BLOCKED (returns null)
      const adversaryView = await getOrderById(order.id, adversaryUserId)
      expect(adversaryView).toBeNull()

      const adversaryRefView = await getOrderByReference(order.orderReference, adversaryUserId)
      expect(adversaryRefView).toBeNull()

      // PRICE IMMUTABILITY: Order items and totals remain strictly intact
      const freshLookup = await getOrderById(order.id, customerUserId)
      expect(freshLookup?.items[0]?.unitPriceMinorUnits).toBe(104900)
      expect(freshLookup?.items[0]?.lineTotalMinorUnits).toBe(209800)
      expect(freshLookup?.totalMinorUnits).toBe(209800)
    })
  })
})
