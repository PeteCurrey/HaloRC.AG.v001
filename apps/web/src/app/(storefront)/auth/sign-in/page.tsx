import type { Metadata } from 'next'
import { signInAction } from '@/actions/auth'
import Link from 'next/link'
import styles from './signin.module.css'

export const metadata: Metadata = {
  title: 'Sign In — Halo RC',
  robots: { index: false, follow: false },
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>Halo RC Workshop</p>
        <h1 className={styles.heading}>Sign In</h1>
        <p className={styles.sub}>Access your Garage, builds and service records.</p>

        {error && (
          <div className={styles.errorBanner} role="alert">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signInAction} className={styles.form}>
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
            autoComplete="current-password"
            required
            className={styles.input}
            placeholder="••••••••"
          />

          <button type="submit" className={styles.btn}>
            Sign In
          </button>
        </form>

        <p className={styles.footer}>
          No account?{' '}
          <Link href="/auth/sign-up" className={styles.link}>
            Create one →
          </Link>
        </p>
      </div>
    </div>
  )
}
