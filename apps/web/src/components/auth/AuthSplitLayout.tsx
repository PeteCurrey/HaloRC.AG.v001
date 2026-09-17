import React from 'react'
import Link from 'next/link'
import { AvorriaMark } from '@/components/brand/AvorriaMark'
import { AuthEditorialPanel, type AuthEditorialPanelProps } from './AuthEditorialPanel'
import s from './AuthSplitLayout.module.css'

export interface AuthSplitLayoutProps {
  children: React.ReactNode
  editorialProps?: AuthEditorialPanelProps
  showBackLink?: boolean
  backLinkHref?: string
  backLinkLabel?: string
  badgeLabel?: string
}

export function AuthSplitLayout({
  children,
  editorialProps,
  showBackLink = true,
  backLinkHref = '/',
  backLinkLabel = 'Back to Avorria RC',
  badgeLabel = 'WORKSHOP ACCESS',
}: AuthSplitLayoutProps) {
  return (
    <div className={s.container}>
      {/* Left visual column */}
      <div className={s.visualCol}>
        <AuthEditorialPanel {...editorialProps} />
      </div>

      {/* Right form column */}
      <div className={s.formCol}>
        {showBackLink && (
          <div className={s.backLinkContainer}>
            <Link href={backLinkHref} className={s.backLink}>
              ← <span>{backLinkLabel}</span>
            </Link>
          </div>
        )}

        <div className={s.contentWrapper}>
          <Link href="/" className={s.brandRow} aria-label="Avorria RC Home">
            <AvorriaMark variant="dark" style={{ height: 20, width: 'auto' }} />
            <span className={s.brandBadge}>{badgeLabel}</span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  )
}
