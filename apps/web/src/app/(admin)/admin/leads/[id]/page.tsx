import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminLead } from '@halo-rc/db'
import { updateLeadStatusAction, addLeadNoteAction } from '@/actions/admin'
import type { LeadStatus } from '@halo-rc/types'
import {
  AdminPageHeader,
  AdminPanel,
  AdminAction,
  AdminStatus,
  AdminField,
} from '@/components/admin'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const { id } = await params
  const lead = await getAdminLead(id)

  if (!lead) notFound()

  async function handleStatusChange(formData: FormData) {
    'use server'
    const status = formData.get('status') as LeadStatus
    const note = (formData.get('note') as string) || undefined
    await updateLeadStatusAction(id, status, note)
  }

  async function handleAddNote(formData: FormData) {
    'use server'
    const note = formData.get('note') as string
    if (note && note.trim()) {
      await addLeadNoteAction(id, note.trim())
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '32px',
    padding: '0 10px',
    backgroundColor: 'var(--admin-surface, #FFFFFF)',
    border: '1px solid var(--admin-border, #E2E2DE)',
    borderRadius: 'var(--admin-radius-sm, 3px)',
    color: 'var(--admin-text-primary, #111317)',
    fontSize: '0.8125rem',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Leads & Enquiries', href: '/admin/leads' },
          { label: 'Enquiries', href: '/admin/leads' },
          { label: lead.name },
        ]}
        title={lead.name}
        description={`${lead.email} ${lead.phone ? `· ${lead.phone}` : ''} ${lead.company ? `· ${lead.company}` : ''}`}
        status={
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <AdminStatus status={lead.status.toLowerCase()} label={lead.status} />
            <span
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.6875rem',
                padding: '2px 6px',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                border: '1px solid var(--admin-border, #E2E2DE)',
                color:
                  lead.priority === 'URGENT'
                    ? 'var(--admin-dot-alert, #C8001A)'
                    : lead.priority === 'HIGH'
                    ? 'var(--admin-dot-warning, #B86818)'
                    : 'var(--admin-text-secondary, #494D55)',
                fontWeight: 600,
              }}
            >
              {lead.priority} PRIORITY
            </span>
          </div>
        }
        actions={
          <AdminAction variant="subtle" size="sm" href="/admin/leads">
            &larr; Back to Leads
          </AdminAction>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Message Content */}
          <AdminPanel title="Enquiry Message" subtitle="Direct customer consultation message" padding="md">
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                borderRadius: 'var(--admin-radius-sm, 3px)',
                fontSize: '0.8125rem',
                color: 'var(--admin-text-primary, #111317)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {lead.message}
            </div>

            {lead.productInterestName && (
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--admin-border-subtle, #EBEBE7)', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--admin-text-tertiary, #767A85)' }}>Product Interest: </span>
                <Link
                  href={`/admin/products/${lead.productInterestId}`}
                  style={{ color: 'var(--admin-accent, #B8935A)', textDecoration: 'none', fontWeight: 600 }}
                >
                  {lead.productInterestName} &rarr;
                </Link>
              </div>
            )}
          </AdminPanel>

          {/* Activity Log & Staff Notes */}
          <AdminPanel title="Activity History & Staff Notes" subtitle="Internal consultations and touchpoints" padding="md">
            {/* Note Input Form */}
            <form action={handleAddNote} style={{ marginBottom: '20px' }}>
              <textarea
                name="note"
                required
                rows={3}
                placeholder="Log a phone call, technical build discussion, or quotation notes..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: 'var(--admin-surface, #FFFFFF)',
                  border: '1px solid var(--admin-border, #E2E2DE)',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  color: 'var(--admin-text-primary, #111317)',
                  fontSize: '0.75rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '8px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <AdminAction type="submit" variant="secondary" size="sm">
                  + Add Staff Note
                </AdminAction>
              </div>
            </form>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lead.activities.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary, #767A85)' }}>
                  No activity logged yet.
                </div>
              ) : (
                lead.activities.map((act: any) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--admin-surface-well, #EFEFED)',
                      borderRadius: 'var(--admin-radius-sm, 3px)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--admin-text-tertiary, #767A85)', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>{act.action}</span>
                      <span>{new Date(act.createdAt).toLocaleString('en-GB')}</span>
                    </div>
                    {act.details ? (
                      <p style={{ color: 'var(--admin-text-secondary, #494D55)', margin: 0, lineHeight: 1.4 }}>
                        {String((act.details as Record<string, unknown>).note ?? JSON.stringify(act.details))}
                      </p>
                    ) : null}
                    {act.userEmail && (
                      <span style={{ display: 'block', fontSize: '0.625rem', color: 'var(--admin-text-tertiary, #767A85)', marginTop: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
                        Operator: {act.userEmail}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </AdminPanel>
        </div>

        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Transition Control */}
          <AdminPanel title="Pipeline Status" subtitle="Update lead stage" padding="md">
            <form action={handleStatusChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                  Pipeline Stage
                </label>
                <select name="status" defaultValue={lead.status} style={inputStyle}>
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="WON">Won (Order Placed)</option>
                  <option value="LOST">Lost</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: 'var(--admin-text-tertiary, #767A85)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                  Reason / Transition Note
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="e.g. Discussed spec and sent quote"
                  style={inputStyle}
                />
              </div>

              <AdminAction type="submit" variant="primary" size="sm" style={{ width: '100%' }}>
                Update Pipeline Status
              </AdminAction>
            </form>
          </AdminPanel>

          {/* Lead Meta */}
          <AdminPanel title="Provenance" subtitle="Source & timestamps" padding="md">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AdminField label="Channel Source" value={lead.source} monospace />
              <AdminField label="Created" value={new Date(lead.createdAt).toLocaleString('en-GB')} monospace />
              <AdminField label="Updated" value={new Date(lead.updatedAt).toLocaleString('en-GB')} monospace />
              <AdminField label="Lead ID" value={lead.id} monospace />
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
