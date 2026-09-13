// Drizzle schema: baskets, basket items, payment events
import {
  pgTable,
  text,
  integer,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { marketCodeEnum, currencyEnum, taxModeEnum, basketStatusEnum } from './enums'
import { products, productVariants, marketOffers } from './products'
import { profiles, orders } from './auth'

// ─── Baskets ──────────────────────────────────────────────────────────────────

export const baskets = pgTable('baskets', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').references(() => profiles.id, { onDelete: 'set null' }),
  marketCode: marketCodeEnum('market_code').notNull().default('UK'),
  currency: currencyEnum('currency').notNull().default('GBP'),
  status: basketStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('baskets_user_idx').on(t.userId),
  index('baskets_status_idx').on(t.status),
])

// ─── Basket Items ─────────────────────────────────────────────────────────────

export const basketItems = pgTable('basket_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  basketId: text('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  productVariantId: text('product_variant_id').references(() => productVariants.id),
  marketOfferId: text('market_offer_id').references(() => marketOffers.id),
  sku: text('sku').notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPriceMinorUnits: integer('unit_price_minor_units').notNull(),
  currency: currencyEnum('currency').notNull(),
  taxMode: taxModeEnum('tax_mode').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('basket_items_basket_idx').on(t.basketId),
  index('basket_items_product_idx').on(t.productId),
])

// ─── Payment Events (Stripe Webhook Idempotency & Audit Ledger) ────────────────

export const paymentEvents = pgTable('payment_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  stripeEventId: text('stripe_event_id').unique().notNull(),
  eventType: text('event_type').notNull(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  status: text('status').notNull(),
  payload: jsonb('payload').notNull().$defaultFn(() => ({})),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('payment_events_stripe_event_idx').on(t.stripeEventId),
  index('payment_events_order_idx').on(t.orderId),
])

// ─── Relations ────────────────────────────────────────────────────────────────

export const basketsRelations = relations(baskets, ({ one, many }) => ({
  user: one(profiles, {
    fields: [baskets.userId],
    references: [profiles.id],
  }),
  items: many(basketItems),
}))

export const basketItemsRelations = relations(basketItems, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketItems.basketId],
    references: [baskets.id],
  }),
  product: one(products, {
    fields: [basketItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [basketItems.productVariantId],
    references: [productVariants.id],
  }),
  offer: one(marketOffers, {
    fields: [basketItems.marketOfferId],
    references: [marketOffers.id],
  }),
}))

export const paymentEventsRelations = relations(paymentEvents, ({ one }) => ({
  order: one(orders, {
    fields: [paymentEvents.orderId],
    references: [orders.id],
  }),
}))
