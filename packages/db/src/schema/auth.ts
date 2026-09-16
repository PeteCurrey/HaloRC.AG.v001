// Drizzle schema: auth/profiles, orders

import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { marketCodeEnum, currencyEnum, userRoleEnum, taxModeEnum } from './enums'
import {
  orderPaymentStatusEnum,
  orderFulfilmentStatusEnum,
} from './enums'
import { marketOffers, productVariants, products } from './products'
import { garageVehicles } from './garage'

// ─── Profiles ─────────────────────────────────────────────────────────────────
// Created automatically via DB trigger when auth.users row is created.
// id mirrors auth.users.id.

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey(), // = auth.users.id
  username: text('username').unique(),
  displayName: text('display_name'),
  marketPreference: marketCodeEnum('market_preference').notNull().default('UK'),
  currencyPreference: currencyEnum('currency_preference').notNull().default('GBP'),
  role: userRoleEnum('role').notNull().default('CUSTOMER'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Orders ───────────────────────────────────────────────────────────────────
// Payment state is authoritative from Stripe webhook, not browser redirect.

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderReference: text('order_reference').unique(),
  userId: text('user_id'), // nullable: guest checkout or authenticated customer
  marketCode: marketCodeEnum('market_code').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
  paymentStatus: orderPaymentStatusEnum('payment_status').notNull().default('PENDING_PAYMENT'),
  fulfilmentStatus: orderFulfilmentStatusEnum('fulfilment_status').notNull().default('PENDING'),
  subtotalMinorUnits: integer('subtotal_minor_units'),
  taxMinorUnits: integer('tax_minor_units').notNull().default(0),
  taxMode: taxModeEnum('tax_mode').notNull().default('INCLUSIVE'),
  totalMinorUnits: integer('total_minor_units').notNull(),
  currency: currencyEnum('currency').notNull(),
  billingAddress: jsonb('billing_address'),
  shippingAddress: jsonb('shipping_address'),
  customerNotes: text('customer_notes'),
  internalNotes: text('internal_notes'),
  shippingMethodId: text('shipping_method_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('orders_user_idx').on(t.userId),
  index('orders_payment_status_idx').on(t.paymentStatus),
  index('orders_order_reference_idx').on(t.orderReference),
])

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').references(() => products.id),
  productVariantId: text('product_variant_id').references(() => productVariants.id),
  marketOfferId: text('market_offer_id').references(() => marketOffers.id),
  sku: text('sku'),
  productName: text('product_name'),
  quantity: integer('quantity').notNull().default(1),
  unitPriceMinorUnits: integer('unit_price_minor_units').notNull(),
  taxMinorUnits: integer('tax_minor_units').notNull().default(0),
  lineTotalMinorUnits: integer('line_total_minor_units'),
  currency: currencyEnum('currency'),
  taxMode: taxModeEnum('tax_mode'),
  snapshot: jsonb('snapshot'),
  garageVehicleId: text('garage_vehicle_id').references(() => garageVehicles.id, { onDelete: 'set null' }),
}, (t) => [
  index('order_items_order_idx').on(t.orderId),
  index('order_items_garage_vehicle_idx').on(t.garageVehicleId),
])

// ─── Relations ────────────────────────────────────────────────────────────────

export const ordersRelations = relations(orders, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [orders.userId],
    references: [profiles.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}))

export const profilesRelations = relations(profiles, ({ many }) => ({
  orders: many(orders),
}))
