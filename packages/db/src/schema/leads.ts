// Drizzle schema: leads, lead activities (CRM-lite)

import {
  pgTable,
  text,
  timestamp,
  date,
  index,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { leadStatusEnum, leadSourceEnum, leadPriorityEnum } from './enums'
import { products } from './products'

// ─── Leads ───────────────────────────────────────────────────────────────────

export const leads = pgTable('leads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  company: text('company'),
  source: leadSourceEnum('source').notNull().default('CONTACT_FORM'),
  productInterestId: text('product_interest_id').references(() => products.id, { onDelete: 'set null' }),
  message: text('message').notNull(),
  status: leadStatusEnum('status').notNull().default('NEW'),
  priority: leadPriorityEnum('priority').notNull().default('NORMAL'),
  assignedUserId: text('assigned_user_id'),
  notes: text('notes'),
  followUpDate: date('follow_up_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('leads_status_idx').on(t.status),
  index('leads_source_idx').on(t.source),
  index('leads_created_at_idx').on(t.createdAt),
  index('leads_product_interest_idx').on(t.productInterestId),
  index('leads_assigned_idx').on(t.assignedUserId),
])

// ─── Lead Activities ─────────────────────────────────────────────────────────

export const leadActivities = pgTable('lead_activities', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  userEmail: text('user_email'),
  action: text('action').notNull(),
  details: jsonb('details').notNull().$defaultFn(() => ({})),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('lead_activities_lead_idx').on(t.leadId),
])

// ─── Relations ───────────────────────────────────────────────────────────────

export const leadsRelations = relations(leads, ({ one, many }) => ({
  productInterest: one(products, {
    fields: [leads.productInterestId],
    references: [products.id],
  }),
  activities: many(leadActivities),
}))

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
}))
