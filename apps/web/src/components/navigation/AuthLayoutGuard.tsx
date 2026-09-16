'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

interface AuthLayoutGuardProps {
  children: React.ReactNode
}

/**
 * Hides GlobalNav and SiteFooter on dedicated full-screen auth pages (/auth/*),
 * allowing the split-screen layout to occupy the viewport edge-to-edge.
 */
export function AuthLayoutGuard({ children }: AuthLayoutGuardProps) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  if (isAuthPage) {
    return null
  }

  return <>{children}</>
}
