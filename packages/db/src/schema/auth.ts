// Drizzle schema: auth/profiles, orders

import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { marketCodeEnum, currencyEnum, userRoleEnum } from './enums'
import {
  orderPaymentStatusEnum,
  orderFulfilmentStatusEnum,
} from './enums'
import { marketOffers } from './products'
import { productVariants } from './products'

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
})

// ─── Orders ───────────────────────────────────────────────────────────────────
// Payment state is authoritative from Stripe webhook, not browser redirect.

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id'), // nullable: future guest checkout
  marketCode: marketCodeEnum('market_code').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique(),
  stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
  paymentStatus: orderPaymentStatusEnum('payment_status').notNull().default('PENDING'),
  fulfilmentStatus: orderFulfilmentStatusEnum('fulfilment_status').notNull().default('PENDING'),
  totalMinorUnits: integer('total_minor_units').notNull(),
  currency: currencyEnum('currency').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('orders_user_idx').on(t.userId),
  index('orders_payment_status_idx').on(t.paymentStatus),
])

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  marketOfferId: text('market_offer_id').references(() => marketOffers.id),
  productVariantId: text('product_variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  unitPriceMinorUnits: integer('unit_price_minor_units').notNull(),
  taxMinorUnits: integer('tax_minor_units').notNull().default(0),
}, (t) => [
  index('order_items_order_idx').on(t.orderId),
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
