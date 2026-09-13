'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import s from './GlobalNav.module.css'
import { MarketSelector } from './MarketSelector'
import { HaloLogo } from '@/components/brand/HaloLogo'

interface NavItem {
  label: string
  href: string
  variant?: 'race' | undefined
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'The Machines', href: '/machines' },
  { label: 'Race Department', href: '/race', variant: 'race' },
  { label: 'Brands', href: '/brands' },
  { label: 'Build My Rig', href: '/build' },
  { label: 'Find My Machine', href: '/find' },
  { label: 'The Garage', href: '/garage' },
] as const

export function GlobalNav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Trap scroll when mobile nav is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev)
  }, [])

  return (
    <>
      <nav
        className={s.nav}
        data-scrolled={scrolled}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className={s.logo} aria-label="Halo RC — Home">
          <HaloLogo className={s.logoMark} />
          <span className={s.logoText}>Halo RC</span>
        </Link>

        {/* Desktop navigation links */}
        <ul className={s.navLinks} role="list">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  item.variant === 'race'
                    ? `${s.navLink} ${s.navLinkRace}`
                    : s.navLink
                }
                aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className={s.navRight}>
          <MarketSelector />

          {/* Search */}
          <Link href="/search" className={s.iconButton} aria-label="Search">
            <SearchIcon />
          </Link>

          {/* Garage / Account */}
          <Link href="/garage" className={s.iconButton} aria-label="My Garage">
            <GarageIcon />
          </Link>

          {/* Cart */}
          <Link href="/cart" className={s.iconButton} aria-label="Shopping Cart">
            <CartIcon />
          </Link>

          {/* Mobile menu toggle */}
          <button
            className={s.mobileMenuButton}
            onClick={toggleMobile}
            aria-expanded={mobileOpen}
            aria-controls="mobile-drawer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        className={s.mobileDrawer}
        data-open={mobileOpen}
        aria-hidden={!mobileOpen}
        role="dialog"
        aria-label="Navigation menu"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={s.mobileNavLink}
            aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}

        <div style={{ marginTop: 'var(--space-5)' }}>
          <MarketSelector />
        </div>
      </div>
    </>
  )
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function GarageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

