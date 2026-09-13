import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  index,
  primaryKey,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { brands, markets } from './brands'
import { products, productVariants } from './products'
import {
  marketCodeEnum,
  availabilityStatusEnum,
  supplierTypeEnum,
  supplierStatusEnum,
  supplyRouteEnum,
  supplierIntegrationTypeEnum,
  supplierMatchMethodEnum,
  supplierMappingStatusEnum,
  inventoryAuthorityEnum,
  dataFreshnessStateEnum,
  supplierSyncStatusEnum,
  supplierChangeTypeEnum,
} from './enums'

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  legalName: text('legal_name'),
  type: supplierTypeEnum('type').notNull(),
  country: text('country').notNull(),
  website: text('website'),
  accountReference: text('account_reference'),
  status: supplierStatusEnum('status').notNull().default('PROSPECT'),
  relationshipStatus: text('relationship_status').notNull().default('ACTIVE'),
  currency: text('currency').notNull().default('GBP'),
  vatStatus: text('vat_status'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  integrationType: supplierIntegrationTypeEnum('integration_type').notNull().default('MANUAL'),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Supplier Contacts ────────────────────────────────────────────────────────

export const supplierContacts = pgTable('supplier_contacts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role'),
  email: text('email'), // encrypted at application layer before storage
  phone: text('phone'), // encrypted at application layer before storage
  isPrimary: boolean('is_primary').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_contacts_supplier_idx').on(t.supplierId),
])

// ─── Supplier Brand Relationships ─────────────────────────────────────────────

export const supplierBrandRelationships = pgTable('supplier_brand_relationships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  brandId: text('brand_id').notNull().references(() => brands.id),
  marketCode: marketCodeEnum('market_code').notNull().references(() => markets.code),
  exclusive: boolean('exclusive').notNull().default(false),
  supplyRoute: supplyRouteEnum('supply_route'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | INACTIVE | NEGOTIATING
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_brand_supplier_idx').on(t.supplierId),
  index('supplier_brand_brand_idx').on(t.brandId),
])

// ─── Supplier Terms ───────────────────────────────────────────────────────────
// COMMERCIALLY SENSITIVE — service_role access only via RLS
// Never exposed to public API under any circumstances

export const supplierTerms = pgTable('supplier_terms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  brandId: text('brand_id').references(() => brands.id),
  marketCode: marketCodeEnum('market_code').references(() => markets.code),
  openingOrderMin: integer('opening_order_min'), // in minor units
  minimumOrderQty: integer('minimum_order_qty'),
  creditTermsDays: integer('credit_terms_days'),
  paymentMethod: text('payment_method'),
  mapPolicy: boolean('map_policy').notNull().default(false), // minimum advertised price
  dropshipAvailable: boolean('dropship_available').notNull().default(false),
  preorderAvailable: boolean('preorder_available').notNull().default(false),
  allocationModel: text('allocation_model'),
  notes: text('notes'),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Supplier Documents ───────────────────────────────────────────────────────

export const supplierDocuments = pgTable('supplier_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(), // PRICE_LIST | TERMS | CATALOGUE | AGREEMENT
  title: text('title').notNull(),
  version: text('version'),
  storagePath: text('storage_path'),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Supplier Activity Log ────────────────────────────────────────────────────

export const supplierActivityLog = pgTable('supplier_activity_log', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
  activityType: text('activity_type').notNull(), // CALL | EMAIL | MEETING | ORDER | NOTE
  summary: text('summary').notNull(),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_activity_supplier_idx').on(t.supplierId),
])

// ─── Phase 8: Procurement & Supplier Integrations Tables ──────────────────────

export const supplierIntegrations = pgTable('supplier_integrations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  integrationType: supplierIntegrationTypeEnum('integration_type').notNull().default('MANUAL'),
  config: jsonb('config').notNull().$defaultFn(() => ({})),
  scheduleCron: text('schedule_cron'),
  isActive: boolean('is_active').notNull().default(true),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_integrations_supplier_idx').on(t.supplierId),
])

export const supplierProductMappings = pgTable('supplier_product_mappings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  supplierSku: text('supplier_sku').notNull(),
  canonicalProductId: text('canonical_product_id').references(() => products.id, { onDelete: 'set null' }),
  canonicalVariantId: text('canonical_variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  matchMethod: supplierMatchMethodEnum('match_method'),
  matchConfidence: text('match_confidence').notNull().default('UNVERIFIED'),
  status: supplierMappingStatusEnum('status').notNull().default('UNMATCHED'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  rawTitle: text('raw_title'),
  rawBrand: text('raw_brand'),
  rawCostMinorUnits: integer('raw_cost_minor_units'),
  rawCurrency: text('raw_currency'),
  sourcePayload: jsonb('source_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_mappings_supplier_sku_idx').on(t.supplierId, t.supplierSku),
  index('supplier_mappings_canonical_idx').on(t.canonicalProductId),
  index('supplier_mappings_status_idx').on(t.status),
])

export const supplierOffers = pgTable('supplier_offers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  canonicalProductId: text('canonical_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  canonicalVariantId: text('canonical_variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  supplierSku: text('supplier_sku').notNull(),
  costMinorUnits: integer('cost_minor_units').notNull(),
  currency: text('currency').notNull().default('GBP'),
  supplierRrpMinorUnits: integer('supplier_rrp_minor_units'),
  availability: availabilityStatusEnum('availability').notNull().default('NOT_AVAILABLE'),
  inventoryAuthority: inventoryAuthorityEnum('inventory_authority').notNull().default('SUPPLIER_STOCK'),
  quantity: integer('quantity'),
  leadTimeDays: integer('lead_time_days'),
  leadTimeText: text('lead_time_text'),
  marketCode: marketCodeEnum('market_code').notNull().default('UK'),
  freshnessState: dataFreshnessStateEnum('freshness_state').notNull().default('FRESH'),
  lastCheckedAt: timestamp('last_checked_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_offers_product_idx').on(t.canonicalProductId),
  index('supplier_offers_supplier_idx').on(t.supplierId),
  index('supplier_offers_market_idx').on(t.marketCode),
])

export const supplierSyncRuns = pgTable('supplier_sync_runs', {
  runId: text('run_id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  integrationType: supplierIntegrationTypeEnum('integration_type').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  status: supplierSyncStatusEnum('status').notNull().default('RUNNING'),
  recordsReceived: integer('records_received').notNull().default(0),
  recordsProcessed: integer('records_processed').notNull().default(0),
  recordsMatched: integer('records_matched').notNull().default(0),
  recordsUnmatched: integer('records_unmatched').notNull().default(0),
  recordsChanged: integer('records_changed').notNull().default(0),
  recordsRejected: integer('records_rejected').notNull().default(0),
  errors: jsonb('errors').notNull().$defaultFn(() => []),
  warnings: jsonb('warnings').notNull().$defaultFn(() => []),
}, (t) => [
  index('supplier_sync_runs_supplier_idx').on(t.supplierId),
  index('supplier_sync_runs_started_idx').on(t.startedAt),
])

export const supplierChangeEvents = pgTable('supplier_change_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  supplierSku: text('supplier_sku').notNull(),
  canonicalProductId: text('canonical_product_id').references(() => products.id, { onDelete: 'set null' }),
  changeType: supplierChangeTypeEnum('change_type').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  details: text('details'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supplier_change_events_supplier_idx').on(t.supplierId),
  index('supplier_change_events_detected_idx').on(t.detectedAt),
])

// ─── Relations ────────────────────────────────────────────────────────────────

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  contacts: many(supplierContacts),
  brandRelationships: many(supplierBrandRelationships),
  terms: many(supplierTerms),
  documents: many(supplierDocuments),
  activityLog: many(supplierActivityLog),
  integrations: many(supplierIntegrations),
  mappings: many(supplierProductMappings),
  offers: many(supplierOffers),
  syncRuns: many(supplierSyncRuns),
  changeEvents: many(supplierChangeEvents),
}))

// ─── Phase 11: Supplier Network & Trade Accounts Schema ───────────────────────

export const supplierTerritoryCoverages = pgTable('supplier_territory_coverages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  territory: text('territory').notNull(),
  state: text('state').notNull().default('SUPPORTED'),
  restrictionReason: text('restriction_reason'),
  notes: text('notes'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: text('verified_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('supp_terr_supplier_idx').on(t.supplierId),
  index('supp_terr_territory_idx').on(t.territory),
])

export const brandSupplierRelationships = pgTable('brand_supplier_relationships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  brandId: text('brand_id').notNull().references(() => brands.id, { onDelete: 'cascade' }),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull(),
  verificationStatus: text('verification_status').notNull().default('UNVERIFIED'),
  isExclusive: boolean('is_exclusive').notNull().default(false),
  exclusivityScope: text('exclusivity_scope'),
  territory: text('territory').notNull().default('UK'),
  evidenceSourceType: text('evidence_source_type').notNull().default('OTHER'),
  evidenceUrl: text('evidence_url'),
  evidenceNotes: text('evidence_notes'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: text('verified_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('bsr_brand_idx').on(t.brandId),
  index('bsr_supplier_idx').on(t.supplierId),
  index('bsr_verification_idx').on(t.verificationStatus),
])

export const tradeAccountApplications = pgTable('trade_account_applications', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  applicantEntityName: text('applicant_entity_name').notNull().default('Halo RC Ltd'),
  status: text('status').notNull().default('RESEARCHING'),
  stage: text('stage').notNull().default('IDENTIFIED'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectedAt: timestamp('rejected_at', { withTimezone: true }),
  assignedTo: text('assigned_to'),
  accountReference: text('account_reference'),
  creditLimitMinorUnits: integer('credit_limit_minor_units'),
  creditCurrency: text('credit_currency'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('taa_supplier_idx').on(t.supplierId),
  index('taa_status_idx').on(t.status),
  index('taa_stage_idx').on(t.stage),
])

export const tradeAccountRequirements = pgTable('trade_account_requirements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  applicationId: text('application_id').notNull().references(() => tradeAccountApplications.id, { onDelete: 'cascade' }),
  requirementType: text('requirement_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('PENDING'),
  documentId: text('document_id'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: text('verified_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('tar_application_idx').on(t.applicationId),
])

export const supplierCommercialTerms = pgTable('supplier_commercial_terms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  currency: text('currency').notNull().default('GBP'),
  paymentTerms: text('payment_terms').notNull().default('PREPAYMENT'),
  paymentTermsDays: integer('payment_terms_days'),
  earlyPaymentDiscountPercent: integer('early_payment_discount_percent'),
  minimumOrderQuantityUnits: integer('minimum_order_quantity_units'),
  minimumOrderValueMinorUnits: integer('minimum_order_value_minor_units'),
  freeFreightThresholdMinorUnits: integer('free_freight_threshold_minor_units'),
  standardDiscountTierPercent: integer('standard_discount_tier_percent'),
  dropShipAvailable: boolean('drop_ship_available').notNull().default(false),
  dropShipFeeMinorUnits: integer('drop_ship_fee_minor_units'),
  orderingMethod: text('ordering_method'),
  isVerified: boolean('is_verified').notNull().default(false),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: text('verified_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('sct_supplier_idx').on(t.supplierId),
])

export const supplierPricingPolicies = pgTable('supplier_pricing_policies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  brandId: text('brand_id').references(() => brands.id, { onDelete: 'cascade' }),
  policyType: text('policy_type').notNull().default('RRP'),
  enforcementLevel: text('enforcement_level').notNull().default('STRICT'),
  minimumAdvertisedPricePercent: integer('minimum_advertised_price_percent'),
  policyUrl: text('policy_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('spp_supplier_idx').on(t.supplierId),
])

export const procurementTasks = pgTable('procurement_tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  taskType: text('task_type').notNull().default('CONTACT_SUPPLIER'),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('OPEN'),
  priority: text('priority').notNull().default('MEDIUM'),
  dueDate: text('due_date'),
  assignedTo: text('assigned_to'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('ptasks_supplier_idx').on(t.supplierId),
  index('ptasks_status_idx').on(t.status),
])


