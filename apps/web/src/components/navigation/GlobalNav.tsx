'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import s from './GlobalNav.module.css'
import { MarketSelector } from './MarketSelector'
import { HaloLogo } from '@/components/brand/HaloLogo'
import { MegaMenu } from './MegaMenu'
import { MEGA_MENUS } from '@/lib/navigation-data'

type MegaMenuId = 'machines' | 'parts' | 'race' | 'brands'

interface NavItem {
  label: string
  href: string
  variant?: 'race' | undefined
  megaMenuId?: MegaMenuId
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'The Machines', href: '/machines', megaMenuId: 'machines' },
  { label: 'Parts & Upgrades', href: '/parts', megaMenuId: 'parts' },
  { label: 'Race Department', href: '/race', variant: 'race', megaMenuId: 'race' },
  { label: 'Brands', href: '/brands', megaMenuId: 'brands' },
  { label: 'Build My Rig', href: '/build' },
  { label: 'Find My Machine', href: '/find' },
  { label: 'The Garage', href: '/garage' },
] as const

interface GlobalNavProps {
  cartCount?: number
}

export function GlobalNav({ cartCount = 0 }: GlobalNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuId | null>(null)
  const [expandedAccordions, setExpandedAccordions] = useState<Record<MegaMenuId, boolean>>({
    machines: false,
    parts: false,
    race: false,
    brands: false,
  })

  const openTimerRef = useRef<NodeJS.Timeout | null>(null)
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const navRef = useRef<HTMLElement | null>(null)

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cmd+K / Ctrl+K → navigate to /search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        router.push('/search')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router])

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false)
    setActiveMegaMenu(null)
    setExpandedAccordions({
      machines: false,
      parts: false,
      race: false,
      brands: false,
    })
    clearTimers()
  }, [pathname, clearTimers])

  const toggleAccordion = useCallback((id: MegaMenuId) => {
    setExpandedAccordions(prev => ({
      ...prev,
      [id]: !prev[id],
    }))
  }, [])

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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimers()
    }
  }, [clearTimers])

  const toggleMobile = useCallback(() => {
    setMobileOpen(prev => !prev)
  }, [])

  const handleTriggerMouseEnter = (id?: MegaMenuId) => {
    clearTimers()
    if (!id) return

    if (activeMegaMenu) {
      // Immediate switch if already open across tabs
      setActiveMegaMenu(id)
    } else {
      // 120ms intent delay before opening
      openTimerRef.current = setTimeout(() => {
        setActiveMegaMenu(id)
      }, 120)
    }
  }

  const handleTriggerMouseLeave = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    closeTimerRef.current = setTimeout(() => {
      setActiveMegaMenu(null)
    }, 150)
  }

  const handlePanelMouseEnter = () => {
    clearTimers()
  }

  const handlePanelMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setActiveMegaMenu(null)
    }, 150)
  }

  const handleTriggerKeyDown = (e: React.KeyboardEvent, id?: MegaMenuId) => {
    if (!id) return
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveMegaMenu(prev => (prev === id ? null : id))
    } else if (e.key === 'Escape') {
      setActiveMegaMenu(null)
    }
  }

  const handleNavBlur = (e: React.FocusEvent) => {
    // If focus moves completely outside nav container, close mega menu
    if (navRef.current && !navRef.current.contains(e.relatedTarget as Node)) {
      setActiveMegaMenu(null)
    }
  }

  return (
    <>
      {/* Skip navigation — first focusable element on every page */}
      <a href="#main-content" className={s.skipNav}>
        Skip to content
      </a>

      <nav
        ref={navRef}
        className={s.nav}
        data-scrolled={scrolled}
        data-megamenu-open={!!activeMegaMenu}
        data-mobile-open={mobileOpen}
        aria-label="Main navigation"
        onBlur={handleNavBlur}
      >
        {/* Logo */}
        <Link
          href="/"
          className={s.logo}
          aria-label="Avorria RC — Home"
          onClick={() => setActiveMegaMenu(null)}
        >
          <HaloLogo className={s.logoMark} />
          <span className={s.logoText}>Avorria RC</span>
        </Link>

        {/* Desktop navigation links */}
        <ul className={s.navLinks} role="list">
          {NAV_ITEMS.map((item) => {
            const hasMega = !!item.megaMenuId
            const isExpanded = hasMega && activeMegaMenu === item.megaMenuId

            return (
              <li
                key={item.href}
                onMouseEnter={() => handleTriggerMouseEnter(item.megaMenuId)}
                onMouseLeave={handleTriggerMouseLeave}
              >
                <Link
                  href={item.href}
                  className={
                    item.variant === 'race'
                      ? `${s.navLink} ${s.navLinkRace}`
                      : s.navLink
                  }
                  aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                  aria-expanded={hasMega ? isExpanded : undefined}
                  aria-haspopup={hasMega ? 'true' : undefined}
                  aria-controls={hasMega ? `megamenu-${item.megaMenuId}` : undefined}
                  onKeyDown={(e) => handleTriggerKeyDown(e, item.megaMenuId)}
                >
                  <span>{item.label}</span>
                  {hasMega && <ChevronDownIcon className={s.navChevron} />}
                </Link>
              </li>
            )
          })}
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
          <Link
            href="/cart"
            className={`${s.iconButton} ${s.cartIconButton}`}
            aria-label={cartCount > 0 ? `Shopping Cart (${cartCount} items)` : 'Shopping Cart'}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className={s.cartBadge} aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
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

        {/* Desktop Mega Menus (anchored under fixed navbar) */}
        {(['machines', 'parts', 'race', 'brands'] as const).map((key) => (
          <MegaMenu
            key={key}
            id={`megamenu-${key}`}
            data={MEGA_MENUS[key]}
            isOpen={activeMegaMenu === key}
            onClose={() => setActiveMegaMenu(null)}
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
          />
        ))}
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
        {NAV_ITEMS.map((item) => {
          const megaId = item.megaMenuId
          if (!megaId) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={s.mobileNavLink}
                aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            )
          }

          const megaData = MEGA_MENUS[megaId]
          const isExpanded = !!expandedAccordions[megaId]

          return (
            <div key={item.href} className={s.mobileAccordionItem}>
              <div className={s.mobileAccordionHeader}>
                <Link
                  href={item.href}
                  className={s.mobileAccordionLink}
                  aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  className={s.mobileAccordionToggle}
                  onClick={() => toggleAccordion(megaId)}
                  aria-expanded={isExpanded}
                  aria-controls={`mobile-sub-${megaId}`}
                  aria-label={`Toggle ${item.label} sub-links`}
                >
                  <ChevronDownIcon
                    className={
                      isExpanded
                        ? `${s.mobileChevron} ${s.mobileChevronExpanded}`
                        : s.mobileChevron
                    }
                  />
                </button>
              </div>

              <div
                id={`mobile-sub-${megaId}`}
                className={s.accordionContent}
                data-expanded={isExpanded}
                aria-hidden={!isExpanded}
              >
                <div className={s.accordionInner}>
                  {megaData.columns.map((col, cIdx) => (
                    <div key={cIdx} className={s.mobileSubGroup}>
                      <span className={s.mobileSubGroupTitle}>{col.title}</span>
                      {col.links.map((subLink, sIdx) => (
                        <Link
                          key={sIdx}
                          href={subLink.href}
                          className={s.mobileSubLink}
                          tabIndex={isExpanded ? 0 : -1}
                        >
                          <span>{subLink.label}</span>
                          {subLink.badge && (
                            <span className={s.mobileBadge}>{subLink.badge}</span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        <div style={{ marginTop: 'var(--space-5)' }}>
          <MarketSelector />
        </div>
      </div>
    </>
  )
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function ChevronDownIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      className={className}
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

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
