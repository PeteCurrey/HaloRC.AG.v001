import Link from 'next/link'
import { getAdminLeads, getAdminLeadStats } from '@halo-rc/db'
import type { LeadStatus, LeadPriority } from '@halo-rc/types'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    status?: string
    priority?: string
    search?: string
    page?: string
  }>
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const status = params.status as LeadStatus | undefined
  const priority = params.priority as LeadPriority | undefined
  const search = params.search || ''

  const [leadsData, stats] = await Promise.all([
    getAdminLeads({ status, priority, search: search || undefined }, { page, perPage: 25 }),
    getAdminLeadStats(),
  ])

  const { items, total } = leadsData
  const totalPages = Math.ceil(total / 25)

  const statusColor: Record<string, string> = {
    NEW: 'var(--colour-halo)',
    CONTACTED: 'var(--colour-amber)',
    QUALIFIED: 'var(--colour-verified)',
    PROPOSAL_SENT: 'var(--colour-white)',
    WON: 'var(--colour-verified)',
    LOST: 'var(--colour-smoke)',
    ARCHIVED: 'var(--colour-smoke)',
  }

  const priorityColor: Record<string, string> = {
    URGENT: '#ef4444',
    HIGH: 'var(--colour-amber)',
    NORMAL: 'var(--colour-ash)',
    LOW: 'var(--colour-smoke)',
  }

  return (
    <div style={{ maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', letterSpacing: '0.12em', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
              CRM &amp; Commercial Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            Enquiries &amp; Customer Leads
          </h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: '2px' }}>
            High-intent customer consultations, technical inquiries, and custom build requests.
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Total Enquiries</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-white)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.totalLeads}</p>
        </div>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Awaiting Action</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-halo)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.newLeads}</p>
        </div>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Qualified Consultations</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--colour-verified)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.qualifiedLeads}</p>
        </div>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>Urgent Action Required</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: stats.urgentLeads > 0 ? '#ef4444' : 'var(--colour-ash)', marginTop: 'var(--space-1)', fontFamily: 'var(--font-mono)' }}>{stats.urgentLeads}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name, email, company, or message..."
            style={{
              flex: '1 1 240px',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          />

          <select
            name="status"
            defaultValue={status || ''}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            name="priority"
            defaultValue={priority || ''}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>

          <button
            type="submit"
            style={{
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--colour-graphite)',
              border: '1px solid var(--colour-halo)',
              color: 'var(--colour-halo)',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}
          >
            Filter
          </button>

          {(search || status || priority) && (
            <Link
              href="/admin/leads"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                color: 'var(--colour-ash)',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
              }}
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-graphite)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Enquirer / Contact</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Company / Channel</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Product Interest</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Priority</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Status</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600 }}>Received</th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)' }}>
                  No enquiries in this view.
                </td>
              </tr>
            ) : (
              items.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link href={`/admin/leads/${lead.id}`} style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none' }}>
                      {lead.name}
                    </Link>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontSize: '0.6875rem', marginTop: '2px' }}>
                      {lead.email} {lead.phone ? `• ${lead.phone}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-off-white)' }}>
                    <div>{lead.company || 'Private Client'}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-smoke)' }}>{lead.source}</div>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--colour-ash)' }}>
                    {lead.productInterestName ? (
                      <Link href={`/admin/products/${lead.productInterestId}`} style={{ color: 'var(--colour-halo)', textDecoration: 'none' }}>
                        {lead.productInterestName}
                      </Link>
                    ) : (
                      'General Consultation'
                    )}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: priorityColor[lead.priority] || 'var(--colour-ash)', fontWeight: 600 }}>
                      {lead.priority}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.625rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: 'var(--colour-graphite)',
                      color: statusColor[lead.status] || 'var(--colour-smoke)',
                      border: `1px solid ${statusColor[lead.status] || 'var(--colour-steel)'}`,
                    }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)', fontSize: '0.6875rem' }}>
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        backgroundColor: 'var(--colour-graphite)',
                        color: 'var(--colour-off-white)',
                        borderRadius: 'var(--radius-xs)',
                        textDecoration: 'none',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      Manage &rarr;
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--colour-steel)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {page > 1 && (
                <Link
                  href={`/admin/leads?page=${page - 1}&search=${search}&status=${status || ''}&priority=${priority || ''}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)', textDecoration: 'none', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}
                >
                  &larr; Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/leads?page=${page + 1}&search=${search}&status=${status || ''}&priority=${priority || ''}`}
                  style={{ padding: 'var(--space-1) var(--space-3)', backgroundColor: 'var(--colour-graphite)', color: 'var(--colour-off-white)', textDecoration: 'none', borderRadius: 'var(--radius-xs)', fontSize: 'var(--text-xs)' }}
                >
                  Next &rarr;
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
