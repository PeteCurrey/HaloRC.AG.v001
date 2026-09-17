import type { Metadata, Viewport } from 'next'
import { Work_Sans, JetBrains_Mono, Barlow_Condensed, Barlow } from 'next/font/google'
import '../styles/tokens.css'
import '../styles/base.css'
import '../styles/typography.css'
import { GlobalNav } from '@/components/navigation/GlobalNav'
import { SiteFooter } from '@/components/navigation/SiteFooter'
import { AuthLayoutGuard } from '@/components/navigation/AuthLayoutGuard'

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
  weight: ['200', '300', '400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
})

// Condensed: used selectively for discipline labels only
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  display: 'swap',
  weight: ['500', '600'],
})

// Wordmark: Barlow Black — used exclusively for the AVORRIA wordmark identity
const barlow = Barlow({
  subsets: ['latin'],
  variable: '--font-barlow',
  display: 'block',
  weight: ['900'],
})

export const metadata: Metadata = {
  title: {
    template: '%s — Avorria RC',
    default: 'Avorria RC — Remote Control. Without Compromise.',
  },
  description:
    'A premium RC destination for people who take RC seriously. Competition hardware, specialist brands, and the knowledge to match.',
  keywords: ['RC cars', 'radio controlled', 'competition RC', 'XRAY', 'Traxxas', '1/5 scale', 'RC racing'],
  openGraph: {
    type: 'website',
    siteName: 'Avorria RC',
    locale: 'en_GB',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080808',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${jetbrainsMono.variable} ${barlowCondensed.variable} ${barlow.variable}`}
    >
      <body>
        <AuthLayoutGuard>
          <GlobalNav />
        </AuthLayoutGuard>
        <main id="main-content">
          {children}
        </main>
        <AuthLayoutGuard>
          <SiteFooter />
        </AuthLayoutGuard>
      </body>
    </html>
  )
}
