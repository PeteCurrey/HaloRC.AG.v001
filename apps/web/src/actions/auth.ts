'use server'

/**
 * Supabase Auth Server Actions.
 *
 * SECURITY INVARIANTS:
 * - All auth decisions are made server-side by Supabase.
 * - Passwords are never stored, processed, or logged by Avorria RC code.
 * - The browser cannot set its own role or session — only Supabase can.
 * - All redirects happen server-side after verified operations.
 */
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export interface AuthActionResult {
  error?: string
}

/**
 * Sign in with email + password.
 * On success, redirects to /garage (or safe redirectTo).
 * On failure, returns a safe error message.
 */
export async function signInAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string | null
  const password = formData.get('password') as string | null
  const redirectTo = formData.get('redirectTo') as string | null
  // Only allow relative paths for safe redirection
  const safeRedirectTo = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : null

  if (!email || !password) {
    const errorQuery = '?error=' + encodeURIComponent('Email and password are required.')
    const redirectQuery = safeRedirectTo ? '&redirectTo=' + encodeURIComponent(safeRedirectTo) : ''
    redirect('/auth/sign-in' + errorQuery + redirectQuery)
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Return a safe generic message — never leak internal Supabase error details
    const errorQuery = '?error=' + encodeURIComponent('Invalid credentials. Please check your email and password.')
    const redirectQuery = safeRedirectTo ? '&redirectTo=' + encodeURIComponent(safeRedirectTo) : ''
    redirect('/auth/sign-in' + errorQuery + redirectQuery)
  }

  redirect(safeRedirectTo ?? '/garage')
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
 * Request password recovery / reset link.
 */
export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string | null

  if (!email) {
    redirect('/auth/forgot-password?error=' + encodeURIComponent('Please provide your email address.'))
  }

  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const redirectTo = `${origin}/auth/reset-password`

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    // Avoid leaking account existence — show a neutral generic message
    redirect('/auth/forgot-password?success=' + encodeURIComponent('If an account exists with this email, instructions to reset your password have been sent.'))
  }

  redirect('/auth/forgot-password?success=' + encodeURIComponent('If an account exists with this email, instructions to reset your password have been sent.'))
}

/**
 * Set new password following recovery email link.
 */
export async function updatePasswordAction(formData: FormData): Promise<void> {
  const password = formData.get('password') as string | null
  const confirmPassword = formData.get('confirmPassword') as string | null

  if (!password || !confirmPassword) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Both password fields are required.'))
  }

  if (password !== confirmPassword) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Passwords do not match.'))
  }

  if (password.length < 8) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Password must be at least 8 characters.'))
  }

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Unable to update password. Your reset link may have expired.'))
  }

  redirect('/auth/sign-in?success=' + encodeURIComponent('Password successfully updated. Please sign in.'))
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
