import React from 'react'

export interface AdminFilterOption {
  value: string
  label: string
}

export interface AdminFilterProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options?: AdminFilterOption[]
  children?: React.ReactNode
}

export function AdminFilter({
  label,
  options,
  children,
  style,
  ...props
}: AdminFilterProps) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      {label && (
        <span
          style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--admin-text-tertiary, #767A85)',
            textTransform: 'uppercase',
          }}
        >
          {label}:
        </span>
      )}
      <select
        style={{
          height: '30px',
          padding: '0 8px',
          backgroundColor: 'var(--admin-surface, #FFFFFF)',
          border: '1px solid var(--admin-border, #E2E2DE)',
          borderRadius: 'var(--admin-radius-sm, 3px)',
          fontSize: '0.75rem',
          color: 'var(--admin-text-primary, #111317)',
          fontFamily: 'inherit',
          outline: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--admin-shadow-sm)',
          ...style,
        }}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    </div>
  )
}
