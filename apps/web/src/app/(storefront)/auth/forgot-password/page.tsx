import type { Metadata } from 'next'
import Link from 'next/link'
import { forgotPasswordAction } from '@/actions/auth'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import s from '@/components/auth/AuthForm.module.css'

export const metadata: Metadata = {
  title: 'Reset Password — Avorria RC',
  description: 'Request a password recovery link for your Avorria RC account.',
  robots: { index: false, follow: false },
}

interface ForgotPasswordPageProps {
  searchParams: Promise<{ error?: string; success?: string }>
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { error, success } = await searchParams

  return (
    <AuthSplitLayout
      badgeLabel="ACCOUNT RECOVERY"
      editorialProps={{
        caption: 'SECURITY // CREDENTIAL RECOVERY',
        headline: 'Authorised Identity Protection',
        subtext: 'Your credentials safeguard private Garage configurations, order histories, and vehicle telemetry records.',
      }}
    >
      <div className={s.header}>
        <p className={s.eyebrow}>Avorria RC Security</p>
        <h1 className={s.heading}>Reset password</h1>
        <p className={s.sub}>
          Enter your registered email address and we will send you secure recovery instructions.
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

      <form action={forgotPasswordAction} className={s.form}>
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

        <button type="submit" className={s.btn}>
          Send Recovery Link
        </button>
      </form>

      <div className={s.footerLinks}>
        <div className={s.footerRow}>
          <span>Remembered your password?</span>
          <Link href="/auth/sign-in" className={s.link}>
            Back to sign in →
          </Link>
        </div>
      </div>
    </AuthSplitLayout>
  )
}
