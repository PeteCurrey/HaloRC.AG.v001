import { NextResponse } from 'next/server'
import { db, isDbConfigured } from '@halo-rc/db'
import { products } from '@halo-rc/db/schema'
import { count } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rawDbUrl = process.env['DATABASE_URL'] || ''
  const sanitizedDbUrl = rawDbUrl
    ? rawDbUrl.replace(/:([^:@]+)@/, ':***@')
    : 'NOT_SET'

  const envInfo = {
    hasDatabaseUrl: Boolean(process.env['DATABASE_URL']),
    sanitizedDbUrl,
    hasDirectUrl: Boolean(process.env['DIRECT_URL']),
    hasPostgresUrl: Boolean(process.env['POSTGRES_URL']),
    isDbConfigured,
    nodeEnv: process.env['NODE_ENV'],
  }

  let dbStatus = 'NOT_ATTEMPTED'
  let productCount = -1
  let errorMessage: string | null = null

  if (isDbConfigured) {
    try {
      const [res] = await db.select({ val: count() }).from(products)
      productCount = Number(res?.val ?? 0)
      dbStatus = 'CONNECTED'
    } catch (err: any) {
      dbStatus = 'ERROR'
      errorMessage = err?.message || String(err)
    }
  }

  return NextResponse.json({
    envInfo,
    dbStatus,
    productCount,
    errorMessage,
    timestamp: new Date().toISOString(),
  })
}
