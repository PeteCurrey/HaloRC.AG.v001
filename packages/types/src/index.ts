// ─── Market & Commerce ───────────────────────────────────────────────────────

export type MarketCode = 'UK' | 'US'
export type Currency = 'GBP' | 'USD'
export type TaxMode = 'INCLUSIVE' | 'EXCLUSIVE'

export interface Market {
  code: MarketCode
  name: string
  currency: Currency
  taxMode: TaxMode
  active: boolean
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ProductTier =
  | 'STANDARD'
  | 'PREMIUM'
  | 'HALO'
  | 'COLLECTOR'
  | 'SPECIAL_ORDER'

export type RecordStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'

export type LifecycleStatus =
  | 'ACTIVE'
  | 'PREORDER'
  | 'SPECIAL_ORDER'
  | 'ALLOCATED'
  | 'DISCONTINUED'
  | 'REPLACED'
  | 'ARCHIVED'

export type DataConfidence = 'VERIFIED' | 'KNOWN' | 'INFERRED' | 'UNKNOWN'

export type BrandTier =
  | 'FLAGSHIP'
  | 'PREMIUM_COMPETITION'
  | 'HALO_SCALE'
  | 'DRIFT'
  | 'ENGINES'
  | 'ELECTRONICS'
  | 'AFTERMARKET'

export type BrandStatus =
  | 'TARGET'
  | 'RESEARCHED'
  | 'CONTACTED'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DISCONTINUED'

export type SupplyRoute =
  | 'DIRECT_MANUFACTURER'
  | 'UK_DISTRIBUTOR'
  | 'US_DISTRIBUTOR'
  | 'GREY_IMPORT'
  | 'SPECIAL_ORDER'
  | 'ALLOCATION'
  | 'PREORDER'

export type AvailabilityStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'PRE_ORDER'
  | 'SPECIAL_ORDER'
  | 'OUT_OF_STOCK'
  | 'NOT_AVAILABLE'
  | 'ALLOCATED'

export type ProductType =
  | 'VEHICLE'
  | 'PART'
  | 'ACCESSORY'
  | 'APPAREL'
  | 'COLLECTIBLE'
  | 'DOCUMENT_PRODUCT'

export type PowerType = 'ELECTRIC' | 'NITRO' | 'PETROL' | 'NONE'
export type DriveConfig = '2WD' | '4WD' | 'AWD' | 'RWD'

export type CompatibilityRuleType =
  | 'FITS'
  | 'RECOMMENDED_FOR'
  | 'REPLACES'
  | 'REQUIRES'
  | 'IMPROVES'
  | 'INCOMPATIBLE'
  | 'MATCHED_WITH'

export type DocumentType =
  | 'MANUAL'
  | 'EXPLODED_DIAGRAM'
  | 'SETUP_SHEET'
  | 'HOMOLOGATION'
  | 'TECHNICAL_SHEET'
  | 'INSTALLATION_GUIDE'
  | 'PARTS_LIST'

export type MediaType =
  | 'HERO'
  | 'GALLERY'
  | 'COMPONENT'
  | 'LIFESTYLE'
  | 'EXPLODED'
  | 'VIDEO'
  | 'THUMBNAIL'

export type LicenceType =
  | 'MANUFACTURER_PRESS'
  | 'LICENSED'
  | 'OWNED'
  | 'CREATIVE_COMMONS'
  | 'RESTRICTED'

export type StorageProvider = 'SUPABASE' | 'CLOUDINARY' | 'S3' | 'EXTERNAL'

export type SourceType =
  | 'MANUFACTURER_SPEC'
  | 'DISTRIBUTOR_CATALOGUE'
  | 'PRESS_RELEASE'
  | 'COMMUNITY'
  | 'MEASURED'
  | 'INFERRED'

export type BuildType =
  | 'CUSTOMER_BUILD'
  | 'EDITORIAL_BUILD'
  | 'RACE_BUILD'
  | 'RECOMMENDED_BUILD'

export type BuildSlotRole =
  | 'MOTOR'
  | 'ESC'
  | 'BATTERY'
  | 'CHARGER'
  | 'SERVO_STEERING'
  | 'SERVO_THROTTLE'
  | 'RADIO'
  | 'RECEIVER'
  | 'TYRE_FRONT'
  | 'TYRE_REAR'
  | 'WHEEL_FRONT'
  | 'WHEEL_REAR'
  | 'BODY'
  | 'ENGINE'
  | 'EXHAUST'
  | 'CLUTCH'
  | 'FLYWHEEL'
  | 'FUEL_TANK'
  | 'PINION_GEAR'
  | 'SPUR_GEAR'
  | 'DIFF_FLUID'
  | 'BEARING_SET'
  | 'TOOLS'
  | 'OTHER'

export type SlotRequirement = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL'

export type SupplierType =
  | 'MANUFACTURER'
  | 'DISTRIBUTOR'
  | 'DEALER'
  | 'AGENT'

export type SupplierStatus =
  | 'PROSPECT'
  | 'CONTACTED'
  | 'ACTIVE'
  | 'INACTIVE'

export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN'

// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Brand {
  id: string
  slug: string
  name: string
  tier: BrandTier
  status: BrandStatus
  countryOfOrigin: string | null
  foundedYear: number | null
  description: string | null
  website: string | null
  createdAt: Date
  updatedAt: Date
}

export interface VehiclePlatform {
  id: string
  slug: string
  name: string
  brandId: string
  chassisMaterial: string | null
  driveConfig: DriveConfig | null
  wheelbaseMm: number | null
  description: string | null
  status: RecordStatus
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  slug: string
  sku: string | null
  brandId: string
  platformId: string | null
  name: string
  shortName: string | null
  categoryId: string | null
  subcategoryId: string | null
  scale: string | null
  powerType: PowerType | null
  productType: ProductType
  tier: ProductTier
  status: RecordStatus
  lifecycle: LifecycleStatus
  replacementProductId: string | null
  haloClassification: string | null
  editorialSummary: string | null
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ProductVariant {
  id: string
  productId: string
  sku: string | null
  name: string
  colour: string | null
  configuration: string | null
  weightG: number | null
  status: RecordStatus
  lifecycle: LifecycleStatus
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface MarketOffer {
  id: string
  productVariantId: string
  marketCode: MarketCode
  retailPrice: number // in minor units (pence / cents)
  currency: Currency
  taxMode: TaxMode
  availability: AvailabilityStatus
  supplierId: string | null
  supplyRoute: SupplyRoute | null
  leadTimeDays: number | null
  preorderDate: Date | null
  allocationQty: number | null
  notes: string | null
  updatedAt: Date
}

export interface Specification {
  id: string
  entityType: string
  entityId: string
  key: string
  value: string
  unit: string | null
  confidence: DataConfidence
  sourceType: SourceType | null
  sourceUrl: string | null
  sourceDocument: string | null
  sourceDate: Date | null
  verifiedBy: string | null
  verifiedAt: Date | null
  notes: string | null
}

export interface MediaAsset {
  id: string
  entityType: string
  entityId: string
  mediaType: MediaType
  storageProvider: StorageProvider
  storagePath: string | null
  sourceUrl: string | null
  altText: string
  caption: string | null
  credit: string | null
  licenceType: LicenceType
  licenceSource: string | null
  usageScope: 'INTERNAL' | 'COMMERCIAL' | 'ALL'
  approvedForCommercialUse: boolean
  focalPointX: number
  focalPointY: number
  widthPx: number | null
  heightPx: number | null
  sortOrder: number
  status: RecordStatus
  createdAt: Date
}

export interface CompatibilityRule {
  id: string
  sourceEntityType: string
  sourceEntityId: string
  targetEntityType: string
  targetEntityId: string
  ruleType: CompatibilityRuleType
  verified: boolean
  sourceType: SourceType | null
  sourceUrl: string | null
  verifiedBy: string | null
  verifiedAt: Date | null
  notes: string | null
}

// ─── UI / Presentation Types ──────────────────────────────────────────────────

export interface PriceDisplay {
  amount: number // minor units
  currency: Currency
  taxMode: TaxMode
  formatted: string // e.g. "£2,499.00 inc. VAT" or "$1,899.00 excl. tax"
}

export interface ProductCardData {
  id: string
  slug: string
  name: string
  shortName: string | null
  brand: { name: string; slug: string }
  tier: ProductTier
  lifecycle: LifecycleStatus
  heroImage: MediaAsset | null
  price: PriceDisplay | null
  availability: AvailabilityStatus | null
  scale: string | null
  powerType: PowerType | null
  haloClassification: string | null
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string
  slug: string
  name: string
  type: 'product' | 'brand' | 'platform' | 'guide'
  brand?: string
  category?: string
  tier?: ProductTier
  heroImageUrl?: string
  price?: PriceDisplay
}

export interface SearchFilters {
  market: MarketCode
  query?: string
  tier?: ProductTier[]
  brand?: string[]
  category?: string[]
  scale?: string[]
  powerType?: PowerType[]
  availability?: AvailabilityStatus[]
  priceMin?: number
  priceMax?: number
}
