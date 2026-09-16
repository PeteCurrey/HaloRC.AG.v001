import Link from 'next/link'
import {
  getProcurementTasks,
  getSuppliers,
  SEED_BRANDS,
} from '@halo-rc/db'
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
    { title: 'Open', tasks: openTasks, color: 'var(--colour-ash)' },
    { title: 'In Progress', tasks: inProgressTasks, color: '#3b82f6' },
    { title: 'Waiting On Supplier', tasks: waitingTasks, color: '#f59e0b' },
    { title: 'Completed', tasks: completedTasks, color: 'var(--colour-halo)' },
  ]

  return (
    <div>
      <ProcurementNav currentTab="tasks" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Procurement Operations
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Procurement Tasks &amp; Action Board
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Operational tasks across supplier applications, trade references, credit facilities, terms review, and catalogue mapping.
          </p>
        </div>

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-sm)' }}>
          {tasks.length} Total Tasks
        </span>
      </div>

      {/* Board Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
        {columns.map((col) => (
          <div key={col.title} style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--colour-steel)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', color: 'var(--colour-white)', fontWeight: 600 }}>
                  {col.title}
                </span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                {col.tasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {col.tasks.map((task) => (
                <div key={task.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                      {task.title}
                    </span>
                    <span style={{ fontSize: '9px', padding: '1px 5px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--colour-carbon)', color: task.priority === 'HIGH' || task.priority === 'URGENT' ? 'var(--colour-race)' : 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                      {task.priority}
                    </span>
                  </div>

                  {task.supplier && (
                    <Link
                      href={`/admin/procurement/suppliers/${task.supplier.id}`}
                      style={{ fontSize: '11px', color: 'var(--colour-halo)', textDecoration: 'none', display: 'block', marginTop: 2 }}
                    >
                      {task.supplier.name} &rarr;
                    </Link>
                  )}

                  {task.description && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--colour-ash)', lineHeight: 'var(--leading-normal)' }}>
                      {task.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--colour-carbon)', fontSize: '10px', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
                    <span>Due: {task.dueDate ?? 'Unset'}</span>
                    <span>{task.assignedTo ?? 'Unassigned'}</span>
                  </div>
                </div>
              ))}

              {col.tasks.length === 0 && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-slate)', fontStyle: 'italic', padding: 'var(--space-4) 0', textAlign: 'center' }}>
                  No tasks in this stage
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
