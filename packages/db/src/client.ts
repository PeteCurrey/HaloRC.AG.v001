import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Connection singleton for server-side use only.
// Never import this in client components.

const connectionString =
  process.env['DATABASE_URL'] ||
  'postgresql://postgres:postgres@127.0.0.1:5432/halo_rc_placeholder'

// Disable prefetch for Supabase transaction pooler compatibility
const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
})

export const db = drizzle(client, { schema })

export type Database = typeof db
