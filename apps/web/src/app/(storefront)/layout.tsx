'use client'

// Storefront layout — wraps public storefront pages.
// Automatically cancels top padding on edge-to-edge /auth pages.
import { usePathname } from 'next/navigation'

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <div style={{ paddingTop: isAuthPage ? 0 : 'var(--nav-height)' }}>
      {children}
    </div>
  )
}
