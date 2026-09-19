import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Connection singleton for server-side use only.
// Never import this in client components.

import fs from 'node:fs'
import path from 'node:path'

function tryLoadEnv() {
  if (process.env['DATABASE_URL']) return
  const candidates = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../.env.local'),
    path.resolve(process.cwd(), '../../.env.local'),
    typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../../.env.local') : null,
    typeof __dirname !== 'undefined' ? path.resolve(__dirname, '../../.env.local') : null,
  ].filter(Boolean) as string[]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const lines = fs.readFileSync(p, 'utf8').split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const idx = trimmed.indexOf('=')
          if (idx === -1) continue
          const key = trimmed.slice(0, idx).trim()
          const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) process.env[key] = value
        }
        if (process.env['DATABASE_URL']) break
      } catch {
        // ignore
      }
    }
  }
}
tryLoadEnv()

const DEFAULT_SUPABASE_POOLER_URL =
  'postgresql://postgres.crvammuvoryoldclrnoj:Vivaro2104!!@aws-0-eu-west-2.pooler.supabase.com:6543/postgres'

const connectionString =
  process.env['DATABASE_URL'] ||
  process.env['DIRECT_URL'] ||
  process.env['POSTGRES_URL'] ||
  DEFAULT_SUPABASE_POOLER_URL

declare global {
  // eslint-disable-next-line no-var
  var __postgres_client__: ReturnType<typeof postgres> | undefined
}

const clientOptions: Record<string, unknown> = {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
}

if (connectionString.includes('supabase.com')) {
  clientOptions['ssl'] = 'require'
}

// Disable prefetch for Supabase transaction pooler compatibility
const client =
  globalThis.__postgres_client__ ??
  postgres(connectionString, clientOptions as any)

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__postgres_client__ = client
}

export const isDbConfigured = Boolean(
  connectionString && !connectionString.includes('halo_rc_placeholder')
)

export const db = drizzle(client, { schema })

export type Database = typeof db
