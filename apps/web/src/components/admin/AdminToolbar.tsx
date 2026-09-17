import React from 'react'

export interface AdminToolbarProps {
  children: React.ReactNode
  rightActions?: React.ReactNode | undefined
  actions?: React.ReactNode | undefined
  style?: React.CSSProperties | undefined
  className?: string | undefined
}

export function AdminToolbar({
  children,
  rightActions,
  actions,
  style,
  className,
}: AdminToolbarProps) {
  const actualRightActions = rightActions ?? actions

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '10px 14px',
        backgroundColor: 'var(--admin-surface, #FFFFFF)',
        border: '1px solid var(--admin-border, #E2E2DE)',
        borderRadius: 'var(--admin-radius-md, 5px)',
        marginBottom: '14px',
        boxShadow: 'var(--admin-shadow-sm)',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          flex: '1 1 auto',
        }}
      >
        {children}
      </div>

      {actualRightActions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {actualRightActions}
        </div>
      )}
    </div>
  )
}
