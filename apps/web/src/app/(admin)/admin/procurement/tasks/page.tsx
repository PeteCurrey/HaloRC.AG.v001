import Link from 'next/link'
import {
  getProcurementTasks,
  getSuppliers,
  SEED_BRANDS,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminStatus,
} from '@/components/admin'
import { ProcurementNav } from '../ProcurementNav'

export default async function ProcurementTasksBoardPage() {
  const [tasks, suppliers] = await Promise.all([
    getProcurementTasks(),
    getSuppliers(),
  ])

  const tasksWithDetails = tasks.map((t) => {
    const supplier = suppliers.find((s) => s.id === t.supplierId)
    const brand = t.brandId ? SEED_BRANDS.find((b) => b.id === t.brandId) : null
    return {
      ...t,
      supplier,
      brand,
    }
  })

  const openTasks = tasksWithDetails.filter((t) => t.status === 'OPEN')
  const inProgressTasks = tasksWithDetails.filter((t) => t.status === 'IN_PROGRESS')
  const waitingTasks = tasksWithDetails.filter((t) => t.status === 'WAITING')
  const completedTasks = tasksWithDetails.filter((t) => t.status === 'COMPLETED')

  const columns = [
    { title: 'Open', tasks: openTasks, color: '#767A85' },
    { title: 'In Progress', tasks: inProgressTasks, color: '#3b82f6' },
    { title: 'Waiting On Supplier', tasks: waitingTasks, color: '#f59e0b' },
    { title: 'Completed', tasks: completedTasks, color: '#1A6E34' },
  ]

  return (
    <>
      <AdminPageHeader
        category="Procurement Operations"
        title="Procurement Tasks & Action Board"
        description="Operational tasks across supplier applications, trade references, credit facilities, terms review, and catalogue mapping."
        status={
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', backgroundColor: '#EFEFED', padding: '2px 8px', borderRadius: 3 }}>
            {tasks.length} Total Tasks
          </span>
        }
      />

      <ProcurementNav currentTab="tasks" />

      {/* Board Columns */}
      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {columns.map((col) => (
            <AdminPanel
              key={col.title}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
                  <span>{col.title}</span>
                </div>
              }
              badge={
                <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85' }}>
                  {col.tasks.length}
                </span>
              }
              padding="sm"
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#FAFAF9',
                      borderRadius: 4,
                      border: '1px solid #E2E2DE',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111317' }}>
                        {task.title}
                      </span>
                      <AdminStatus
                        status={task.priority === 'HIGH' || task.priority === 'URGENT' ? 'alert' : 'neutral'}
                        label={task.priority}
                      />
                    </div>

                    {task.supplier && (
                      <Link
                        href={`/admin/procurement/suppliers/${task.supplier.id}`}
                        style={{ fontSize: '0.6875rem', color: '#B8935A', textDecoration: 'none', display: 'block', marginTop: 2 }}
                      >
                        {task.supplier.name} →
                      </Link>
                    )}

                    {task.description && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.6875rem', color: '#494D55', lineHeight: 'var(--leading-normal)' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 6, borderTop: '1px solid #E2E2DE', fontSize: '0.625rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)' }}>
                      <span>Due: {task.dueDate ?? 'Unset'}</span>
                      <span>{task.assignedTo ?? 'Unassigned'}</span>
                    </div>
                  </div>
                ))}

                {col.tasks.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', padding: '16px 0', textAlign: 'center', display: 'block' }}>
                    No tasks in this stage
                  </span>
                )}
              </div>
            </AdminPanel>
          ))}
        </div>
      </AdminSection>
    </>
  )
}
