import React from 'react'

export interface AdminTimelineItem {
  id: string | number
  timestamp: string | Date
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  author?: string
  statusDot?: string
}

export interface AdminTimelineProps {
  items: AdminTimelineItem[]
  style?: React.CSSProperties
}

export function AdminTimeline({ items, style }: AdminTimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-tertiary, #767A85)', fontSize: '0.75rem' }}>
        No timeline events recorded.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
      {items.map((item, idx) => {
        const timeStr =
          typeof item.timestamp === 'string'
            ? item.timestamp
            : item.timestamp.toLocaleString('en-GB', {
                dateStyle: 'short',
                timeStyle: 'short',
              })

        return (
          <div
            key={item.id || idx}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              position: 'relative',
            }}
          >
            {/* Dot */}
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: item.statusDot || 'var(--admin-text-tertiary, #767A85)',
                marginTop: '6px',
                flexShrink: 0,
              }}
            />

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
                  {item.title}
                </span>
                {item.badge}
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.6875rem',
                    color: 'var(--admin-text-tertiary, #767A85)',
                    marginLeft: 'auto',
                  }}
                >
                  {timeStr}
                </span>
              </div>

              {item.description && (
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary, #494D55)', marginTop: '2px', lineHeight: 1.4 }}>
                  {item.description}
                </div>
              )}

              {item.author && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '2px' }}>
                  By: {item.author}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface AdminAuditEntry {
  id: string
  action: string
  timestamp: string | Date
  performedBy: string
  entityType?: string
  entityId?: string
  oldValue?: string | null
  newValue?: string | null
}

export interface AdminAuditLogProps {
  entries: AdminAuditEntry[]
  style?: React.CSSProperties
}

export function AdminAuditLog({ entries, style }: AdminAuditLogProps) {
  if (!entries || entries.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--admin-text-tertiary, #767A85)', fontSize: '0.75rem' }}>
        No audit log entries recorded.
      </div>
    )
  }

  return (
    <div
      style={{
        border: '1px solid var(--admin-border, #E2E2DE)',
        borderRadius: 'var(--admin-radius-md, 5px)',
        overflow: 'hidden',
        fontSize: '0.75rem',
        backgroundColor: 'var(--admin-surface, #FFFFFF)',
        ...style,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--admin-surface-subtle, #FAFAF9)', borderBottom: '1px solid var(--admin-border, #E2E2DE)' }}>
            <th style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', fontWeight: 600 }}>Timestamp</th>
            <th style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', fontWeight: 600 }}>Action</th>
            <th style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', fontWeight: 600 }}>Operator</th>
            <th style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', fontWeight: 600 }}>Changes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const timeStr =
              typeof e.timestamp === 'string'
                ? e.timestamp
                : e.timestamp.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })

            return (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--admin-border-subtle, #EBEBE7)' }}>
                <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                  {timeStr}
                </td>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
                  {e.action}
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--admin-text-secondary, #494D55)' }}>
                  {e.performedBy}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                  {e.oldValue && e.newValue ? (
                    <span>
                      <span style={{ textDecoration: 'line-through', color: '#9F0015' }}>{e.oldValue}</span> &rarr;{' '}
                      <span style={{ color: '#145A2B' }}>{e.newValue}</span>
                    </span>
                  ) : (
                    e.newValue || e.oldValue || '—'
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
