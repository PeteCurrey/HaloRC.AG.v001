'use server'

/**
 * Garage Server Actions — all protected by server-side session resolution.
 *
 * SECURITY INVARIANTS:
 * - getSessionUser() is called on every action to resolve user identity.
 * - No action trusts user-supplied IDs for ownership — ownership is validated
 *   inside the query layer against the resolved userId.
 * - No action accepts a userId from the client.
 */
import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import type { VehicleStatus, ServiceType } from '@halo-rc/types'
import {
  createGarageVehicle,
  updateGarageVehicle,
  createServiceRecord,
} from '@halo-rc/db'

export interface GarageActionResult {
  error?: string
  vehicleId?: string
}

/**
 * Create a new vehicle in the authenticated user's garage.
 * On success, redirects to the new vehicle page.
 */
export async function createVehicleAction(formData: FormData): Promise<never> {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const name = formData.get('name') as string | null
  const productId = formData.get('productId') as string | null
  const platformId = formData.get('platformId') as string | null
  const nickname = formData.get('nickname') as string | null
  const colour = formData.get('colour') as string | null
  const purchaseDate = formData.get('purchaseDate') as string | null
  const serialNumber = formData.get('serialNumber') as string | null
  const notes = formData.get('notes') as string | null

  if (!name || name.trim().length < 1) {
    redirect('/garage/new?error=' + encodeURIComponent('Vehicle name is required.'))
  }

  try {
    const vehicle = await createGarageVehicle(user.id, {
      name: name.trim(),
      productId: productId || null,
      platformId: platformId || null,
      nickname: nickname || null,
      colour: colour || null,
      purchaseDate: purchaseDate || null,
      serialNumber: serialNumber || null,
      notes: notes || null,
    })
    redirect(`/garage/${vehicle.id}`)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    redirect('/garage/new?error=' + encodeURIComponent(message))
  }
}

/**
 * Update vehicle status (ACTIVE / STORED / SOLD / ARCHIVED).
 * Bound server action — vehicleId encoded in formData.
 */
export async function updateVehicleStatusAction(formData: FormData): Promise<never> {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const vehicleId = formData.get('vehicleId') as string
  const status = formData.get('status') as VehicleStatus

  await updateGarageVehicle(user.id, vehicleId, { status })
  redirect(`/garage/${vehicleId}`)
}

/**
 * Toggle vehicle public identity (for QR code page).
 * Bound server action — vehicleId and current isPublic in formData.
 */
export async function toggleVehiclePublicAction(formData: FormData): Promise<never> {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const vehicleId = formData.get('vehicleId') as string
  const currentPublic = formData.get('isPublic') === 'true'

  await updateGarageVehicle(user.id, vehicleId, { isPublic: !currentPublic })
  redirect(`/garage/${vehicleId}`)
}

/**
 * Add a service record to a vehicle.
 * vehicleId is passed as a hidden form field.
 */
export async function addServiceRecordAction(formData: FormData): Promise<never> {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const vehicleId = formData.get('vehicleId') as string
  const title = formData.get('title') as string | null
  const description = formData.get('description') as string | null
  const serviceType = (formData.get('serviceType') as ServiceType | null) ?? 'MAINTENANCE'
  const date = (formData.get('date') as string | null) || new Date().toISOString().slice(0, 10)
  const notes = formData.get('notes') as string | null

  if (!title || !description) {
    redirect(`/garage/${vehicleId}/service/new?error=` + encodeURIComponent('Title and description are required.'))
  }

  try {
    await createServiceRecord(user.id, vehicleId, {
      title: title!.trim(),
      description: description!.trim(),
      serviceType,
      date,
      notes: notes || null,
    })
    redirect(`/garage/${vehicleId}`)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    redirect(`/garage/${vehicleId}/service/new?error=` + encodeURIComponent(message))
  }
}
