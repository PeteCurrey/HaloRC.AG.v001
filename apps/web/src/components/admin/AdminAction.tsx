import React from 'react'
import Link from 'next/link'

export type AdminActionVariant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'circular' | 'ghost'
export type AdminActionSize = 'sm' | 'md' | 'lg'

export interface AdminActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminActionVariant
  size?: AdminActionSize
  href?: string | undefined
  target?: string | undefined
  icon?: React.ReactNode
  children?: React.ReactNode
  title?: string
}

export function AdminAction({
  variant = 'secondary',
  size = 'sm',
  href,
  target,
  icon,
  children,
  className,
  style,
  title,
  ...props
}: AdminActionProps) {
  const isCircular = variant === 'circular'

  // Dimensions based on size
  const heightMap = { sm: 30, md: 36, lg: 42 }
  const paddingMap = {
    sm: isCircular ? '0' : '0 10px',
    md: isCircular ? '0' : '0 14px',
    lg: isCircular ? '0' : '0 18px',
  }
  const fontSizeMap = { sm: '0.75rem', md: '0.8125rem', lg: '0.875rem' }

  // Variant styling
  const variantStyles: Record<AdminActionVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--admin-text-primary, #111317)',
      color: '#FFFFFF',
      border: '1px solid var(--admin-text-primary, #111317)',
      fontWeight: 500,
    },
    secondary: {
      backgroundColor: 'var(--admin-surface, #FFFFFF)',
      color: 'var(--admin-text-primary, #111317)',
      border: '1px solid var(--admin-border, #E2E2DE)',
      fontWeight: 500,
      boxShadow: 'var(--admin-shadow-sm)',
    },
    subtle: {
      backgroundColor: 'var(--admin-surface-well, #EFEFED)',
      color: 'var(--admin-text-primary, #111317)',
      border: '1px solid transparent',
      fontWeight: 500,
    },
    danger: {
      backgroundColor: 'rgba(200, 0, 26, 0.08)',
      color: 'var(--admin-dot-alert, #C8001A)',
      border: '1px solid rgba(200, 0, 26, 0.25)',
      fontWeight: 500,
    },
    circular: {
      backgroundColor: 'var(--admin-surface, #FFFFFF)',
      color: 'var(--admin-text-secondary, #494D55)',
      border: '1px solid var(--admin-border, #E2E2DE)',
      borderRadius: '50%',
      width: heightMap[size],
      height: heightMap[size],
      minWidth: heightMap[size],
      padding: 0,
      boxShadow: 'var(--admin-shadow-sm)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--admin-text-secondary, #494D55)',
      border: '1px solid transparent',
    },
  }

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: heightMap[size],
    padding: paddingMap[size],
    borderRadius: isCircular ? '50%' : 'var(--admin-radius-sm, 3px)',
    fontSize: fontSizeMap[size],
    fontFamily: 'var(--font-sans, system-ui)',
    lineHeight: 1,
    textDecoration: 'none',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.5 : 1,
    transition: 'all 120ms ease',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...variantStyles[variant],
    ...style,
  }

  if (href && !props.disabled) {
    return (
      <Link href={href} target={target} style={baseStyle} title={title}>
        {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
        {children}
      </Link>
    )
  }

  return (
    <button style={baseStyle} title={title} {...props}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  )
}
