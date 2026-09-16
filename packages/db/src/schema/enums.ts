// Drizzle schema: enums
// All PostgreSQL enum types used across the schema.

import { pgEnum } from 'drizzle-orm/pg-core'

export const productTierEnum = pgEnum('product_tier', [
  'STANDARD',
  'PREMIUM',
  'HALO',
  'COLLECTOR',
  'SPECIAL_ORDER',
])

export const recordStatusEnum = pgEnum('record_status', [
  'DRAFT',
  'REVIEW',
  'PUBLISHED',
  'ARCHIVED',
])

export const lifecycleStatusEnum = pgEnum('lifecycle_status', [
  'ACTIVE',
  'PREORDER',
  'SPECIAL_ORDER',
  'ALLOCATED',
  'DISCONTINUED',
  'REPLACED',
  'ARCHIVED',
])

export const dataConfidenceEnum = pgEnum('data_confidence', [
  'VERIFIED',
  'KNOWN',
  'INFERRED',
  'UNKNOWN',
])

export const brandTierEnum = pgEnum('brand_tier', [
  'FLAGSHIP',
  'PREMIUM_COMPETITION',
  'HALO_SCALE',
  'DRIFT',
  'ENGINES',
  'ELECTRONICS',
  'AFTERMARKET',
])

export const brandStatusEnum = pgEnum('brand_status', [
  'TARGET',
  'RESEARCHED',
  'CONTACTED',
  'APPROVED',
  'ACTIVE',
  'SUSPENDED',
  'DISCONTINUED',
])

export const supplyRouteEnum = pgEnum('supply_route', [
  'DIRECT_MANUFACTURER',
  'UK_DISTRIBUTOR',
  'US_DISTRIBUTOR',
  'GREY_IMPORT',
  'SPECIAL_ORDER',
  'ALLOCATION',
  'PREORDER',
])

export const availabilityStatusEnum = pgEnum('availability_status', [
  'IN_STOCK',
  'LOW_STOCK',
  'PRE_ORDER',
  'SPECIAL_ORDER',
  'OUT_OF_STOCK',
  'NOT_AVAILABLE',
  'ALLOCATED',
])

export const productTypeEnum = pgEnum('product_type', [
  'VEHICLE',
  'PART',
  'RTR_MACHINE',
  'KIT',
  'CHASSIS',
  'BODY',
  'MOTOR',
  'ESC',
  'SERVO',
  'RADIO_SYSTEM',
  'BATTERY',
  'CHARGER',
  'TYRE',
  'WHEEL',
  'SUSPENSION',
  'DRIVETRAIN',
  'AERODYNAMIC',
  'HARDWARE',
  'TOOLS',
  'ACCESSORY',
  'REPLACEMENT_PART',
  'OPTION_PART',
  'APPAREL',
  'COLLECTIBLE',
  'DOCUMENT_PRODUCT',
])

export const powerTypeEnum = pgEnum('power_type', [
  'ELECTRIC',
  'NITRO',
  'PETROL',
  'NONE',
])

export const driveConfigEnum = pgEnum('drive_config', [
  '2WD',
  '4WD',
  'AWD',
  'RWD',
])

export const compatibilityRuleTypeEnum = pgEnum('compatibility_rule_type', [
  'FITS',
  'RECOMMENDED_FOR',
  'REPLACES',
  'REQUIRES',
  'IMPROVES',
  'INCOMPATIBLE',
  'MATCHED_WITH',
  'RECOMMENDED',
  'REPLACEMENT',
  'OPTION',
  'UPGRADE',
  'REQUIRED',
  'COMPATIBLE',
  'RELATED',
])

export const documentTypeEnum = pgEnum('document_type', [
  'MANUAL',
  'EXPLODED_DIAGRAM',
  'SETUP_SHEET',
  'HOMOLOGATION',
  'TECHNICAL_SHEET',
  'INSTALLATION_GUIDE',
  'PARTS_LIST',
])

export const mediaTypeEnum = pgEnum('media_type', [
  'HERO',
  'GALLERY',
  'COMPONENT',
  'LIFESTYLE',
  'EXPLODED',
  'VIDEO',
  'THUMBNAIL',
])

export const licenceTypeEnum = pgEnum('licence_type', [
  'MANUFACTURER_PRESS',
  'LICENSED',
  'OWNED',
  'CREATIVE_COMMONS',
  'RESTRICTED',
])

export const storageProviderEnum = pgEnum('storage_provider', [
  'SUPABASE',
  'CLOUDINARY',
  'S3',
  'EXTERNAL',
])

export const sourceTypeEnum = pgEnum('source_type', [
  'MANUFACTURER_SPEC',
  'DISTRIBUTOR_CATALOGUE',
  'PRESS_RELEASE',
  'COMMUNITY',
  'MEASURED',
  'INFERRED',
])

export const buildTypeEnum = pgEnum('build_type', [
  'CUSTOMER_BUILD',
  'EDITORIAL_BUILD',
  'RACE_BUILD',
  'RECOMMENDED_BUILD',
])

export const buildSlotRoleEnum = pgEnum('build_slot_role', [
  'BASE_MACHINE',
  'MOTOR',
  'ESC',
  'BATTERY',
  'CHARGER',
  'SERVO_STEERING',
  'SERVO_THROTTLE',
  'RADIO',
  'RECEIVER',
  'TYRES',
  'TYRE_FRONT',
  'TYRE_REAR',
  'WHEELS',
  'WHEEL_FRONT',
  'WHEEL_REAR',
  'BODY',
  'ENGINE',
  'EXHAUST',
  'CLUTCH',
  'FLYWHEEL',
  'FUEL_TANK',
  'PINION_GEAR',
  'SPUR_GEAR',
  'DIFF_FLUID',
  'BEARING_SET',
  'TOOLS',
  'OPTION_PART',
  'OTHER',
])

export const slotRequirementEnum = pgEnum('slot_requirement', [
  'REQUIRED',
  'RECOMMENDED',
  'OPTIONAL',
  'NOT_APPLICABLE',
])

export const supplierTypeEnum = pgEnum('supplier_type', [
  'MANUFACTURER',
  'DISTRIBUTOR',
  'DEALER',
  'AGENT',
])

export const supplierStatusEnum = pgEnum('supplier_status', [
  'PROSPECT',
  'CONTACTED',
  'ACTIVE',
  'INACTIVE',
])

export const userRoleEnum = pgEnum('user_role', [
  'CUSTOMER',
  'CUSTOMER_SUPPORT',
  'CONTENT_EDITOR',
  'SUPPLIER_MANAGER',
  'CATALOGUE_ADMIN',
  'STAFF',
  'ADMIN',
  'SUPER_ADMIN',
])

export const taxModeEnum = pgEnum('tax_mode', ['INCLUSIVE', 'EXCLUSIVE'])

export const currencyEnum = pgEnum('currency', ['GBP', 'USD', 'EUR', 'AUD'])

export const marketCodeEnum = pgEnum('market_code', ['UK', 'US', 'EU', 'AU'])

export const usageScopeEnum = pgEnum('usage_scope', [
  'INTERNAL',
  'COMMERCIAL',
  'ALL',
])

export const basketStatusEnum = pgEnum('basket_status', [
  'ACTIVE',
  'CHECKOUT_PENDING',
  'CONVERTED',
  'ABANDONED',
  'EXPIRED',
])

export const orderPaymentStatusEnum = pgEnum('order_payment_status', [
  'PENDING',
  'PENDING_PAYMENT',
  'PAID',
  'FAILED',
  'PAYMENT_FAILED',
  'CANCELLED',
  'PAYMENT_CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
])

export const orderFulfilmentStatusEnum = pgEnum('order_fulfilment_status', [
  'PENDING',
  'UNFULFILLED',
  'PROCESSING',
  'PACKED',
  'PICKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
])

export const vehicleStatusEnum = pgEnum('vehicle_status', [
  'ACTIVE',
  'STORED',
  'SOLD',
  'ARCHIVED',
])

export const serviceTypeEnum = pgEnum('service_type', [
  'SETUP',
  'MAINTENANCE',
  'REPAIR',
  'UPGRADE',
  'INSPECTION',
  'OTHER',
])

export const haloBuildTypeEnum = pgEnum('halo_build_type', [
  'HALO_BUILD',
  'RACE_BUILD',
  'CLUB_BUILD',
  'BASELINE_BUILD',
])

export const haloBuildStatusEnum = pgEnum('halo_build_status', [
  'DRAFT',
  'REVIEW',
  'PUBLISHED',
  'RETIRED',
])

export const haloBuildProvenanceEnum = pgEnum('halo_build_provenance', [
  'HALO_ENGINEERED',
  'MANUFACTURER_BASED',
  'CUSTOMER_CONFIGURED',
  'RESEARCH_BASED',
])

export const raceDisciplineEnum = pgEnum('race_discipline', [
  'TOURING',
  'OFF_ROAD',
  'BUGGY',
  'SHORT_COURSE',
  'ROCK_CRAWLER',
  'DRIFT',
  'FORMULA',
  'GT',
  'LARGE_SCALE',
  'OTHER',
])

export const haloBuildSubsystemEnum = pgEnum('halo_build_subsystem', [
  'CHASSIS',
  'POWERTRAIN',
  'CONTROL',
  'ENERGY',
  'AERODYNAMICS',
  'RUNNING_GEAR',
  'HARDWARE',
])

// ─── Phase 8: Procurement & Supplier Integrations Enums ───────────────────────

export const supplierIntegrationTypeEnum = pgEnum('supplier_integration_type', [
  'MANUAL',
  'CSV',
  'XML',
  'JSON_API',
  'REST_API',
  'SFTP',
  'WEBHOOK',
  'ERP',
  'DISTRIBUTOR_FEED',
])

export const supplierMatchMethodEnum = pgEnum('supplier_match_method', [
  'EXACT_SKU',
  'EXACT_PART_NUMBER',
  'EXACT_GTIN',
  'EXPLICIT_MAPPING',
  'MANUAL_REVIEW',
])

export const supplierMappingStatusEnum = pgEnum('supplier_mapping_status', [
  'UNMATCHED',
  'PENDING_REVIEW',
  'MATCHED',
  'REJECTED',
  'SUPERSEDED',
])

export const inventoryAuthorityEnum = pgEnum('inventory_authority', [
  'OWN_STOCK',
  'SUPPLIER_STOCK',
  'UNKNOWN',
])

export const dataFreshnessStateEnum = pgEnum('data_freshness_state', [
  'FRESH',
  'STALE',
  'EXPIRED',
  'UNKNOWN',
])

export const supplierSyncStatusEnum = pgEnum('supplier_sync_status', [
  'RUNNING',
  'COMPLETED',
  'PARTIAL',
  'FAILED',
])

export const supplierChangeTypeEnum = pgEnum('supplier_change_type', [
  'COST_CHANGED',
  'AVAILABILITY_CHANGED',
  'RRP_CHANGED',
  'SKU_CHANGED',
  'DISCONTINUED_BY_SUPPLIER',
  'REMOVED_FROM_FEED',
])

// ─── Phase 9: International Markets & Shipping Enums ──────────────────────────

export const taxDisplayModeEnum = pgEnum('tax_display_mode', [
  'TAX_INCLUDED',
  'TAX_EXCLUDED',
  'TAX_CALCULATED_AT_CHECKOUT',
  'TAX_NOT_APPLICABLE',
  'TAX_UNKNOWN',
])

export const measurementSystemEnum = pgEnum('measurement_system', [
  'METRIC',
  'IMPERIAL',
])

export const shippingRegionEnum = pgEnum('shipping_region', [
  'UK_DOMESTIC',
  'US_DOMESTIC',
])

export const shippingRestrictionTypeEnum = pgEnum('shipping_restriction_type', [
  'BATTERY_HAZMAT',
  'OVERSIZE_FREIGHT',
  'PROHIBITED_IMPORT',
])

// ─── Admin Platform Foundation Enums ─────────────────────────────────────────

export const leadStatusEnum = pgEnum('lead_status', [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'QUOTED',
  'WON',
  'LOST',
  'ARCHIVED',
])

export const leadSourceEnum = pgEnum('lead_source', [
  'PRODUCT_ENQUIRY',
  'CONTACT_FORM',
  'QUOTE_REQUEST',
  'COMPATIBILITY_QUESTION',
  'TRADE_ENQUIRY',
  'SUPPLIER_ENQUIRY',
  'NEWSLETTER',
  'OTHER',
])

export const leadPriorityEnum = pgEnum('lead_priority', [
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
])

export const cmsPageTypeEnum = pgEnum('cms_page_type', [
  'BRAND',
  'BUYING_GUIDE',
  'EDITORIAL',
  'LANDING',
  'ABOUT',
  'SHIPPING',
  'RETURNS',
  'CONTACT',
  'OTHER',
])

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'UPDATE',
  'DELETE',
  'PUBLISH',
  'UNPUBLISH',
  'ARCHIVE',
  'STATUS_CHANGE',
  'PRICE_CHANGE',
])

export const aiSuggestionTypeEnum = pgEnum('ai_suggestion_type', [
  'DESCRIPTION',
  'SHORT_DESCRIPTION',
  'SEO_TITLE',
  'META_DESCRIPTION',
  'FEATURES',
  'COLLECTION_DESCRIPTION',
])

export const aiSuggestionStatusEnum = pgEnum('ai_suggestion_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
])

export const homepageSectionTypeEnum = pgEnum('homepage_section_type', [
  'HERO',
  'FEATURED_MACHINES',
  'FEATURED_BRANDS',
  'EDITORIAL',
  'PROMOTIONAL',
  'COLLECTIONS',
  'HALO_PRODUCT',
  'BUYING_GUIDE',
])

export const supplierFeedTypeEnum = pgEnum('supplier_feed_type', [
  'CATALOGUE',
  'STOCK',
  'PRICE',
  'IMAGE',
  'ORDER_STATUS',
])

export const supplierFeedFormatEnum = pgEnum('supplier_feed_format', [
  'CSV',
  'XML',
  'JSON',
  'REST_API',
  'MANUAL_UPLOAD',
])

export const supplierAuthTypeEnum = pgEnum('supplier_auth_type', [
  'NONE',
  'BASIC',
  'API_KEY',
  'BEARER_TOKEN',
  'OAUTH2',
  'SFTP',
])

export const supplierExceptionSeverityEnum = pgEnum('supplier_exception_severity', [
  'WARNING',
  'ERROR',
  'CRITICAL',
])

export const supplierExceptionStatusEnum = pgEnum('supplier_exception_status', [
  'OPEN',
  'RESOLVED',
  'IGNORED',
])





