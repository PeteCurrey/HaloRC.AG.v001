// packages/db/src/queries/race.ts
// Authoritative in-memory repository for the Race Department & Halo Builds domain.
// Preserves historical configuration snapshots, strict version immutability,
// Phase 3 compatibility validation, and market offer commercial resolution.

import type {
  MarketCode,
  Currency,
  TaxMode,
  BuildSlotRole,
  HaloBuildType,
  HaloBuildStatus,
  HaloBuildProvenance,
  RaceDiscipline,
  HaloBuildSubsystem,
  HaloBuildComponentSnapshot,
  HaloBuildVersionRecord,
  HaloBuildRecord,
  HaloBuildPricingCalculation,
  HaloBuildValidationResult,
  HaloBuildAuditLog,
  AvailabilityStatus,
} from '@halo-rc/types'
import {
  SEED_PRODUCTS,
  SEED_PLATFORMS,
  SEED_BRANDS,
  SEED_OFFERS,
  SEED_COMPATIBILITY_RULES,
  SEED_DOCUMENTS,
} from '../seed/catalogue-data'
import { resolveMarketOffer, getOffersForProduct } from './index'

// ── In-Memory Fixtures ────────────────────────────────────────────────────────

const INITIAL_HALO_BUILDS: HaloBuildRecord[] = [
  {
    id: 'hbld-x4-comp-001',
    slug: 'halo-x4-competition-spec',
    title: 'Halo X4 Competition Spec',
    subtitle: '1/10 Electric Touring Car — World Championship Blueprint',
    buildType: 'HALO_BUILD',
    provenance: 'HALO_ENGINEERED',
    discipline: 'TOURING',
    scale: '1:10',
    platformId: 'plat-xray-x4',
    platformName: 'XRAY X4 Platform',
    baseProductId: 'prod-xray-x4-2026',
    baseProductName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
    status: 'PUBLISHED',
    published: true,
    heroImageUrl: 'https://images.halo-rc.com/builds/halo-x4-hero.jpg',
    engineeringSummary:
      'Engineered specifically for high-bite carpet and medium-to-high asphalt competition. Calibrated with mid-motor twin belt weight distribution, high-voltage brushless telemetry control, and 13.5T stock class thermal efficiency.',
    trackConditions: 'Indoor High-Grip Carpet / High-Bite Asphalt',
    currentVersion: '1.0',
    documents: [
      {
        id: 'doc-xray-manual',
        title: "XRAY X4 '26 Instruction & Assembly Manual",
        documentType: 'MANUAL',
        sourceUrl: 'https://teamxray.com/x4/manual.pdf',
      },
      {
        id: 'doc-xray-setup',
        title: "XRAY X4 '26 Carpet World Cup Base Setup Sheet",
        documentType: 'SETUP_SHEET',
      },
      {
        id: 'doc-xray-exploded',
        title: 'XRAY X4 Platform Exploded View & Spare Parts Index',
        documentType: 'EXPLODED_DIAGRAM',
        sourceUrl: 'https://teamxray.com/x4/exploded.pdf',
      },
    ],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
    versions: [
      {
        id: 'hbld-ver-x4-1-0',
        buildId: 'hbld-x4-comp-001',
        version: '1.0',
        status: 'PUBLISHED',
        changelogNotes: 'Initial production championship specification release.',
        engineeringNotes:
          'Selected for balanced weight transfer, zero timing ESC compliance, and low centre of gravity.',
        publishedAt: '2026-02-01T12:00:00Z',
        validatedAt: '2026-02-01T11:45:00Z',
        createdAt: '2026-01-10T10:00:00Z',
        components: [
          {
            role: 'BASE_MACHINE',
            subsystem: 'CHASSIS',
            productId: 'prod-xray-x4-2026',
            sku: 'XRAY-300040',
            productName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
            brandName: 'XRAY',
            brandId: 'brand-xray',
            requirement: 'REQUIRED',
            notes: 'Swiss 7075-T6 Aluminium dual-belt competition chassis.',
            compatibilityRuleId: 'target-chassis',
            compatibilityRuleDescription: 'Authoritative Base Chassis Platform',
            verified: true,
            sortOrder: 1,
          },
          {
            role: 'MOTOR',
            subsystem: 'POWERTRAIN',
            productId: 'prod-hw-v10-g4-135t',
            sku: 'HW-30401140',
            productName: 'Hobbywing XeRun V10 G4 Competition Brushless Motor 13.5T',
            brandName: 'Hobbywing',
            brandId: 'brand-hobbywing',
            requirement: 'REQUIRED',
            notes: 'High-efficiency sensored stator with verified touring car gearing clearance.',
            compatibilityRuleId: 'compat-x4-motor',
            compatibilityRuleDescription: '13.5T competition brushless motor required for stock touring car class',
            verified: true,
            sortOrder: 2,
          },
          {
            role: 'ESC',
            subsystem: 'POWERTRAIN',
            productId: 'prod-hw-xr10-pro-g3',
            sku: 'HW-30112614',
            productName: 'Hobbywing XeRun XR10 Pro G3 Competition ESC',
            brandName: 'Hobbywing',
            brandId: 'brand-hobbywing',
            requirement: 'REQUIRED',
            notes: 'Full telemetry logging, 160A continuous load rating.',
            compatibilityRuleId: 'compat-x4-esc',
            compatibilityRuleDescription: 'Recommended 1/10 touring car ESC for X4 chassis',
            verified: true,
            sortOrder: 3,
          },
          {
            role: 'SERVO_STEERING',
            subsystem: 'CONTROL',
            productId: 'prod-sanwa-pgs-lh2',
            sku: 'SANWA-107A54534A',
            productName: 'Sanwa PGS-LH II Low Profile Program Brushless Servo',
            brandName: 'Sanwa',
            brandId: 'brand-sanwa',
            requirement: 'REQUIRED',
            notes: 'Low profile SSL telemetry servo engineered for direct chassis rail mounting.',
            compatibilityRuleId: 'compat-x4-servo-sanwa',
            compatibilityRuleDescription: 'Low profile SSL telemetry servo alternative',
            verified: true,
            sortOrder: 4,
          },
          {
            role: 'BATTERY',
            subsystem: 'ENERGY',
            productId: 'prod-sunpadow-6000-lipo',
            sku: 'SP-6000-2S-LCG',
            productName: 'Sunpadow 6000mAh 140C 2S LCG Competition LiPo Battery',
            brandName: 'Sunpadow',
            brandId: 'brand-sunpadow',
            requirement: 'REQUIRED',
            notes: 'Low Centre of Gravity 22.5mm casing with 5mm bullet connections.',
            compatibilityRuleId: 'compat-x4-battery',
            compatibilityRuleDescription: '2S LCG competition LiPo battery pack required for X4 chassis',
            verified: true,
            sortOrder: 5,
          },
          {
            role: 'BODY',
            subsystem: 'AERODYNAMICS',
            productId: 'prod-montech-hyper-190',
            sku: 'MT-HYPER-190',
            productName: 'Mon-Tech Hyper 190mm Touring Car Clear Body Shell',
            brandName: 'Mon-Tech Racing',
            brandId: 'brand-montech',
            requirement: 'RECOMMENDED',
            notes: 'EFRA/BRCA approved aero profile for high downforce balance.',
            compatibilityRuleId: 'compat-x4-body',
            compatibilityRuleDescription: '190mm touring car competition aerodynamic package',
            verified: true,
            sortOrder: 6,
          },
        ],
      },
    ],
  },
  {
    id: 'hbld-tc10-club-002',
    slug: 'halo-tc10-club-spec',
    title: 'Halo TC10 Club Racer',
    subtitle: 'Balanced Club-Racing Setup for Weekly Regional Championships',
    buildType: 'CLUB_BUILD',
    provenance: 'HALO_ENGINEERED',
    discipline: 'TOURING',
    scale: '1:10',
    platformId: 'plat-xray-x4',
    platformName: 'XRAY X4 Platform',
    baseProductId: 'prod-xray-x4-2026',
    baseProductName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
    status: 'PUBLISHED',
    published: true,
    heroImageUrl: 'https://images.halo-rc.com/builds/halo-tc10-club.jpg',
    engineeringSummary:
      'Configured with cost-effective, zero-maintenance electronics complying with standard club blinking rules. Reliable, balanced, and durable for weekend racing.',
    trackConditions: 'Club Carpet & Asphalt',
    currentVersion: '1.0',
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-05T12:00:00Z',
    versions: [
      {
        id: 'hbld-ver-tc10-1-0',
        buildId: 'hbld-tc10-club-002',
        version: '1.0',
        status: 'PUBLISHED',
        changelogNotes: 'Standard club release with Justock ESC configuration.',
        engineeringNotes: 'Zero-timing fixed RPM spec for club compliance.',
        publishedAt: '2026-02-05T12:00:00Z',
        validatedAt: '2026-02-05T11:30:00Z',
        createdAt: '2026-01-20T10:00:00Z',
        components: [
          {
            role: 'BASE_MACHINE',
            subsystem: 'CHASSIS',
            productId: 'prod-xray-x4-2026',
            sku: 'XRAY-300040',
            productName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
            brandName: 'XRAY',
            brandId: 'brand-xray',
            requirement: 'REQUIRED',
            verified: true,
            sortOrder: 1,
          },
          {
            role: 'ESC',
            subsystem: 'POWERTRAIN',
            productId: 'prod-hw-xr10-justock',
            sku: 'HW-30112003',
            productName: 'Hobbywing XeRun XR10 Justock G3 Sensored ESC',
            brandName: 'Hobbywing',
            brandId: 'brand-hobbywing',
            requirement: 'REQUIRED',
            verified: true,
            sortOrder: 2,
          },
          {
            role: 'SERVO_STEERING',
            subsystem: 'CONTROL',
            productId: 'prod-savox-sb2292sg',
            sku: 'SAVOX-SB2292SG',
            productName: 'Savox SB-2292SG Monster Torque Brushless Servo',
            brandName: 'Savox',
            brandId: 'brand-savox',
            requirement: 'REQUIRED',
            verified: true,
            sortOrder: 3,
          },
        ],
      },
    ],
  },
  {
    id: 'hbld-draft-003',
    slug: 'halo-prototype-gt-draft',
    title: 'Halo GT Prototype Spec',
    subtitle: 'Under Development — Internal Engineering Review Only',
    buildType: 'RACE_BUILD',
    provenance: 'RESEARCH_BASED',
    discipline: 'GT',
    scale: '1:8',
    platformId: 'plat-xray-x4',
    platformName: 'XRAY Platform',
    baseProductId: 'prod-xray-x4-2026',
    baseProductName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
    status: 'DRAFT',
    published: false,
    engineeringSummary: 'Confidential developmental test bed for high-speed aerodynamics.',
    currentVersion: '0.1',
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    versions: [
      {
        id: 'hbld-ver-draft-0-1',
        buildId: 'hbld-draft-003',
        version: '0.1',
        status: 'DRAFT',
        changelogNotes: 'Draft prototype testing phase.',
        components: [],
        createdAt: '2026-03-01T10:00:00Z',
      },
    ],
  },
  {
    id: 'hbld-retired-004',
    slug: 'halo-x4-2024-legacy-spec',
    title: 'Halo X4 2024 Legacy Spec',
    subtitle: 'Archived Historical Blueprint',
    buildType: 'BASELINE_BUILD',
    provenance: 'MANUFACTURER_BASED',
    discipline: 'TOURING',
    scale: '1:10',
    platformId: 'plat-xray-x4',
    platformName: 'XRAY X4 Platform',
    baseProductId: 'prod-xray-x4-2026',
    baseProductName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
    status: 'RETIRED',
    published: false,
    engineeringSummary: 'Retired competition setup from previous season.',
    currentVersion: '1.0',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
    versions: [
      {
        id: 'hbld-ver-legacy-1-0',
        buildId: 'hbld-retired-004',
        version: '1.0',
        status: 'RETIRED',
        changelogNotes: 'Legacy version retired following chassis update.',
        components: [],
        createdAt: '2024-01-10T10:00:00Z',
      },
    ],
  },
]

const INITIAL_AUDIT_LOGS: HaloBuildAuditLog[] = [
  {
    id: 'hlog-001',
    buildId: 'hbld-x4-comp-001',
    buildVersion: '1.0',
    action: 'CREATED',
    details: { note: 'Initial engineering draft authored.' },
    userId: 'usr-admin-001',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'hlog-002',
    buildId: 'hbld-x4-comp-001',
    buildVersion: '1.0',
    action: 'VALIDATED',
    details: { result: 'All required slots verified compatible.' },
    userId: 'usr-admin-001',
    createdAt: '2026-02-01T11:45:00Z',
  },
  {
    id: 'hlog-003',
    buildId: 'hbld-x4-comp-001',
    buildVersion: '1.0',
    action: 'PUBLISHED',
    details: { marketOfferUK: true, marketOfferUS: true },
    userId: 'usr-admin-001',
    createdAt: '2026-02-01T12:00:00Z',
  },
]

// Mutable store for testing
let BUILDS_STORE: HaloBuildRecord[] = JSON.parse(JSON.stringify(INITIAL_HALO_BUILDS))
let AUDIT_LOGS_STORE: HaloBuildAuditLog[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS))

export function __resetRaceStoreForTesting(): void {
  BUILDS_STORE = JSON.parse(JSON.stringify(INITIAL_HALO_BUILDS))
  AUDIT_LOGS_STORE = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS))
}

export function __getRawRaceCounts() {
  return {
    totalBuilds: BUILDS_STORE.length,
    publishedBuilds: BUILDS_STORE.filter((b) => b.status === 'PUBLISHED' && b.published).length,
    draftBuilds: BUILDS_STORE.filter((b) => b.status === 'DRAFT').length,
    retiredBuilds: BUILDS_STORE.filter((b) => b.status === 'RETIRED').length,
    reviewRequiredBuilds: BUILDS_STORE.filter((b) => b.status === 'REVIEW').length,
    totalAuditLogs: AUDIT_LOGS_STORE.length,
  }
}

// ── Public Queries ────────────────────────────────────────────────────────────

/**
 * Get published Halo Builds for public discovery.
 * Filters strictly to status === 'PUBLISHED' and published === true.
 * Drafts and retired builds are NEVER returned.
 */
export async function getPublishedHaloBuilds(filters?: {
  discipline?: RaceDiscipline | string
  scale?: string
  platformId?: string
  brandId?: string
  buildType?: HaloBuildType | string
  marketCode?: MarketCode
}): Promise<HaloBuildRecord[]> {
  let list = BUILDS_STORE.filter((b) => b.status === 'PUBLISHED' && b.published)

  if (filters?.discipline && filters.discipline !== 'ALL') {
    list = list.filter((b) => b.discipline.toUpperCase() === filters.discipline!.toUpperCase())
  }
  if (filters?.scale && filters.scale !== 'ALL') {
    list = list.filter((b) => b.scale === filters.scale)
  }
  if (filters?.platformId && filters.platformId !== 'ALL') {
    list = list.filter((b) => b.platformId === filters.platformId)
  }
  if (filters?.buildType && filters.buildType !== 'ALL') {
    list = list.filter((b) => b.buildType === filters.buildType)
  }

  // Filter by market availability if requested
  if (filters?.marketCode) {
    const code = filters.marketCode
    list = list.filter((b) => {
      const pricing = resolveCurrentBuildPricing(b, code)
      return pricing.availabilityState === 'AVAILABLE' || pricing.availabilityState === 'PARTIALLY_AVAILABLE'
    })
  }

  return list
}

/**
 * Get a single Halo Build by its URL slug.
 * By default, only returns PUBLISHED builds.
 * Pass options.includeDrafts = true only for authorized admin contexts.
 */
export async function getHaloBuildBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<HaloBuildRecord | null> {
  const build = BUILDS_STORE.find((b) => b.slug === slug)
  if (!build) return null

  if (!options?.includeDrafts && (build.status !== 'PUBLISHED' || !build.published)) {
    return null
  }

  return build
}

/**
 * Get a single Halo Build by its internal ID.
 */
export async function getHaloBuildById(
  id: string,
  options?: { includeDrafts?: boolean }
): Promise<HaloBuildRecord | null> {
  const build = BUILDS_STORE.find((b) => b.id === id)
  if (!build) return null

  if (!options?.includeDrafts && (build.status !== 'PUBLISHED' || !build.published)) {
    return null
  }

  return build
}

/**
 * Get a specific immutable historical version of a Halo Build.
 */
export async function getHaloBuildVersion(
  buildId: string,
  versionNumber: string
): Promise<HaloBuildVersionRecord | null> {
  const build = BUILDS_STORE.find((b) => b.id === buildId)
  if (!build) return null

  const ver = build.versions.find((v) => v.version === versionNumber)
  return ver ?? null
}

// ── Validation & Pricing Operations ───────────────────────────────────────────

/**
 * Validate a Halo Build version against authoritative catalogue rules.
 * Does NOT duplicate the Phase 3 compatibility engine — directly verifies:
 * 1. Base machine exists, active, and published.
 * 2. Required slot components resolve.
 * 3. Verified compatibility rules exist (rejects unverified rules).
 * 4. Component lifecycle states (flags replaced components).
 * 5. Market offers exist for commercial availability.
 */
export function validateHaloBuild(
  buildId: string,
  versionNumber: string,
  marketCode: MarketCode = 'UK'
): HaloBuildValidationResult {
  const build = BUILDS_STORE.find((b) => b.id === buildId)
  if (!build) {
    return {
      isValid: false,
      canPublish: false,
      buildId,
      version: versionNumber,
      errors: ['Halo Build record not found.'],
      warnings: [],
      details: {
        baseMachineValid: false,
        platformValid: false,
        requiredSlotsSatisfied: false,
        compatibilityVerified: false,
        lifecycleValid: false,
        ukOfferAvailable: false,
        usOfferAvailable: false,
      },
    }
  }

  const ver = build.versions.find((v) => v.version === versionNumber)
  if (!ver) {
    return {
      isValid: false,
      canPublish: false,
      buildId,
      version: versionNumber,
      errors: [`Version ${versionNumber} not found on build ${buildId}.`],
      warnings: [],
      details: {
        baseMachineValid: false,
        platformValid: false,
        requiredSlotsSatisfied: false,
        compatibilityVerified: false,
        lifecycleValid: false,
        ukOfferAvailable: false,
        usOfferAvailable: false,
      },
    }
  }

  const errors: string[] = []
  const warnings: string[] = []

  // 1. Base Machine & Platform
  const baseMachine = SEED_PRODUCTS.find((p) => p.id === build.baseProductId)
  const baseMachineValid = Boolean(baseMachine && baseMachine.published)
  if (!baseMachineValid) {
    errors.push(`Base machine (${build.baseProductId}) does not exist or is not published.`)
  }

  const platform = SEED_PLATFORMS.find((p) => p.id === build.platformId)
  const platformValid = Boolean(platform)
  if (!platformValid) {
    errors.push(`Platform (${build.platformId}) does not exist.`)
  }

  // 2. Required Slots & Components
  const requiredRoles: BuildSlotRole[] = ['BASE_MACHINE', 'MOTOR', 'ESC', 'SERVO_STEERING', 'BATTERY']
  const presentRoles = ver.components.map((c) => c.role)
  const missingRequired = requiredRoles.filter((r) => !presentRoles.includes(r))
  const requiredSlotsSatisfied = missingRequired.length === 0
  if (!requiredSlotsSatisfied) {
    errors.push(`Missing mandatory configuration slots: ${missingRequired.join(', ')}.`)
  }

  // 3. Compatibility Rules Verification
  let compatibilityVerified = true
  for (const comp of ver.components) {
    if (comp.role === 'BASE_MACHINE') continue

    // Find rule in SEED_COMPATIBILITY_RULES
    const rule = SEED_COMPATIBILITY_RULES.find(
      (r) =>
        r.sourceEntityId === comp.productId &&
        (r.targetEntityId === build.baseProductId || r.targetEntityId === build.platformId)
    )

    if (!rule) {
      // Incompatible component with no rule
      compatibilityVerified = false
      errors.push(`Component ${comp.productName} (${comp.sku}) has no compatibility rule for platform ${build.platformName}.`)
    } else if (!rule.verified) {
      // Unverified rule — Scenario C mandate: MUST reject
      compatibilityVerified = false
      errors.push(`Component ${comp.productName} has unverified compatibility rule (${rule.id}). Unverified rules are rejected.`)
    }
  }

  // 4. Lifecycle Validity
  let lifecycleValid = true
  for (const comp of ver.components) {
    const prod = SEED_PRODUCTS.find((p) => p.id === comp.productId)
    if (prod?.lifecycle === 'DISCONTINUED') {
      lifecycleValid = false
      warnings.push(`Component ${comp.productName} is DISCONTINUED.`)
    } else if (prod?.lifecycle === 'REPLACED') {
      warnings.push(
        `Component ${comp.productName} is REPLACED by modern alternative ${prod.replacementProductId ?? 'unknown'}.`
      )
    }
  }

  // 5. Commercial Offers
  let ukOfferAvailable = true
  let usOfferAvailable = true

  for (const comp of ver.components) {
    const offers = getOffersForProduct(comp.productId)
    const ukOffer = resolveMarketOffer(offers, 'UK')
    const usOffer = resolveMarketOffer(offers, 'US')

    if (!ukOffer || ukOffer.availability === 'NOT_AVAILABLE') {
      ukOfferAvailable = false
    }
    if (!usOffer || usOffer.availability === 'NOT_AVAILABLE') {
      usOfferAvailable = false
    }
  }

  if (!ukOfferAvailable) {
    warnings.push('One or more components lack active commercial offers in the UK market.')
  }
  if (!usOfferAvailable) {
    warnings.push('One or more components lack active commercial offers in the US market.')
  }

  const isValid = errors.length === 0
  const canPublish = isValid && (marketCode === 'UK' ? ukOfferAvailable : usOfferAvailable)

  return {
    isValid,
    canPublish,
    buildId,
    version: versionNumber,
    errors,
    warnings,
    details: {
      baseMachineValid,
      platformValid,
      requiredSlotsSatisfied,
      compatibilityVerified,
      lifecycleValid,
      ukOfferAvailable,
      usOfferAvailable,
    },
  }
}

/**
 * Dynamically resolve current commercial pricing for a Halo Build in a specific market.
 * Prices are NEVER hardcoded on the build — they always resolve from current SEED_OFFERS.
 */
export function resolveCurrentBuildPricing(
  build: HaloBuildRecord,
  marketCode: MarketCode = 'UK'
): HaloBuildPricingCalculation {
  const currentVer = build.versions.find((v) => v.version === build.currentVersion)
  const currency: Currency = marketCode === 'UK' ? 'GBP' : 'USD'
  const taxMode: TaxMode = marketCode === 'UK' ? 'INCLUSIVE' : 'EXCLUSIVE'

  if (!currentVer || currentVer.components.length === 0) {
    return {
      marketCode,
      currency,
      taxMode,
      availabilityState: 'TECHNICAL_ONLY',
      totalMinorUnits: null,
      isPurchasable: false,
      unavailableCount: 0,
      replacedCount: 0,
      lines: [],
    }
  }

  let grandTotal = 0
  let unavailableCount = 0
  let replacedCount = 0
  let missingOffer = false

  const lines = currentVer.components.map((comp) => {
    const prod = SEED_PRODUCTS.find((p) => p.id === comp.productId)
    const isReplaced = prod?.lifecycle === 'REPLACED'
    if (isReplaced) replacedCount++

    const offers = getOffersForProduct(comp.productId)
    const offer = resolveMarketOffer(offers, marketCode)

    if (!offer || offer.availability === 'NOT_AVAILABLE') {
      unavailableCount++
      missingOffer = true
      return {
        role: comp.role,
        productId: comp.productId,
        productName: comp.productName,
        sku: comp.sku,
        available: false,
        priceMinorUnits: null,
        availabilityStatus: (offer?.availability ?? 'NOT_AVAILABLE') as AvailabilityStatus,
        isReplaced,
        replacementProductId: prod?.replacementProductId ?? null,
      }
    }

    grandTotal += offer.retailPriceMinorUnits
    return {
      role: comp.role,
      productId: comp.productId,
      productName: comp.productName,
      sku: comp.sku,
      available: true,
      priceMinorUnits: offer.retailPriceMinorUnits,
      availabilityStatus: offer.availability,
      isReplaced,
      replacementProductId: prod?.replacementProductId ?? null,
    }
  })

  let availabilityState: HaloBuildPricingCalculation['availabilityState'] = 'AVAILABLE'
  if (replacedCount > 0) {
    availabilityState = 'REVIEW_REQUIRED'
  } else if (unavailableCount === lines.length) {
    availabilityState = 'UNAVAILABLE'
  } else if (unavailableCount > 0) {
    availabilityState = 'PARTIALLY_AVAILABLE'
  }

  const isPurchasable = availabilityState === 'AVAILABLE' && !missingOffer

  return {
    marketCode,
    currency,
    taxMode,
    availabilityState,
    totalMinorUnits: missingOffer ? null : grandTotal,
    isPurchasable,
    unavailableCount,
    replacedCount,
    lines,
  }
}

// ── Admin Mutation Operations ─────────────────────────────────────────────────

/**
 * Create a new draft Halo Build.
 */
export async function createHaloBuildDraft(
  input: {
    slug: string
    title: string
    subtitle?: string
    buildType: HaloBuildType
    provenance: HaloBuildProvenance
    discipline: RaceDiscipline
    scale: string
    platformId: string
    baseProductId: string
    engineeringSummary: string
    trackConditions?: string
  },
  userId: string
): Promise<HaloBuildRecord> {
  const existing = BUILDS_STORE.find((b) => b.slug === input.slug)
  if (existing) {
    throw new Error(`Halo Build slug "${input.slug}" is already taken.`)
  }

  const platform = SEED_PLATFORMS.find((p) => p.id === input.platformId)
  const baseProduct = SEED_PRODUCTS.find((p) => p.id === input.baseProductId)

  const buildId = `hbld-${crypto.randomUUID().slice(0, 8)}`
  const versionId = `hbld-ver-${crypto.randomUUID().slice(0, 8)}`

  const newVersion: HaloBuildVersionRecord = {
    id: versionId,
    buildId,
    version: '1.0',
    status: 'DRAFT',
    components: [],
    createdAt: new Date().toISOString(),
  }

  const newBuild: HaloBuildRecord = {
    id: buildId,
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle ?? null,
    buildType: input.buildType,
    provenance: input.provenance,
    discipline: input.discipline,
    scale: input.scale,
    platformId: input.platformId,
    platformName: platform ? platform.name : 'Unknown Platform',
    baseProductId: input.baseProductId,
    baseProductName: baseProduct ? baseProduct.name : 'Unknown Product',
    status: 'DRAFT',
    published: false,
    engineeringSummary: input.engineeringSummary,
    trackConditions: input.trackConditions ?? null,
    currentVersion: '1.0',
    versions: [newVersion],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  BUILDS_STORE.push(newBuild)
  recordBuildAuditLog(buildId, '1.0', 'CREATED', { title: input.title }, userId)

  return newBuild
}

/**
 * Add a component to a draft Halo Build version.
 */
export async function addComponentToBuildVersion(
  buildId: string,
  versionNumber: string,
  component: {
    role: BuildSlotRole
    subsystem: HaloBuildSubsystem
    productId: string
    requirement?: HaloBuildComponentSnapshot['requirement']
    notes?: string
  }
): Promise<HaloBuildVersionRecord> {
  const build = BUILDS_STORE.find((b) => b.id === buildId)
  if (!build) throw new Error(`Build ${buildId} not found.`)

  const ver = build.versions.find((v) => v.version === versionNumber)
  if (!ver) throw new Error(`Version ${versionNumber} not found.`)

  if (ver.status === 'PUBLISHED') {
    throw new Error(`Cannot modify published version ${versionNumber}. Published versions are immutable. Create a new version.`)
  }

  const prod = SEED_PRODUCTS.find((p) => p.id === component.productId)
  if (!prod) throw new Error(`Product ${component.productId} not found in catalogue.`)
  const brand = SEED_BRANDS.find((b) => b.id === prod.brandId)

  // Find verified rule
  const rule = SEED_COMPATIBILITY_RULES.find(
    (r) =>
      r.sourceEntityId === component.productId &&
      (r.targetEntityId === build.baseProductId || r.targetEntityId === build.platformId)
  )

  const newComp: HaloBuildComponentSnapshot = {
    role: component.role,
    subsystem: component.subsystem,
    productId: prod.id,
    sku: prod.sku ?? 'UNKNOWN-SKU',
    productName: prod.name,
    brandName: brand ? brand.name : 'Unknown Brand',
    brandId: prod.brandId,
    requirement: component.requirement ?? 'REQUIRED',
    notes: component.notes ?? null,
    compatibilityRuleId: rule ? rule.id : null,
    compatibilityRuleDescription: rule ? rule.notes ?? 'Verified rule' : null,
    verified: rule ? rule.verified : false,
    sortOrder: ver.components.length + 1,
  }

  ver.components.push(newComp)
  build.updatedAt = new Date().toISOString()
  return ver
}

/**
 * Create a new draft version from an existing version.
 * Leaves the previous version intact and immutable.
 */
export async function createNewBuildVersion(
  buildId: string,
  baseVersionNumber: string,
  changelogNotes: string,
  userId: string
): Promise<HaloBuildVersionRecord> {
  const build = BUILDS_STORE.find((b) => b.id === buildId)
  if (!build) throw new Error(`Build ${buildId} not found.`)

  const baseVer = build.versions.find((v) => v.version === baseVersionNumber)
  if (!baseVer) throw new Error(`Base version ${baseVersionNumber} not found.`)

  // Increment version: e.g. "1.0" -> "1.1"
  const parts = baseVersionNumber.split('.').map(Number)
  const major = parts[0] ?? 1
  const minor = (parts[1] ?? 0) + 1
  const newVersionStr = `${major}.${minor}`

  const newVersion: HaloBuildVersionRecord = {
    id: `hbld-ver-${crypto.randomUUID().slice(0, 8)}`,
    buildId,
    version: newVersionStr,
    status: 'DRAFT',
    changelogNotes,
    engineeringNotes: baseVer.engineeringNotes ?? null,
    components: JSON.parse(JSON.stringify(baseVer.components)), // Deep copy of configuration
    createdAt: new Date().toISOString(),
  }

  build.versions.push(newVersion)
  build.updatedAt = new Date().toISOString()

  recordBuildAuditLog(buildId, newVersionStr, 'VERSION_BUMPED', { baseVersion: baseVersionNumber }, userId)
  return newVersion
}

/**
 * Publish a Halo Build version.
 * Validates the build; if valid, sets version to PUBLISHED, updates build currentVersion,
 * sets build status to PUBLISHED, and writes audit record.
 * If validation fails, throws an error with explicit reasons.
 */
export async function publishHaloBuildVersion(
  buildId: string,
  versionNumber: string,
  adminUserId: string,
  marketCode: MarketCode = 'UK'
): Promise<HaloBuildRecord> {
  const build = BUILDS_STORE.find((b) => b.id === buildId)
  if (!build) throw new Error(`Build ${buildId} not found.`)

  const ver = build.versions.find((v) => v.version === versionNumber)
  if (!ver) throw new Error(`Version ${versionNumber} not found.`)

  // Validate before publishing
  const validation = validateHaloBuild(buildId, versionNumber, marketCode)
  if (!validation.isValid) {
    throw new Error(`Cannot publish build ${buildId} v${versionNumber}. Validation failed: ${validation.errors.join('; ')}`)
  }

  // Update version status
  ver.status = 'PUBLISHED'
  ver.publishedAt = new Date().toISOString()
  ver.validatedAt = new Date().toISOString()

  // Update build master record
  build.currentVersion = versionNumber
  build.status = 'PUBLISHED'
  build.published = true
  build.updatedAt = new Date().toISOString()

  recordBuildAuditLog(
    buildId,
    versionNumber,
    'PUBLISHED',
    {
      validationErrors: validation.errors.length,
      warnings: validation.warnings,
    },
    adminUserId
  )

  return build
}

/**
 * Retire a Halo Build.
 * Retains historical integrity while unpublishing from public storefront.
 */
export async function retireHaloBuild(buildId: string, adminUserId: string): Promise<HaloBuildRecord> {
  const build = BUILDS_STORE.find((b) => b.id === buildId)
  if (!build) throw new Error(`Build ${buildId} not found.`)

  build.status = 'RETIRED'
  build.published = false
  build.updatedAt = new Date().toISOString()

  for (const v of build.versions) {
    if (v.status === 'PUBLISHED') {
      v.status = 'RETIRED'
    }
  }

  recordBuildAuditLog(buildId, build.currentVersion, 'RETIRED', {}, adminUserId)
  return build
}

/**
 * Record an audit log entry.
 */
export function recordBuildAuditLog(
  buildId: string,
  buildVersion: string | null,
  action: HaloBuildAuditLog['action'],
  details: Record<string, unknown>,
  userId: string
): HaloBuildAuditLog {
  const log: HaloBuildAuditLog = {
    id: `hlog-${crypto.randomUUID().slice(0, 8)}`,
    buildId,
    buildVersion,
    action,
    details,
    userId,
    createdAt: new Date().toISOString(),
  }
  AUDIT_LOGS_STORE.push(log)
  return log
}

/**
 * Get audit logs for a build.
 */
export async function getBuildAuditLogs(buildId: string): Promise<HaloBuildAuditLog[]> {
  return AUDIT_LOGS_STORE.filter((l) => l.buildId === buildId)
}
