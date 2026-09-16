import type { Metadata } from 'next'
import Link from 'next/link'
import { signInAction } from '@/actions/auth'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import s from '@/components/auth/AuthForm.module.css'

export const metadata: Metadata = {
  title: 'Sign In — Avorria RC',
  description: 'Access your Avorria RC Garage, builds, telemetry, and Chief Pit Crew.',
  robots: { index: false, follow: false },
}

interface SignInPageProps {
  searchParams: Promise<{ error?: string; success?: string; redirectTo?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error, success, redirectTo } = await searchParams
  const isAdmin = redirectTo?.startsWith('/admin')

  return (
    <AuthSplitLayout
      badgeLabel={isAdmin ? 'ADMINISTRATION' : 'WORKSHOP ACCESS'}
      editorialProps={{
        caption: isAdmin ? 'AVORRIA RC // PLATFORM OPERATIONS' : 'AVORRIA SPEC // WORKSHOP & RACE ENGINEERING',
        headline: isAdmin ? 'Platform Administration & Fleet Operations' : 'Precision Engineering. Without Compromise.',
        subtext: isAdmin
          ? 'Secure management for verified catalogue items, supplier distribution, and platform governance.'
          : 'Access your personal Garage, live telemetry, precision builds, and Chief Pit Crew diagnostic advisor.',
      }}
    >
      <div className={s.header}>
        <p className={s.eyebrow}>{isAdmin ? 'Avorria RC Operations' : 'Avorria RC Workshop'}</p>
        <h1 className={s.heading}>{isAdmin ? 'Staff Sign In' : 'Welcome back.'}</h1>
        <p className={s.sub}>
          {isAdmin
            ? 'Sign in with your staff or administrator credentials.'
            : 'Access your Garage, custom builds, orders, and Chief Pit Crew.'}
        </p>
      </div>

      {error && (
        <div className={`${s.alertBanner} ${s.errorBanner}`} role="alert">
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}

      {success && (
        <div className={`${s.alertBanner} ${s.successBanner}`} role="status">
          <span>{decodeURIComponent(success)}</span>
        </div>
      )}

      <form action={signInAction} className={s.form}>
        {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

        <div className={s.field}>
          <label className={s.label} htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={s.input}
            placeholder="name@domain.com"
          />
        </div>

        <div className={s.field}>
          <div className={s.fieldRow}>
            <label className={s.label} htmlFor="password">Password</label>
            <Link href="/auth/forgot-password" className={s.linkMuted}>
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={s.input}
            placeholder="••••••••••••"
          />
        </div>

        <button type="submit" className={s.btn}>
          {isAdmin ? 'Authenticate & Enter' : 'Sign In to Workshop'}
        </button>
      </form>

      <div className={s.footerLinks}>
        <div className={s.footerRow}>
          <span>Don't have an account?</span>
          <Link href="/auth/sign-up" className={s.link}>
            Create an account →
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
