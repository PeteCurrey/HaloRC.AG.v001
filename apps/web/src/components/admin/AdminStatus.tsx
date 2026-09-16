import React from 'react'

export type AdminStatusType =
  | 'verified'
  | 'active'
  | 'published'
  | 'trading'
  | 'approved'
  | 'open'
  | 'draft'
  | 'review'
  | 'waiting'
  | 'pending'
  | 'contacted'
  | 'target'
  | 'warning'
  | 'alert'
  | 'danger'
  | 'rejected'
  | 'closed'
  | 'archived'
  | 'neutral'
  | 'info'

interface StatusConfig {
  dotColor: string
  bg: string
  color: string
  border: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  verified: {
    dotColor: '#1A6E34',
    bg: 'rgba(26, 110, 52, 0.08)',
    color: '#145A2B',
    border: 'rgba(26, 110, 52, 0.22)',
  },
  active: {
    dotColor: '#1A6E34',
    bg: 'rgba(26, 110, 52, 0.08)',
    color: '#145A2B',
    border: 'rgba(26, 110, 52, 0.22)',
  },
  published: {
    dotColor: '#1A6E34',
    bg: 'rgba(26, 110, 52, 0.08)',
    color: '#145A2B',
    border: 'rgba(26, 110, 52, 0.22)',
  },
  trading: {
    dotColor: '#1A6E34',
    bg: 'rgba(26, 110, 52, 0.08)',
    color: '#145A2B',
    border: 'rgba(26, 110, 52, 0.22)',
  },
  approved: {
    dotColor: '#1A6E34',
    bg: 'rgba(26, 110, 52, 0.08)',
    color: '#145A2B',
    border: 'rgba(26, 110, 52, 0.22)',
  },
  open: {
    dotColor: '#1A6E34',
    bg: 'rgba(26, 110, 52, 0.08)',
    color: '#145A2B',
    border: 'rgba(26, 110, 52, 0.22)',
  },
  review: {
    dotColor: '#B86818',
    bg: 'rgba(184, 104, 24, 0.08)',
    color: '#945312',
    border: 'rgba(184, 104, 24, 0.22)',
  },
  waiting: {
    dotColor: '#B86818',
    bg: 'rgba(184, 104, 24, 0.08)',
    color: '#945312',
    border: 'rgba(184, 104, 24, 0.22)',
  },
  pending: {
    dotColor: '#B86818',
    bg: 'rgba(184, 104, 24, 0.08)',
    color: '#945312',
    border: 'rgba(184, 104, 24, 0.22)',
  },
  contacted: {
    dotColor: '#B86818',
    bg: 'rgba(184, 104, 24, 0.08)',
    color: '#945312',
    border: 'rgba(184, 104, 24, 0.22)',
  },
  warning: {
    dotColor: '#B86818',
    bg: 'rgba(184, 104, 24, 0.08)',
    color: '#945312',
    border: 'rgba(184, 104, 24, 0.22)',
  },
  alert: {
    dotColor: '#C8001A',
    bg: 'rgba(200, 0, 26, 0.08)',
    color: '#9F0015',
    border: 'rgba(200, 0, 26, 0.22)',
  },
  danger: {
    dotColor: '#C8001A',
    bg: 'rgba(200, 0, 26, 0.08)',
    color: '#9F0015',
    border: 'rgba(200, 0, 26, 0.22)',
  },
  rejected: {
    dotColor: '#C8001A',
    bg: 'rgba(200, 0, 26, 0.08)',
    color: '#9F0015',
    border: 'rgba(200, 0, 26, 0.22)',
  },
  closed: {
    dotColor: '#767A85',
    bg: 'rgba(118, 122, 133, 0.08)',
    color: '#494D55',
    border: 'rgba(118, 122, 133, 0.2)',
  },
  draft: {
    dotColor: '#767A85',
    bg: 'rgba(118, 122, 133, 0.08)',
    color: '#494D55',
    border: 'rgba(118, 122, 133, 0.2)',
  },
  archived: {
    dotColor: '#767A85',
    bg: 'rgba(118, 122, 133, 0.08)',
    color: '#494D55',
    border: 'rgba(118, 122, 133, 0.2)',
  },
  target: {
    dotColor: '#4A5568',
    bg: 'rgba(74, 85, 104, 0.08)',
    color: '#2D3748',
    border: 'rgba(74, 85, 104, 0.2)',
  },
  info: {
    dotColor: '#2B6CB0',
    bg: 'rgba(43, 108, 176, 0.08)',
    color: '#205081',
    border: 'rgba(43, 108, 176, 0.22)',
  },
  neutral: {
    dotColor: '#8A8E98',
    bg: 'rgba(138, 142, 152, 0.08)',
    color: '#494D55',
    border: 'rgba(138, 142, 152, 0.2)',
  },
}

export interface AdminStatusProps {
  status?: string
  label?: string
  showDot?: boolean
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}

const DEFAULT_CONFIG: StatusConfig = {
  dotColor: '#8A8E98',
  bg: 'rgba(138, 142, 152, 0.08)',
  color: '#494D55',
  border: 'rgba(138, 142, 152, 0.2)',
}

export function AdminStatus({
  status = 'neutral',
  label,
  showDot = true,
  size = 'sm',
  style,
}: AdminStatusProps) {
  const normalizedKey = status.toLowerCase().replace(/[\s_-]+/g, '')
  const config =
    STATUS_MAP[normalizedKey] ||
    STATUS_MAP[status.toLowerCase()] ||
    STATUS_MAP.neutral ||
    DEFAULT_CONFIG

  const displayLabel = label || status.replace(/_/g, ' ')

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '2px 7px' : '3px 9px',
        borderRadius: 'var(--admin-radius-sm, 3px)',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        fontFamily: 'var(--font-mono, monospace)',
        fontWeight: 500,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        lineHeight: 1.2,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {showDot && (
        <span
          style={{
            width: size === 'sm' ? 5 : 6,
            height: size === 'sm' ? 5 : 6,
            borderRadius: '50%',
            backgroundColor: config.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {displayLabel}
    </span>
  )
}
