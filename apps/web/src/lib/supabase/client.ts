/**
 * Supabase browser client — used in Client Components.
 * Must only ever be called from the browser.
 */
import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://placeholder.supabase.co'
  const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || 'placeholder-anon-key'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
