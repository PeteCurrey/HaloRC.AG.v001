#!/usr/bin/env node
/**
 * Halo RC — Authoritative Supabase Seed Runner
 * Reads DATABASE_URL and environment variables from .env.local and executes db:seed.
 *
 * Usage:
 *   node scripts/seed-supabase.mjs
 * Or via:
 *   pnpm db:seed
 */

import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { spawnSync } from 'child_process'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
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
  } catch (err) {
    console.warn('Could not load .env.local:', err.message)
  }
}

loadEnv()

if (!process.env['DATABASE_URL']) {
  console.error('❌ DATABASE_URL is not set in environment or .env.local')
  process.exit(1)
}

console.log('🌱 Invoking seed runner with database connection configured...')

const result = spawnSync(
  'pnpm',
  ['--filter', '@halo-rc/db', 'exec', 'tsx', 'src/seed/index.ts'],
  {
    stdio: 'inherit',
    env: process.env,
  }
)

process.exit(result.status ?? 0)
