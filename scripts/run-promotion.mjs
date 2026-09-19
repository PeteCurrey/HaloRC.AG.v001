import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

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

async function main() {
  const { MugenCanonicalPromoter } = await import('../packages/db/src/importers/mugen-canonical-promoter.ts')
  console.log('Starting promotion...')
  const promoter = new MugenCanonicalPromoter()
  const start = Date.now()
  const report = await promoter.promoteAll()
  console.log('Promotion complete in', ((Date.now() - start) / 1000).toFixed(2), 'seconds')
  console.log(JSON.stringify(report, null, 2))
}

main().catch(console.error)
