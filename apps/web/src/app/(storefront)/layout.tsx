// Storefront layout — wraps all public-facing pages
// Nav and Footer are in the root layout; this adds the top padding offset

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ paddingTop: 'var(--nav-height)' }}>
      {children}
    </div>
  )
}
