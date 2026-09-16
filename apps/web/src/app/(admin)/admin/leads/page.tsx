import Link from 'next/link'
import { getAdminLeads, getAdminLeadStats } from '@halo-rc/db'
import type { LeadStatus, LeadPriority } from '@halo-rc/types'
import {
  AdminPageHeader,
  AdminPanel,
  AdminToolbar,
  AdminSearch,
  AdminFilter,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminPagination,
  AdminAction,
} from '@/components/admin'

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

  const columns = [
    { header: 'Enquirer / Contact', width: '24%' },
    { header: 'Company / Channel', width: '18%' },
    { header: 'Product Interest', width: '20%' },
    { header: 'Priority', width: '10%' },
    { header: 'Status', width: '12%' },
    { header: 'Received', width: '10%' },
    { header: 'Actions', width: '6%', align: 'right' as const },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        category="CRM & Commercial Pipeline"
        title="Enquiries & Customer Leads"
        description="High-intent customer consultations, technical inquiries, and custom build requests."
      />

      {/* KPI Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Total Enquiries
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.totalLeads}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Awaiting Action
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.newLeads > 0 ? 'var(--admin-accent, #B8935A)' : 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.newLeads}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Qualified Consultations
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--admin-dot-online, #1A6E34)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.qualifiedLeads}
          </div>
        </AdminPanel>

        <AdminPanel padding="sm">
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase' }}>
            Urgent Attention
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: stats.urgentLeads > 0 ? 'var(--admin-dot-alert, #C8001A)' : 'var(--admin-text-primary, #111317)', fontFamily: 'var(--font-mono, monospace)', marginTop: '2px' }}>
            {stats.urgentLeads}
          </div>
        </AdminPanel>
      </div>

      {/* Filter Bar */}
      <form method="get">
        <AdminToolbar
          rightActions={
            (search || status || priority) && (
              <AdminAction variant="ghost" size="sm" href="/admin/leads">
                Clear
              </AdminAction>
            )
          }
        >
          <AdminSearch
            name="search"
            defaultValue={search}
            placeholder="Search by name, email, company, or message..."
            width={280}
          />

          <AdminFilter name="status" defaultValue={status || ''}>
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="PROPOSAL_SENT">Proposal Sent</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
            <option value="ARCHIVED">Archived</option>
          </AdminFilter>

          <AdminFilter name="priority" defaultValue={priority || ''}>
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </AdminFilter>

          <button
            type="submit"
            style={{
              height: '30px',
              padding: '0 12px',
              backgroundColor: 'var(--admin-surface, #FFFFFF)',
              border: '1px solid var(--admin-border, #E2E2DE)',
              borderRadius: 'var(--admin-radius-sm, 3px)',
              color: 'var(--admin-text-primary, #111317)',
              fontSize: '0.75rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Filter
          </button>
        </AdminToolbar>
      </form>

      {/* Table */}
      <AdminTable columns={columns} emptyMessage="No enquiries in this view.">
        {items.map((lead) => (
          <AdminTableRow key={lead.id}>
            <td style={{ padding: '10px 14px' }}>
              <Link
                href={`/admin/leads/${lead.id}`}
                style={{
                  color: 'var(--admin-text-primary, #111317)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                }}
              >
                {lead.name}
              </Link>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--admin-text-tertiary, #767A85)',
                  fontSize: '0.6875rem',
                  marginTop: '2px',
                }}
              >
                {lead.email} {lead.phone ? `· ${lead.phone}` : ''}
              </div>
            </td>

            <td style={{ padding: '10px 14px' }}>
              <div style={{ color: 'var(--admin-text-primary, #111317)', fontWeight: 500 }}>
                {lead.company || 'Private Client'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                {lead.source}
              </div>
            </td>

            <td style={{ padding: '10px 14px', color: 'var(--admin-text-secondary, #494D55)' }}>
              {lead.productInterestName ? (
                <Link
                  href={`/admin/products/${lead.productInterestId}`}
                  style={{ color: 'var(--admin-accent, #B8935A)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {lead.productInterestName}
                </Link>
              ) : (
                'General Consultation'
              )}
            </td>

            <td style={{ padding: '10px 14px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color:
                    lead.priority === 'URGENT'
                      ? 'var(--admin-dot-alert, #C8001A)'
                      : lead.priority === 'HIGH'
                      ? 'var(--admin-dot-warning, #B86818)'
                      : 'var(--admin-text-tertiary, #767A85)',
                }}
              >
                {lead.priority}
              </span>
            </td>

            <td style={{ padding: '10px 14px' }}>
              <AdminStatus
                status={lead.status.toLowerCase()}
                label={lead.status.replace('_', ' ')}
              />
            </td>

            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-tertiary, #767A85)', fontSize: '0.6875rem' }}>
              {new Date(lead.createdAt).toLocaleDateString('en-GB')}
            </td>

            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
              <AdminAction
                variant="subtle"
                size="sm"
                href={`/admin/leads/${lead.id}`}
              >
                Manage &rarr;
              </AdminAction>
            </td>
          </AdminTableRow>
        ))}
      </AdminTable>

      {/* Pagination */}
      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={total}
        createPageUrl={(p) =>
          `/admin/leads?page=${p}&search=${search}&status=${status || ''}&priority=${priority || ''}`
        }
      />
    </div>
  )
}
