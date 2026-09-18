#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createRequire } from 'module'

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}
loadEnv()

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL

const require = createRequire(import.meta.url)
let postgres
try {
  postgres = require('postgres')
} catch {
  postgres = require(
    resolve(
      process.cwd(),
      'node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/cjs/src/index.js'
    )
  )
}

const sql = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
})

async function main() {
  console.log('Connecting to:', connectionString.replace(/:[^:@]+@/, ':***@'))

  const totalProducts = await sql`SELECT count(*) as count FROM products`
  console.log('Total products in Supabase:', totalProducts[0].count)

  const mugenProducts = await sql`SELECT id, sku, name, product_type, category_id, status, published FROM products WHERE brand_id = 'brand-mugen-seiki' ORDER BY sku`
  console.log('Mugen products found:', mugenProducts.length)
  for (const p of mugenProducts) {
    console.log(`- [${p.sku}] ${p.name} | type=${p.product_type} | cat=${p.category_id} | status=${p.status} | published=${p.published}`)
  }

  const mugenVariants = await sql`SELECT pv.id, pv.product_id, pv.sku, pv.published, pv.status FROM product_variants pv JOIN products p ON pv.product_id = p.id WHERE p.brand_id = 'brand-mugen-seiki'`
  console.log('Mugen variants found:', mugenVariants.length)

  const mugenOffers = await sql`SELECT mo.id, mo.market_code, mo.retail_price, mo.currency, mo.availability FROM market_offers mo JOIN product_variants pv ON mo.product_variant_id = pv.id JOIN products p ON pv.product_id = p.id WHERE p.brand_id = 'brand-mugen-seiki'`
  console.log('Mugen market offers found:', mugenOffers.length)

  const mugenSupplierOffers = await sql`SELECT count(*) as count FROM supplier_offers WHERE supplier_id = 'sup-mugen-europe'`
  console.log('Mugen supplier offers found:', mugenSupplierOffers[0].count)

  const platforms = await sql`SELECT id, name, brand_id FROM vehicle_platforms WHERE brand_id = 'brand-mugen-seiki'`
  console.log('Mugen platforms:', platforms)

  await sql.end()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
