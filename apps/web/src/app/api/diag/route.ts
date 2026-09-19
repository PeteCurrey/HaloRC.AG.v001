import { NextResponse } from 'next/server'
import { isDbConfigured, getMachinesList, getPartsList } from '@halo-rc/db'

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

  let machinesCount = 0
  let partsCount = 0
  let errorMessage: string | null = null

  try {
    const machines = await getMachinesList()
    machinesCount = machines.length
    const parts = await getPartsList({ limit: 10 })
    partsCount = parts.length
  } catch (err: any) {
    errorMessage = err?.message || String(err)
  }

  return NextResponse.json({
    envInfo,
    machinesCount,
    partsCount,
    errorMessage,
    timestamp: new Date().toISOString(),
  })
}
