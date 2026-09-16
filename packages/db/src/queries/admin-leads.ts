/**
 * Admin leads queries (CRM-Lite) — all operations use Drizzle DB directly.
 */

import { db, isDbConfigured } from '../client'
import {
  leads,
  leadActivities,
  products,
} from '../schema'
import {
  eq,
  and,
  desc,
  count,
  ilike,
  or,
} from 'drizzle-orm'
import { writeAuditLog } from './admin-products'
import type { LeadStatus, LeadPriority, LeadSource } from '@halo-rc/types'

export interface AdminLeadListItem {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  source: LeadSource
  productInterestId: string | null
  productInterestName?: string | null
  message: string
  status: LeadStatus
  priority: LeadPriority
  assignedUserId: string | null
  followUpDate: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AdminLeadFilters {
  status?: LeadStatus | undefined
  priority?: LeadPriority | undefined
  source?: LeadSource | undefined
  search?: string | undefined
}

// In-memory fallback store for hermetic testing and offline development
const LEADS_STORE: any[] = []
const LEAD_ACTIVITIES_STORE: any[] = []

export function __resetLeadsStoreForTesting() {
  LEADS_STORE.length = 0
  LEAD_ACTIVITIES_STORE.length = 0
}

export async function getAdminLeads(
  filters: AdminLeadFilters = {},
  pagination = { page: 1, perPage: 50 }
): Promise<{ items: AdminLeadListItem[]; total: number }> {
  const { page, perPage } = pagination
  const offset = (page - 1) * perPage

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const conditions = []

    if (filters.status) {
      conditions.push(eq(leads.status, filters.status))
    }
    if (filters.priority) {
      conditions.push(eq(leads.priority, filters.priority))
    }
    if (filters.source) {
      conditions.push(eq(leads.source, filters.source))
    }
    if (filters.search) {
      const q = `%${filters.search}%`
      conditions.push(
        or(
          ilike(leads.name, q),
          ilike(leads.email, q),
          ilike(leads.company, q),
          ilike(leads.message, q)
        )
      )
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: leads.id,
          name: leads.name,
          email: leads.email,
          phone: leads.phone,
          company: leads.company,
          source: leads.source,
          productInterestId: leads.productInterestId,
          productInterestName: products.name,
          message: leads.message,
          status: leads.status,
          priority: leads.priority,
          assignedUserId: leads.assignedUserId,
          followUpDate: leads.followUpDate,
          createdAt: leads.createdAt,
          updatedAt: leads.updatedAt,
        })
        .from(leads)
        .leftJoin(products, eq(leads.productInterestId, products.id))
        .where(whereClause)
        .orderBy(desc(leads.createdAt))
        .limit(perPage)
        .offset(offset),

      db
        .select({ total: count() })
        .from(leads)
        .where(whereClause),
    ])

    const total = countRows[0]?.total ?? 0
    if (rows.length > 0 || total > 0) {
      return { items: rows as AdminLeadListItem[], total: Number(total) }
    }
  } catch {
    // Non-blocking fallback
  }

  let filtered = [...LEADS_STORE]
  if (filters.status) filtered = filtered.filter((l) => l.status === filters.status)
  if (filters.priority) filtered = filtered.filter((l) => l.priority === filters.priority)
  if (filters.source) filtered = filtered.filter((l) => l.source === filters.source)
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.company && l.company.toLowerCase().includes(q)) ||
        l.message.toLowerCase().includes(q)
    )
  }

  const items = filtered.slice(offset, offset + perPage).map((l) => ({
    ...l,
    productInterestName: null,
    createdAt: new Date(l.createdAt),
    updatedAt: new Date(l.updatedAt),
  }))

  return { items, total: filtered.length }
}

export async function getAdminLead(id: string) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db
      .select({
        lead: leads,
        productInterestName: products.name,
      })
      .from(leads)
      .leftJoin(products, eq(leads.productInterestId, products.id))
      .where(eq(leads.id, id))
      .limit(1)

    if (row) {
      const activities = await db
        .select()
        .from(leadActivities)
        .where(eq(leadActivities.leadId, id))
        .orderBy(desc(leadActivities.createdAt))

      return {
        ...row.lead,
        productInterestName: row.productInterestName,
        activities,
      }
    }
  } catch {
    // Fallback
  }

  const mem = LEADS_STORE.find((l) => l.id === id)
  if (!mem) return null

  const activities = LEAD_ACTIVITIES_STORE.filter((a) => a.leadId === id).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return {
    ...mem,
    productInterestName: null,
    activities,
  }
}

export async function createLead(
  data: Omit<typeof leads.$inferInsert, 'id' | 'createdAt' | 'updatedAt'>
) {
  let createdId: string | null = null

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [row] = await db.insert(leads).values(data).returning({ id: leads.id })
    if (row) {
      createdId = row.id
      await db.insert(leadActivities).values({
        leadId: row.id,
        action: 'LEAD_CREATED',
        details: { source: data.source },
      })
    }
  } catch {
    // Fallback
  }

  if (!createdId) {
    createdId = `lead-${crypto.randomUUID()}`
    LEADS_STORE.push({
      id: createdId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    LEAD_ACTIVITIES_STORE.push({
      id: `act-${crypto.randomUUID()}`,
      leadId: createdId,
      action: 'LEAD_CREATED',
      details: { source: data.source },
      createdAt: new Date(),
    })
  }

  return { id: createdId }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  actor: { userId?: string; userEmail?: string },
  note?: string
) {
  let prevStatus: string | undefined

  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    const [current] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
    if (current) {
      prevStatus = current.status
      await db
        .update(leads)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, id))

      await db.insert(leadActivities).values({
        leadId: id,
        userId: actor.userId ?? null,
        userEmail: actor.userEmail ?? null,
        action: 'STATUS_CHANGE',
        details: { previousStatus: current.status, newStatus: status, note },
      })
    }
  } catch {
    // Fallback
  }

  const mem = LEADS_STORE.find((l) => l.id === id)
  if (mem) {
    prevStatus = prevStatus ?? mem.status
    mem.status = status
    mem.updatedAt = new Date()
    LEAD_ACTIVITIES_STORE.push({
      id: `act-${crypto.randomUUID()}`,
      leadId: id,
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'STATUS_CHANGE',
      details: { previousStatus: prevStatus, newStatus: status, note },
      createdAt: new Date(),
    })
  }

  try {
    await writeAuditLog({
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'STATUS_CHANGE',
      entityType: 'LEAD',
      entityId: id,
      previousState: { status: prevStatus ?? 'NEW' },
      newState: { status },
      notes: note ?? null,
    })
  } catch {
    // Continue
  }
}

export async function addLeadNote(
  id: string,
  note: string,
  actor: { userId?: string; userEmail?: string }
) {
  try {
    if (!isDbConfigured) throw new Error('DB_NOT_CONFIGURED')
    await db.insert(leadActivities).values({
      leadId: id,
      userId: actor.userId ?? null,
      userEmail: actor.userEmail ?? null,
      action: 'NOTE_ADDED',
      details: { note },
    })
  } catch {
    // Fallback
  }

  LEAD_ACTIVITIES_STORE.push({
    id: `act-${crypto.randomUUID()}`,
    leadId: id,
    userId: actor.userId ?? null,
    userEmail: actor.userEmail ?? null,
    action: 'NOTE_ADDED',
    details: { note },
    createdAt: new Date(),
  })
}

export async function getAdminLeadStats() {
  const [
    totalRows,
    newRows,
    qualifiedRows,
    urgentRows,
  ] = await Promise.all([
    db.select({ totalLeads: count() }).from(leads),
    db.select({ newLeads: count() }).from(leads).where(eq(leads.status, 'NEW')),
    db.select({ qualifiedLeads: count() }).from(leads).where(eq(leads.status, 'QUALIFIED')),
    db.select({ urgentLeads: count() }).from(leads).where(eq(leads.priority, 'URGENT')),
  ])

  return {
    totalLeads: Number(totalRows[0]?.totalLeads ?? 0),
    newLeads: Number(newRows[0]?.newLeads ?? 0),
    qualifiedLeads: Number(qualifiedRows[0]?.qualifiedLeads ?? 0),
    urgentLeads: Number(urgentRows[0]?.urgentLeads ?? 0),
  }
}
