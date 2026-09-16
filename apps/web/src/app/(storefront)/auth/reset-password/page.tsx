import type { Metadata } from 'next'
import Link from 'next/link'
import { updatePasswordAction } from '@/actions/auth'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import s from '@/components/auth/AuthForm.module.css'

export const metadata: Metadata = {
  title: 'Set New Password — Avorria RC',
  description: 'Update your Avorria RC account password securely.',
  robots: { index: false, follow: false },
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { error } = await searchParams

  return (
    <AuthSplitLayout
      badgeLabel="CREDENTIAL UPDATE"
      editorialProps={{
        caption: 'SECURITY // CREDENTIAL UPDATE',
        headline: 'Establish New Credentials',
        subtext: 'Configure a strong passphrase to ensure full protection for your Garage vehicles and telemetry.',
      }}
    >
      <div className={s.header}>
        <p className={s.eyebrow}>Avorria RC Security</p>
        <h1 className={s.heading}>Set new password</h1>
        <p className={s.sub}>
          Create a new password of at least 8 characters for your account.
        </p>
      </div>

      {error && (
        <div className={`${s.alertBanner} ${s.errorBanner}`} role="alert">
          <span>{decodeURIComponent(error)}</span>
        </div>
      )}

      <form action={updatePasswordAction} className={s.form}>
        <div className={s.field}>
          <label className={s.label} htmlFor="password">New Password</label>
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
        </div>

        <div className={s.field}>
          <label className={s.label} htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={s.input}
            placeholder="Repeat password"
          />
        </div>

        <button type="submit" className={s.btn}>
          Update Password
        </button>
      </form>

      <div className={s.footerLinks}>
        <div className={s.footerRow}>
          <span>Return to authentication</span>
          <Link href="/auth/sign-in" className={s.link}>
            Sign in →
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
