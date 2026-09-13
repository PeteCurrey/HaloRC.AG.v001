'use server'

/**
 * Supabase Auth Server Actions.
 *
 * SECURITY INVARIANTS:
 * - All auth decisions are made server-side by Supabase.
 * - Passwords are never stored, processed, or logged by Halo RC code.
 * - The browser cannot set its own role or session — only Supabase can.
 * - All redirects happen server-side after verified operations.
 */
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface AuthActionResult {
  error?: string
}

/**
 * Sign in with email + password.
 * On success, redirects to /garage.
 * On failure, returns an error message suitable for display.
 */
export async function signInAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string | null
  const password = formData.get('password') as string | null

  if (!email || !password) {
    redirect('/auth/sign-in?error=' + encodeURIComponent('Email and password are required.'))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Return a safe generic message — never leak internal Supabase error details
    redirect('/auth/sign-in?error=' + encodeURIComponent('Invalid credentials. Please check your email and password.'))
  }

  redirect('/garage')
}

/**
 * Create a new customer account.
 * On success, redirects to /garage with a prompt to verify email.
 * On failure, returns a safe error message.
 */
export async function signUpAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string | null
  const password = formData.get('password') as string | null

  if (!email || !password) {
    redirect('/auth/sign-up?error=' + encodeURIComponent('Email and password are required.'))
  }

  if (password.length < 8) {
    redirect('/auth/sign-up?error=' + encodeURIComponent('Password must be at least 8 characters.'))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Set initial role in metadata — can be elevated by admins later
      data: { role: 'CUSTOMER' },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      redirect('/auth/sign-up?error=' + encodeURIComponent('An account with this email already exists.'))
    }
    redirect('/auth/sign-up?error=' + encodeURIComponent('Could not create account. Please try again.'))
  }

  redirect('/garage')
}

/**
 * Sign out the current user.
 * Clears all Supabase session cookies.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}
