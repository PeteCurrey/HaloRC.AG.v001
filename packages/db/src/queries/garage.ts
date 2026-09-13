// Authoritative Garage Data Access & Domain Logic

import crypto from 'node:crypto'
import type {
  GarageRecord,
  GarageVehicleRecord,
  VehicleStatus,
  SavedBuildRecord,
  SavedBuildSnapshot,
  SavedBuildSlotSnapshot,
  GarageServiceRecord,
  PublicVehicleIdentity,
  CreateVehicleInput,
  UpdateVehicleInput,
  CreateServiceRecordInput,
  SaveBuildInput,
} from '@halo-rc/types'
import {
  SEED_PRODUCTS,
  SEED_PLATFORMS,
  SEED_BRANDS,
  SEED_SPECIFICATIONS,
} from '../seed/catalogue-data'

// ── In-Memory Repository for Garage Entities ──────────────────────────────────
// Ensures high-performance, deterministic verification across SSR, API, and Vitest.

interface DbGarage {
  id: string
  userId: string
  name: string
  createdAt: string
  updatedAt: string
}

interface DbGarageVehicle {
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
}

interface DbGarageBuild {
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

interface DbGarageServiceLog {
  id: string
  garageVehicleId: string
  date: string
  serviceType: GarageServiceRecord['serviceType']
  title: string
  description: string
  partsUsed: Array<{ productId?: string; sku?: string; name?: string }> | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Initial baseline fixtures
let GARAGES: DbGarage[] = [
  {
    id: 'garage-customer-1',
    userId: 'usr-customer',
    name: 'Pro Works Workshop',
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'garage-other-1',
    userId: 'usr-adversary',
    name: 'Privateer Pit Box',
    createdAt: '2026-01-11T12:00:00Z',
    updatedAt: '2026-01-11T12:00:00Z',
  },
]

let VEHICLES: DbGarageVehicle[] = [
  {
    id: 'veh-x4-customer',
    garageId: 'garage-customer-1',
    productId: 'prod-xray-x4-2026',
    platformId: 'plat-xray-x4',
    variantId: 'var-xray-x4-2026-base',
    name: "XRAY X4 '26 Carpet Racer",
    nickname: 'Black Arrow',
    colour: 'Graphite / Orange',
    purchaseDate: '2026-01-15',
    serialNumber: 'X4-26-8841',
    qrCodeToken: '550e8400-e29b-41d4-a716-446655440001',
    isPublic: true,
    status: 'ACTIVE',
    notes: 'Base setup sheet carpet world cup baseline.',
    createdAt: '2026-01-15T14:00:00Z',
    updatedAt: '2026-01-15T14:00:00Z',
  },
  {
    id: 'veh-xmaxx-customer',
    garageId: 'garage-customer-1',
    productId: 'prod-traxxas-xmaxx-8s',
    platformId: 'plat-xmaxx',
    variantId: 'var-traxxas-xmaxx-8s-base',
    name: 'Traxxas X-Maxx 8S Basher',
    nickname: 'Beast',
    colour: 'Rock n Roll Edition',
    purchaseDate: '2026-02-01',
    serialNumber: 'TRX-994120',
    qrCodeToken: '550e8400-e29b-41d4-a716-446655440002',
    isPublic: false,
    status: 'ACTIVE',
    notes: 'Upgraded to HD driveshafts.',
    createdAt: '2026-02-01T16:30:00Z',
    updatedAt: '2026-02-01T16:30:00Z',
  },
  {
    id: 'veh-archived-customer',
    garageId: 'garage-customer-1',
    productId: 'prod-yokomo-md-2',
    platformId: 'plat-yokomo-md2',
    variantId: null,
    name: 'Yokomo MD 2.0 (Sold Chassis)',
    nickname: 'Drift Spec',
    colour: 'Matte Black',
    purchaseDate: '2025-08-10',
    serialNumber: null,
    qrCodeToken: '550e8400-e29b-41d4-a716-446655440003',
    isPublic: false,
    status: 'ARCHIVED',
    notes: 'Sold to local club member in December 2025.',
    createdAt: '2025-08-10T11:00:00Z',
    updatedAt: '2025-12-20T10:00:00Z',
  },
  {
    id: 'veh-other-private',
    garageId: 'garage-other-1',
    productId: 'prod-xray-x4-2026',
    platformId: 'plat-xray-x4',
    variantId: null,
    name: 'Competitor Stealth Rig',
    nickname: 'Classified',
    colour: 'Raw Carbon',
    purchaseDate: '2026-02-10',
    serialNumber: 'CONFIDENTIAL-007',
    qrCodeToken: '550e8400-e29b-41d4-a716-446655440004',
    isPublic: false,
    status: 'ACTIVE',
    notes: 'Secret anti-roll bar geometry testing.',
    createdAt: '2026-02-10T09:00:00Z',
    updatedAt: '2026-02-10T09:00:00Z',
  },
]

let BUILDS: DbGarageBuild[] = [
  {
    id: 'build-x4-customer-saved',
    garageVehicleId: 'veh-x4-customer',
    buildId: 'bld-x4-competition-spec',
    name: 'National Championship Spec',
    status: 'ACTIVE',
    notes: 'Optimised for high-grip CRC black carpet.',
    snapshot: {
      machineId: 'prod-xray-x4-2026',
      machineName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
      machineSku: 'XRAY-300034',
      marketCode: 'UK',
      currency: 'GBP',
      taxMode: 'INCLUSIVE',
      buildStatus: 'COMPLETE',
      totalMinorUnits: 120100,
      priceState: 'KNOWN_PRICE',
      savedAt: '2026-01-16T10:00:00Z',
      slots: {
        MOTOR: {
          role: 'MOTOR',
          productId: 'prod-hw-v10-g4-135t',
          productName: 'Hobbywing XeRun V10 G4 13.5T Outlaw Brushless Motor',
          sku: 'HW-30401135',
          unitPriceMinorUnits: 8900,
          currency: 'GBP',
          taxMode: 'INCLUSIVE',
          lifecycleAtSave: 'ACTIVE',
        },
        ESC: {
          role: 'ESC',
          productId: 'prod-hw-xr10-pro-g3',
          productName: 'Hobbywing XeRun XR10 Pro G3 Brushless Speed Controller',
          sku: 'HW-30112614',
          unitPriceMinorUnits: 18900,
          currency: 'GBP',
          taxMode: 'INCLUSIVE',
          lifecycleAtSave: 'ACTIVE',
        },
        SERVO_STEERING: {
          role: 'SERVO_STEERING',
          productId: 'prod-savox-sb2292sg',
          productName: 'Savöx SB-2292SG Monster Torque Brushless Servo',
          sku: 'SAV-SB2292SG',
          unitPriceMinorUnits: 12900,
          currency: 'GBP',
          taxMode: 'INCLUSIVE',
          lifecycleAtSave: 'ACTIVE',
        },
        BATTERY: {
          role: 'BATTERY',
          productId: 'prod-sunpadow-6000-lipo',
          productName: 'Sunpadow 6000mAh 7.4V 2S2P 130C LCG Competition LiPo',
          sku: 'SP-6000-2S-LCG',
          unitPriceMinorUnits: 6500,
          currency: 'GBP',
          taxMode: 'INCLUSIVE',
          lifecycleAtSave: 'ACTIVE',
        },
      },
    },
    createdAt: '2026-01-16T10:00:00Z',
    updatedAt: '2026-01-16T10:00:00Z',
  },
]

let SERVICE_LOGS: DbGarageServiceLog[] = [
  {
    id: 'srv-x4-001',
    garageVehicleId: 'veh-x4-customer',
    date: '2026-01-20',
    serviceType: 'SETUP',
    title: 'Initial Carpet Setup & Droop Measurement',
    description: 'Measured front droop 5.2mm, rear 4.8mm. Filled diff with 3000cSt silicone fluid.',
    partsUsed: null,
    notes: 'Corner weights balanced within 2g.',
    createdAt: '2026-01-20T18:00:00Z',
    updatedAt: '2026-01-20T18:00:00Z',
  },
  {
    id: 'srv-x4-002',
    garageVehicleId: 'veh-x4-customer',
    date: '2026-02-05',
    serviceType: 'REPAIR',
    title: 'Front Left Lower Arm Replacement',
    description: 'Replaced cracked front lower suspension arm following boards contact in heat 3.',
    partsUsed: [{ productId: 'prod-xray-front-lower-arm', sku: 'XRAY-302000', name: 'XRAY Front Lower Suspension Arm — Graphite' }],
    notes: 'Hinge pins inspected and true.',
    createdAt: '2026-02-05T19:30:00Z',
    updatedAt: '2026-02-05T19:30:00Z',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function enrichVehicle(veh: DbGarageVehicle): GarageVehicleRecord {
  const prod = veh.productId ? SEED_PRODUCTS.find((p) => p.id === veh.productId) : null
  const plat = veh.platformId ? SEED_PLATFORMS.find((p) => p.id === veh.platformId) : null
  const brand = prod ? SEED_BRANDS.find((b) => b.id === prod.brandId) : null

  return {
    id: veh.id,
    garageId: veh.garageId,
    productId: veh.productId,
    platformId: veh.platformId,
    variantId: veh.variantId,
    name: veh.name,
    nickname: veh.nickname,
    colour: veh.colour,
    purchaseDate: veh.purchaseDate,
    serialNumber: veh.serialNumber,
    qrCodeToken: veh.qrCodeToken,
    isPublic: veh.isPublic,
    status: veh.status,
    notes: veh.notes,
    createdAt: veh.createdAt,
    updatedAt: veh.updatedAt,
    product: prod
      ? {
          id: prod.id,
          slug: prod.slug,
          sku: prod.sku,
          name: prod.name,
          brandName: brand ? brand.name : '',
          productType: prod.productType,
          scale: prod.scale ?? null,
          powerType: prod.powerType ?? null,
          discipline: prod.discipline,
        }
      : null,
    platform: plat
      ? {
          id: plat.id,
          name: plat.name,
          slug: plat.slug,
        }
      : null,
  }
}

// ── Authoritative Query & Mutation API ────────────────────────────────────────

/**
 * Get or create the authenticated user's primary Garage.
 */
export async function getCustomerGarage(userId: string): Promise<GarageRecord> {
  if (!userId) {
    throw new Error('Unauthorized: User ID required')
  }

  let garage = GARAGES.find((g) => g.userId === userId)
  if (!garage) {
    garage = {
      id: `garage-${crypto.randomUUID()}`,
      userId,
      name: 'My Garage',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    GARAGES.push(garage)
  }

  return {
    id: garage.id,
    userId: garage.userId,
    name: garage.name,
    createdAt: garage.createdAt,
    updatedAt: garage.updatedAt,
  }
}

/**
 * Get all vehicles in customer's garage, respecting archive filter.
 * Verifies that the garage belongs to the requesting user.
 */
export async function getGarageVehicles(
  garageId: string,
  userId: string,
  options?: { includeArchived?: boolean }
): Promise<GarageVehicleRecord[]> {
  const garage = GARAGES.find((g) => g.id === garageId)
  if (!garage || garage.userId !== userId) {
    // Strict tenant isolation: do not reveal existence of foreign garage
    return []
  }

  const vehicles = VEHICLES.filter((v) => {
    if (v.garageId !== garageId) return false
    if (!options?.includeArchived && v.status === 'ARCHIVED') return false
    return true
  })

  // Sort active first, then by updated date
  vehicles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return vehicles.map(enrichVehicle)
}

/**
 * Get a single garage vehicle by ID.
 * Strict authorization: verifies user owns the vehicle's garage.
 */
export async function getGarageVehicleById(
  vehicleId: string,
  userId: string
): Promise<GarageVehicleRecord | null> {
  const vehicle = VEHICLES.find((v) => v.id === vehicleId)
  if (!vehicle) return null

  const garage = GARAGES.find((g) => g.id === vehicle.garageId)
  if (!garage || garage.userId !== userId) {
    // Strict isolation: return null
    return null
  }

  return enrichVehicle(vehicle)
}

/**
 * Create a new customer vehicle in the Garage.
 * Allows linking to catalogue product/platform or unlinked custom vehicle.
 */
export async function createGarageVehicle(
  userId: string,
  input: CreateVehicleInput
): Promise<GarageVehicleRecord> {
  const garage = await getCustomerGarage(userId)

  let platformId = input.platformId ?? null
  if (input.productId) {
    const prod = SEED_PRODUCTS.find((p) => p.id === input.productId)
    if (!prod) {
      throw new Error(`Invalid catalogue product ID: ${input.productId}`)
    }
    if (!platformId && prod.platformId) {
      platformId = prod.platformId
    }
  }

  const newVehicle: DbGarageVehicle = {
    id: `veh-${crypto.randomUUID()}`,
    garageId: garage.id,
    productId: input.productId ?? null,
    platformId,
    variantId: input.variantId ?? null,
    name: input.name.trim() || 'My RC Vehicle',
    nickname: input.nickname?.trim() || null,
    colour: input.colour?.trim() || null,
    purchaseDate: input.purchaseDate || null,
    serialNumber: input.serialNumber?.trim() || null,
    qrCodeToken: crypto.randomUUID(),
    isPublic: Boolean(input.isPublic),
    status: input.status ?? 'ACTIVE',
    notes: input.notes?.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  VEHICLES.push(newVehicle)
  return enrichVehicle(newVehicle)
}

/**
 * Update an existing vehicle's attributes or status.
 */
export async function updateGarageVehicle(
  userId: string,
  vehicleId: string,
  input: UpdateVehicleInput
): Promise<GarageVehicleRecord | null> {
  const vehicle = VEHICLES.find((v) => v.id === vehicleId)
  if (!vehicle) return null

  const garage = GARAGES.find((g) => g.id === vehicle.garageId)
  if (!garage || garage.userId !== userId) {
    return null // Unauthorized
  }

  if (input.name !== undefined) vehicle.name = input.name.trim() || vehicle.name
  if (input.nickname !== undefined) vehicle.nickname = input.nickname?.trim() || null
  if (input.colour !== undefined) vehicle.colour = input.colour?.trim() || null
  if (input.purchaseDate !== undefined) vehicle.purchaseDate = input.purchaseDate || null
  if (input.serialNumber !== undefined) vehicle.serialNumber = input.serialNumber?.trim() || null
  if (input.status !== undefined) vehicle.status = input.status
  if (input.notes !== undefined) vehicle.notes = input.notes?.trim() || null
  if (input.isPublic !== undefined) vehicle.isPublic = Boolean(input.isPublic)

  vehicle.updatedAt = new Date().toISOString()
  return enrichVehicle(vehicle)
}

/**
 * Save a Build My Rig configuration into the customer's Garage vehicle.
 * Preserves the exact configuration snapshot for historical integrity.
 */
export async function saveBuildToGarageVehicle(
  userId: string,
  input: SaveBuildInput
): Promise<SavedBuildRecord> {
  const vehicle = await getGarageVehicleById(input.garageVehicleId, userId)
  if (!vehicle) {
    throw new Error('Unauthorized or vehicle not found')
  }

  const build = input.configuredBuild

  if (input.marketCode && build.marketCode && input.marketCode !== build.marketCode) {
    throw new Error(
      `Market mismatch: input marketCode ${input.marketCode} does not match configured build marketCode ${build.marketCode}`
    )
  }

  const slotSnapshots: Record<string, SavedBuildSlotSnapshot> = {}

  for (const slot of build.slots) {
    if (slot.selectedProduct) {
      slotSnapshots[slot.role] = {
        role: slot.role,
        productId: slot.selectedProduct.id,
        productName: slot.selectedProduct.name,
        sku: slot.selectedProduct.sku,
        unitPriceMinorUnits: slot.selectedProduct.offer?.retailPriceMinorUnits ?? null,
        currency: build.currency,
        taxMode: build.taxMode,
        lifecycleAtSave: slot.selectedProduct.lifecycle,
      }
    }
  }

  const snapshot: SavedBuildSnapshot = {
    machineId: build.machine ? build.machine.id : 'unlinked',
    machineName: build.machine ? build.machine.name : vehicle.name,
    machineSku: build.machine ? build.machine.sku : '',
    marketCode: input.marketCode,
    currency: build.currency,
    taxMode: build.taxMode,
    buildStatus: build.status,
    totalMinorUnits: build.totalMinorUnits,
    priceState: build.priceState,
    slots: slotSnapshots,
    savedAt: new Date().toISOString(),
  }

  const newBuild: DbGarageBuild = {
    id: `gbld-${crypto.randomUUID()}`,
    garageVehicleId: vehicle.id,
    buildId: `bld-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name.trim() || 'Custom Specification',
    status: 'ACTIVE',
    notes: input.notes?.trim() || null,
    snapshot,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Deactivate prior active builds for this vehicle
  for (const b of BUILDS) {
    if (b.garageVehicleId === vehicle.id && b.status === 'ACTIVE') {
      b.status = 'RETIRED'
    }
  }

  BUILDS.push(newBuild)

  return {
    id: newBuild.id,
    garageVehicleId: newBuild.garageVehicleId,
    buildId: newBuild.buildId,
    name: newBuild.name,
    status: newBuild.status,
    notes: newBuild.notes,
    snapshot: newBuild.snapshot,
    createdAt: newBuild.createdAt,
    updatedAt: newBuild.updatedAt,
  }
}

/**
 * Get active build record for a vehicle.
 */
export async function getVehicleActiveBuild(
  vehicleId: string,
  userId: string
): Promise<SavedBuildRecord | null> {
  const vehicle = await getGarageVehicleById(vehicleId, userId)
  if (!vehicle) return null

  const activeBuild = BUILDS.find(
    (b) => b.garageVehicleId === vehicleId && b.status === 'ACTIVE'
  )
  if (!activeBuild) return null

  return {
    id: activeBuild.id,
    garageVehicleId: activeBuild.garageVehicleId,
    buildId: activeBuild.buildId,
    name: activeBuild.name,
    status: activeBuild.status,
    notes: activeBuild.notes,
    snapshot: activeBuild.snapshot,
    createdAt: activeBuild.createdAt,
    updatedAt: activeBuild.updatedAt,
  }
}

/**
 * Add a service / maintenance entry for a vehicle.
 * Factual logging only. Validates product references against authoritative catalogue.
 */
export async function createServiceRecord(
  userId: string,
  vehicleId: string,
  input: CreateServiceRecordInput
): Promise<GarageServiceRecord> {
  const vehicle = await getGarageVehicleById(vehicleId, userId)
  if (!vehicle) {
    throw new Error('Unauthorized or vehicle not found')
  }

  // Validate any referenced products
  const validatedParts: Array<{ productId?: string; sku?: string; name?: string }> = []
  if (input.partsUsed && input.partsUsed.length > 0) {
    for (const part of input.partsUsed) {
      if (part.productId) {
        const prod = SEED_PRODUCTS.find((p) => p.id === part.productId)
        if (!prod) {
          throw new Error(`Referenced service part "${part.productId}" not found in catalogue`)
        }
        validatedParts.push({
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
        })
      } else if (part.name) {
        validatedParts.push({
          ...(part.sku !== undefined ? { sku: part.sku } : {}),
          name: part.name,
        })
      }
    }
  }

  const newRecord: DbGarageServiceLog = {
    id: `srv-${crypto.randomUUID()}`,
    garageVehicleId: vehicle.id,
    date: input.date || new Date().toISOString().slice(0, 10),
    serviceType: input.serviceType,
    title: input.title.trim() || 'Service Entry',
    description: input.description.trim(),
    partsUsed: validatedParts.length > 0 ? validatedParts : null,
    notes: input.notes?.trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  SERVICE_LOGS.push(newRecord)

  return {
    id: newRecord.id,
    garageVehicleId: newRecord.garageVehicleId,
    date: newRecord.date,
    serviceType: newRecord.serviceType,
    title: newRecord.title,
    description: newRecord.description,
    partsUsed: newRecord.partsUsed,
    notes: newRecord.notes,
    createdAt: newRecord.createdAt,
    updatedAt: newRecord.updatedAt,
  }
}

/**
 * Get all service records for a vehicle, sorted by date descending.
 */
export async function getVehicleServiceHistory(
  vehicleId: string,
  userId: string
): Promise<GarageServiceRecord[]> {
  const vehicle = await getGarageVehicleById(vehicleId, userId)
  if (!vehicle) return []

  const logs = SERVICE_LOGS.filter((l) => l.garageVehicleId === vehicleId)
  logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return logs.map((l) => ({
    id: l.id,
    garageVehicleId: l.garageVehicleId,
    date: l.date,
    serviceType: l.serviceType,
    title: l.title,
    description: l.description,
    partsUsed: l.partsUsed,
    notes: l.notes,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  }))
}

/**
 * Resolve public vehicle identity from opaque QR code token.
 * Strictly sanitizes private customer data.
 * Returns null if the token does not exist or if vehicle is not public (isPublic = false).
 */
export async function resolveVehiclePublicIdentity(
  qrCodeToken: string
): Promise<PublicVehicleIdentity | null> {
  const vehicle = VEHICLES.find((v) => v.qrCodeToken === qrCodeToken)
  if (!vehicle) return null

  // Privacy boundary: strictly enforce isPublic
  if (!vehicle.isPublic) return null

  const prod = vehicle.productId ? SEED_PRODUCTS.find((p) => p.id === vehicle.productId) : null
  const plat = vehicle.platformId ? SEED_PLATFORMS.find((p) => p.id === vehicle.platformId) : null
  const brand = prod ? SEED_BRANDS.find((b) => b.id === prod.brandId) : null

  // Get public specifications if machine is linked
  const specs = prod
    ? SEED_SPECIFICATIONS.filter((s) => s.entityId === prod.id && s.confidence !== 'UNKNOWN').map((s) => ({
        key: s.key,
        value: s.value,
        unit: s.unit ?? null,
      }))
    : []

  // Check if there is an active build attached to show high-level components
  const activeBuild = BUILDS.find(
    (b) => b.garageVehicleId === vehicle.id && b.status === 'ACTIVE'
  )

  let publicBuildSummary: PublicVehicleIdentity['publicBuildSummary'] = null
  if (activeBuild && activeBuild.snapshot.slots) {
    const slots = activeBuild.snapshot.slots
    publicBuildSummary = {
      motor: slots['MOTOR']?.productName ?? null,
      esc: slots['ESC']?.productName ?? null,
      servo: slots['SERVO_STEERING']?.productName ?? null,
    }
  }

  // Strictly sanitized output — ZERO private customer fields
  return {
    token: vehicle.qrCodeToken,
    isPublic: vehicle.isPublic,
    vehicleName: vehicle.name,
    platformName: plat ? plat.name : null,
    machineName: prod ? prod.name : null,
    brandName: brand ? brand.name : null,
    scale: prod?.scale ?? null,
    discipline: prod?.discipline ?? null,
    specifications: specs,
    publicBuildSummary,
  }
}

/**
 * Internal testing helper to reset or inspect garage store in Vitest.
 */
export function __resetGarageStoreForTesting() {
  // Re-initialise
  GARAGES = [
    {
      id: 'garage-customer-1',
      userId: 'usr-customer',
      name: 'Pro Works Workshop',
      createdAt: '2026-01-10T10:00:00Z',
      updatedAt: '2026-01-10T10:00:00Z',
    },
    {
      id: 'garage-other-1',
      userId: 'usr-adversary',
      name: 'Privateer Pit Box',
      createdAt: '2026-01-11T12:00:00Z',
      updatedAt: '2026-01-11T12:00:00Z',
    },
  ]
  VEHICLES = [
    {
      id: 'veh-x4-customer',
      garageId: 'garage-customer-1',
      productId: 'prod-xray-x4-2026',
      platformId: 'plat-xray-x4',
      variantId: 'var-xray-x4-2026-base',
      name: "XRAY X4 '26 Carpet Racer",
      nickname: 'Black Arrow',
      colour: 'Graphite / Orange',
      purchaseDate: '2026-01-15',
      serialNumber: 'X4-26-8841',
      qrCodeToken: '550e8400-e29b-41d4-a716-446655440001',
      isPublic: true,
      status: 'ACTIVE',
      notes: 'Base setup sheet carpet world cup baseline.',
      createdAt: '2026-01-15T14:00:00Z',
      updatedAt: '2026-01-15T14:00:00Z',
    },
    {
      id: 'veh-xmaxx-customer',
      garageId: 'garage-customer-1',
      productId: 'prod-traxxas-xmaxx-8s',
      platformId: 'plat-xmaxx',
      variantId: 'var-traxxas-xmaxx-8s-base',
      name: 'Traxxas X-Maxx 8S Basher',
      nickname: 'Beast',
      colour: 'Rock n Roll Edition',
      purchaseDate: '2026-02-01',
      serialNumber: 'TRX-994120',
      qrCodeToken: '550e8400-e29b-41d4-a716-446655440002',
      isPublic: false,
      status: 'ACTIVE',
      notes: 'Upgraded to HD driveshafts.',
      createdAt: '2026-02-01T16:30:00Z',
      updatedAt: '2026-02-01T16:30:00Z',
    },
    {
      id: 'veh-archived-customer',
      garageId: 'garage-customer-1',
      productId: 'prod-yokomo-md-2',
      platformId: 'plat-yokomo-md2',
      variantId: null,
      name: 'Yokomo MD 2.0 (Sold Chassis)',
      nickname: 'Drift Spec',
      colour: 'Matte Black',
      purchaseDate: '2025-08-10',
      serialNumber: null,
      qrCodeToken: '550e8400-e29b-41d4-a716-446655440003',
      isPublic: false,
      status: 'ARCHIVED',
      notes: 'Sold to local club member in December 2025.',
      createdAt: '2025-08-10T11:00:00Z',
      updatedAt: '2025-12-20T10:00:00Z',
    },
    {
      id: 'veh-other-private',
      garageId: 'garage-other-1',
      productId: 'prod-xray-x4-2026',
      platformId: 'plat-xray-x4',
      variantId: null,
      name: 'Competitor Stealth Rig',
      nickname: 'Classified',
      colour: 'Raw Carbon',
      purchaseDate: '2026-02-10',
      serialNumber: 'CONFIDENTIAL-007',
      qrCodeToken: '550e8400-e29b-41d4-a716-446655440004',
      isPublic: false,
      status: 'ACTIVE',
      notes: 'Secret anti-roll bar geometry testing.',
      createdAt: '2026-02-10T09:00:00Z',
      updatedAt: '2026-02-10T09:00:00Z',
    },
  ]
  BUILDS = [
    {
      id: 'build-x4-customer-saved',
      garageVehicleId: 'veh-x4-customer',
      buildId: 'bld-x4-competition-spec',
      name: 'National Championship Spec',
      status: 'ACTIVE',
      notes: 'Optimised for high-grip CRC black carpet.',
      snapshot: {
        machineId: 'prod-xray-x4-2026',
        machineName: "XRAY X4 '26 1/10 Electric Touring Car Kit",
        machineSku: 'XRAY-300034',
        marketCode: 'UK',
        currency: 'GBP',
        taxMode: 'INCLUSIVE',
        buildStatus: 'COMPLETE',
        totalMinorUnits: 120100,
        priceState: 'KNOWN_PRICE',
        savedAt: '2026-01-16T10:00:00Z',
        slots: {
          MOTOR: {
            role: 'MOTOR',
            productId: 'prod-hw-v10-g4-135t',
            productName: 'Hobbywing XeRun V10 G4 13.5T Outlaw Brushless Motor',
            sku: 'HW-30401135',
            unitPriceMinorUnits: 8900,
            currency: 'GBP',
            taxMode: 'INCLUSIVE',
            lifecycleAtSave: 'ACTIVE',
          },
          ESC: {
            role: 'ESC',
            productId: 'prod-hw-xr10-pro-g3',
            productName: 'Hobbywing XeRun XR10 Pro G3 Brushless Speed Controller',
            sku: 'HW-30112614',
            unitPriceMinorUnits: 18900,
            currency: 'GBP',
            taxMode: 'INCLUSIVE',
            lifecycleAtSave: 'ACTIVE',
          },
          SERVO_STEERING: {
            role: 'SERVO_STEERING',
            productId: 'prod-savox-sb2292sg',
            productName: 'Savöx SB-2292SG Monster Torque Brushless Servo',
            sku: 'SAV-SB2292SG',
            unitPriceMinorUnits: 12900,
            currency: 'GBP',
            taxMode: 'INCLUSIVE',
            lifecycleAtSave: 'ACTIVE',
          },
          BATTERY: {
            role: 'BATTERY',
            productId: 'prod-sunpadow-6000-lipo',
            productName: 'Sunpadow 6000mAh 7.4V 2S2P 130C LCG Competition LiPo',
            sku: 'SP-6000-2S-LCG',
            unitPriceMinorUnits: 6500,
            currency: 'GBP',
            taxMode: 'INCLUSIVE',
            lifecycleAtSave: 'ACTIVE',
          },
        },
      },
      createdAt: '2026-01-16T10:00:00Z',
      updatedAt: '2026-01-16T10:00:00Z',
    },
  ]
  SERVICE_LOGS = [
    {
      id: 'srv-x4-001',
      garageVehicleId: 'veh-x4-customer',
      date: '2026-01-20',
      serviceType: 'SETUP',
      title: 'Initial Carpet Setup & Droop Measurement',
      description: 'Measured front droop 5.2mm, rear 4.8mm. Filled diff with 3000cSt silicone fluid.',
      partsUsed: null,
      notes: 'Corner weights balanced within 2g.',
      createdAt: '2026-01-20T18:00:00Z',
      updatedAt: '2026-01-20T18:00:00Z',
    },
    {
      id: 'srv-x4-002',
      garageVehicleId: 'veh-x4-customer',
      date: '2026-02-05',
      serviceType: 'REPAIR',
      title: 'Front Left Lower Arm Replacement',
      description: 'Replaced cracked front lower suspension arm following boards contact in heat 3.',
      partsUsed: [{ productId: 'prod-xray-front-lower-arm', sku: 'XRAY-302000', name: 'XRAY Front Lower Suspension Arm — Graphite' }],
      notes: 'Trackside repair. Checked front caster block alignment.',
      createdAt: '2026-02-05T15:20:00Z',
      updatedAt: '2026-02-05T15:20:00Z',
    },
  ]
}

export function __getRawGarageCounts() {
  return {
    totalGarages: GARAGES.length,
    totalVehicles: VEHICLES.length,
    activeVehicles: VEHICLES.filter((v) => v.status === 'ACTIVE').length,
    archivedVehicles: VEHICLES.filter((v) => v.status === 'ARCHIVED').length,
    unlinkedVehicles: VEHICLES.filter((v) => v.productId === null).length,
    publicVehicles: VEHICLES.filter((v) => v.isPublic).length,
    totalBuilds: BUILDS.length,
    totalServiceLogs: SERVICE_LOGS.length,
  }
}
