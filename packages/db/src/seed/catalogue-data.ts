import type {
  BrandTier,
  BrandStatus,
  ProductTier,
  RecordStatus,
  LifecycleStatus,
  DataConfidence,
  SourceType,
  ProductType,
  PowerType,
  MarketCode,
  Currency,
  TaxMode,
  AvailabilityStatus,
  SupplyRoute,
  CompatibilityRuleType,
  DocumentType,
  Discipline,
  CommercialRelationship,
} from '@halo-rc/types'

export interface SeedBrand {
  id: string
  slug: string
  name: string
  tier: BrandTier
  status: BrandStatus
  countryOfOrigin: string
  foundedYear: number | null
  description: string
  website: string | null
  commercialRelationship: CommercialRelationship
  specialisms: string[]
  disciplines: Discipline[]
}

export interface SeedPlatform {
  id: string
  slug: string
  name: string
  brandId: string
  chassisMaterial?: string
  driveConfig?: '2WD' | '4WD' | 'AWD' | 'RWD'
  wheelbaseMm?: number
  description: string
  status: RecordStatus
  published: boolean
}

export interface SeedProduct {
  id: string
  slug: string
  sku: string
  brandId: string
  platformId: string | null
  name: string
  shortName: string
  categoryId: string
  subcategoryId?: string
  scale?: string
  powerType?: PowerType
  productType: ProductType
  tier: ProductTier
  status: RecordStatus
  lifecycle: LifecycleStatus
  replacementProductId?: string
  haloClassification?: string
  editorialSummary: string
  discipline: Discipline
  tags?: string[]
  published: boolean
}

export interface SeedVariant {
  id: string
  productId: string
  sku: string
  name: string
  colour?: string
  configuration?: string
  weightG?: number
  status: RecordStatus
  lifecycle: LifecycleStatus
  published: boolean
}

export interface SeedOffer {
  id: string
  productVariantId: string
  marketCode: MarketCode
  retailPrice: number // minor units
  currency: Currency
  taxMode: TaxMode
  availability: AvailabilityStatus
  supplierId?: string
  supplyRoute?: SupplyRoute
  leadTimeDays?: number
  notes?: string
}

export interface SeedSpecification {
  id: string
  entityType: 'product' | 'platform' | 'variant'
  entityId: string
  key: string
  value: string
  unit?: string
  confidence: DataConfidence
  sourceType?: SourceType
  sourceUrl?: string
  sourceDocument?: string
  verifiedAt?: string
  notes?: string
}

export interface SeedCompatibilityRule {
  id: string
  sourceEntityType: 'product'
  sourceEntityId: string
  targetEntityType: 'platform' | 'product'
  targetEntityId: string
  ruleType: CompatibilityRuleType
  verified: boolean
  sourceType?: SourceType
  sourceUrl?: string
  notes?: string
}

export interface SeedDocument {
  id: string
  entityType: 'product' | 'platform'
  entityId: string
  documentType: DocumentType
  title: string
  version?: string
  sourceUrl?: string
  approvedForUse: boolean
  published: boolean
}

// ── 1. Brands ────────────────────────────────────────────────────────────────
export const SEED_BRANDS: SeedBrand[] = [
  {
    id: 'brand-xray',
    slug: 'xray',
    name: 'XRAY',
    tier: 'PREMIUM_COMPETITION',
    status: 'ACTIVE',
    countryOfOrigin: 'SK',
    foundedYear: 1998,
    description: 'Slovak manufacturer renowned for world-championship touring car and off-road engineering.',
    website: 'https://teamxray.com',
    commercialRelationship: 'OFFICIAL_DEALER',
    specialisms: ['1/10 Touring', '1/8 Off-Road', '1/10 Pan Car'],
    disciplines: ['RACE'],
  },
  {
    id: 'brand-traxxas',
    slug: 'traxxas',
    name: 'Traxxas',
    tier: 'FLAGSHIP',
    status: 'ACTIVE',
    countryOfOrigin: 'US',
    foundedYear: 1986,
    description: 'The defining pioneer of ready-to-run high-power RC bashers and realistic scale trail trucks.',
    website: 'https://traxxas.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Large Scale Bash', 'Scale Trail Crawlers', 'Monster Trucks'],
    disciplines: ['BASH', 'CRAWL'],
  },
  {
    id: 'brand-arrma',
    slug: 'arrma',
    name: 'ARRMA',
    tier: 'FLAGSHIP',
    status: 'ACTIVE',
    countryOfOrigin: 'US',
    foundedYear: 2011,
    description: 'Engineered for extreme high-speed bashing and durability under punishing conditions.',
    website: 'https://arrma-rc.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Extreme Bash (EXB)', 'High Speed Stunt Trucks'],
    disciplines: ['BASH'],
  },
  {
    id: 'brand-awesomatix',
    slug: 'awesomatix',
    name: 'Awesomatix',
    tier: 'PREMIUM_COMPETITION',
    status: 'ACTIVE',
    countryOfOrigin: 'CZ',
    foundedYear: 2013,
    description: 'Revolutionary Czech competition engineering featuring innovative rotary damper architecture.',
    website: 'https://awesomatix.com',
    commercialRelationship: 'INDEPENDENT',
    specialisms: ['1/10 Touring', 'Rotary Damper Suspension', 'Carbon Matrix'],
    disciplines: ['RACE'],
  },
  {
    id: 'brand-team-associated',
    slug: 'team-associated',
    name: 'Team Associated',
    tier: 'FLAGSHIP',
    status: 'ACTIVE',
    countryOfOrigin: 'US',
    foundedYear: 1965,
    description: 'Historic American competition champion with dozens of IFMAR world titles.',
    website: 'https://teamassociated.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['1/8 Nitro Buggy', '1/10 2WD/4WD Buggy', 'Short Course'],
    disciplines: ['RACE'],
  },
  {
    id: 'brand-yokomo',
    slug: 'yokomo',
    name: 'Yokomo',
    tier: 'PREMIUM_COMPETITION',
    status: 'ACTIVE',
    countryOfOrigin: 'JP',
    foundedYear: 1975,
    description: 'Japanese competition powerhouse dominating international RC drift and touring car disciplines.',
    website: 'https://teamyokomo.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Championship RWD Drift', '1/10 Touring'],
    disciplines: ['DRIFT', 'RACE'],
  },
  {
    id: 'brand-reve-d',
    slug: 'reve-d',
    name: 'Rêve D',
    tier: 'DRIFT',
    status: 'ACTIVE',
    countryOfOrigin: 'JP',
    foundedYear: 2019,
    description: 'Specialist Japanese drift brand engineering lightweight, highly articulate RWD drift platforms.',
    website: 'https://teamreved.com',
    commercialRelationship: 'INDEPENDENT',
    specialisms: ['RWD Drift Chassis', 'Specialist Drift Geometry'],
    disciplines: ['DRIFT'],
  },
  {
    id: 'brand-axial',
    slug: 'axial',
    name: 'Axial',
    tier: 'FLAGSHIP',
    status: 'ACTIVE',
    countryOfOrigin: 'US',
    foundedYear: 2005,
    description: 'The benchmark brand in competition rock crawling and realistic trail exploration.',
    website: 'https://axialadventure.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Scale Rock Crawling', 'Trail Rigs', 'Portal Axles'],
    disciplines: ['CRAWL', 'SCALE'],
  },
  {
    id: 'brand-tamiya',
    slug: 'tamiya',
    name: 'Tamiya',
    tier: 'FLAGSHIP',
    status: 'ACTIVE',
    countryOfOrigin: 'JP',
    foundedYear: 1946,
    description: 'Legendary Japanese scale model and RC manufacturer revered for iconic realism and mechanical craft.',
    website: 'https://tamiya.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Scale Realism', 'Builder Kits', 'Heritage RC'],
    disciplines: ['SCALE', 'RACE'],
  },
  {
    id: 'brand-fg',
    slug: 'fg-modellsport',
    name: 'FG Modellsport',
    tier: 'HALO_SCALE',
    status: 'RESEARCHED',
    countryOfOrigin: 'DE',
    foundedYear: 1982,
    description: 'German pioneer in 1/5 large-scale on-road and off-road petrol motorsport engineering.',
    website: 'https://fg-modellsport.de',
    commercialRelationship: 'RESEARCHED',
    specialisms: ['1/5 Touring', '1/5 Scale GT', 'Petrol Motorsport'],
    disciplines: ['LARGE_SCALE'],
  },
  {
    id: 'brand-mecatech',
    slug: 'mecatech',
    name: 'Mecatech',
    tier: 'HALO_SCALE',
    status: 'RESEARCHED',
    countryOfOrigin: 'FR',
    foundedYear: 1995,
    description: 'French master manufacturer of true hydraulic disc braking systems and bespoke 1/5 racing machines.',
    website: 'https://mecatech.fr',
    commercialRelationship: 'RESEARCHED',
    specialisms: ['Hydraulic Disc Brakes', 'Large Scale Supercars', 'Bespoke CNC'],
    disciplines: ['LARGE_SCALE', 'RACE'],
  },
  {
    id: 'brand-hobbywing',
    slug: 'hobbywing',
    name: 'Hobbywing',
    tier: 'ELECTRONICS',
    status: 'ACTIVE',
    countryOfOrigin: 'CN',
    foundedYear: 2003,
    description: 'World-championship brushless power systems, XeRun ESCs, and sensorless monster truck combos.',
    website: 'https://hobbywing.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Competition ESCs', 'Brushless Motors', 'Telemetry'],
    disciplines: ['RACE', 'BASH', 'DRIFT'],
  },
  {
    id: 'brand-sanwa',
    slug: 'sanwa',
    name: 'Sanwa',
    tier: 'ELECTRONICS',
    status: 'ACTIVE',
    countryOfOrigin: 'JP',
    foundedYear: 1974,
    description: 'Ultra-fast FH5 telemetry radio equipment selected by top international factory drivers.',
    website: 'https://sanwa-denshi.co.jp',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['FH5 Transmitters', 'High-Response Receivers'],
    disciplines: ['RACE', 'DRIFT'],
  },
  {
    id: 'brand-savox',
    slug: 'savox',
    name: 'Savox',
    tier: 'ELECTRONICS',
    status: 'ACTIVE',
    countryOfOrigin: 'TW',
    foundedYear: 2007,
    description: 'Precision digital and brushless titanium-geared servos for competition and heavy-duty bashers.',
    website: 'https://savox.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Titanium Gear Servos', 'High Voltage Brushless'],
    disciplines: ['RACE', 'BASH', 'CRAWL'],
  },
  {
    id: 'brand-sunpadow',
    slug: 'sunpadow',
    name: 'Sunpadow',
    tier: 'ELECTRONICS',
    status: 'ACTIVE',
    countryOfOrigin: 'CN',
    foundedYear: 2011,
    description: 'World championship winning competition LiPo batteries engineered with ultra-low internal resistance.',
    website: 'https://sunpadow.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Competition LiPo Batteries', 'LCG Low Centre of Gravity Packs'],
    disciplines: ['RACE', 'DRIFT'],
  },
  {
    id: 'brand-icharger',
    slug: 'icharger',
    name: 'iCharger',
    tier: 'ELECTRONICS',
    status: 'ACTIVE',
    countryOfOrigin: 'CN',
    foundedYear: 2006,
    description: 'High-current precision balance chargers and battery diagnostic systems for competition paddocks.',
    website: 'https://hillrc.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['Synchronous Balance Chargers', 'Ultra-fast Discharge Testing'],
    disciplines: ['RACE', 'BASH'],
  },
  {
    id: 'brand-montech',
    slug: 'montech',
    name: 'Mon-Tech Racing',
    tier: 'AFTERMARKET',
    status: 'ACTIVE',
    countryOfOrigin: 'IT',
    foundedYear: 2004,
    description: 'Italian manufacturer of aerodynamic 1/10 touring car and pan car competition polycarbonate bodies.',
    website: 'https://mon-techracing.net',
    commercialRelationship: 'INDEPENDENT',
    specialisms: ['Touring Car Aerodynamics', 'EFRA/BRCA Homologated Bodies'],
    disciplines: ['RACE'],
  },
  {
    id: 'brand-mugen-seiki',
    slug: 'mugen-seiki',
    name: 'Mugen Seiki',
    tier: 'PREMIUM_COMPETITION',
    status: 'ACTIVE',
    countryOfOrigin: 'JP',
    foundedYear: 1990,
    description: 'Premier Japanese RC racing manufacturer, legendary for multiple IFMAR World Championship titles across 1/8 nitro off-road buggies (MBX), 1/8 on-road track racing (MRX), and competition electric touring cars (MTC).',
    website: 'https://www.mugenseiki.com',
    commercialRelationship: 'DISTRIBUTOR_SOURCED',
    specialisms: ['1/8 Off-Road Buggies', '1/8 On-Road Track', '1/10 Electric Touring', '1/10 2WD Buggies'],
    disciplines: ['RACE'],
  },
]

// ── 2. Platforms ─────────────────────────────────────────────────────────────
export const SEED_PLATFORMS: SeedPlatform[] = [
  {
    id: 'plat-xmaxx',
    slug: 'traxxas-x-maxx',
    name: 'X-Maxx',
    brandId: 'brand-traxxas',
    driveConfig: '4WD',
    description: 'Traxxas large-scale heavy duty monster truck platform with modular chassis design.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-kraton-6s',
    slug: 'arrma-kraton-6s',
    name: 'Kraton 6S',
    brandId: 'brand-arrma',
    chassisMaterial: '7075-T6 Aluminium Plate',
    driveConfig: '4WD',
    description: 'ARRMA 1/8 scale extreme bash speed monster platform.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-xray-x4',
    slug: 'xray-x4',
    name: 'X4',
    brandId: 'brand-xray',
    chassisMaterial: '7075-T6 Swiss Aluminium / Carbon Matrix',
    driveConfig: '4WD',
    wheelbaseMm: 257,
    description: 'XRAY premier 1/10 electric touring car world championship platform.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-rc8b4',
    slug: 'team-associated-rc8b4',
    name: 'RC8B4',
    brandId: 'brand-team-associated',
    chassisMaterial: 'Hard-Anodized 7075 Aluminium',
    driveConfig: '4WD',
    description: 'Team Associated flagship 1/8 competition off-road buggy platform.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-yokomo-md2',
    slug: 'yokomo-md2',
    name: 'Master Drift MD 2.0',
    brandId: 'brand-yokomo',
    chassisMaterial: 'High-Traction Carbon Graphite Double Deck',
    driveConfig: 'RWD',
    wheelbaseMm: 256,
    description: 'Yokomo competition-level rear-wheel drive drift chassis platform.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-trx4',
    slug: 'traxxas-trx-4',
    name: 'TRX-4',
    brandId: 'brand-traxxas',
    chassisMaterial: 'Steel C-Channel Ladder Frame',
    driveConfig: '4WD',
    wheelbaseMm: 312,
    description: 'Traxxas portal-axle scale trail crawler platform with remote-locking differentials.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-scx10-3',
    slug: 'axial-scx10-iii',
    name: 'SCX10 III',
    brandId: 'brand-axial',
    chassisMaterial: 'Steel C-Channel Frame',
    driveConfig: '4WD',
    wheelbaseMm: 312,
    description: 'Axial third-generation scale rock crawler chassis with DIG transmission.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-fg-sportsline',
    slug: 'fg-sportsline-4wd',
    name: 'FG Sportsline 4WD',
    brandId: 'brand-fg',
    chassisMaterial: '4mm CNC Aluminium Alloy',
    driveConfig: '4WD',
    wheelbaseMm: 535,
    description: 'FG Modellsport 1/5 scale competition touring car platform.',
    status: 'DRAFT',
    published: false,
  },
  {
    id: 'plat-mecatech-fw01',
    slug: 'mecatech-fw01',
    name: 'FW01 Supercar',
    brandId: 'brand-mecatech',
    chassisMaterial: 'T6 Aero Grade Billet Aluminium',
    driveConfig: '4WD',
    wheelbaseMm: 530,
    description: 'Mecatech bespoke large scale rolling race chassis featuring integrated hydraulic brakes.',
    status: 'DRAFT',
    published: false,
  },
  {
    id: 'plat-mugen-mtc3',
    slug: 'mugen-mtc3',
    name: 'MTC3',
    brandId: 'brand-mugen-seiki',
    chassisMaterial: '7075 Aluminium / Carbon Matrix',
    driveConfig: '4WD',
    wheelbaseMm: 257,
    description: 'Mugen Seiki premier 1/10 electric touring car competition chassis featuring ultra-low centre of gravity and aluminium flex plate.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-mugen-msb1',
    slug: 'mugen-msb1',
    name: 'MSB1',
    brandId: 'brand-mugen-seiki',
    chassisMaterial: 'Hard-Anodized Aluminium',
    driveConfig: '2WD',
    wheelbaseMm: 280,
    description: 'Mugen Seiki 1/10 2WD competition electric off-road buggy platform designed for high-grip carpet and dirt circuits.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-mugen-mbx8r',
    slug: 'mugen-mbx8r',
    name: 'MBX-8R',
    brandId: 'brand-mugen-seiki',
    chassisMaterial: '3mm 7075 Hard-Anodized Aluminium',
    driveConfig: '4WD',
    wheelbaseMm: 325,
    description: 'Mugen Seiki world-championship-winning 1/8 competition off-road buggy platform available in Nitro and ECO electric configurations.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-mugen-mbx8tr',
    slug: 'mugen-mbx8tr',
    name: 'MBX-8TR',
    brandId: 'brand-mugen-seiki',
    chassisMaterial: '3mm 7075 Hard-Anodized Aluminium',
    driveConfig: '4WD',
    wheelbaseMm: 375,
    description: 'Mugen Seiki flagship 1/8 competition truggy platform engineered for extreme stability, high-speed jumps, and rough track performance.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-mugen-mrx7',
    slug: 'mugen-mrx7',
    name: 'MRX7',
    brandId: 'brand-mugen-seiki',
    chassisMaterial: 'CNC 7075 Aircraft Aluminium with Carbon Radio Plate',
    driveConfig: '4WD',
    wheelbaseMm: 295,
    description: 'Mugen Seiki legendary 1/8 scale on-road nitro circuit racing platform, multiple IFMAR World Championship winner.',
    status: 'PUBLISHED',
    published: true,
  },
  {
    id: 'plat-mugen-mtx7r',
    slug: 'mugen-mtx7r',
    name: 'MTX-7R',
    brandId: 'brand-mugen-seiki',
    chassisMaterial: 'CNC 7075 Aluminium Chassis',
    driveConfig: '4WD',
    wheelbaseMm: 258,
    description: 'Mugen Seiki 1/10 scale 200mm nitro touring car platform with revised suspension geometry and high-efficiency belt drivetrain.',
    status: 'PUBLISHED',
    published: true,
  },
]

// ── 3. Products ──────────────────────────────────────────────────────────────
export const SEED_PRODUCTS: SeedProduct[] = [
  // ── Bash Discipline ──
  {
    id: 'prod-traxxas-xmaxx-8s',
    slug: 'traxxas-x-maxx-8s-brushless-monster-truck',
    sku: 'TRX-77086-4',
    brandId: 'brand-traxxas',
    platformId: 'plat-xmaxx',
    name: 'Traxxas X-Maxx 8S Brushless Monster Truck',
    shortName: 'X-Maxx 8S',
    categoryId: 'cat-bash',
    scale: '1:6 (Large Scale)',
    powerType: 'ELECTRIC',
    productType: 'RTR_MACHINE',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'BASH',
    editorialSummary: "Traxxas's definitive large-scale basher. Powered by the Velineon 1200XL motor and VXL-8s speed control, it combines relentless 50+ mph power with heavy-duty steel drivetrain components and self-righting capability.",
    published: true,
  },
  {
    id: 'prod-arrma-kraton-6s-exb',
    slug: 'arrma-kraton-6s-blx-extreme-bash-speed-monster',
    sku: 'ARA8708T1',
    brandId: 'brand-arrma',
    platformId: 'plat-kraton-6s',
    name: 'ARRMA Kraton 6S BLX Extreme Bash Speed Monster',
    shortName: 'Kraton 6S EXB',
    categoryId: 'cat-bash',
    scale: '1:8',
    powerType: 'ELECTRIC',
    productType: 'RTR_MACHINE',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'BASH',
    editorialSummary: 'Factory upgraded with EXB 7075-T6 aluminium components, all-metal differential outdrives, and Spektrum 6S brushless power system for extreme stunt punishment.',
    published: true,
  },

  // ── Race Discipline ──
  {
    id: 'prod-xray-x4-2026',
    slug: 'xray-x4-2026-1-10-touring-car-kit',
    sku: 'XRAY-300040',
    brandId: 'brand-xray',
    platformId: 'plat-xray-x4',
    name: "XRAY X4 '26 1/10 Electric Touring Car Kit",
    shortName: "X4 '26",
    categoryId: 'cat-110-touring',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    haloClassification: '1:10 COMPETITION',
    discipline: 'RACE',
    editorialSummary: "The X4 is XRAY's premier touring platform, representing decades of world championship development. The '26 chassis incorporates precision CNC-machined 7075-T6 Swiss aluminium, ultra-low CG bulkhead design, and redesigned active geometry.",
    published: true,
  },
  {
    id: 'prod-awesomatix-a800mx',
    slug: 'awesomatix-a800mx-1-10-touring-car-kit',
    sku: 'ATX-A800MX',
    brandId: 'brand-awesomatix',
    platformId: null,
    name: 'Awesomatix A800MX 1/10 Touring Car Kit',
    shortName: 'A800MX',
    categoryId: 'cat-110-touring',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Czech precision engineering featuring revolutionary damper-free rotary suspension and ultra-low polar moment of inertia for maximum technical track speed.',
    published: true,
  },
  {
    id: 'prod-team-associated-rc8b4',
    slug: 'team-associated-rc8b4-1-nitro-buggy-kit',
    sku: 'ASC80946',
    brandId: 'brand-team-associated',
    platformId: 'plat-rc8b4',
    name: 'Team Associated RC8B4.1 1/8 Nitro Buggy Kit',
    shortName: 'RC8B4.1 Nitro',
    categoryId: 'cat-18-buggy',
    scale: '1:8',
    powerType: 'NITRO',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Developed by Area 51 engineers, the RC8B4.1 features updated suspension arm geometry, high-flow fuel delivery, and championship-proven chassis flex control.',
    published: true,
  },

  // ── MUGEN Seiki Competition Kits (Controlled Publication) ──
  {
    id: 'prod-mugen-a2006',
    slug: 'mugen-mtc3-1-10-4wd-ep-touring-kit',
    sku: 'A2006',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-mtc3',
    name: 'Mugen Seiki MTC3 1/10 4WD EP Touring Car Kit',
    shortName: 'MTC3 Touring Kit',
    categoryId: 'cat-110-touring',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'MTC3 1/10 4WD EP Touring Kit including aluminum chassis without wheels. Engineered for IFMAR-level electric touring car competition with ultra-low centre of gravity and advanced bulkheads.',
    published: true,
  },
  {
    id: 'prod-mugen-b2001',
    slug: 'mugen-msb1-1-10-2wd-ep-buggy-kit',
    sku: 'B2001',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-msb1',
    name: 'Mugen Seiki MSB1 1/10 2WD EP Buggy Kit',
    shortName: 'MSB1 2WD Buggy',
    categoryId: 'cat-18-buggy',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'MSB1 1/10 2WD EP Buggy Kit. Mugen Seiki precision 1/10 scale electric off-road platform designed for extreme traction and control on carpet and dirt circuits.',
    published: true,
  },
  {
    id: 'prod-mugen-e2027',
    slug: 'mugen-mbx-8r-nitro-1-8-4wd-buggy-kit',
    sku: 'E2027',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-mbx8r',
    name: 'Mugen Seiki MBX-8R Nitro 1/8 4WD Off-Road Buggy Kit',
    shortName: 'MBX-8R Nitro Buggy',
    categoryId: 'cat-18-buggy',
    scale: '1:8',
    powerType: 'NITRO',
    productType: 'KIT',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    haloClassification: '1:8 NITRO OFF-ROAD COMPETITION',
    discipline: 'RACE',
    editorialSummary: 'MBX-8 "R" Nitro 1/8 4WD Off-Road Buggy kit without wheels. Multiple IFMAR World Championship winning heritage with refined suspension geometry and high-traction differential package.',
    published: true,
  },
  {
    id: 'prod-mugen-e2028',
    slug: 'mugen-mbx-8r-eco-1-8-4wd-buggy-kit',
    sku: 'E2028',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-mbx8r',
    name: 'Mugen Seiki MBX-8R ECO 1/8 4WD Electric Buggy Kit',
    shortName: 'MBX-8R ECO Buggy',
    categoryId: 'cat-18-buggy',
    scale: '1:8',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    haloClassification: '1:8 BRUSHLESS OFF-ROAD COMPETITION',
    discipline: 'RACE',
    editorialSummary: 'MBX-8 "R" ECO 1/8 4WD Off-Road Buggy kit without wheels. Dedicated electric brushless layout with balanced split-battery weight distribution.',
    published: true,
  },
  {
    id: 'prod-mugen-e2029',
    slug: 'mugen-mbx-8tr-nitro-1-8-4wd-truggy-kit',
    sku: 'E2029',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-mbx8tr',
    name: 'Mugen Seiki MBX-8TR Nitro 1/8 4WD Off-Road Truggy Kit',
    shortName: 'MBX-8TR Nitro Truggy',
    categoryId: 'cat-18-buggy',
    scale: '1:8',
    powerType: 'NITRO',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'MBX-8T R 1/8 4WD Off-Road Truggy kit without wheels. Long wheelbase, heavy-duty suspension arms, and competition truggy stability over large jumps and rough outdoor tracks.',
    published: true,
  },
  {
    id: 'prod-mugen-e2030',
    slug: 'mugen-mbx-8tr-eco-1-8-4wd-truggy-kit',
    sku: 'E2030',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-mbx8tr',
    name: 'Mugen Seiki MBX-8TR ECO 1/8 4WD Electric Truggy Kit',
    shortName: 'MBX-8TR ECO Truggy',
    categoryId: 'cat-18-buggy',
    scale: '1:8',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'MBX-8T R ECO 1/8 4WD Off-Road Truggy kit without wheels. High-voltage brushless power platform engineered for race-winning durability and acceleration.',
    published: true,
  },
  {
    id: 'prod-mugen-h2009',
    slug: 'mugen-mrx7-1-8-touring-kit',
    sku: 'H2009',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-mrx7',
    name: 'Mugen Seiki MRX7 1/8 On-Road Nitro Track Kit',
    shortName: 'MRX7 On-Road Kit',
    categoryId: 'cat-15-onroad',
    scale: '1:8',
    powerType: 'NITRO',
    productType: 'KIT',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    haloClassification: '1:8 FORMULA TRACK RACING',
    discipline: 'RACE',
    editorialSummary: 'MRX7 1/8 Touring Kit without wheels. The absolute benchmark of 1/8 nitro circuit racing, purpose-built for speeds exceeding 70 mph with knife-edge aerodynamic handling.',
    published: true,
  },
  {
    id: 'prod-mugen-t2006',
    slug: 'mugen-mtx-7r-1-10-touring-kit',
    sku: 'T2006',
    brandId: 'brand-mugen-seiki',
    platformId: 'plat-mugen-mtx7r',
    name: 'Mugen Seiki MTX-7R 1/10 200mm Nitro Touring Car Kit',
    shortName: 'MTX-7R Nitro Touring',
    categoryId: 'cat-110-touring',
    scale: '1:10',
    powerType: 'NITRO',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'MTX-7R 1/10 Touring Kit without wheels. High-performance 200mm nitro touring car chassis with 2-speed automatic transmission, lightweight belt drive, and competition roll bars.',
    published: true,
  },

  // ── Drift Discipline ──
  {
    id: 'prod-yokomo-md-2',
    slug: 'yokomo-master-drift-md-2-0-competition-kit',
    sku: 'YOK-MDR-020',
    brandId: 'brand-yokomo',
    platformId: 'plat-yokomo-md2',
    name: 'Yokomo Master Drift MD 2.0 Competition Kit',
    shortName: 'MD 2.0 Drift',
    categoryId: 'cat-drift',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    haloClassification: 'RWD DRIFT COMPETITION',
    discipline: 'DRIFT',
    editorialSummary: 'Yokomo flagship competition drift chassis. Features a 4-gear rear transmission, variable motor position adjustment, and double-deck matte graphite chassis plate.',
    published: true,
  },
  {
    id: 'prod-reve-d-rdx',
    slug: 'reve-d-rdx-1-10-rwd-drift-chassis-kit',
    sku: 'RDX-001',
    brandId: 'brand-reve-d',
    platformId: null,
    name: 'Rêve D RDX 1/10 RWD Drift Chassis Kit',
    shortName: 'RDX RWD Drift',
    categoryId: 'cat-drift',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'DRIFT',
    editorialSummary: 'Masterminded by factory champion Takahiro Kawakami. Provides instant high-angle drift stability straight out of the box with zero setup compromises.',
    published: true,
  },

  // ── Crawl Discipline ──
  {
    id: 'prod-traxxas-trx4-bronco',
    slug: 'traxxas-trx-4-1979-ford-bronco-crawler',
    sku: 'TRX-82046-4',
    brandId: 'brand-traxxas',
    platformId: 'plat-trx4',
    name: 'Traxxas TRX-4 1979 Ford Bronco Scale Trail Crawler',
    shortName: 'TRX-4 Bronco',
    categoryId: 'cat-crawl',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'RTR_MACHINE',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'CRAWL',
    editorialSummary: 'Portal axles deliver massive ground clearance while remote-locking T-Lock differentials and high/low 2-speed transmission handle severe off-camber rock crawling.',
    published: true,
  },
  {
    id: 'prod-axial-scx10-iii-jeep',
    slug: 'axial-scx10-iii-jeep-jlu-wrangler-4wd-rtr',
    sku: 'AXI03007',
    brandId: 'brand-axial',
    platformId: 'plat-scx10-3',
    name: 'Axial SCX10 III Jeep JLU Wrangler 4WD RTR',
    shortName: 'SCX10 III Jeep',
    categoryId: 'cat-crawl',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'RTR_MACHINE',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'CRAWL',
    editorialSummary: 'Scale trail chassis with full replica V8 engine cover hiding the 540 motor, portal axles, and functional DIG transmission for tight pivot turning.',
    published: true,
  },

  // ── Scale Discipline ──
  {
    id: 'prod-tamiya-cc02-g500',
    slug: 'tamiya-cc-02-mercedes-benz-g-500-scale-kit',
    sku: 'TAM-58675',
    brandId: 'brand-tamiya',
    platformId: null,
    name: 'Tamiya CC-02 Mercedes-Benz G 500 Scale Truck Kit',
    shortName: 'CC-02 G 500',
    categoryId: 'cat-scale',
    scale: '1:10',
    powerType: 'ELECTRIC',
    productType: 'KIT',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'SCALE',
    editorialSummary: 'The Cross Country 02 ladder frame chassis combines authentic 4-link rigid suspension with an exquisitely detailed polycarbonate replica of the G 500.',
    published: true,
  },

  // ── Large Scale Discipline ──
  {
    id: 'prod-fg-sportsline-porsche',
    slug: 'fg-sportsline-4wd-porsche-911-gt3-1-5-rtr',
    sku: 'FG-145180R',
    brandId: 'brand-fg',
    platformId: 'plat-fg-sportsline',
    name: 'FG Modellsport Sportsline 4WD Porsche 911 GT3 1/5 RTR',
    shortName: 'FG Porsche 911 GT3',
    categoryId: 'cat-large-scale',
    scale: '1:5',
    powerType: 'PETROL',
    productType: 'RTR_MACHINE',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    haloClassification: '1:5 MOTORSPORT',
    discipline: 'LARGE_SCALE',
    editorialSummary: 'Full 1/5 scale touring car with 26cc 2-stroke petrol motor, dual disc brakes, tuned exhaust pipe, and officially licensed Porsche 911 GT3 aerodynamic body.',
    published: true,
  },
  {
    id: 'prod-mecatech-fw01',
    slug: 'mecatech-fw01-1-5-competition-supercar-chassis',
    sku: 'MEC-FW01',
    brandId: 'brand-mecatech',
    platformId: 'plat-mecatech-fw01',
    name: 'Mecatech FW01 1/5 Competition Supercar Rolling Chassis',
    shortName: 'Mecatech FW01',
    categoryId: 'cat-large-scale',
    scale: '1:5',
    powerType: 'PETROL',
    productType: 'CHASSIS',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'SPECIAL_ORDER',
    haloClassification: '1:5 BESPOKE MOTORSPORT',
    discipline: 'LARGE_SCALE',
    editorialSummary: 'Hand-crafted in France with aero-grade billet aluminium and quadruple hydraulic disc brakes with braided aircraft hoses. Built strictly to customer order.',
    published: true,
  },

  // ── Race Department Electronics ──
  {
    id: 'prod-hw-xr10-pro-g3',
    slug: 'hobbywing-xerun-xr10-pro-g3-competition-esc',
    sku: 'HW-30112614',
    brandId: 'brand-hobbywing',
    platformId: null,
    name: 'Hobbywing XeRun XR10 Pro G3 Competition ESC',
    shortName: 'XR10 Pro G3 ESC',
    categoryId: 'cat-race-electronics',
    powerType: 'ELECTRIC',
    productType: 'ESC',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Championship-grade 160A speed controller with real-time Bluetooth telemetry logging and frameless cooling fan.',
    published: true,
  },
  {
    id: 'prod-sanwa-m17',
    slug: 'sanwa-m17-fh5-4-channel-radio-system',
    sku: 'SAN-101A32471A',
    brandId: 'brand-sanwa',
    platformId: null,
    name: 'Sanwa M17 FH5 4-Channel Radio System with RX-493i',
    shortName: 'Sanwa M17 Radio',
    categoryId: 'cat-race-electronics',
    productType: 'RADIO_SYSTEM',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    haloClassification: 'COMPETITION TELEMETRY',
    discipline: 'RACE',
    editorialSummary: 'The definitive competition transmitter. Ultra-Response Mode (SUR/SXR) delivers sub-millisecond control latency.',
    published: true,
  },
  {
    id: 'prod-savox-sb2292sg',
    slug: 'savox-sb-2292sg-high-voltage-monster-torque-servo',
    sku: 'SAV-SB2292SG',
    brandId: 'brand-savox',
    platformId: null,
    name: 'Savox SB-2292SG Monster Torque Brushless Servo',
    shortName: 'Savox 2292SG Servo',
    categoryId: 'cat-race-electronics',
    productType: 'SERVO',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Patented brushless motor delivering 31.0 kg-cm of holding torque at 0.07 sec speed with hardened steel gear train.',
    published: true,
  },
  {
    id: 'prod-hw-v10-g4-135t',
    slug: 'hobbywing-xerun-v10-g4-13-5t-brushless-motor',
    sku: 'HW-30401140',
    brandId: 'brand-hobbywing',
    platformId: null,
    name: 'Hobbywing XeRun V10 G4 Competition Brushless Motor 13.5T',
    shortName: 'XeRun V10 G4 13.5T',
    categoryId: 'cat-race-electronics',
    productType: 'MOTOR',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Factory race-tuned 13.5T sensored brushless motor with dual sensor ports, ultra-low internal resistance copper windings, and dynamic timing adjustment.',
    published: true,
  },
  {
    id: 'prod-sunpadow-6000-lipo',
    slug: 'sunpadow-6000mah-140c-2s-lcg-competition-lipo',
    sku: 'SUN-6000-2S',
    brandId: 'brand-sunpadow',
    platformId: null,
    name: 'Sunpadow 6000mAh 140C 2S LCG Competition LiPo Battery',
    shortName: 'Sunpadow 6000 2S LCG',
    categoryId: 'cat-race-electronics',
    productType: 'BATTERY',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Low centre of gravity 22.5mm slim competition LiPo pack delivering sustained 140C burst discharge and 7.4V nominal output.',
    published: true,
  },
  {
    id: 'prod-icharger-x6',
    slug: 'icharger-x6-high-power-800w-balance-charger',
    sku: 'ICH-X6',
    brandId: 'brand-icharger',
    platformId: null,
    name: 'iCharger X6 High Power 800W 30A DC Balance Charger',
    shortName: 'iCharger X6 DC',
    categoryId: 'cat-race-electronics',
    productType: 'CHARGER',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Pocket-sized powerhouse delivering up to 30A charging current with 2A synchronous balance current and internal resistance diagnostics.',
    published: true,
  },
  {
    id: 'prod-sanwa-pgs-lh2',
    slug: 'sanwa-pgs-lh-ii-low-profile-brushless-servo',
    sku: 'SAN-107A54477A',
    brandId: 'brand-sanwa',
    platformId: null,
    name: 'Sanwa PGS-LH II Low Profile Program Brushless Servo',
    shortName: 'Sanwa PGS-LH II',
    categoryId: 'cat-race-electronics',
    productType: 'SERVO',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Direct SSL telemetry programmable low-profile steering servo delivering 15.6 kg-cm holding torque at 0.07 sec speed for 1/10 touring platforms.',
    published: true,
  },
  {
    id: 'prod-hw-xr10-justock',
    slug: 'hobbywing-xerun-xr10-justock-g3-spec-esc',
    sku: 'HW-30112003',
    brandId: 'brand-hobbywing',
    platformId: null,
    name: 'Hobbywing XeRun XR10 Justock G3 Sensored ESC',
    shortName: 'XR10 Justock G3',
    categoryId: 'cat-race-electronics',
    productType: 'ESC',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Zero-timing blinky spec competition speed controller engineered for club racing and controlled stock touring categories.',
    published: true,
  },
  {
    id: 'prod-montech-hyper-body',
    slug: 'mon-tech-hyper-190mm-touring-car-clear-body',
    sku: 'MON-HYPER-190',
    brandId: 'brand-montech',
    platformId: null,
    name: 'Mon-Tech Hyper 190mm Touring Car Clear Body Shell',
    shortName: 'Mon-Tech Hyper Body',
    categoryId: 'cat-parts',
    productType: 'BODY',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'High-downforce EFRA/BRCA homologated 190mm competition touring car shell precision thermoformed from lightweight polycarbonate.',
    published: true,
  },

  // ── Parts, Upgrades & Replacement Lineage ──
  {
    id: 'prod-xray-front-lower-arm',
    slug: 'xray-302000-front-lower-suspension-arm-graphite',
    sku: 'XRAY-302000',
    brandId: 'brand-xray',
    platformId: 'plat-xray-x4',
    name: 'XRAY Front Lower Suspension Arm — Graphite',
    shortName: 'Front Lower Arm',
    categoryId: 'cat-parts',
    productType: 'SUSPENSION',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Factory team graphite composite front lower suspension arm engineered specifically for the X4 platform.',
    published: true,
  },
  {
    id: 'prod-xray-legacy-front-arm',
    slug: 'xray-301000-front-lower-suspension-arm-hard',
    sku: 'XRAY-301000',
    brandId: 'brand-xray',
    platformId: 'plat-xray-x4',
    name: 'XRAY Front Lower Suspension Arm — Hard (Superseded)',
    shortName: 'Front Lower Arm (Legacy)',
    categoryId: 'cat-parts',
    productType: 'REPLACEMENT_PART',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'REPLACED',
    replacementProductId: 'prod-xray-front-lower-arm',
    discipline: 'RACE',
    editorialSummary: 'Original hard composite front lower arm for early X4 batches. Superseded by graphite composite part XRAY-302000.',
    published: true,
  },
  {
    id: 'prod-xray-titanium-pivot',
    slug: 'xray-302040-x4-titanium-pivot-ball-set',
    sku: 'XRAY-302040',
    brandId: 'brand-xray',
    platformId: 'plat-xray-x4',
    name: 'XRAY X4 Titanium Pivot Ball Set (4pcs)',
    shortName: 'Titanium Pivot Balls',
    categoryId: 'cat-parts',
    productType: 'OPTION_PART',
    tier: 'HALO',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'RACE',
    editorialSummary: 'Ultra-lightweight CNC-machined titanium pivot balls reducing unsprung weight by 42% over steel.',
    published: true,
  },
  {
    id: 'prod-traxxas-steering-bellcrank',
    slug: 'traxxas-7746-heavy-duty-steering-bellcranks',
    sku: 'TRX-7746',
    brandId: 'brand-traxxas',
    platformId: 'plat-xmaxx',
    name: 'Traxxas Heavy Duty Steering Bellcranks with Bearings',
    shortName: 'HD Steering Bellcrank',
    categoryId: 'cat-parts',
    productType: 'REPLACEMENT_PART',
    tier: 'STANDARD',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'BASH',
    editorialSummary: 'Complete heavy duty replacement steering bellcrank assembly for the X-Maxx platform with sealed ball bearings.',
    published: true,
  },
  {
    id: 'prod-traxxas-hd-driveshafts',
    slug: 'traxxas-7750x-steel-heavy-duty-driveshaft-set',
    sku: 'TRX-7750X',
    brandId: 'brand-traxxas',
    platformId: 'plat-xmaxx',
    name: 'Traxxas Heavy Duty Steel CV Driveshaft Set',
    shortName: 'Steel CV Driveshafts',
    categoryId: 'cat-parts',
    productType: 'OPTION_PART',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'BASH',
    editorialSummary: 'High-strength hardened steel constant-velocity driveshafts engineered for extreme 8S brushless torque loads.',
    published: true,
  },
  {
    id: 'prod-yokomo-alum-steering',
    slug: 'yokomo-md-008-aluminum-steering-bellcrank-set',
    sku: 'YOK-MD008',
    brandId: 'brand-yokomo',
    platformId: 'plat-yokomo-md2',
    name: 'Yokomo MD 2.0 Aluminum Steering Bellcrank Set',
    shortName: 'Aluminum Steering Bellcrank',
    categoryId: 'cat-parts',
    productType: 'OPTION_PART',
    tier: 'PREMIUM',
    status: 'PUBLISHED',
    lifecycle: 'ACTIVE',
    discipline: 'DRIFT',
    editorialSummary: 'Rigid CNC aluminum bellcranks eliminating steering deflection for razor-sharp drift angle transitions.',
    published: true,
  },
]

// ── 4. Variants ──────────────────────────────────────────────────────────────
export const SEED_VARIANTS: SeedVariant[] = [
  { id: 'var-xmaxx-8s-red', productId: 'prod-traxxas-xmaxx-8s', sku: 'TRX-77086-4-RED', name: 'Red Body', colour: 'Red', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-kraton-6s-black', productId: 'prod-arrma-kraton-6s-exb', sku: 'ARA8708T1-BLK', name: 'Matte Black EXB', colour: 'Black', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-xray-x4-2026-kit', productId: 'prod-xray-x4-2026', sku: 'XRAY-300040', name: 'Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-a800mx-kit', productId: 'prod-awesomatix-a800mx', sku: 'ATX-A800MX', name: 'Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-rc8b4-nitro-kit', productId: 'prod-team-associated-rc8b4', sku: 'ASC80946', name: 'Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-yokomo-md2-kit', productId: 'prod-yokomo-md-2', sku: 'YOK-MDR-020', name: 'Chassis Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-reve-d-rdx-kit', productId: 'prod-reve-d-rdx', sku: 'RDX-001', name: 'Chassis Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  // MUGEN Seiki Competition Kits
  { id: 'var-mugen-a2006-kit', productId: 'prod-mugen-a2006', sku: 'A2006', name: 'Kit w/ Aluminium Chassis', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-mugen-b2001-kit', productId: 'prod-mugen-b2001', sku: 'B2001', name: 'Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-mugen-e2027-kit', productId: 'prod-mugen-e2027', sku: 'E2027', name: 'Nitro Buggy Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-mugen-e2028-kit', productId: 'prod-mugen-e2028', sku: 'E2028', name: 'ECO Electric Buggy Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-mugen-e2029-kit', productId: 'prod-mugen-e2029', sku: 'E2029', name: 'Nitro Truggy Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-mugen-e2030-kit', productId: 'prod-mugen-e2030', sku: 'E2030', name: 'ECO Electric Truggy Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-mugen-h2009-kit', productId: 'prod-mugen-h2009', sku: 'H2009', name: '1/8 On-Road Track Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-mugen-t2006-kit', productId: 'prod-mugen-t2006', sku: 'T2006', name: '1/10 Nitro Touring Kit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-trx4-bronco-sunset', productId: 'prod-traxxas-trx4-bronco', sku: 'TRX-82046-4-SNT', name: 'Sunset Orange', colour: 'Orange', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-scx10-jeep-grey', productId: 'prod-axial-scx10-iii-jeep', sku: 'AXI03007-GRY', name: 'Sting Grey', colour: 'Grey', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-cc02-g500-kit', productId: 'prod-tamiya-cc02-g500', sku: 'TAM-58675', name: 'Kit with Body', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-fg-porsche-rtr', productId: 'prod-fg-sportsline-porsche', sku: 'FG-145180R', name: '26cc RTR', status: 'DRAFT', lifecycle: 'ACTIVE', published: false },
  { id: 'var-mecatech-fw01-chassis', productId: 'prod-mecatech-fw01', sku: 'MEC-FW01', name: 'Rolling Chassis', status: 'DRAFT', lifecycle: 'SPECIAL_ORDER', published: false },
  // Electronics & Parts
  { id: 'var-hw-xr10-esc', productId: 'prod-hw-xr10-pro-g3', sku: 'HW-30112614', name: 'Single Unit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-sanwa-m17-tx', productId: 'prod-sanwa-m17', sku: 'SAN-101A32471A', name: 'Radio + RX Set', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-savox-servo', productId: 'prod-savox-sb2292sg', sku: 'SAV-SB2292SG', name: 'Single Servo', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-xray-front-arm', productId: 'prod-xray-front-lower-arm', sku: 'XRAY-302000', name: 'Single Unit', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-xray-legacy-arm', productId: 'prod-xray-legacy-front-arm', sku: 'XRAY-301000', name: 'Single Unit', status: 'PUBLISHED', lifecycle: 'REPLACED', published: true },
  { id: 'var-xray-titanium-pivot', productId: 'prod-xray-titanium-pivot', sku: 'XRAY-302040', name: '4-Pack Set', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-traxxas-bellcrank', productId: 'prod-traxxas-steering-bellcrank', sku: 'TRX-7746', name: 'Complete Assembly', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-traxxas-driveshaft', productId: 'prod-traxxas-hd-driveshafts', sku: 'TRX-7750X', name: 'Pair', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-yokomo-steering', productId: 'prod-yokomo-alum-steering', sku: 'YOK-MD008', name: 'Bellcrank Set', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-hw-v10-g4', productId: 'prod-hw-v10-g4-135t', sku: 'HW-30401140', name: '13.5T Motor', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-sunpadow-6000', productId: 'prod-sunpadow-6000-lipo', sku: 'SUN-6000-2S', name: '6000mAh 2S LiPo', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-icharger-x6', productId: 'prod-icharger-x6', sku: 'ICH-X6', name: 'X6 Charger', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-sanwa-pgs-lh2', productId: 'prod-sanwa-pgs-lh2', sku: 'SAN-107A54477A', name: 'PGS-LH II Servo', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-hw-xr10-justock', productId: 'prod-hw-xr10-justock', sku: 'HW-30112003', name: 'Justock G3 ESC', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
  { id: 'var-montech-hyper', productId: 'prod-montech-hyper-body', sku: 'MON-HYPER-190', name: '190mm Clear Body', status: 'PUBLISHED', lifecycle: 'ACTIVE', published: true },
]

// ── 5. Market Offers (Dual-Market UK & US) ───────────────────────────────────
export const SEED_OFFERS: SeedOffer[] = [
  // X-Maxx 8S: Both markets
  { id: 'offer-xmaxx-uk', productVariantId: 'var-xmaxx-8s-red', marketCode: 'UK', retailPrice: 104900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-xmaxx-us', productVariantId: 'var-xmaxx-8s-red', marketCode: 'US', retailPrice: 114900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 3 },

  // Kraton 6S EXB: Both markets
  { id: 'offer-kraton-uk', productVariantId: 'var-kraton-6s-black', marketCode: 'UK', retailPrice: 67900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-kraton-us', productVariantId: 'var-kraton-6s-black', marketCode: 'US', retailPrice: 69900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },

  // XRAY X4 '26: Both markets
  { id: 'offer-xray-x4-uk', productVariantId: 'var-xray-x4-2026-kit', marketCode: 'UK', retailPrice: 72900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-xray-x4-us', productVariantId: 'var-xray-x4-2026-kit', marketCode: 'US', retailPrice: 89900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 4 },

  // Awesomatix A800MX: UK ONLY (US deliberately NOT_AVAILABLE)
  { id: 'offer-awesomatix-uk', productVariantId: 'var-a800mx-kit', marketCode: 'UK', retailPrice: 78900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'LOW_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },

  // Team Associated RC8B4.1: Both markets
  { id: 'offer-rc8b4-uk', productVariantId: 'var-rc8b4-nitro-kit', marketCode: 'UK', retailPrice: 69900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-rc8b4-us', productVariantId: 'var-rc8b4-nitro-kit', marketCode: 'US', retailPrice: 72900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },

  // Yokomo MD 2.0: Both markets
  { id: 'offer-yokomo-md2-uk', productVariantId: 'var-yokomo-md2-kit', marketCode: 'UK', retailPrice: 64900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'LOW_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-yokomo-md2-us', productVariantId: 'var-yokomo-md2-kit', marketCode: 'US', retailPrice: 68900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  // Rêve D RDX: Both markets (UK in stock, US PRE_ORDER)
  { id: 'offer-reve-d-uk', productVariantId: 'var-reve-d-rdx-kit', marketCode: 'UK', retailPrice: 28900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-reve-d-us', productVariantId: 'var-reve-d-rdx-kit', marketCode: 'US', retailPrice: 31900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'PRE_ORDER', supplyRoute: 'GREY_IMPORT', leadTimeDays: 14 },

  // Traxxas TRX-4 Bronco: Both markets
  { id: 'offer-trx4-uk', productVariantId: 'var-trx4-bronco-sunset', marketCode: 'UK', retailPrice: 56900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-trx4-us', productVariantId: 'var-trx4-bronco-sunset', marketCode: 'US', retailPrice: 54900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },

  // Axial SCX10 III: US ONLY (UK deliberately NOT_AVAILABLE)
  { id: 'offer-axial-us', productVariantId: 'var-scx10-jeep-grey', marketCode: 'US', retailPrice: 52900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },

  // Tamiya CC-02: Both markets
  { id: 'offer-tamiya-uk', productVariantId: 'var-cc02-g500-kit', marketCode: 'UK', retailPrice: 23900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-tamiya-us', productVariantId: 'var-cc02-g500-kit', marketCode: 'US', retailPrice: 26900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 3 },

  // FG Porsche 911 GT3: UK SPECIAL_ORDER
  { id: 'offer-fg-uk', productVariantId: 'var-fg-porsche-rtr', marketCode: 'UK', retailPrice: 149900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'SPECIAL_ORDER', supplyRoute: 'SPECIAL_ORDER', leadTimeDays: 14 },

  // Mecatech FW01: UK & US SPECIAL_ORDER
  { id: 'offer-mecatech-uk', productVariantId: 'var-mecatech-fw01-chassis', marketCode: 'UK', retailPrice: 289900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'SPECIAL_ORDER', supplyRoute: 'SPECIAL_ORDER', leadTimeDays: 21 },
  { id: 'offer-mecatech-us', productVariantId: 'var-mecatech-fw01-chassis', marketCode: 'US', retailPrice: 349900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'SPECIAL_ORDER', supplyRoute: 'SPECIAL_ORDER', leadTimeDays: 28 },

  // MUGEN Seiki Competition Kits (UK & US Markets)
  { id: 'offer-mugen-a2006-uk', productVariantId: 'var-mugen-a2006-kit', marketCode: 'UK', retailPrice: 69900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-a2006-us', productVariantId: 'var-mugen-a2006-kit', marketCode: 'US', retailPrice: 74900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-mugen-b2001-uk', productVariantId: 'var-mugen-b2001-kit', marketCode: 'UK', retailPrice: 41900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-b2001-us', productVariantId: 'var-mugen-b2001-kit', marketCode: 'US', retailPrice: 44900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-mugen-e2027-uk', productVariantId: 'var-mugen-e2027-kit', marketCode: 'UK', retailPrice: 69900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-e2027-us', productVariantId: 'var-mugen-e2027-kit', marketCode: 'US', retailPrice: 74900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-mugen-e2028-uk', productVariantId: 'var-mugen-e2028-kit', marketCode: 'UK', retailPrice: 69900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-e2028-us', productVariantId: 'var-mugen-e2028-kit', marketCode: 'US', retailPrice: 74900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-mugen-e2029-uk', productVariantId: 'var-mugen-e2029-kit', marketCode: 'UK', retailPrice: 75900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-e2029-us', productVariantId: 'var-mugen-e2029-kit', marketCode: 'US', retailPrice: 81900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-mugen-e2030-uk', productVariantId: 'var-mugen-e2030-kit', marketCode: 'UK', retailPrice: 75900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-e2030-us', productVariantId: 'var-mugen-e2030-kit', marketCode: 'US', retailPrice: 81900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-mugen-h2009-uk', productVariantId: 'var-mugen-h2009-kit', marketCode: 'UK', retailPrice: 84900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-h2009-us', productVariantId: 'var-mugen-h2009-kit', marketCode: 'US', retailPrice: 89900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-mugen-t2006-uk', productVariantId: 'var-mugen-t2006-kit', marketCode: 'UK', retailPrice: 64900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 3 },
  { id: 'offer-mugen-t2006-us', productVariantId: 'var-mugen-t2006-kit', marketCode: 'US', retailPrice: 69900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  // Electronics & Parts Offers
  { id: 'offer-hw-esc-uk', productVariantId: 'var-hw-xr10-esc', marketCode: 'UK', retailPrice: 18900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-hw-esc-us', productVariantId: 'var-hw-xr10-esc', marketCode: 'US', retailPrice: 21900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 3 },

  { id: 'offer-sanwa-uk', productVariantId: 'var-sanwa-m17-tx', marketCode: 'UK', retailPrice: 62900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'LOW_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-sanwa-us', productVariantId: 'var-sanwa-m17-tx', marketCode: 'US', retailPrice: 69900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 5 },

  { id: 'offer-savox-uk', productVariantId: 'var-savox-servo', marketCode: 'UK', retailPrice: 12900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-savox-us', productVariantId: 'var-savox-servo', marketCode: 'US', retailPrice: 14900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },

  { id: 'offer-xray-arm-uk', productVariantId: 'var-xray-front-arm', marketCode: 'UK', retailPrice: 1950, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-xray-arm-us', productVariantId: 'var-xray-front-arm', marketCode: 'US', retailPrice: 2400, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'DIRECT_MANUFACTURER', leadTimeDays: 4 },

  { id: 'offer-xray-pivot-uk', productVariantId: 'var-xray-titanium-pivot', marketCode: 'UK', retailPrice: 3450, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },

  { id: 'offer-traxxas-bellcrank-uk', productVariantId: 'var-traxxas-bellcrank', marketCode: 'UK', retailPrice: 2850, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-traxxas-driveshaft-uk', productVariantId: 'var-traxxas-driveshaft', marketCode: 'UK', retailPrice: 8450, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },

  { id: 'offer-yokomo-steering-uk', productVariantId: 'var-yokomo-steering', marketCode: 'UK', retailPrice: 4800, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'LOW_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-hw-v10-uk', productVariantId: 'var-hw-v10-g4', marketCode: 'UK', retailPrice: 8900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-hw-v10-us', productVariantId: 'var-hw-v10-g4', marketCode: 'US', retailPrice: 9900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 3 },
  { id: 'offer-sunpadow-uk', productVariantId: 'var-sunpadow-6000', marketCode: 'UK', retailPrice: 6500, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-sunpadow-us', productVariantId: 'var-sunpadow-6000', marketCode: 'US', retailPrice: 7200, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-icharger-uk', productVariantId: 'var-icharger-x6', marketCode: 'UK', retailPrice: 11900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-icharger-us', productVariantId: 'var-icharger-x6', marketCode: 'US', retailPrice: 12900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-sanwa-pgs-uk', productVariantId: 'var-sanwa-pgs-lh2', marketCode: 'UK', retailPrice: 13900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 2 },
  { id: 'offer-sanwa-pgs-us', productVariantId: 'var-sanwa-pgs-lh2', marketCode: 'US', retailPrice: 14900, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 3 },
  { id: 'offer-justock-uk', productVariantId: 'var-hw-xr10-justock', marketCode: 'UK', retailPrice: 5900, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  { id: 'offer-justock-us', productVariantId: 'var-hw-xr10-justock', marketCode: 'US', retailPrice: 6500, currency: 'USD', taxMode: 'EXCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'US_DISTRIBUTOR', leadTimeDays: 2 },
  // Deliberate UK-only offer for Mon-Tech Body (testing missing US offer in US builds)
  { id: 'offer-montech-body-uk', productVariantId: 'var-montech-hyper', marketCode: 'UK', retailPrice: 3400, currency: 'GBP', taxMode: 'INCLUSIVE', availability: 'IN_STOCK', supplyRoute: 'UK_DISTRIBUTOR', leadTimeDays: 1 },
  // Note: var-xray-legacy-arm has NO active offer (DISCONTINUED/REPLACED)
]

// ── 6. Specifications with Full Provenance ───────────────────────────────────
export const SEED_SPECIFICATIONS: SeedSpecification[] = [
  // XRAY X4 '26
  { id: 'spec-xray-chassis', entityType: 'product', entityId: 'prod-xray-x4-2026', key: 'Chassis Material', value: 'Swiss 7075-T6 Aluminium / Carbon Matrix', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://teamxray.com/x4/2026', sourceDocument: 'CAD Datasheet Rev B', verifiedAt: '2026-09-12' },
  { id: 'spec-xray-drive', entityType: 'product', entityId: 'prod-xray-x4-2026', key: 'Drive Configuration', value: '4WD Dual Belt', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://teamxray.com/x4/2026', sourceDocument: 'Technical Spec v1.0', verifiedAt: '2026-09-12' },
  { id: 'spec-xray-wheelbase', entityType: 'product', entityId: 'prod-xray-x4-2026', key: 'Wheelbase', value: '257', unit: 'mm', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceDocument: 'CAD Datasheet Rev B', verifiedAt: '2026-09-12' },
  { id: 'spec-xray-diff', entityType: 'product', entityId: 'prod-xray-x4-2026', key: 'Differential', value: 'Rear Gear Diff / Front Solid Axle', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceDocument: 'Manual v1.0', verifiedAt: '2026-09-12' },
  // Deliberate UNKNOWN to test omission
  { id: 'spec-xray-unknown-batch', entityType: 'product', entityId: 'prod-xray-x4-2026', key: 'Internal Foundry Code', value: 'SK-2026-UNV', confidence: 'UNKNOWN', sourceType: 'COMMUNITY', notes: 'Unverified internal code' },

  // Traxxas X-Maxx 8S
  { id: 'spec-xmaxx-wheelbase', entityType: 'product', entityId: 'prod-traxxas-xmaxx-8s', key: 'Wheelbase', value: '480', unit: 'mm', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://traxxas.com/products/models/electric/x-maxx-8s', verifiedAt: '2026-09-12' },
  { id: 'spec-xmaxx-weight', entityType: 'product', entityId: 'prod-traxxas-xmaxx-8s', key: 'Weight (Running)', value: '8.66', unit: 'kg', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://traxxas.com/products/models/electric/x-maxx-8s', verifiedAt: '2026-09-12' },
  { id: 'spec-xmaxx-speed', entityType: 'product', entityId: 'prod-traxxas-xmaxx-8s', key: 'Estimated Top Speed', value: '50+ mph (with dual 4S LiPo & optional gearing)', confidence: 'INFERRED', sourceType: 'INFERRED', notes: 'Calculated from motor kV and 8S nominal voltage' },

  // ARRMA Kraton 6S EXB
  { id: 'spec-kraton-chassis', entityType: 'product', entityId: 'prod-arrma-kraton-6s-exb', key: 'Chassis Plate', value: '7075-T6 Hard-Anodized Aluminium', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://arrma-rc.com', verifiedAt: '2026-09-12' },
  { id: 'spec-kraton-voltage', entityType: 'product', entityId: 'prod-arrma-kraton-6s-exb', key: 'Operating Voltage', value: '4S - 6S LiPo', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://arrma-rc.com', verifiedAt: '2026-09-12' },

  // Yokomo MD 2.0
  { id: 'spec-yokomo-trans', entityType: 'product', entityId: 'prod-yokomo-md-2', key: 'Transmission Type', value: '4-Gear High-Traction Rear Transmission', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://teamyokomo.com', verifiedAt: '2026-09-12' },
  { id: 'spec-yokomo-wheelbase', entityType: 'product', entityId: 'prod-yokomo-md-2', key: 'Wheelbase', value: '256', unit: 'mm', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceDocument: 'MD 2.0 Manual v1', verifiedAt: '2026-09-12' },

  // Traxxas TRX-4 Bronco
  { id: 'spec-trx4-axles', entityType: 'product', entityId: 'prod-traxxas-trx4-bronco', key: 'Axle Design', value: 'Portal Axles with Gear Reduction', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://traxxas.com', verifiedAt: '2026-09-12' },
  { id: 'spec-trx4-transmission', entityType: 'product', entityId: 'prod-traxxas-trx4-bronco', key: 'Transmission', value: 'Two-Speed High/Low Remote Shift', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://traxxas.com', verifiedAt: '2026-09-12' },

  // FG Porsche 911 GT3
  { id: 'spec-fg-engine', entityType: 'product', entityId: 'prod-fg-sportsline-porsche', key: 'Displacement', value: '26', unit: 'cc', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://fg-modellsport.de', verifiedAt: '2026-09-12' },
  { id: 'spec-fg-scale', entityType: 'product', entityId: 'prod-fg-sportsline-porsche', key: 'Scale', value: '1:5', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://fg-modellsport.de', verifiedAt: '2026-09-12' },

  // Mecatech FW01
  { id: 'spec-mecatech-brakes', entityType: 'product', entityId: 'prod-mecatech-fw01', key: 'Braking System', value: 'Quadruple Hydraulic Disc with Master Cylinders', confidence: 'VERIFIED', sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://mecatech.fr', verifiedAt: '2026-09-12' },
  { id: 'spec-mecatech-fluid', entityType: 'product', entityId: 'prod-mecatech-fw01', key: 'Hydraulic Fluid Spec', value: 'DOT4 Mineral Formula', confidence: 'KNOWN', sourceType: 'DISTRIBUTOR_CATALOGUE', verifiedAt: '2026-09-10' },

  // Awesomatix A800MX unknown spec
  { id: 'spec-a800mx-unknown', entityType: 'product', entityId: 'prod-awesomatix-a800mx', key: 'Exact Fastener Count', value: '128 (unverified)', confidence: 'UNKNOWN', sourceType: 'COMMUNITY', notes: 'Omit from public catalog' },
]

// ── 7. Compatibility Rules (Structured Non-AI Relationships) ────────────────
export const SEED_COMPATIBILITY_RULES: SeedCompatibilityRule[] = [
  // Platform fits
  { id: 'compat-xray-arm-x4', sourceEntityType: 'product', sourceEntityId: 'prod-xray-front-lower-arm', targetEntityType: 'platform', targetEntityId: 'plat-xray-x4', ruleType: 'FITS', verified: true, sourceType: 'MANUFACTURER_SPEC', sourceUrl: 'https://teamxray.com/x4/parts', notes: 'Standard graphite lower arm across all X4 iterations' },
  { id: 'compat-xray-pivot-x4', sourceEntityType: 'product', sourceEntityId: 'prod-xray-titanium-pivot', targetEntityType: 'platform', targetEntityId: 'plat-xray-x4', ruleType: 'UPGRADE', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Direct upgrade replacing steel pivot balls' },
  { id: 'compat-trx-bellcrank-xmaxx', sourceEntityType: 'product', sourceEntityId: 'prod-traxxas-steering-bellcrank', targetEntityType: 'platform', targetEntityId: 'plat-xmaxx', ruleType: 'FITS', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'OEM steering bellcrank assembly' },
  { id: 'compat-trx-driveshaft-xmaxx', sourceEntityType: 'product', sourceEntityId: 'prod-traxxas-hd-driveshafts', targetEntityType: 'platform', targetEntityId: 'plat-xmaxx', ruleType: 'UPGRADE', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Factory heavy-duty upgrade driveshafts' },
  { id: 'compat-yokomo-steering-md2', sourceEntityType: 'product', sourceEntityId: 'prod-yokomo-alum-steering', targetEntityType: 'platform', targetEntityId: 'plat-yokomo-md2', ruleType: 'OPTION', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Precision aluminum upgrade set' },

  // Replacement Lineage: OLD (XRAY 301000) -> NEW (XRAY 302000)
  { id: 'compat-legacy-arm-replaces', sourceEntityType: 'product', sourceEntityId: 'prod-xray-legacy-front-arm', targetEntityType: 'product', targetEntityId: 'prod-xray-front-lower-arm', ruleType: 'REPLACES', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Hard composite arm superseded by graphite 302000' },

  // Vehicle-specific Recommended & Required Component Rules (Build My Rig Foundation)
  { id: 'compat-x4-esc', sourceEntityType: 'product', sourceEntityId: 'prod-hw-xr10-pro-g3', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'RECOMMENDED', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Recommended 1/10 touring car ESC for X4 chassis' },
  { id: 'compat-x4-servo', sourceEntityType: 'product', sourceEntityId: 'prod-savox-sb2292sg', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'REQUIRED', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'High voltage low-profile competition steering servo required' },
  { id: 'compat-x4-radio', sourceEntityType: 'product', sourceEntityId: 'prod-sanwa-m17', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'RECOMMENDED', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Recommended radio system with SUR response mode' },
  { id: 'compat-x4-motor', sourceEntityType: 'product', sourceEntityId: 'prod-hw-v10-g4-135t', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'REQUIRED', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: '13.5T competition brushless motor required for stock touring car class' },
  { id: 'compat-x4-battery', sourceEntityType: 'product', sourceEntityId: 'prod-sunpadow-6000-lipo', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'REQUIRED', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: '2S LCG competition LiPo battery pack required for X4 chassis' },
  { id: 'compat-x4-charger', sourceEntityType: 'product', sourceEntityId: 'prod-icharger-x6', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'RECOMMENDED', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'High power DC balance charger recommended for race day turnaround' },
  { id: 'compat-x4-servo-sanwa', sourceEntityType: 'product', sourceEntityId: 'prod-sanwa-pgs-lh2', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'COMPATIBLE', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Low profile SSL telemetry servo alternative' },
  { id: 'compat-x4-esc-justock', sourceEntityType: 'product', sourceEntityId: 'prod-hw-xr10-justock', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'COMPATIBLE', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Zero-timing spec class racing ESC alternative' },
  { id: 'compat-x4-body-montech', sourceEntityType: 'product', sourceEntityId: 'prod-montech-hyper-body', targetEntityType: 'platform', targetEntityId: 'plat-xray-x4', ruleType: 'OPTION', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: '190mm aerodynamic touring car body shell' },
  { id: 'compat-xray-legacy-arm-x4', sourceEntityType: 'product', sourceEntityId: 'prod-xray-legacy-front-arm', targetEntityType: 'platform', targetEntityId: 'plat-xray-x4', ruleType: 'OPTION', verified: true, sourceType: 'MANUFACTURER_SPEC', notes: 'Legacy fitment for X4 platform (superseded by 302000)' },
  { id: 'compat-x4-unverified-bellcrank', sourceEntityType: 'product', sourceEntityId: 'prod-traxxas-steering-bellcrank', targetEntityType: 'product', targetEntityId: 'prod-xray-x4-2026', ruleType: 'OPTION', verified: false, sourceType: 'COMMUNITY', notes: 'Unverified speculation — Traxxas parts do NOT fit X4' },

  { id: 'compat-md2-esc', sourceEntityType: 'product', sourceEntityId: 'prod-hw-xr10-pro-g3', targetEntityType: 'product', targetEntityId: 'prod-yokomo-md-2', ruleType: 'RECOMMENDED', verified: true, notes: 'Ideal drift ESC with dedicated drift throttle curves' },
  { id: 'compat-md2-servo', sourceEntityType: 'product', sourceEntityId: 'prod-savox-sb2292sg', targetEntityType: 'product', targetEntityId: 'prod-yokomo-md-2', ruleType: 'REQUIRED', verified: true, notes: 'Coreless steering servo required for drift gyro interface' },
  { id: 'compat-md2-motor', sourceEntityType: 'product', sourceEntityId: 'prod-hw-v10-g4-135t', targetEntityType: 'product', targetEntityId: 'prod-yokomo-md-2', ruleType: 'REQUIRED', verified: true, notes: 'High response sensored brushless motor required for drift powerband' },
  { id: 'compat-md2-battery', sourceEntityType: 'product', sourceEntityId: 'prod-sunpadow-6000-lipo', targetEntityType: 'product', targetEntityId: 'prod-yokomo-md-2', ruleType: 'REQUIRED', verified: true, notes: '2S low centre of gravity LiPo battery required for drift chassis' },
  { id: 'compat-md2-radio', sourceEntityType: 'product', sourceEntityId: 'prod-sanwa-m17', targetEntityType: 'product', targetEntityId: 'prod-yokomo-md-2', ruleType: 'RECOMMENDED', verified: true, notes: 'Telemetry transmitter recommended for drift gyro sensitivity tuning' },
]

// ── 8. Documents ─────────────────────────────────────────────────────────────
export const SEED_DOCUMENTS: SeedDocument[] = [
  { id: 'doc-xray-manual', entityType: 'product', entityId: 'prod-xray-x4-2026', documentType: 'MANUAL', title: "XRAY X4 '26 Instruction & Assembly Manual", version: '1.0', sourceUrl: 'https://teamxray.com/x4/manual.pdf', approvedForUse: true, published: true },
  { id: 'doc-xray-exploded', entityType: 'platform', entityId: 'plat-xray-x4', documentType: 'EXPLODED_DIAGRAM', title: 'XRAY X4 Platform Exploded View & Spare Parts Index', version: '2.1', sourceUrl: 'https://teamxray.com/x4/exploded.pdf', approvedForUse: true, published: true },
  { id: 'doc-xray-setup', entityType: 'product', entityId: 'prod-xray-x4-2026', documentType: 'SETUP_SHEET', title: "XRAY X4 '26 Carpet World Cup Base Setup Sheet", version: '1.2', approvedForUse: true, published: true },

  { id: 'doc-xmaxx-exploded', entityType: 'platform', entityId: 'plat-xmaxx', documentType: 'EXPLODED_DIAGRAM', title: 'Traxxas X-Maxx 8S Official Exploded Diagram', version: '77086-4', sourceUrl: 'https://traxxas.com/exploded/77086-4', approvedForUse: true, published: true },
  { id: 'doc-xmaxx-manual', entityType: 'product', entityId: 'prod-traxxas-xmaxx-8s', documentType: 'MANUAL', title: 'Traxxas X-Maxx 8S Operating & Maintenance Manual', version: '8S-EN', approvedForUse: true, published: true },

  { id: 'doc-yokomo-manual', entityType: 'product', entityId: 'prod-yokomo-md-2', documentType: 'MANUAL', title: 'Yokomo Master Drift MD 2.0 Assembly Guide', version: '2.0-EN', approvedForUse: true, published: true },
  { id: 'doc-fg-diagram', entityType: 'platform', entityId: 'plat-fg-sportsline', documentType: 'EXPLODED_DIAGRAM', title: 'FG Sportsline 4WD 1/5 Chassis Exploded Diagram', version: '2025-A', approvedForUse: true, published: true },
]
