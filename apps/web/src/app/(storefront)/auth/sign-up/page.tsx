import type { Metadata } from 'next'
import Link from 'next/link'
import { signUpAction } from '@/actions/auth'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import s from '@/components/auth/AuthForm.module.css'

export const metadata: Metadata = {
  title: 'Create Account — Avorria RC',
  description: 'Create your private Avorria RC account for fleet management, telemetry, and builds.',
  robots: { index: false, follow: false },
}

interface SignUpPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams

  return (
    <AuthSplitLayout
      badgeLabel="REGISTRATION"
      editorialProps={{
        caption: 'AVORRIA SPEC // CHASSIS & RIG ASSEMBLY',
        headline: 'Join the High-Performance Engineering Community',
        subtext: 'Track multiple vehicles, configure custom builds with verified component tolerances, and consult the Chief Pit Crew.',
      }}
    >
      <div className={s.header}>
        <p className={s.eyebrow}>Avorria RC Ownership</p>
        <h1 className={s.heading}>Create Account</h1>
        <p className={s.sub}>Your Garage, builds and service records — private, secure, and persistent.</p>
      </div>

      {error && (
        <div className={`${s.alertBanner} ${s.errorBanner}`} role="alert">
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}

      <form action={signUpAction} className={s.form}>
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
          <label className={s.label} htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={s.input}
            placeholder="Minimum 8 characters"
          />
          <span className={s.helperText}>Must be at least 8 characters long.</span>
        </div>

        <button type="submit" className={s.btn}>
          Create Private Account
        </button>
      </form>

      <div className={s.footerLinks}>
        <div className={s.footerRow}>
          <span>Already have an account?</span>
          <Link href="/auth/sign-in" className={s.link}>
            Sign in →
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
