import React from 'react'

export interface AdminTableColumnObject {
  header: React.ReactNode
  key?: string | undefined
  width?: string | number | undefined
  align?: 'left' | 'center' | 'right' | undefined
}

export type AdminTableColumn = string | AdminTableColumnObject

export interface AdminTableProps {
  columns?: AdminTableColumn[] | undefined
  children?: React.ReactNode | undefined
  emptyMessage?: React.ReactNode | undefined
  style?: React.CSSProperties | undefined
  className?: string | undefined
}

export function AdminTable({
  columns,
  children,
  emptyMessage = 'No records found',
  style,
  className,
}: AdminTableProps) {
  return (
    <div
      className={className}
      style={{
        width: '100%',
        overflowX: 'auto',
        backgroundColor: 'var(--admin-surface, #FFFFFF)',
        border: '1px solid var(--admin-border, #E2E2DE)',
        borderRadius: 'var(--admin-radius-md, 5px)',
        boxShadow: 'var(--admin-shadow-card)',
        ...style,
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.75rem',
          textAlign: 'left',
          whiteSpace: 'nowrap',
        }}
      >
        {columns && (
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--admin-surface-subtle, #FAFAF9)',
                borderBottom: '1px solid var(--admin-border, #E2E2DE)',
              }}
            >
              {columns.map((col, idx) => {
                const header = typeof col === 'string' ? col : col.header
                const key = typeof col === 'string' ? idx : (col.key || idx)
                const align = typeof col === 'string' ? 'left' : (col.align || 'left')
                const width = typeof col === 'string' ? undefined : col.width

                return (
                  <th
                    key={key}
                    style={{
                      padding: '8px 14px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: 'var(--admin-text-tertiary, #767A85)',
                      textAlign: align,
                      width,
                    }}
                  >
                    {header}
                  </th>
                )
              })}
            </tr>
          </thead>
        )}
        <tbody>
          {children ? (
            children
          ) : (
            <tr>
              <td
                colSpan={columns?.length || 1}
                style={{
                  padding: '36px',
                  textAlign: 'center',
                  color: 'var(--admin-text-tertiary, #767A85)',
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export interface AdminTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children?: React.ReactNode | undefined
  cells?: React.ReactNode[] | undefined
  isHighlighted?: boolean | undefined
}

export function AdminTableRow({
  children,
  cells,
  isHighlighted,
  style,
  ...props
}: AdminTableRowProps) {
  return (
    <tr
      style={{
        borderBottom: '1px solid var(--admin-border-subtle, #EBEBE7)',
        backgroundColor: isHighlighted ? 'var(--admin-surface-well, #EFEFED)' : 'transparent',
        transition: 'background-color 80ms ease',
        ...style,
      }}
      {...props}
    >
      {cells
        ? cells.map((cell, idx) => (
            <td
              key={idx}
              style={{
                padding: '10px 14px',
                fontSize: '0.75rem',
                color: 'var(--admin-text-secondary, #494D55)',
                verticalAlign: 'middle',
              }}
            >
              {cell}
            </td>
          ))
        : children}
    </tr>
  )
}
