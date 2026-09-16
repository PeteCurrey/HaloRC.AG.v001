#!/usr/bin/env node
/**
 * Halo RC — Admin User Setup Script
 * Reads credentials from .env.local — never commits them to git.
 * Run: node scripts/setup-admin-user.mjs
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createRequire } from 'module'

// Parse .env.local manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  const env = {}
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    env[key] = value
  }
  return env
}

const env = loadEnv()

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
// Support both ADIMIN_PASSWORD (typo in env) and ADMIN_PASSWORD
const ADMIN_EMAIL = env['SUPER_ADMIN']
const ADMIN_PASSWORD = env['ADMIN_PASSWORD'] ?? env['ADIMIN_PASSWORD']
const ADMIN_ROLE = 'SUPER_ADMIN'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌  Missing SUPER_ADMIN or ADIMIN_PASSWORD in .env.local')
  process.exit(1)
}

// Use the pnpm-installed supabase-js CJS build
const require = createRequire(import.meta.url)
const supabaseJsPath = '/Users/petercurrey/Desktop/Websites/Halo RC/node_modules/.pnpm/@supabase+supabase-js@2.116.0/node_modules/@supabase/supabase-js/dist/index.cjs'
const { createClient } = require(supabaseJsPath)

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function run() {
  console.log(`\n🔧  Halo RC — Admin User Setup`)
  console.log(`    Target: ${ADMIN_EMAIL}`)
  console.log(`    Role:   ${ADMIN_ROLE}\n`)

  // List existing users and check if this email exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) {
    console.error('❌  Failed to list users:', listError.message)
    process.exit(1)
  }

  const existingUser = existingUsers.users.find((u) => u.email === ADMIN_EMAIL)

  if (existingUser) {
    // Update existing user's role
    console.log(`    ℹ️   User found (id: ${existingUser.id}) — updating role to ${ADMIN_ROLE}...`)
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: ADMIN_PASSWORD,
      user_metadata: { ...existingUser.user_metadata, role: ADMIN_ROLE },
    })
    if (updateError) {
      console.error('❌  Failed to update user:', updateError.message)
      process.exit(1)
    }
    console.log(`✅  User updated — password reset + role set to ${ADMIN_ROLE}`)
  } else {
    // Create new user
    console.log(`    ℹ️   User not found — creating ${ADMIN_EMAIL}...`)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { role: ADMIN_ROLE },
    })
    if (createError) {
      console.error('❌  Failed to create user:', createError.message)
      process.exit(1)
    }
    console.log(`✅  Created ${ADMIN_EMAIL} (id: ${newUser.user.id})`)
  }

  console.log(`\n🎉  Done! Sign in at /admin with:`)
  console.log(`    Email:    ${ADMIN_EMAIL}`)
  console.log(`    Password: (as set in .env.local)\n`)
}

run().catch((err) => {
  console.error('❌  Unexpected error:', err)
  process.exit(1)
})
