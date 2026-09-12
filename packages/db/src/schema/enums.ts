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
  'ACCESSORY',
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
  'MOTOR',
  'ESC',
  'BATTERY',
  'CHARGER',
  'SERVO_STEERING',
  'SERVO_THROTTLE',
  'RADIO',
  'RECEIVER',
  'TYRE_FRONT',
  'TYRE_REAR',
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
  'OTHER',
])

export const slotRequirementEnum = pgEnum('slot_requirement', [
  'REQUIRED',
  'RECOMMENDED',
  'OPTIONAL',
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

export const orderPaymentStatusEnum = pgEnum('order_payment_status', [
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED',
])

export const orderFulfilmentStatusEnum = pgEnum('order_fulfilment_status', [
  'PENDING',
  'PICKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
])
