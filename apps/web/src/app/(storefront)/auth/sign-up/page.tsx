import type { Metadata } from 'next'
import { signUpAction } from '@/actions/auth'
import Link from 'next/link'
import styles from '../sign-in/signin.module.css'

export const metadata: Metadata = {
  title: 'Create Account — Halo RC',
  robots: { index: false, follow: false },
}

interface SignUpPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Halo RC Workshop</p>
        <h1 className={styles.heading}>Create Account</h1>
        <p className={styles.sub}>Your Garage, builds and service records — private and persistent.</p>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signUpAction} className={styles.form}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={styles.input}
            placeholder="you@example.com"
          />

          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={styles.input}
            placeholder="Min. 8 characters"
          />

          <button type="submit" className={styles.btn}>
            Create Account
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/auth/sign-in" className={styles.link}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  )
}
