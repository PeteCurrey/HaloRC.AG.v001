import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdminLead } from '@halo-rc/db'
import { updateLeadStatusAction, addLeadNoteAction } from '@/actions/admin'
import type { LeadStatus } from '@halo-rc/types'

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

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>
        <Link href="/admin/leads" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          Leads
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--colour-white)' }}>{lead.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--colour-graphite)',
              color: 'var(--colour-halo)',
              border: '1px solid var(--colour-halo)',
            }}>
              {lead.status}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
              backgroundColor: 'var(--colour-graphite)',
              color: lead.priority === 'URGENT' ? '#ef4444' : 'var(--colour-smoke)',
            }}>
              {lead.priority} PRIORITY
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', letterSpacing: 'var(--tracking-tight)' }}>
            {lead.name}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginTop: 'var(--space-1)' }}>
            {lead.email} {lead.phone ? `• ${lead.phone}` : ''} {lead.company ? `• ${lead.company}` : ''}
          </p>
        </div>

        <Link
          href="/admin/leads"
          style={{
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--colour-graphite)',
            border: '1px solid var(--colour-steel)',
            color: 'var(--colour-off-white)',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textDecoration: 'none',
          }}
        >
          &larr; Back to Leads
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Message Content */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
              Enquiry Message
            </h2>
            <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', color: 'var(--colour-off-white)', lineHeight: 'var(--leading-relaxed)', whiteSpace: 'pre-wrap' }}>
              {lead.message}
            </div>

            {lead.productInterestName && (
              <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--colour-graphite)', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--colour-smoke)' }}>Product Interest: </span>
                <Link href={`/admin/products/${lead.productInterestId}`} style={{ color: 'var(--colour-halo)', textDecoration: 'none', fontWeight: 600 }}>
                  {lead.productInterestName} &rarr;
                </Link>
              </div>
            )}
          </div>

          {/* Activity Log & Staff Notes */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-4)' }}>
              Activity History &amp; Staff Notes
            </h2>

            {/* Note Input */}
            <form action={handleAddNote} style={{ marginBottom: 'var(--space-6)' }}>
              <textarea
                name="note"
                required
                rows={3}
                placeholder="Log a call, technical consultation result, or quotation notes..."
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--colour-graphite)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--colour-white)',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-sans)',
                  marginBottom: 'var(--space-2)',
                }}
              />
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
                + Add Staff Note
              </button>
            </form>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {lead.activities.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)' }}>No activity logged yet.</p>
              ) : (
                lead.activities.map((act: any) => (
                  <div key={act.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-graphite)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--colour-white)' }}>{act.action}</span>
                      <span>{new Date(act.createdAt).toLocaleString()}</span>
                    </div>
                    {act.details ? (
                      <p style={{ color: 'var(--colour-ash)', margin: 0 }}>
                        {String((act.details as Record<string, unknown>).note ?? JSON.stringify(act.details))}
                      </p>
                    ) : null}
                    {act.userEmail && (
                      <span style={{ display: 'block', fontSize: '0.625rem', color: 'var(--colour-smoke)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                        By: {act.userEmail}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Status Transition Control */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
              Update Pipeline Status
            </h2>

            <form action={handleStatusChange} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={lead.status}
                  style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-xs)',
                  }}
                >
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
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>
                  Reason / Note
                </label>
                <input
                  type="text"
                  name="note"
                  placeholder="e.g. Discussed setup requirements via email"
                  style={{
                    width: '100%',
                    padding: 'var(--space-2)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-xs)',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: 'var(--space-2)',
                  backgroundColor: 'var(--colour-halo)',
                  color: 'var(--colour-void)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: 'var(--space-1)',
                }}
              >
                Update Status
              </button>
            </form>
          </div>

          {/* Lead Meta */}
          <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
            <h2 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-3)' }}>
              Provenance
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--colour-smoke)' }}>
              <div>Source: {lead.source}</div>
              <div>Created: {new Date(lead.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(lead.updatedAt).toLocaleString()}</div>
              <div>ID: {lead.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
