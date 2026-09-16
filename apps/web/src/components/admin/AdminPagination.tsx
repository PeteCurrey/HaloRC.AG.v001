import React from 'react'
import Link from 'next/link'
import { AdminAction } from './AdminAction'

export interface AdminPaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  createPageUrl?: (page: number) => string
  onPageChange?: (page: number) => void
  style?: React.CSSProperties
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  createPageUrl,
  onPageChange,
  style,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null

  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: 'var(--admin-surface, #FFFFFF)',
        border: '1px solid var(--admin-border, #E2E2DE)',
        borderRadius: 'var(--admin-radius-md, 5px)',
        marginTop: '12px',
        boxShadow: 'var(--admin-shadow-sm)',
        fontSize: '0.75rem',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.6875rem',
          color: 'var(--admin-text-tertiary, #767A85)',
        }}
      >
        Page <strong style={{ color: 'var(--admin-text-primary, #111317)' }}>{currentPage}</strong> of{' '}
        <strong style={{ color: 'var(--admin-text-primary, #111317)' }}>{totalPages}</strong>
        {totalItems !== undefined && ` · ${totalItems} total records`}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {createPageUrl ? (
          <>
            <AdminAction
              variant="secondary"
              size="sm"
              href={hasPrev ? createPageUrl(currentPage - 1) : undefined}
              disabled={!hasPrev}
            >
              &larr; Previous
            </AdminAction>
            <AdminAction
              variant="secondary"
              size="sm"
              href={hasNext ? createPageUrl(currentPage + 1) : undefined}
              disabled={!hasNext}
            >
              Next &rarr;
            </AdminAction>
          </>
        ) : (
          <>
            <AdminAction
              variant="secondary"
              size="sm"
              onClick={() => hasPrev && onPageChange?.(currentPage - 1)}
              disabled={!hasPrev}
            >
              &larr; Previous
            </AdminAction>
            <AdminAction
              variant="secondary"
              size="sm"
              onClick={() => hasNext && onPageChange?.(currentPage + 1)}
              disabled={!hasNext}
            >
              Next &rarr;
            </AdminAction>
          </>
        )}
      </div>
    </div>
  )
}
