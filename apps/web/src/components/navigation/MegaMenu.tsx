'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import s from './MegaMenu.module.css'
import type { MegaMenuData } from '@/lib/navigation-data'

interface MegaMenuProps {
  id: string
  data: MegaMenuData
  isOpen: boolean
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function MegaMenu({
  id,
  data,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    }
  }

  const getBadgeClass = (badge?: string) => {
    if (!badge) return s.badge
    const b = badge.toUpperCase()
    if (b.includes('HALO') || b.includes('COMPETITION')) {
      return `${s.badge} ${s.badgeHalo}`
    }
    if (b.includes('VERIFIED') || b.includes('AUTHORISED') || b.includes('DEALER')) {
      return `${s.badge} ${s.badgeVerified}`
    }
    return s.badge
  }

  return (
    <div
      id={id}
      className={s.megaPanel}
      data-open={isOpen}
      role="region"
      aria-label={`${data.navLabel} mega menu`}
      aria-hidden={!isOpen}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <div className={`${s.inner} ${!data.spotlight ? s.innerNoSpotlight : ''}`}>
        {/* Columns of links */}
        {data.columns.map((col, idx) => (
          <div key={idx} className={s.column}>
            <h3 className={s.columnTitle}>{col.title}</h3>
            <ul className={s.linksList} role="list">
              {col.links.map((link, lIdx) => (
                <li key={lIdx} className={s.linkItem}>
                  <Link
                    href={link.href}
                    className={s.linkAnchor}
                    onClick={onClose}
                    tabIndex={isOpen ? 0 : -1}
                  >
                    <div className={s.linkHeader}>
                      <span className={s.linkLabel}>{link.label}</span>
                      {link.badge && (
                        <span className={getBadgeClass(link.badge)}>
                          {link.badge}
                        </span>
                      )}
                    </div>
                    {link.sub && <span className={s.linkSub}>{link.sub}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Optional Spotlight Panel */}
        {data.spotlight && (
          <aside className={s.spotlightCard} aria-label={`${data.navLabel} spotlight`}>
            <div className={s.spotlightTagRow}>
              <span className={s.spotlightTag}>{data.spotlight.tag}</span>
              {data.spotlight.badge && (
                <span className={getBadgeClass(data.spotlight.badge)}>
                  {data.spotlight.badge}
                </span>
              )}
            </div>

            {data.spotlight.imageSrc && (
              <div className={s.spotlightImageWrap}>
                <Image
                  src={data.spotlight.imageSrc}
                  alt={data.spotlight.imageAlt || data.spotlight.title}
                  fill
                  sizes="340px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}

            <h4 className={s.spotlightTitle}>{data.spotlight.title}</h4>
            <p className={s.spotlightDescription}>{data.spotlight.description}</p>

            <Link
              href={data.spotlight.href}
              className={s.spotlightLink}
              onClick={onClose}
              tabIndex={isOpen ? 0 : -1}
            >
              <span>{data.spotlight.linkText}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </aside>
        )}
      </div>
    </div>
  )
}
