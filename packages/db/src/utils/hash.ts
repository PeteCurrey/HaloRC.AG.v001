// packages/db/src/utils/hash.ts
import crypto from 'node:crypto'

/**
 * Deterministically compute a SHA-256 hash of a raw record payload.
 * Used for change detection (idempotent no-op vs real change).
 */
export function computeSourceHash(raw: unknown): string {
  const json = JSON.stringify(raw, Object.keys(raw as object || {}).sort())
  return crypto.createHash('sha256').update(json).digest('hex')
}
