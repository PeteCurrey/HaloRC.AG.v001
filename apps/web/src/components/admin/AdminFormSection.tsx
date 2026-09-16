import React from 'react'
import { AdminPanel } from './AdminPanel'

export interface AdminFormSectionProps {
  title: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  style?: React.CSSProperties
}

export function AdminFormSection({
  title,
  description,
  action,
  children,
  columns = 2,
  style,
}: AdminFormSectionProps) {
  return (
    <AdminPanel
      title={title}
      subtitle={description}
      action={action}
      padding="lg"
      style={{ marginBottom: '16px', ...style }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            columns === 1
              ? '1fr'
              : columns === 2
              ? 'repeat(auto-fit, minmax(280px, 1fr))'
              : columns === 3
              ? 'repeat(auto-fit, minmax(220px, 1fr))'
              : 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        {children}
      </div>
    </AdminPanel>
  )
}
