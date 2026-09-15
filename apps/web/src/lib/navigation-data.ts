// apps/web/src/lib/navigation-data.ts
// Shared authoritative navigation and catalogue seed data

export interface NavMachineSpec {
  key: string
  value: string
}

export interface FeaturedMachineData {
  slug: string
  brand: string
  name: string
  fullName: string
  scale: string
  power: string
  editorial: string
  tier: 'STANDARD' | 'HALO'
}

export interface HaloMachineData {
  slug: string
  brand: string
  name: string
  fullName: string
  haloClassification: string
  scale: string
  power: string
  drive: string
  editorial: string
  specs: NavMachineSpec[]
}

export interface RaceDisciplineItem {
  label: string
  sub: string
  href: string
}

export const FEATURED_MACHINE: FeaturedMachineData = {
  slug: 'traxxas-x-maxx-8s-brushless-monster-truck',
  brand: 'Traxxas',
  name: 'X-Maxx 8S',
  fullName: 'X-Maxx 8S Brushless Monster Truck',
  scale: '1:6',
  power: 'Electric',
  editorial:
    "The X-Maxx 8S is Traxxas's largest, most powerful bash monster truck. 8S brushless power, fully waterproof electronics, and a scale that commands attention.",
  tier: 'STANDARD',
}

export const HALO_MACHINE: HaloMachineData = {
  slug: 'xray-x4-2026-1-10-touring-car-kit',
  brand: 'XRAY',
  name: "X4 '26",
  fullName: "XRAY X4 '26 1/10 Electric Touring Car",
  haloClassification: '1:10 COMPETITION',
  scale: '1:10',
  power: 'Electric',
  drive: '4WD',
  editorial:
    "The XRAY X4 has taken more World Championship titles than any other 1/10 touring car platform. The '26 is its most refined expression yet — engineered without compromise for drivers who compete at the highest level.",
  specs: [
    { key: 'Chassis', value: '7075 Alu' },
    { key: 'Drive', value: '4WD' },
    { key: 'Scale', value: '1:10' },
  ],
}

export const RACE_DISCIPLINES: readonly RaceDisciplineItem[] = [
  { label: '1/5 On-Road', sub: 'Petrol touring & GT', href: '/race/1-5' },
  { label: '1/10 Touring', sub: 'Electric TC', href: '/race/1-10-touring' },
  { label: '1/8 Buggy', sub: 'Nitro & electric', href: '/race/1-8-buggy' },
  { label: '1/8 GT', sub: 'Grand touring', href: '/race/1-8-gt' },
  { label: 'F1', sub: 'Formula one class', href: '/race/f1' },
  { label: '1/12 Pan Car', sub: 'Technical precision', href: '/race/1-12' },
  { label: 'Engines', sub: 'Competition power', href: '/race/engines' },
  { label: 'Electronics', sub: 'Radio, ESC & servo', href: '/race/electronics' },
] as const

export const BRANDS_LIST: readonly string[] = [
  'XRAY', 'Traxxas', 'Yokomo', 'Tamiya', 'Awesomatix', 'Losi', 'Schumacher',
  'Hobbywing', 'Sanwa', 'Kyosho', 'Ielasi Tuned', 'REDS Racing', 'Pro-Line',
  'Serpent', 'Tekno RC', 'Castle Creations', 'Futaba', 'ARRMA', 'Rêve D',
  'JConcepts', 'Team Associated',
] as const

export const BRANDS_MARQUEE: readonly string[] = [
  ...BRANDS_LIST,
  ...BRANDS_LIST,
] as const

// ─── Mega Menu Data Structures ───────────────────────────────────────────────

export interface MegaMenuLink {
  label: string
  href: string
  sub?: string
  badge?: string
}

export interface MegaMenuColumn {
  title: string
  links: MegaMenuLink[]
}

export interface MegaMenuSpotlight {
  tag: string
  title: string
  description: string
  href: string
  linkText: string
  imageSrc?: string
  imageAlt?: string
  badge?: string
}

export interface MegaMenuData {
  id: string
  navLabel: string
  href: string
  columns: MegaMenuColumn[]
  spotlight?: MegaMenuSpotlight
}

export const MEGA_MENUS: Record<'machines' | 'race' | 'brands', MegaMenuData> = {
  machines: {
    id: 'machines',
    navLabel: 'The Machines',
    href: '/machines',
    columns: [
      {
        title: 'By Discipline',
        links: [
          { label: 'Bash', href: '/machines?discipline=bash', sub: 'Tough, high-speed extreme platforms' },
          { label: 'Race', href: '/machines?discipline=race', sub: 'World-championship competition' },
          { label: 'Drift', href: '/machines?discipline=drift', sub: 'RWD precision chassis dynamics' },
          { label: 'Crawl', href: '/machines?discipline=crawl', sub: 'Scale rock crawling and technical trail rigs' },
          { label: 'Scale Realism', href: '/machines?discipline=scale', sub: 'Authentic engineering fidelity' },
          { label: 'Large Scale 1:5', href: '/machines?discipline=large_scale', sub: 'High-voltage and petrol motorsport' },
        ],
      },
      {
        title: 'By Scale & Class',
        links: [
          { label: '1:5 Scale', href: '/machines?scale=1-5', sub: 'Heavyweight petrol & 8S electric' },
          { label: '1:8 Scale', href: '/machines?scale=1-8', sub: 'Nitro & high-power brushless off-road' },
          { label: '1:10 Scale', href: '/machines?scale=1-10', sub: 'Touring car, buggy & drift standards' },
          { label: '1:12 Scale', href: '/machines?scale=1-12', sub: 'Ultra-light technical pan cars' },
          { label: 'Browse All Machines', href: '/machines', badge: '12 PLATFORMS' },
        ],
      },
    ],
    spotlight: {
      tag: 'FEATURED PLATFORM',
      title: 'Traxxas X-Maxx 8S',
      description: 'The heavyweight bash benchmark. 8S brushless powertrain, reinforced driveline, and authoritative 1:6 scale stance.',
      href: '/machines/traxxas-x-maxx-8s-brushless-monster-truck',
      linkText: 'Inspect Machine',
      imageSrc: '/images/hero/hero-1-5-scale-rc.jpg',
      imageAlt: 'Traxxas X-Maxx 8S monster truck platform',
      badge: 'BASH BENCHMARK',
    },
  },

  race: {
    id: 'race',
    navLabel: 'Race Department',
    href: '/race',
    columns: [
      {
        title: 'Championship Classes',
        links: [
          { label: '1/10 Touring Car', href: '/race?discipline=TOURING', sub: 'Electric TC on-road competition' },
          { label: '1/8 Buggy', href: '/race?discipline=BUGGY', sub: 'Nitro & electric off-road racing' },
          { label: '1/8 GT', href: '/race?discipline=GT', sub: 'Grand touring tarmac performance' },
          { label: '1/5 Large Scale', href: '/race?discipline=LARGE_SCALE', sub: 'Circuit touring & GT championships' },
        ],
      },
      {
        title: 'Engineering Services',
        links: [
          { label: 'Halo Turnkey Builds', href: '/race', sub: 'Calibrated factory competition packages' },
          { label: 'Build Comparison Matrix', href: '/race/compare', sub: 'Direct side-by-side chassis spec analysis' },
          { label: 'Competition Powertrain', href: '/race/engines', sub: 'Hand-tuned engines, high-response ESCs & servos' },
          { label: 'Telemetry & Radio Gear', href: '/race/electronics', sub: 'Low-latency FHSS-5 radio systems' },
        ],
      },
    ],
    spotlight: {
      tag: 'HALO TIER BENCHMARK',
      title: "XRAY X4 '26",
      description: "Multiple IFMAR World Championship titles. Ultra-low centre of gravity, 7075 Swiss aluminium chassis, zero-compromise racing engineering.",
      href: '/machines/xray-x4-2026-1-10-touring-car-kit',
      linkText: 'View Halo Blueprint',
      badge: '1:10 COMPETITION',
    },
  },

  brands: {
    id: 'brands',
    navLabel: 'Brands',
    href: '/brands',
    columns: [
      {
        title: 'Competition Manufacturers',
        links: [
          { label: 'XRAY', href: '/brands#competition-precision', sub: 'Slovakian precision engineering' },
          { label: 'Awesomatix', href: '/brands#competition-precision', sub: 'Patented rotary damper platforms' },
          { label: 'Schumacher', href: '/brands#competition-precision', sub: 'Championship British design' },
          { label: 'Serpent', href: '/brands#competition-precision', sub: 'Legacy nitro & on-road power' },
        ],
      },
      {
        title: 'Flagship & Electronics',
        links: [
          { label: 'Traxxas', href: '/brands#flagship-scale', sub: 'Authorised dealer network & spare parts' },
          { label: 'Hobbywing', href: '/brands#specialist-electronics', sub: 'XeRun competition brushless ESCs' },
          { label: 'Sanwa', href: '/brands#specialist-electronics', sub: 'Ultra-low latency telemetry transmitters' },
          { label: 'REDS Racing', href: '/brands#specialist-electronics', sub: 'Mario Rossi hand-tuned race engines' },
        ],
      },
      {
        title: 'Discovery & Roster',
        links: [
          { label: 'Authorised Dealers', href: '/brands', sub: 'Direct manufacturer distribution' },
          { label: 'Specialist Tuners', href: '/brands', sub: 'Independent racing ateliers' },
          { label: 'Browse All 21 Brands', href: '/brands', badge: 'VERIFIED' },
        ],
      },
    ],
    spotlight: {
      tag: 'TRANSPARENCY STANDARD',
      title: 'Authorised Roster',
      description: 'We distinguish clearly between official dealers, distributor-sourced inventory, and bespoke imports. Zero grey-market ambiguity.',
      href: '/brands',
      linkText: 'Explore Brand Universe',
      badge: 'AUTHORISED',
    },
  },
}
