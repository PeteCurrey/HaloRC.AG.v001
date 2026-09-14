/**
 * Supabase server client — used in Server Components, Route Handlers, Server Actions.
 * Uses @supabase/ssr cookie utilities to read/write cookies from the Next.js
 * cookies() API. This is the ONLY authoritative way to resolve a server-side
 * session in Halo RC.
 *
 * SECURITY: This file runs server-side only. Never import it from a Client Component.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'placeholder-anon-key'

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — middleware handles session refresh
          }
        },
      },
    }
  )
}

/**
 * Get the currently authenticated Supabase user, or null if not signed in.
 * Always uses getUser() — not getSession() — to validate against the server.
 */
export async function getSupabaseUser() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith('http')) {
    return null
  }

  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
}
