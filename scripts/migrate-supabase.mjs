#!/usr/bin/env node
/**
 * Halo RC — Authoritative Supabase Migration Runner
 * Applies all SQL migrations in supabase/migrations/ in sequential order.
 * Tracks applied migrations in public._halo_migrations table.
 *
 * Usage:
 *   node scripts/migrate-supabase.mjs
 * Or via pnpm:
 *   pnpm db:migrate
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { createRequire } from 'module'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    const lines = readFileSync(envPath, 'utf8').split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const idx = trimmed.indexOf('=')
      if (idx === -1) continue
      const key = trimmed.slice(0, idx).trim()
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // .env.local may not exist in CI
  }
}

loadEnv()

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/halo_rc_placeholder'

if (connectionString.includes('halo_rc_placeholder') || connectionString.includes('[YOUR-PASSWORD]')) {
  console.error('❌  Cannot run migrations: DATABASE_URL or DIRECT_URL is not configured.')
  process.exit(1)
}

const require = createRequire(import.meta.url)
const postgres = require(
  resolve(
    process.cwd(),
    'node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/cjs/src/index.js'
  )
)

const sql = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
})

async function run() {
  console.log('🚀  Running Supabase Migrations...\n')

  await sql`
    CREATE TABLE IF NOT EXISTS public._halo_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `

  const migrationsDir = resolve(process.cwd(), 'supabase/migrations')
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let appliedCount = 0

  for (const file of files) {
    const existing = await sql`
      SELECT id FROM public._halo_migrations WHERE name = ${file}
    `
    if (existing.length > 0) {
      console.log(`  ✓  [Already applied] ${file}`)
      continue
    }

    console.log(`  →  Applying ${file}...`)
    const content = readFileSync(resolve(migrationsDir, file), 'utf8')
    await sql.unsafe(content)
    await sql`
      INSERT INTO public._halo_migrations (name) VALUES (${file})
    `
    console.log(`  ✅  Applied ${file}`)
    appliedCount++
  }

  console.log(`\n🎉  Migrations complete. ${appliedCount} new migrations applied.\n`)
  process.exit(0)
}

run().catch((err) => {
  console.error('\n❌  Migration failed:', err)
  process.exit(1)
})
