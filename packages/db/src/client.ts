import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// Connection singleton for server-side use only.
// Never import this in client components.

const connectionString = process.env['DATABASE_URL']

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Disable prefetch for Supabase transaction pooler compatibility
const client = postgres(connectionString, { prepare: false })

export const db = drizzle(client, { schema })

export type Database = typeof db
