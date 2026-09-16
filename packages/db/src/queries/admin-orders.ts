/**
 * Admin orders queries — all operations use Drizzle DB directly.
 * Halo RC immutability rule: prices on order items are captured snapshots
 * at time of checkout and never recalculated.
 *
 * Note: email lives in auth.users (Supabase), not in the profiles table.
 * The profiles table exposes displayName and username only.
 */

import { db, isDbConfigured } from '../client'
import { orders, orderItems, profiles } from '../schema'
import { eq, and, desc, count, ilike, or } from 'drizzle-orm'
import { writeAuditLog } from './admin-products'
import { __getRawOrdersAndBaskets, __getRawOrderItems } from './commerce'
import type { OrderPaymentStatus, OrderFulfilmentStatus } from '@halo-rc/types'

export interface AdminOrderListItem {
  id: string
  orderReference: string | null
  userId: string | null
  userDisplayName?: string | null
  userUsername?: string | null
  userName?: string | null
  userEmail?: string | null
  marketCode: string
  paymentStatus: OrderPaymentStatus
  fulfilmentStatus: OrderFulfilmentStatus
  totalMinorUnits: number
  currency: string
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

export interface AdminOrderFilters {
  paymentStatus?: OrderPaymentStatus | undefined
  fulfilmentStatus?: OrderFulfilmentStatus | undefined
  search?: string | undefined
}

export async function getAdminOrders(
  filters: AdminOrderFilters = {},
  pagination = { page: 1, perPage: 50 }
): Promise<{ items: AdminOrderListItem[]; total: number }> {
  const { page, perPage } = pagination
  const offset = (page - 1) * perPage

  try {
    const conditions = []

    if (filters.paymentStatus) {
      conditions.push(eq(orders.paymentStatus, filters.paymentStatus))
    }
    if (filters.fulfilmentStatus) {
      conditions.push(eq(orders.fulfilmentStatus, filters.fulfilmentStatus))
    }
    if (filters.search) {
      const q = `%${filters.search}%`
      conditions.push(
        or(
          ilike(orders.orderReference, q),
          ilike(orders.id, q),
          ilike(profiles.username, q),
          ilike(profiles.displayName, q)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: orders.id,
          orderReference: orders.orderReference,
          userId: orders.userId,
          userDisplayName: profiles.displayName,
          userUsername: profiles.username,
          marketCode: orders.marketCode,
          paymentStatus: orders.paymentStatus,
          fulfilmentStatus: orders.fulfilmentStatus,
          totalMinorUnits: orders.totalMinorUnits,
          currency: orders.currency,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .leftJoin(profiles, eq(orders.userId, profiles.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(perPage)
        .offset(offset),

      db
        .select({ total: count() })
        .from(orders)
        .leftJoin(profiles, eq(orders.userId, profiles.id))
        .where(whereClause),
    ])

    const total = countRows[0]?.total ?? 0

    if (rows.length > 0) {
      // Count items per order
      const orderIds = rows.map((r) => r.id)
      const itemCounts = new Map<string, number>()

      if (orderIds.length > 0) {
        const itemRows = await db
          .select({
            orderId: orderItems.orderId,
            cnt: count(),
          })
          .from(orderItems)
          .groupBy(orderItems.orderId)

        for (const r of itemRows) {
          itemCounts.set(r.orderId, Number(r.cnt))
        }
      }

      const items: AdminOrderListItem[] = rows.map((r) => ({
        ...r,
        paymentStatus: r.paymentStatus as OrderPaymentStatus,
        fulfilmentStatus: r.fulfilmentStatus as OrderFulfilmentStatus,
        itemCount: itemCounts.get(r.id) ?? 0,
      }))

      return { items, total: Number(total) }
    }
  } catch {
    // Non-blocking fallback to commerce store if live DB is offline or empty
  }

  // Fallback to active commerce memory store
  const { orders: rawOrders } = __getRawOrdersAndBaskets()
  const rawItems = __getRawOrderItems()

  let filtered = [...rawOrders]
  if (filters.paymentStatus) {
    filtered = filtered.filter((o) => o.paymentStatus === filters.paymentStatus)
  }
  if (filters.fulfilmentStatus) {
    filtered = filtered.filter((o) => (o as any).fulfilmentStatus === filters.fulfilmentStatus)
  }
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(
      (o) =>
        o.orderReference.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.userId && o.userId.toLowerCase().includes(q))
    )
  }

  const paginated = filtered.slice(offset, offset + perPage)
  const items: AdminOrderListItem[] = paginated.map((o) => {
    const count = rawItems.filter((item) => item.orderId === o.id).length
    return {
      id: o.id,
      orderReference: o.orderReference,
      userId: o.userId,
      userDisplayName: o.userId ? `Customer (${o.userId.slice(0, 8)})` : 'Guest Customer',
      userUsername: null,
      userName: o.userId ? `Customer (${o.userId.slice(0, 8)})` : 'Guest Customer',
      userEmail: null,
      marketCode: o.marketCode,
      paymentStatus: o.paymentStatus,
      fulfilmentStatus: ((o as any).fulfilmentStatus as OrderFulfilmentStatus) || 'UNFULFILLED',
      totalMinorUnits: o.totalMinorUnits,
      currency: o.currency,
      itemCount: count > 0 ? count : 1,
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt),
    }
  })

  return { items, total: filtered.length }
}

export async function getAdminOrder(id: string) {
  try {
    const orderRow = await db
      .select({
        order: orders,
        userDisplayName: profiles.displayName,
        userUsername: profiles.username,
      })
      .from(orders)
      .leftJoin(profiles, eq(orders.userId, profiles.id))
      .where(eq(orders.id, id))
      .limit(1)

    if (orderRow[0]) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, id))

      return {
        ...orderRow[0].order,
        userDisplayName: orderRow[0].userDisplayName,
        userUsername: orderRow[0].userUsername,
        userName: orderRow[0].userDisplayName ?? orderRow[0].userUsername ?? null,
        userEmail: null as null,
        items,
      }
    }
  } catch {
    // Fallback to commerce store if live DB is offline
  }

  // Fallback to commerce store
  const { orders: rawOrders } = __getRawOrdersAndBaskets()
  const rawOrder = rawOrders.find((o) => o.id === id || o.orderReference === id)
  if (!rawOrder) return null

  const rawItems = __getRawOrderItems().filter((item) => item.orderId === rawOrder.id)

  return {
    ...rawOrder,
    fulfilmentStatus: ((rawOrder as any).fulfilmentStatus as OrderFulfilmentStatus) || 'UNFULFILLED',
    shippingAddress: ((rawOrder as any).shippingAddress as any) ?? null,
    billingAddress: ((rawOrder as any).billingAddress as any) ?? null,
    customerNotes: ((rawOrder as any).customerNotes as string | null) ?? null,
    internalNotes: ((rawOrder as any).internalNotes as string | null) ?? null,
    createdAt: new Date(rawOrder.createdAt),
    updatedAt: new Date(rawOrder.updatedAt),
    userDisplayName: rawOrder.userId ? `Customer (${rawOrder.userId.slice(0, 8)})` : 'Guest Customer',
    userUsername: null,
    userName: rawOrder.userId ? `Customer (${rawOrder.userId.slice(0, 8)})` : 'Guest Customer',
    userEmail: null as null,
    items: rawItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      productVariantId: item.variantId,
      marketOfferId: item.marketOfferId,
      sku: item.sku,
      productName: item.productName,
      quantity: item.quantity,
      unitPriceMinorUnits: item.unitPriceMinorUnits,
      taxMinorUnits: item.taxMinorUnits,
      lineTotalMinorUnits: item.lineTotalMinorUnits,
      currency: item.currency,
      taxMode: item.taxMode,
      snapshot: item.snapshot,
      garageVehicleId: item.garageVehicleId,
    })),
  }
}

export const VALID_FULFILMENT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['UNFULFILLED', 'PROCESSING', 'CANCELLED'],
  UNFULFILLED: ['PROCESSING', 'PICKING', 'CANCELLED'],
  PICKING: ['PACKED', 'CANCELLED'],
  PROCESSING: ['PACKED', 'PICKING', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

export async function updateOrderFulfilmentStatus(
  id: string,
  fulfilmentStatus: OrderFulfilmentStatus,
  actor: { userId?: string; userEmail?: string },
  note?: string
) {
  let prevStatus: string | undefined
  let found = false

  if (isDbConfigured) {
    const current = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (current[0]) {
      found = true
      prevStatus = current[0].fulfilmentStatus
      // Validate transition
      if (prevStatus !== fulfilmentStatus) {
        const allowed = VALID_FULFILMENT_TRANSITIONS[prevStatus] ?? []
        if (!allowed.includes(fulfilmentStatus)) {
          throw new Error(
            `Invalid order fulfilment transition from ${prevStatus} to ${fulfilmentStatus}. Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`
          )
        }
      }

      await db
        .update(orders)
        .set({
          fulfilmentStatus,
          internalNotes: note
            ? `${current[0].internalNotes ? current[0].internalNotes + '\n' : ''}[${new Date().toISOString()}] ${note}`
            : current[0].internalNotes,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
    }
  }

  // Synchronize memory store if order exists there
  const { orders: rawOrders } = __getRawOrdersAndBaskets()
  const memOrder = rawOrders.find((o) => o.id === id || o.orderReference === id)
  if (memOrder) {
    found = true
    const currentStatus: string = prevStatus ?? (memOrder as any).fulfilmentStatus ?? 'PENDING'
    prevStatus = currentStatus
    if (currentStatus !== fulfilmentStatus) {
      const allowed = VALID_FULFILMENT_TRANSITIONS[currentStatus] ?? []
      if (!allowed.includes(fulfilmentStatus)) {
        throw new Error(
          `Invalid order fulfilment transition from ${currentStatus} to ${fulfilmentStatus}. Allowed transitions: ${allowed.join(', ') || 'none (terminal state)'}`
        )
      }
    }
    ;(memOrder as any).fulfilmentStatus = fulfilmentStatus
    memOrder.updatedAt = new Date().toISOString()
  }

  if (!found) {
    throw new Error(`Order not found: ${id}`)
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'STATUS_CHANGE',
      entityType: 'ORDER',
      entityId: id,
      previousState: { fulfilmentStatus: prevStatus ?? 'PENDING' },
      newState: { fulfilmentStatus },
      notes: note ?? null,
    })
  } catch {
    // Non-blocking if DB is offline
  }
}

export async function updateOrderPaymentStatus(
  id: string,
  paymentStatus: OrderPaymentStatus,
  actor: { userId?: string; userEmail?: string },
  note?: string
) {
  let prevStatus: string | undefined

  try {
    const current = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (current[0]) {
      prevStatus = current[0].paymentStatus
      await db
        .update(orders)
        .set({
          paymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
    }
  } catch {
    // Continue to memory sync
  }

  const { orders: rawOrders } = __getRawOrdersAndBaskets()
  const memOrder = rawOrders.find((o) => o.id === id || o.orderReference === id)
  if (memOrder) {
    prevStatus = prevStatus ?? memOrder.paymentStatus
    memOrder.paymentStatus = paymentStatus
    memOrder.updatedAt = new Date().toISOString()
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'STATUS_CHANGE',
      entityType: 'ORDER_PAYMENT',
      entityId: id,
      previousState: { paymentStatus: prevStatus ?? 'PENDING_PAYMENT' },
      newState: { paymentStatus },
      notes: note ?? null,
    })
  } catch {
    // Non-blocking if DB is offline
  }
}

export async function addOrderInternalNote(
  id: string,
  note: string,
  actor: { userId?: string; userEmail?: string }
) {
  try {
    const current = await db.select().from(orders).where(eq(orders.id, id)).limit(1)
    if (current[0]) {
      const updatedNotes = `${current[0].internalNotes ? current[0].internalNotes + '\n' : ''}[${new Date().toISOString()} by ${actor.userEmail || 'Staff'}]: ${note}`
      await db
        .update(orders)
        .set({
          internalNotes: updatedNotes,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
    }
  } catch {
    // Continue
  }
}

export async function getAdminOrderStats() {
  try {
    const results = await Promise.all([
      db.select({ totalOrders: count() }).from(orders),
      db.select({ paidOrders: count() }).from(orders).where(eq(orders.paymentStatus, 'PAID')),
      db.select({ pendingFulfilment: count() }).from(orders).where(eq(orders.fulfilmentStatus, 'PENDING')),
      db.select({ unfulfilledOrders: count() }).from(orders).where(eq(orders.fulfilmentStatus, 'UNFULFILLED')),
    ])

    const totalOrders = Number(results[0][0]?.totalOrders ?? 0)
    if (totalOrders > 0) {
      return {
        totalOrders,
        paidOrders: Number(results[1][0]?.paidOrders ?? 0),
        pendingFulfilment: Number(results[2][0]?.pendingFulfilment ?? 0),
        unfulfilledOrders: Number(results[3][0]?.unfulfilledOrders ?? 0),
      }
    }
  } catch {
    // Fallback to commerce memory store
  }

  const { orders: rawOrders } = __getRawOrdersAndBaskets()
  return {
    totalOrders: rawOrders.length,
    paidOrders: rawOrders.filter((o) => o.paymentStatus === 'PAID').length,
    pendingFulfilment: rawOrders.filter((o) => (o as any).fulfilmentStatus === 'PENDING').length,
    unfulfilledOrders: rawOrders.filter((o) => (o as any).fulfilmentStatus === 'UNFULFILLED').length,
  }
}
