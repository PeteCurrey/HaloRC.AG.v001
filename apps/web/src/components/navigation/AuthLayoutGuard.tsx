'use client'

import { usePathname } from 'next/navigation'
import React from 'react'

interface AuthLayoutGuardProps {
  children: React.ReactNode
}

/**
 * Hides GlobalNav and SiteFooter on dedicated full-screen auth pages (/auth/*)
 * and the operational administrative control center (/admin/*),
 * allowing both environments to occupy the viewport edge-to-edge.
 */
export function AuthLayoutGuard({ children }: AuthLayoutGuardProps) {
  const pathname = usePathname()
  const isExcluded = pathname.startsWith('/auth') || pathname.startsWith('/admin')

  if (isExcluded) {
    return null
  }

  return <>{children}</>
}
