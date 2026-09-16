import React from 'react'

export interface AdminSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (val: string) => void
  width?: string | number
}

export function AdminSearch({
  placeholder = 'Search by keyword, SKU, or name...',
  width = 260,
  style,
  ...props
}: AdminSearchProps) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: typeof width === 'number' ? `${width}px` : width,
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          left: '9px',
          color: 'var(--admin-text-tertiary, #767A85)',
          pointerEvents: 'none',
        }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        style={{
          width: '100%',
          height: '30px',
          paddingLeft: '28px',
          paddingRight: '10px',
          backgroundColor: 'var(--admin-surface-well, #EFEFED)',
          border: '1px solid var(--admin-border, #E2E2DE)',
          borderRadius: 'var(--admin-radius-sm, 3px)',
          fontSize: '0.75rem',
          color: 'var(--admin-text-primary, #111317)',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'all 120ms ease',
          ...style,
        }}
        {...props}
      />
    </div>
  )
}
