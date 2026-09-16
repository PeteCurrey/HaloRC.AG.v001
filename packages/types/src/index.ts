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
  | 'RTR_MACHINE'
  | 'KIT'
  | 'CHASSIS'
  | 'BODY'
  | 'MOTOR'
  | 'ESC'
  | 'SERVO'
  | 'RADIO_SYSTEM'
  | 'BATTERY'
  | 'CHARGER'
  | 'TYRE'
  | 'WHEEL'
  | 'SUSPENSION'
  | 'DRIVETRAIN'
  | 'AERODYNAMIC'
  | 'HARDWARE'
  | 'TOOLS'
  | 'ACCESSORY'
  | 'REPLACEMENT_PART'
  | 'OPTION_PART'
  | 'APPAREL'
  | 'COLLECTIBLE'
  | 'DOCUMENT_PRODUCT'

export type Discipline =
  | 'BASH'
  | 'RACE'
  | 'DRIFT'
  | 'CRAWL'
  | 'SCALE'
  | 'LARGE_SCALE'

export type CommercialRelationship =
  | 'OFFICIAL_DEALER'
  | 'DISTRIBUTOR_SOURCED'
  | 'INDEPENDENT'
  | 'RESEARCHED'

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
  | 'RECOMMENDED'
  | 'REPLACEMENT'
  | 'OPTION'
  | 'UPGRADE'
  | 'REQUIRED'
  | 'COMPATIBLE'
  | 'RELATED'

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
  | 'BASE_MACHINE'
  | 'MOTOR'
  | 'ESC'
  | 'BATTERY'
  | 'CHARGER'
  | 'SERVO_STEERING'
  | 'SERVO_THROTTLE'
  | 'RADIO'
  | 'RECEIVER'
  | 'TYRES'
  | 'TYRE_FRONT'
  | 'TYRE_REAR'
  | 'WHEELS'
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
  | 'OPTION_PART'
  | 'OTHER'

export type SlotRequirement = 'REQUIRED' | 'RECOMMENDED' | 'OPTIONAL' | 'NOT_APPLICABLE'

export type BuildStatus = 'DRAFT' | 'INCOMPLETE' | 'COMPLETE' | 'INVALID'

export type PriceState = 'KNOWN_PRICE' | 'NOT_AVAILABLE' | 'PRICE_UNAVAILABLE'

export type CompatibilityState = 'VALID' | 'INVALID' | 'CONFLICT'

export type SlotState = 'EMPTY' | 'SELECTED' | 'INVALID' | 'UNAVAILABLE'

export type SupplierType =
  | 'MANUFACTURER'
  | 'UK_DISTRIBUTOR'
  | 'EU_DISTRIBUTOR'
  | 'US_DISTRIBUTOR'
  | 'WHOLESALER'
  | 'TRADE_SUPPLIER'
  | 'DIRECT_BRAND'
  | 'MARKETPLACE'
  | 'RESEARCH_SOURCE'
  | 'DISTRIBUTOR'
  | 'DEALER'
  | 'AGENT'

export type SupplierStatus =
  | 'PROSPECT'
  | 'CONTACTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'APPLIED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'CLOSED'

export type UserRole =
  | 'CUSTOMER'
  | 'CUSTOMER_SUPPORT'
  | 'CONTENT_EDITOR'
  | 'SUPPLIER_MANAGER'
  | 'CATALOGUE_ADMIN'
  | 'STAFF'
  | 'ADMIN'
  | 'SUPER_ADMIN'

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
  commercialRelationship?: CommercialRelationship
  specialisms?: string[]
  disciplines?: Discipline[]
  createdAt: Date
  updatedAt: Date
}

export interface ConfiguratorSlot {
  role: BuildSlotRole
  name: string
  requirement: SlotRequirement
  description?: string
  compatibleProductIds: string[]
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

// ─── Build My Rig Domain Interfaces ──────────────────────────────────────────

export interface BuildComponentOffer {
  id: string
  productVariantId: string
  marketCode: MarketCode
  retailPriceMinorUnits: number
  currency: string
  taxMode: TaxMode
  availability: AvailabilityStatus
  leadTimeDays: number | null
  supplyRoute: string | null
}

export interface BuildCandidateProduct {
  id: string
  name: string
  shortName: string
  sku: string
  slug: string
  tier: ProductTier
  productType: ProductType
  brandName: string
  ruleType: CompatibilityRuleType
  compatibilityReason?: string | null
  offer: BuildComponentOffer | null
  lifecycle: LifecycleStatus
  isRecommended: boolean
  replacement?: {
    id: string
    name: string
    sku: string
    slug: string
  } | null
}

export interface ConfiguredBuildSlot {
  role: BuildSlotRole
  name: string
  description?: string
  requirement: SlotRequirement
  selectedProduct: BuildCandidateProduct | null
  compatibleProducts: BuildCandidateProduct[]
  slotState: SlotState
  validationError?: string | null
}

export interface ConfiguredBuildMachine {
  id: string
  slug: string
  sku: string
  name: string
  shortName: string
  brandName: string
  tier: ProductTier
  scale?: string | null
  powerType?: string | null
  platformName?: string | null
  productType: ProductType
  discipline: Discipline
  editorialSummary: string
  offer: BuildComponentOffer | null
}

export interface ConfiguredBuild {
  id: string
  machine: ConfiguredBuildMachine | null
  marketCode: MarketCode
  status: BuildStatus
  slots: ConfiguredBuildSlot[]
  totalMinorUnits: number | null
  currency: Currency
  taxMode: TaxMode
  priceState: PriceState
  completeness: {
    isComplete: boolean
    totalRequiredSlots: number
    completedRequiredSlots: number
    missingRequiredSlots: BuildSlotRole[]
    invalidSlots: BuildSlotRole[]
    unavailableSlots: BuildSlotRole[]
  }
  createdAt: string
  updatedAt: string
}

// ─── Phase 4: My Garage & Persistent Vehicle Record Types ─────────────────────

export type VehicleStatus = 'ACTIVE' | 'STORED' | 'SOLD' | 'ARCHIVED'

export type ServiceType =
  | 'SETUP'
  | 'MAINTENANCE'
  | 'REPAIR'
  | 'UPGRADE'
  | 'INSPECTION'
  | 'OTHER'

export interface GarageRecord {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface GarageVehicleRecord {
  id: string
  garageId: string
  productId: string | null
  platformId: string | null
  variantId: string | null
  name: string
  nickname: string | null
  colour: string | null
  purchaseDate: string | null
  serialNumber: string | null
  qrCodeToken: string
  isPublic: boolean
  status: VehicleStatus
  notes: string | null
  createdAt: string
  updatedAt: string
  // Authoritative catalogue references when linked
  product?: {
    id: string
    slug: string
    sku: string
    name: string
    brandName: string
    productType: ProductType
    scale: string | null
    powerType: PowerType | null
    discipline: Discipline
  } | null
  platform?: {
    id: string
    name: string
    slug: string
  } | null
}

export interface SavedBuildSlotSnapshot {
  role: BuildSlotRole
  productId: string
  variantId?: string | null
  productName: string
  sku: string
  unitPriceMinorUnits: number | null
  currency: Currency
  taxMode: TaxMode
  lifecycleAtSave: LifecycleStatus
}

export interface SavedBuildSnapshot {
  machineId: string
  machineName: string
  machineSku: string
  marketCode: MarketCode
  currency: Currency
  taxMode: TaxMode
  buildStatus: BuildStatus
  totalMinorUnits: number | null
  priceState: PriceState
  slots: Record<string, SavedBuildSlotSnapshot>
  savedAt: string
}

export interface SavedBuildRecord {
  id: string
  garageVehicleId: string
  buildId: string | null
  name: string
  status: 'CONCEPT' | 'ACTIVE' | 'RETIRED'
  notes: string | null
  snapshot: SavedBuildSnapshot
  createdAt: string
  updatedAt: string
}

export interface GarageServiceRecord {
  id: string
  garageVehicleId: string
  date: string
  serviceType: ServiceType
  title: string
  description: string
  partsUsed: Array<{
    productId?: string
    sku?: string
    name?: string
  }> | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface PublicVehicleIdentity {
  token: string
  isPublic: boolean
  vehicleName: string
  platformName: string | null
  machineName: string | null
  brandName: string | null
  scale: string | null
  discipline: Discipline | null
  specifications: Array<{
    key: string
    value: string
    unit: string | null
  }>
  publicBuildSummary?: {
    motor?: string | null
    esc?: string | null
    servo?: string | null
  } | null
}

export interface CreateVehicleInput {
  garageId?: string
  productId?: string | null
  platformId?: string | null
  variantId?: string | null
  name: string
  nickname?: string | null
  colour?: string | null
  purchaseDate?: string | null
  serialNumber?: string | null
  status?: VehicleStatus
  notes?: string | null
  isPublic?: boolean
}

export interface UpdateVehicleInput {
  name?: string
  nickname?: string | null
  colour?: string | null
  purchaseDate?: string | null
  serialNumber?: string | null
  status?: VehicleStatus
  notes?: string | null
  isPublic?: boolean
}

export interface CreateServiceRecordInput {
  date: string
  serviceType: ServiceType
  title: string
  description: string
  partsUsed?: Array<{
    productId?: string
    sku?: string
    name?: string
  }> | null
  notes?: string | null
}

export interface SaveBuildInput {
  garageVehicleId: string
  name: string
  marketCode: MarketCode
  configuredBuild: ConfiguredBuild
  notes?: string | null
}

// ─── Phase 5: Commerce, Basket, Stripe Checkout & Order Management Types ──────

export type BasketStatus =
  | 'ACTIVE'
  | 'CHECKOUT_PENDING'
  | 'CONVERTED'
  | 'ABANDONED'
  | 'EXPIRED'

/**
 * Authoritative Halo RC payment state machine.
 *
 * PENDING_PAYMENT  — Order created, awaiting successful payment
 * PAID             — Stripe has confirmed payment (terminal, cannot regress)
 * PAYMENT_FAILED   — A payment attempt failed; order may be retried
 * PAYMENT_CANCELLED — Payment process explicitly cancelled or authoritatively expired (terminal)
 *
 * Permitted transitions:
 *   PENDING_PAYMENT → PAID
 *   PENDING_PAYMENT → PAYMENT_FAILED
 *   PENDING_PAYMENT → PAYMENT_CANCELLED
 *   PAYMENT_FAILED  → PENDING_PAYMENT   (retry)
 *   PAYMENT_FAILED  → PAYMENT_CANCELLED
 *
 * PAID and PAYMENT_CANCELLED are terminal — they cannot transition to any other state.
 */
export type OrderPaymentStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_CANCELLED'

export interface BasketItemRecord {
  id: string
  basketId: string
  productId: string
  variantId?: string | null
  marketOfferId?: string | null
  sku: string
  productName: string
  quantity: number
  unitPriceMinorUnits: number
  currency: Currency
  taxMode: TaxMode
  availability: AvailabilityStatus
  imageUrl?: string | null
  // Build provenance — populated when the item is part of a Halo Build configuration
  buildId?: string | null
  buildVersion?: string | null
  buildSlug?: string | null
  buildRole?: string | null
  createdAt: string
  updatedAt: string
}

export interface BasketRecord {
  id: string
  userId?: string | null
  marketCode: MarketCode
  currency: Currency
  status: BasketStatus
  items: BasketItemRecord[]
  subtotalMinorUnits: number
  taxMinorUnits: number
  totalMinorUnits: number
  createdAt: string
  updatedAt: string
}

export interface CheckoutLineSnapshot {
  productId: string
  variantId?: string | null
  marketOfferId?: string | null
  sku: string
  productName: string
  quantity: number
  unitPriceMinorUnits: number
  lineTotalMinorUnits: number
  currency: Currency
  taxMode: TaxMode
  lifecycleAtCheckout: LifecycleStatus
  buildId?: string | null
  buildVersion?: string | null
  buildSlug?: string | null
  buildRole?: string | null
}

export interface CheckoutSnapshot {
  basketId: string
  userId?: string | null
  marketCode: MarketCode
  currency: Currency
  taxMode: TaxMode
  lines: CheckoutLineSnapshot[]
  subtotalMinorUnits: number
  taxMinorUnits: number
  totalMinorUnits: number
  shippingMethodId?: string | null
  shippingCostMinorUnits?: number | null
  taxDisplayMode?: TaxDisplayMode | null
  buildId?: string | null
  buildVersion?: string | null
  createdAt: string
}

export interface OrderItemRecord {
  id: string
  orderId: string
  productId: string | null
  variantId?: string | null
  marketOfferId?: string | null
  sku: string
  productName: string
  quantity: number
  unitPriceMinorUnits: number
  taxMinorUnits: number
  lineTotalMinorUnits: number
  currency: Currency
  taxMode: TaxMode
  snapshot: CheckoutLineSnapshot
  garageVehicleId?: string | null
}

export interface OrderRecord {
  id: string
  orderReference: string
  userId: string | null
  marketCode: MarketCode
  currency: Currency
  taxMode: TaxMode
  taxDisplayMode?: TaxDisplayMode | null
  paymentStatus: OrderPaymentStatus
  subtotalMinorUnits: number
  taxMinorUnits: number
  shippingMethodId?: string | null
  shippingCostMinorUnits?: number | null
  totalMinorUnits: number
  stripeCheckoutSessionId?: string | null
  stripePaymentIntentId?: string | null
  buildId?: string | null
  buildVersion?: string | null
  items: OrderItemRecord[]
  createdAt: string
  updatedAt: string
}

export interface PaymentEventRecord {
  id: string
  stripeEventId: string
  eventType: string
  orderId?: string | null
  status: string
  payload: Record<string, unknown>
  createdAt: string
}

export interface AddToBasketInput {
  productId: string
  variantId?: string | null
  quantity?: number
  marketCode: MarketCode
  buildProvenance?: {
    buildId: string
    buildVersion: string
    buildSlug: string
    buildRole?: string
  }
}

export interface UpdateBasketItemInput {
  quantity: number
}

export interface CreateOrderFromSnapshotInput {
  snapshot: CheckoutSnapshot
  userId?: string | null
  stripeCheckoutSessionId?: string | null
}

// ─── Phase 6: Race Department & Halo Builds ──────────────────────────────────

export type HaloBuildType =
  | 'HALO_BUILD'
  | 'RACE_BUILD'
  | 'CLUB_BUILD'
  | 'BASELINE_BUILD'

export type HaloBuildStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'RETIRED'

export type HaloBuildProvenance =
  | 'HALO_ENGINEERED'
  | 'MANUFACTURER_BASED'
  | 'CUSTOMER_CONFIGURED'
  | 'RESEARCH_BASED'

export type HaloBuildAvailabilityState =
  | 'TECHNICAL_ONLY'
  | 'AVAILABLE'
  | 'PARTIALLY_AVAILABLE'
  | 'UNAVAILABLE'
  | 'REVIEW_REQUIRED'

export type RaceDiscipline =
  | 'TOURING'
  | 'OFF_ROAD'
  | 'BUGGY'
  | 'SHORT_COURSE'
  | 'ROCK_CRAWLER'
  | 'DRIFT'
  | 'FORMULA'
  | 'GT'
  | 'LARGE_SCALE'
  | 'OTHER'

export type HaloBuildSubsystem =
  | 'CHASSIS'
  | 'POWERTRAIN'
  | 'CONTROL'
  | 'ENERGY'
  | 'AERODYNAMICS'
  | 'RUNNING_GEAR'
  | 'HARDWARE'

export interface HaloBuildComponentSnapshot {
  role: BuildSlotRole
  subsystem: HaloBuildSubsystem
  productId: string
  variantId?: string | null
  sku: string
  productName: string
  brandName: string
  brandId: string
  requirement: SlotRequirement
  notes?: string | null
  compatibilityRuleId?: string | null
  compatibilityRuleDescription?: string | null
  verified: boolean
  sortOrder: number
}

export interface HaloBuildVersionRecord {
  id: string
  buildId: string
  version: string // e.g. "1.0", "1.1"
  status: HaloBuildStatus
  changelogNotes?: string | null
  engineeringNotes?: string | null
  components: HaloBuildComponentSnapshot[]
  createdAt: string
  publishedAt?: string | null
  validatedAt?: string | null
}

export interface HaloBuildRecord {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  buildType: HaloBuildType
  provenance: HaloBuildProvenance
  discipline: RaceDiscipline
  scale: string
  platformId: string
  platformName: string
  baseProductId: string
  baseProductName: string
  status: HaloBuildStatus
  published: boolean
  heroImageUrl?: string | null
  engineeringSummary: string
  trackConditions?: string | null
  currentVersion: string
  versions: HaloBuildVersionRecord[]
  documents?: {
    id: string
    title: string
    documentType: string
    sourceUrl?: string | null
  }[]
  createdAt: string
  updatedAt: string
}

export interface HaloBuildPricingCalculation {
  marketCode: MarketCode
  currency: Currency
  taxMode: TaxMode
  availabilityState: HaloBuildAvailabilityState
  totalMinorUnits: number | null
  isPurchasable: boolean
  unavailableCount: number
  replacedCount: number
  lines: {
    role: BuildSlotRole
    productId: string
    productName: string
    sku: string
    available: boolean
    priceMinorUnits: number | null
    availabilityStatus: AvailabilityStatus
    isReplaced: boolean
    replacementProductId?: string | null
  }[]
}

export interface HaloBuildValidationResult {
  isValid: boolean
  canPublish: boolean
  buildId: string
  version: string
  errors: string[]
  warnings: string[]
  details: {
    baseMachineValid: boolean
    platformValid: boolean
    requiredSlotsSatisfied: boolean
    compatibilityVerified: boolean
    lifecycleValid: boolean
    ukOfferAvailable: boolean
    usOfferAvailable: boolean
  }
}

export interface HaloBuildAuditLog {
  id: string
  buildId: string
  buildVersion?: string | null
  action: 'CREATED' | 'EDITED' | 'VALIDATED' | 'PUBLISHED' | 'VERSION_BUMPED' | 'RETIRED'
  details: Record<string, unknown>
  userId: string
  createdAt: string
}

// ─── Phase 7: AI Intelligence Layer (Authoritative Grounding) ────────────────

export type AIIntentCategory =
  | 'PRODUCT_DISCOVERY'
  | 'PRODUCT_COMPARISON'
  | 'COMPATIBILITY_EXPLANATION'
  | 'BUILD_ASSISTANCE'
  | 'TECHNICAL_QA'
  | 'DOCUMENT_QA'
  | 'SPECIFICATION_EXPLANATION'
  | 'MARKET_AVAILABILITY'
  | 'GARAGE_ASSISTANCE'
  | 'GENERAL_RC_QUERY'
  | 'UNSUPPORTED_REQUEST'

export type AIGroundingState =
  | 'GROUNDED'
  | 'PARTIALLY_GROUNDED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'UNSUPPORTED'

export type AISourceType =
  | 'PRODUCT'
  | 'VARIANT'
  | 'SPECIFICATION'
  | 'COMPATIBILITY_RULE'
  | 'MARKET_OFFER'
  | 'TECHNICAL_DOCUMENT'
  | 'HALO_BUILD'
  | 'GARAGE_RECORD'
  | 'EDITORIAL_CONTENT'

export interface AISourceCitation {
  id: string
  sourceType: AISourceType
  title: string
  reference: string
  url?: string | null
  verified: boolean
}

export interface AIRecommendationReason {
  code: string
  description: string
  verified: boolean
}

export interface AIRecommendation {
  productId: string
  productName: string
  sku: string
  brandName?: string
  scale?: string | null
  discipline?: string | null
  priceMinorUnits?: number | null
  currency?: Currency | null
  availabilityStatus: AvailabilityStatus
  reasons: AIRecommendationReason[]
}

export interface AIResponse {
  answer: string
  groundingState: AIGroundingState
  intent: AIIntentCategory
  sources: AISourceCitation[]
  recommendations: AIRecommendation[]
  warnings: string[]
  followUpActions: Array<{
    label: string
    href?: string
    action?: string
  }>
}

export interface StructuredSearchQuery {
  rawQuery: string
  interpretedIntent: AIIntentCategory
  filters: {
    discipline?: string
    scale?: string
    platformId?: string
    brandId?: string
    categoryId?: string
    powerType?: string
    driveConfig?: string
    searchTerms?: string[]
  }
  marketCode: MarketCode
}

export interface AIAuditEvent {
  id: string
  requestId: string
  userId?: string | null
  marketCode: MarketCode
  intent: AIIntentCategory
  retrievedSourceIds: string[]
  modelProvider: string
  modelId: string
  latencyMs: number
  groundingState: AIGroundingState
  toolCalls: Array<{
    toolName: string
    input: Record<string, unknown>
  }>
  errorState?: string | null
  createdAt: string
}

export interface AIFeedbackRecord {
  id: string
  requestId: string
  userId?: string | null
  feedbackType: 'HELPFUL' | 'NOT_HELPFUL' | 'REPORTED_INCORRECT'
  notes?: string | null
  createdAt: string
}

// ─── Phase 8: Multi-Supplier Procurement & Inventory Infrastructure ─────────

export type SupplierRelationshipStatus =
  | 'PROSPECT'
  | 'APPLIED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'CLOSED'
  | 'CONTACTED'
  | 'INACTIVE'

export type SupplierIntegrationType =
  | 'MANUAL'
  | 'CSV'
  | 'XML'
  | 'JSON_API'
  | 'REST_API'
  | 'SFTP'
  | 'WEBHOOK'
  | 'ERP'
  | 'DISTRIBUTOR_FEED'

export type SupplierMatchMethod =
  | 'EXACT_SKU'
  | 'EXACT_PART_NUMBER'
  | 'EXACT_GTIN'
  | 'EXPLICIT_MAPPING'
  | 'MANUAL_REVIEW'

export type SupplierMappingStatus =
  | 'UNMATCHED'
  | 'PENDING_REVIEW'
  | 'MATCHED'
  | 'REJECTED'
  | 'SUPERSEDED'

export type InventoryAuthority =
  | 'OWN_STOCK'
  | 'SUPPLIER_STOCK'
  | 'UNKNOWN'

export type DataFreshnessState =
  | 'FRESH'
  | 'STALE'
  | 'EXPIRED'
  | 'UNKNOWN'

export type SupplierSyncStatus =
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIAL'
  | 'FAILED'

export type SupplierChangeType =
  | 'COST_CHANGED'
  | 'AVAILABILITY_CHANGED'
  | 'RRP_CHANGED'
  | 'SKU_CHANGED'
  | 'DISCONTINUED_BY_SUPPLIER'
  | 'REMOVED_FROM_FEED'

export interface SupplierRecord {
  id: string
  slug: string
  name: string
  legalName?: string | null
  supplierType: SupplierType
  country: string
  website?: string | null
  accountReference?: string | null
  relationshipStatus: SupplierRelationshipStatus
  currency: Currency
  vatStatus?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  integrationType: SupplierIntegrationType
  lastSyncAt?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface RawSupplierFeedItem {
  supplierSku: string
  manufacturerSku?: string | null
  partNumber?: string | null
  eanGtin?: string | null
  title: string
  brandName?: string | null
  description?: string | null
  cost: number // in minor units
  rrp?: number | null // in minor units
  currency: Currency
  availability: string
  quantity?: number | null
  leadTimeDays?: number | null
  leadTimeText?: string | null
  vatTreatment?: string | null
  category?: string | null
  productUrl?: string | null
  isDiscontinued?: boolean | null
  imageUrls?: string[]
  documentUrls?: string[]
  sourceTimestamp?: string
}

export interface NormalizedSupplierItem {
  supplierSku: string
  normalizedSku: string
  manufacturerSku?: string | null
  normalizedManufacturerSku?: string | null
  partNumber?: string | null
  eanGtin?: string | null
  title: string
  brandId?: string | null
  brandName?: string | null
  costMinorUnits: number
  rrpMinorUnits?: number | null
  currency: Currency
  availability: AvailabilityStatus
  quantity?: number | null
  leadTimeDays?: number | null
  leadTimeText?: string | null
  inventoryAuthority: InventoryAuthority
  freshnessState: DataFreshnessState
  rawPayload: Record<string, unknown>
  sourceTimestamp: string
}

export interface SupplierProductMapping {
  id: string
  supplierId: string
  supplierSku: string
  supplierProductId?: string | null
  canonicalProductId: string | null
  canonicalVariantId: string | null
  canonicalProductName?: string | null
  canonicalProductSku?: string | null
  matchMethod: SupplierMatchMethod | null
  matchConfidenceCategory: 'EXACT_MATCH' | 'HIGH_CERTAINTY' | 'MANUALLY_VERIFIED' | 'UNVERIFIED'
  status: SupplierMappingStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  rawTitle?: string | null
  rawBrand?: string | null
  rawCostMinorUnits?: number | null
  rawCurrency?: Currency | null
  sourcePayload?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface SupplierOffer {
  id: string
  canonicalProductId: string
  canonicalVariantId?: string | null
  supplierId: string
  supplierName: string
  supplierSku: string
  costMinorUnits: number
  currency: Currency
  supplierRrpMinorUnits?: number | null
  availability: AvailabilityStatus
  inventoryAuthority: InventoryAuthority
  quantity?: number | null
  leadTimeDays?: number | null
  leadTimeText?: string | null
  marketCode: MarketCode
  freshnessState: DataFreshnessState
  lastCheckedAt: string
  status: 'ACTIVE' | 'STALE' | 'SUPERSEDED' | 'DISCONTINUED'
  createdAt: string
  updatedAt: string
}

export interface SupplierSyncRun {
  runId: string
  supplierId: string
  supplierName: string
  integrationType: SupplierIntegrationType
  startedAt: string
  completedAt?: string | null
  status: SupplierSyncStatus
  recordsReceived: number
  recordsProcessed: number
  recordsMatched: number
  recordsUnmatched: number
  recordsChanged: number
  recordsRejected: number
  errors: string[]
  warnings: string[]
}

export interface SupplierChangeEvent {
  id: string
  supplierId: string
  supplierName: string
  supplierSku: string
  canonicalProductId?: string | null
  changeType: SupplierChangeType
  oldValue?: string | number | null
  newValue?: string | number | null
  details?: string | null
  detectedAt: string
}

export interface ProcurementSummary {
  totalSuppliers: number
  activeSuppliers: number
  totalMappings: number
  unmatchedMappings: number
  pendingReviewMappings: number
  activeOffers: number
  staleOffers: number
  recentSyncRuns: SupplierSyncRun[]
  recentChanges: SupplierChangeEvent[]
  syncHealth: 'OPTIMAL' | 'DEGRADED' | 'ATTENTION_REQUIRED'
}

// ─── Multi-Supplier Catalogue Ingestion Engine Types ─────────────────────────

export type SupplierFeedType =
  | 'CATALOGUE'
  | 'STOCK'
  | 'PRICE'
  | 'IMAGE'
  | 'ORDER_STATUS'

export type SupplierFeedFormat =
  | 'CSV'
  | 'XML'
  | 'JSON'
  | 'REST_API'
  | 'MANUAL_UPLOAD'

export type SupplierAuthType =
  | 'NONE'
  | 'BASIC'
  | 'API_KEY'
  | 'BEARER_TOKEN'
  | 'OAUTH2'
  | 'SFTP'

export type SupplierExceptionSeverity = 'WARNING' | 'ERROR' | 'CRITICAL'

export type SupplierExceptionStatus = 'OPEN' | 'RESOLVED' | 'IGNORED'

export type SupplierExceptionCode =
  | 'MISSING_SKU'
  | 'DUPLICATE_SKU'
  | 'INVALID_PRICE'
  | 'INVALID_CURRENCY'
  | 'INVALID_STOCK'
  | 'UNKNOWN_CATEGORY'
  | 'UNKNOWN_BRAND'
  | 'UNMAPPED_PRODUCT'
  | 'CONFLICTING_EAN'
  | 'MALFORMED_RECORD'
  | 'MISSING_REQUIRED_FIELD'
  | 'DISCONTINUED_PRODUCT'
  | 'IMAGE_UNAVAILABLE'
  | 'AMBIGUOUS_MATCH'

export interface SupplierFeed {
  id: string
  supplierId: string
  feedName: string
  feedType: SupplierFeedType
  format: SupplierFeedFormat
  sourceUrl?: string | null
  authType: SupplierAuthType
  authConfig?: Record<string, unknown>
  scheduleCron?: string | null
  isActive: boolean
  lastAttemptedRun?: string | null
  lastSuccessfulRun?: string | null
  nextScheduledRun?: string | null
  errorState?: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierProduct {
  id: string
  supplierId: string
  supplierFeedId?: string | null
  supplierSku: string
  manufacturerSku?: string | null
  eanGtin?: string | null
  supplierProductName: string
  supplierDescription?: string | null
  supplierBrand?: string | null
  supplierCategory?: string | null
  supplierProductUrl?: string | null
  rawCostMinorUnits: number
  rawRrpMinorUnits?: number | null
  currency: Currency
  rawStockQuantity?: number | null
  rawAvailability: string
  isDiscontinued: boolean
  sourcePayload: Record<string, unknown>
  sourceHash?: string | null
  firstSeenAt: string
  lastSeenAt: string
  importStatus: 'VALID' | 'EXCEPTION' | 'REJECTED' | 'DISCONTINUED'
  createdAt: string
  updatedAt: string
}

export interface SupplierImportException {
  id: string
  syncRunId?: string | null
  supplierId: string
  supplierProductId?: string | null
  supplierSku?: string | null
  exceptionCode: SupplierExceptionCode
  severity: SupplierExceptionSeverity
  message: string
  rawRecord?: Record<string, unknown> | null
  resolutionStatus: SupplierExceptionStatus
  resolvedBy?: string | null
  resolvedAt?: string | null
  resolutionNotes?: string | null
  createdAt: string
}

export interface ValidationIssue {
  field?: string
  code: SupplierExceptionCode
  severity: SupplierExceptionSeverity
  message: string
}

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
}

export interface ImportPreviewSummary {
  supplierId: string
  feedId?: string | null
  totalDiscovered: number
  validRecords: number
  newProducts: number
  existingProductsUpdated: number
  unchangedProducts: number
  requireMapping: number
  exceptionsCount: number
  exceptions: Array<{
    supplierSku?: string
    code: SupplierExceptionCode
    severity: SupplierExceptionSeverity
    message: string
  }>
}

export interface ProductDataLineage {
  canonicalProductId: string
  canonicalProductSku: string
  canonicalProductName: string
  supplierId: string
  supplierName: string
  supplierSku: string
  feedId?: string | null
  feedName?: string | null
  syncRunId?: string | null
  supplierProductId: string
  mappingId: string
  matchMethod: SupplierMatchMethod | null
  mappingConfidence: string
  lastSyncedAt: string
  sourcePayload?: Record<string, unknown> | null
}


// ─── Phase 9: Multi-Market Commercial Expansion & International Scale ───────

export type TaxDisplayMode =
  | 'TAX_INCLUDED'
  | 'TAX_EXCLUDED'
  | 'TAX_CALCULATED_AT_CHECKOUT'
  | 'TAX_NOT_APPLICABLE'
  | 'TAX_UNKNOWN'

export type MeasurementSystem = 'METRIC' | 'IMPERIAL'

export type ShippingRegion = 'UK_DOMESTIC' | 'US_DOMESTIC'

export type ShippingRestrictionType =
  | 'BATTERY_HAZMAT'
  | 'OVERSIZE_FREIGHT'
  | 'PROHIBITED_IMPORT'

export interface MarketConfig {
  marketCode: MarketCode
  countryCode: string
  name: string
  currency: Currency
  locale: string
  taxMode: TaxMode
  taxDisplayMode: TaxDisplayMode
  defaultLanguage: string
  measurementSystem: MeasurementSystem
  shippingRegion: ShippingRegion
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface ShippingMethod {
  id: string
  marketCode: MarketCode
  name: string
  carrier: string
  serviceLevel: string
  costMinorUnits: number
  currency: Currency
  estimatedDaysMin: number
  estimatedDaysMax: number
  cutoffTimeUtc?: string | null
  freeThresholdMinorUnits?: number | null
  active: boolean
}

export interface ProductShippingConstraint {
  productId: string
  isOversize: boolean
  isHazardous: boolean
  maxQuantityPerConsignment?: number | null
  requiresSpecialHandling: boolean
  prohibitedMarkets: MarketCode[]
  restrictionNote?: string | null
}

export interface ShippingEligibilityResult {
  eligible: boolean
  restrictionReason?: string | null
  reasons: string[]
  isHazardous?: boolean
  isOversize?: boolean
  requiresSpecialHandling?: boolean
  restrictionNote?: string | null
  availableMethods: ShippingMethod[]
}

export interface MarketCompletenessScore {
  marketCode: MarketCode
  status: 'COMPLETE' | 'PARTIAL' | 'MISSING'
  totalProductsCount: number
  offeredProductsCount: number
  coveragePercentage: number
}

export interface MarketAnalyticsSummary {
  marketCode: MarketCode
  currency: Currency
  totalOrders: number
  grossRevenueMinorUnits: number
  averageOrderValueMinorUnits: number
  activeBasketsCount: number
}

export interface MultiMarketReporting {
  markets: MarketAnalyticsSummary[]
  reportingTimestamp: string
}

// ─── Phase 11: Supplier Network Activation, Trade Accounts & Procurement Relationship Management ───

export type ProcurementTerritory =
  | 'UK'
  | 'USA'
  | 'EU'
  | 'AUSTRALIA'
  | 'CANADA'
  | 'OTHER'

export type TerritorySupportState =
  | 'SUPPORTED'
  | 'RESTRICTED'
  | 'NOT_SUPPORTED'
  | 'UNKNOWN'

export type TerritoryRestrictionReason =
  | 'EXCLUSIVE_DISTRIBUTOR'
  | 'DIRECT_ONLY'
  | 'TERRITORY_RESTRICTION'
  | 'EXPORT_RESTRICTION'
  | 'COMMERCIAL_DECISION'
  | 'UNKNOWN'

export type BrandSupplierRelationshipType =
  | 'DIRECT_MANUFACTURER'
  | 'AUTHORISED_DISTRIBUTOR'
  | 'WHOLESALER'
  | 'RESELLER'
  | 'MARKETPLACE'
  | 'RESEARCH_ONLY'

export type CommercialRelationshipVerificationStatus =
  | 'VERIFIED'
  | 'UNVERIFIED'
  | 'EXPIRED'
  | 'DISPUTED'
  | 'REJECTED'

export type RelationshipEvidenceSourceType =
  | 'MANUFACTURER_WEBSITE'
  | 'DISTRIBUTOR_WEBSITE'
  | 'SUPPLIER_DOCUMENT'
  | 'DIRECT_SUPPLIER_CONFIRMATION'
  | 'TRADE_ACCOUNT_RESPONSE'
  | 'EMAIL_CONFIRMATION'
  | 'PHONE_CONFIRMATION'
  | 'TRADE_SHOW'
  | 'PUBLIC_REGISTRY'
  | 'OTHER'

export type ExclusivityScope =
  | 'UK_EXCLUSIVE'
  | 'USA_EXCLUSIVE'
  | 'REGION_EXCLUSIVE'
  | 'CATEGORY_EXCLUSIVE'
  | 'NONE'

export type TradeAccountApplicationStatus =
  | 'RESEARCHING'
  | 'READY_TO_APPLY'
  | 'APPLICATION_DRAFT'
  | 'SUBMITTED'
  | 'ACKNOWLEDGED'
  | 'UNDER_REVIEW'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'ON_HOLD'
  | 'CLOSED'

export type TradeAccountRequirementType =
  | 'COMPANY_REGISTRATION'
  | 'VAT_NUMBER'
  | 'BUSINESS_ADDRESS'
  | 'WEBSITE'
  | 'TRADE_REFERENCES'
  | 'BANK_DETAILS'
  | 'CREDIT_APPLICATION'
  | 'RESALE_CERTIFICATE'
  | 'BUSINESS_INSURANCE'
  | 'DEALER_APPLICATION'
  | 'OPENING_ORDER'
  | 'MINIMUM_ANNUAL_SPEND'
  | 'MOQ'
  | 'PAYMENT_TERMS'
  | 'IDENTITY_VERIFICATION'
  | 'OTHER'

export type TradeAccountRequirementStatus =
  | 'PENDING'
  | 'PROVIDED'
  | 'VERIFIED'
  | 'WAIVED'
  | 'REJECTED'

export type PaymentTermsType =
  | 'PREPAYMENT'
  | 'NET_7'
  | 'NET_14'
  | 'NET_30'
  | 'NET_60'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'OTHER'
  | 'UNKNOWN'

export type PricingPolicyType =
  | 'RRP'
  | 'MAP'
  | 'MINIMUM_ADVERTISED_PRICE'
  | 'RECOMMENDED_RETAIL_PRICE'

export type SupplierContactRole =
  | 'COMMERCIAL_SALES'
  | 'TRADE_ACCOUNTS'
  | 'CREDIT'
  | 'TECHNICAL'
  | 'RETURNS'
  | 'WARRANTY'
  | 'MARKETING'
  | 'MANAGEMENT'
  | 'OTHER'

export type CommunicationType =
  | 'EMAIL'
  | 'PHONE'
  | 'MEETING'
  | 'FORM_SUBMISSION'
  | 'PORTAL'
  | 'TRADE_SHOW'
  | 'OTHER'

export type ProcurementPipelineStage =
  | 'IDENTIFIED'
  | 'CONTACTED'
  | 'APPLICATION_PREPARED'
  | 'APPLICATION_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'TERMS_NEGOTIATION'
  | 'ACCOUNT_OPENED'
  | 'CATALOGUE_MAPPED'
  | 'TEST_ORDER_PLACED'
  | 'INTEGRATION_ACTIVE'
  | 'ACTIVE_SUPPLIER'

export type ProcurementReadinessState =
  | 'NOT_READY'
  | 'RELATIONSHIP_UNVERIFIED'
  | 'ACCOUNT_PENDING'
  | 'TERMS_MISSING'
  | 'FEED_MISSING'
  | 'PROCUREMENT_READY'

export type SupplierOpportunityTier =
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'UNASSESSED'

export type SupplierDocumentType =
  | 'DEALER_APPLICATION'
  | 'PRICE_LIST'
  | 'TERMS_AND_CONDITIONS'
  | 'CREDIT_APPLICATION'
  | 'CERTIFICATE_OF_RESALE'
  | 'VAT_CERTIFICATE'
  | 'COMPANY_REGISTRATION'
  | 'BRAND_AUTHORISATION_LETTER'
  | 'INVOICE_SAMPLE'
  | 'TRADE_FORM'
  | 'OTHER'

export type ProcurementTaskType =
  | 'CONTACT_SUPPLIER'
  | 'REQUEST_TRADE_ACCOUNT'
  | 'SUBMIT_APPLICATION'
  | 'CHASE_APPLICATION'
  | 'UPLOAD_DOCUMENTS'
  | 'PROVIDE_TRADE_REFERENCES'
  | 'VERIFY_TERMS'
  | 'MAP_CATALOGUE'
  | 'SETUP_FEED'
  | 'PLACE_TEST_ORDER'
  | 'REVIEW_COMMERCIALS'

export interface SupplierTerritoryCoverage {
  id: string
  supplierId: string
  territory: ProcurementTerritory
  state: TerritorySupportState
  restrictionReason?: TerritoryRestrictionReason | null
  notes?: string | null
  verifiedAt?: string | null
  verifiedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface BrandSupplierRelationship {
  id: string
  brandId: string
  supplierId: string
  relationshipType: BrandSupplierRelationshipType
  verificationStatus: CommercialRelationshipVerificationStatus
  isExclusive: boolean
  exclusivityScope?: ExclusivityScope | null
  territory: ProcurementTerritory
  evidenceSourceType: RelationshipEvidenceSourceType
  evidenceUrl?: string | null
  evidenceNotes?: string | null
  verifiedAt?: string | null
  verifiedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface TradeAccountRequirement {
  id: string
  applicationId: string
  requirementType: TradeAccountRequirementType
  title: string
  description?: string | null
  status: TradeAccountRequirementStatus
  documentId?: string | null
  verifiedAt?: string | null
  verifiedBy?: string | null
  createdAt: string
  updatedAt: string
}

export interface TradeAccountApplication {
  id: string
  supplierId: string
  applicantEntityName: string
  status: TradeAccountApplicationStatus
  stage: ProcurementPipelineStage
  submittedAt?: string | null
  reviewedAt?: string | null
  approvedAt?: string | null
  rejectedAt?: string | null
  assignedTo?: string | null
  accountReference?: string | null
  creditLimitMinorUnits?: number | null
  creditCurrency?: Currency | null
  notes?: string | null
  requirements: TradeAccountRequirement[]
  createdAt: string
  updatedAt: string
}

export interface SupplierCommercialTerms {
  id: string
  supplierId: string
  currency: Currency
  paymentTerms: PaymentTermsType
  paymentTermsDays?: number | null
  earlyPaymentDiscountPercent?: number | null
  minimumOrderQuantityUnits?: number | null
  minimumOrderValueMinorUnits?: number | null
  freeFreightThresholdMinorUnits?: number | null
  standardDiscountTierPercent?: number | null
  dropShipAvailable: boolean
  dropShipFeeMinorUnits?: number | null
  orderingMethod?: string | null
  isVerified: boolean
  verifiedAt?: string | null
  verifiedBy?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierPricingPolicy {
  id: string
  supplierId: string
  brandId?: string | null
  policyType: PricingPolicyType
  enforcementLevel: 'STRICT' | 'ADVISORY' | 'FLEXIBLE' | 'NONE'
  minimumAdvertisedPricePercent?: number | null
  policyUrl?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierContact {
  id: string
  supplierId: string
  name: string
  role: SupplierContactRole
  title?: string | null
  email?: string | null
  phone?: string | null
  isPrimary: boolean
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierCommunication {
  id: string
  supplierId: string
  contactId?: string | null
  type: CommunicationType
  subject: string
  summary: string
  loggedBy: string
  occurredAt: string
  nextFollowUpDate?: string | null
  createdAt: string
}

export interface SupplierDocument {
  id: string
  supplierId: string
  documentType: SupplierDocumentType
  title: string
  fileUrl: string
  fileSize?: number | null
  mimeType?: string | null
  uploadedBy: string
  expiresAt?: string | null
  createdAt: string
}

export interface ProcurementTask {
  id: string
  supplierId: string
  taskType: ProcurementTaskType
  title: string
  description?: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: string | null
  assignedTo?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProcurementReadinessChecklist {
  hasVerifiedRelationship: boolean
  hasApprovedAccount: boolean
  isTerritorySupported: boolean
  hasVerifiedTerms: boolean
  hasActiveFeedOrOffer: boolean
  hasVerifiedProductMappings: boolean
  hasFreshInventory: boolean
}

export interface ProcurementReadinessResult {
  supplierId: string
  brandId?: string | null
  state: ProcurementReadinessState
  isProcurementReady: boolean
  score: number
  checklist: ProcurementReadinessChecklist
  blockers: string[]
  nextRecommendedAction?: string | null
}

export interface SupplierOpportunityScore {
  supplierId: string
  overallScore: number
  tier: SupplierOpportunityTier
  breakdown: {
    brandStrategicValue: number
    catalogueBreadth: number
    commercialMarginPotential: number
    easeOfIntegration: number
    territoryCoverageStrength: number
  }
  reasons: string[]
}

export interface BrandSourcingView {
  brandId: string
  brandName: string
  territory: ProcurementTerritory
  directManufacturer?: SupplierRecord | null
  verifiedDistributors: Array<{
    supplier: SupplierRecord
    relationship: BrandSupplierRelationship
    terms?: SupplierCommercialTerms | null
  }>
  unverifiedDistributors: Array<{
    supplier: SupplierRecord
    relationship: BrandSupplierRelationship
  }>
  hasExclusivityConstraint: boolean
  exclusiveSupplier?: SupplierRecord | null
  isPurchasableInTerritory: boolean
}

export interface ProductSourcingView {
  productId: string
  sku: string
  brandId: string
  brandName: string
  territory: ProcurementTerritory
  bestSupplier?: SupplierRecord | null
  availableSuppliers: Array<{
    supplier: SupplierRecord
    isDirect: boolean
    costMinorUnits?: number | null
    inStock: boolean
    quantityAvailable: number
  }>
  readinessState: ProcurementReadinessState
}

export interface HaloCompanyProfile {
  legalName: string
  tradingName: string
  companyNumber: string
  vatNumber: string
  eoriNumber: string
  registeredAddress: {
    line1: string
    line2?: string | null
    city: string
    postalCode: string
    country: string
  }
  tradingAddress: {
    line1: string
    line2?: string | null
    city: string
    postalCode: string
    country: string
  }
  primaryContact: {
    name: string
    title: string
    email: string
    phone: string
  }
  bankDetails: {
    bankName: string
    accountName: string
    sortCode: string
    accountNumber: string
    iban: string
    swiftBic: string
  }
  tradeReferences: Array<{
    companyName: string
    contactName: string
    email: string
    phone: string
    relationship: string
  }>
}

// ─── Admin Platform Foundation Types ─────────────────────────────────────────

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'QUOTED'
  | 'WON'
  | 'LOST'
  | 'ARCHIVED'

export type LeadSource =
  | 'PRODUCT_ENQUIRY'
  | 'CONTACT_FORM'
  | 'QUOTE_REQUEST'
  | 'COMPATIBILITY_QUESTION'
  | 'TRADE_ENQUIRY'
  | 'SUPPLIER_ENQUIRY'
  | 'NEWSLETTER'
  | 'OTHER'

export type LeadPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string | null
  company?: string | null
  source: LeadSource
  productInterestId?: string | null
  message: string
  status: LeadStatus
  priority: LeadPriority
  assignedUserId?: string | null
  notes?: string | null
  followUpDate?: string | null
  createdAt: string
  updatedAt: string
}

export interface LeadActivity {
  id: string
  leadId: string
  userId?: string | null
  userEmail?: string | null
  action: string
  details: Record<string, unknown>
  createdAt: string
}

export type CmsPageType =
  | 'BRAND'
  | 'BUYING_GUIDE'
  | 'EDITORIAL'
  | 'LANDING'
  | 'ABOUT'
  | 'SHIPPING'
  | 'RETURNS'
  | 'CONTACT'
  | 'OTHER'

export interface CmsPage {
  id: string
  slug: string
  title: string
  status: RecordStatus
  pageType: CmsPageType
  heroHeading?: string | null
  heroSubheading?: string | null
  contentJson: Array<Record<string, unknown>>
  seoTitle?: string | null
  seoDescription?: string | null
  canonicalUrl?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageUrl?: string | null
  indexPage: boolean
  publishedAt?: string | null
  publishedBy?: string | null
  authorId?: string | null
  createdAt: string
  updatedAt: string
}

export type HomepageSectionType =
  | 'HERO'
  | 'FEATURED_MACHINES'
  | 'FEATURED_BRANDS'
  | 'EDITORIAL'
  | 'PROMOTIONAL'
  | 'COLLECTIONS'
  | 'HALO_PRODUCT'
  | 'BUYING_GUIDE'

export interface CmsHomepageConfig {
  id: string
  sectionKey: string
  sectionType: HomepageSectionType
  title: string
  subtitle?: string | null
  contentJson: Record<string, unknown>
  active: boolean
  sortOrder: number
  updatedAt: string
  updatedBy?: string | null
}

export interface NavigationConfigItem {
  id: string
  navKey: string
  label: string
  href: string
  parentId?: string | null
  badge?: string | null
  subText?: string | null
  sortOrder: number
  active: boolean
  createdAt: string
}

export interface ProductContent {
  id: string
  productId: string
  shortDescription?: string | null
  longDescription?: string | null
  keyFeatures: string[]
  whatsIncluded: string[]
  requirements: string[]
  compatibilityNotes?: string | null
  manufacturerInfo?: string | null
  editorialNotes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductSeo {
  id: string
  productId: string
  seoTitle?: string | null
  metaDescription?: string | null
  canonicalUrl?: string | null
  ogTitle?: string | null
  ogDescription?: string | null
  ogImageUrl?: string | null
  indexPage: boolean
  primaryKeyword?: string | null
  seoNotes?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductRelationship {
  id: string
  productId: string
  relatedProductId: string
  relationshipType: string
  sortOrder: number
  notes?: string | null
  createdAt: string
}

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'PUBLISH'
  | 'UNPUBLISH'
  | 'ARCHIVE'
  | 'STATUS_CHANGE'
  | 'PRICE_CHANGE'

export interface AuditLogEntry {
  id: string
  userId?: string | null
  userEmail?: string | null
  action: AuditAction
  entityType: string
  entityId: string
  previousState?: Record<string, unknown> | null
  newState?: Record<string, unknown> | null
  notes?: string | null
  createdAt: string
}

export type AiSuggestionType =
  | 'DESCRIPTION'
  | 'SHORT_DESCRIPTION'
  | 'SEO_TITLE'
  | 'META_DESCRIPTION'
  | 'FEATURES'
  | 'COLLECTION_DESCRIPTION'

export type AiSuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AiSuggestion {
  id: string
  productId?: string | null
  suggestionType: AiSuggestionType
  draftContent: string
  modelProvider: string
  modelId: string
  reviewedBy?: string | null
  reviewedAt?: string | null
  status: AiSuggestionStatus
  createdAt: string
}

export type OrderFulfilmentStatus =
  | 'PENDING'
  | 'UNFULFILLED'
  | 'PROCESSING'
  | 'PACKED'
  | 'PICKING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'






