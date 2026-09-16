import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getSupplierById,
  getSupplierMappings,
  getSupplierSyncRuns,
  getSupplierChangeEvents,
  getSupplierTerritoryCoverages,
  getBrandSupplierRelationships,
  getTradeAccountApplications,
  getSupplierCommercialTerms,
  getSupplierPricingPolicies,
  getSupplierContacts,
  getSupplierCommunications,
  getProcurementTasks,
  getProcurementNotes,
  getProcurementAuditLog,
  SEED_BRANDS,
} from '@halo-rc/db'
import { ProcurementNav } from '../../ProcurementNav'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  RESEARCH: { bg: 'rgba(148, 163, 184, 0.1)', text: 'var(--colour-ash)', border: 'var(--colour-steel)' },
  TARGET: { bg: 'rgba(148, 163, 184, 0.15)', text: 'var(--colour-silver)', border: 'var(--colour-steel)' },
  CONTACT_TO_MAKE: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: '#f59e0b' },
  CONTACTED: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: '#3b82f6' },
  APPLICATION_AVAILABLE: { bg: 'rgba(139, 92, 246, 0.1)', text: '#a78bfa', border: '#8b5cf6' },
  APPLICATION_SUBMITTED: { bg: 'rgba(236, 72, 153, 0.1)', text: '#f472b6', border: '#ec4899' },
  AWAITING_RESPONSE: { bg: 'rgba(249, 115, 22, 0.1)', text: '#fb923c', border: '#f97316' },
  APPROVED: { bg: 'var(--colour-halo-10)', text: 'var(--colour-halo)', border: 'var(--colour-halo)' },
  ACCOUNT_OPEN: { bg: 'var(--colour-halo-10)', text: 'var(--colour-halo)', border: 'var(--colour-halo)' },
  TERMS_RECEIVED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: '#10b981' },
  TRADING: { bg: 'rgba(5, 150, 105, 0.15)', text: '#10b981', border: '#059669' },
  PAUSED: { bg: 'rgba(100, 116, 139, 0.1)', text: 'var(--colour-slate)', border: 'var(--colour-steel)' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--colour-race)', border: 'var(--colour-race)' },
  CLOSED: { bg: 'rgba(51, 65, 85, 0.2)', text: 'var(--colour-slate)', border: 'var(--colour-steel)' },
}

export default async function SupplierDetailPage({ params }: PageProps) {
  const { id } = await params
  const supplier = await getSupplierById(id)
  if (!supplier) notFound()

  const [
    mappings,
    syncRuns,
    changeEvents,
    territories,
    relationships,
    applications,
    terms,
    pricingPolicies,
    contacts,
    communications,
    tasks,
    notes,
    auditLog,
  ] = await Promise.all([
    getSupplierMappings(supplier.id),
    getSupplierSyncRuns(supplier.id),
    getSupplierChangeEvents(supplier.id, 10),
    getSupplierTerritoryCoverages(supplier.id),
    getBrandSupplierRelationships(undefined, supplier.id),
    getTradeAccountApplications(supplier.id),
    getSupplierCommercialTerms(supplier.id),
    getSupplierPricingPolicies(supplier.id),
    getSupplierContacts(supplier.id),
    getSupplierCommunications(supplier.id),
    getProcurementTasks(supplier.id),
    getProcurementNotes(supplier.id),
    getProcurementAuditLog(supplier.id, 15),
  ])

  const application = applications[0] ?? null
  const currentStatus = supplier.procurementStatus ?? 'RESEARCH'
  const fallbackColor = { bg: 'rgba(148, 163, 184, 0.1)', text: 'var(--colour-ash)', border: 'var(--colour-steel)' }
  const colorInfo = STATUS_COLOR_MAP[currentStatus] ?? fallbackColor

  return (
    <div>
      <ProcurementNav currentTab="suppliers" />

      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        <Link href="/admin/procurement/suppliers" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          &larr; Back to Directory
        </Link>
        <span style={{ color: 'var(--colour-smoke)' }}>/</span>
        <span style={{ color: 'var(--colour-halo)' }}>{supplier.name}</span>
      </div>

      {/* Supplier Profile Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
              {supplier.name}
            </h1>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: colorInfo.bg,
                color: colorInfo.text,
                border: `1px solid ${colorInfo.border}`,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {currentStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            <span>Entity: <strong style={{ color: 'var(--colour-white)' }}>{supplier.legalName ?? supplier.name}</strong></span>
            <span>Type: <strong style={{ color: 'var(--colour-white)' }}>{supplier.supplierType.replace(/_/g, ' ')}</strong></span>
            <span>Country: <strong style={{ color: 'var(--colour-white)' }}>{supplier.country}</strong></span>
            {supplier.accountReference && (
              <span>Account Ref: <strong style={{ color: 'var(--colour-halo)', fontFamily: 'var(--font-mono)' }}>{supplier.accountReference}</strong></span>
            )}
            {supplier.website && (
              <a href={supplier.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--colour-smoke)' }}>
                {supplier.website.replace(/^https?:\/\//, '')} &nearr;
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Multi-Tab / Multi-Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Section 1: Overview & Contact Information */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'var(--space-4)' }}>
              Entity Details &amp; Contact Routes
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Trading Name</span>
                <span style={{ color: 'var(--colour-white)', fontWeight: 600 }}>{supplier.tradingName ?? supplier.name}</span>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Currency / VAT</span>
                <span style={{ color: 'var(--colour-white)', fontWeight: 600 }}>{supplier.currency} • {supplier.vatStatus ?? 'None on file'}</span>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>General Email</span>
                <span style={{ color: 'var(--colour-white)' }}>{supplier.generalEmail ?? supplier.contactEmail ?? 'Unknown'}</span>
              </div>
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Sales / Trade Phone</span>
                <span style={{ color: 'var(--colour-white)' }}>{supplier.contactPhone ?? 'Unknown'}</span>
              </div>
              {supplier.dealerApplicationUrl && (
                <div style={{ gridColumn: '1 / -1', padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Dealer Application Route</span>
                  <a href={supplier.dealerApplicationUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--colour-halo)', wordBreak: 'break-all' }}>
                    {supplier.dealerApplicationUrl} &nearr;
                  </a>
                </div>
              )}
            </div>

            {supplier.notes && (
              <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--colour-halo)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--colour-ash)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                  Procurement Profile Notes
                </span>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--colour-silver)', lineHeight: 'var(--leading-relaxed)' }}>
                  {supplier.notes}
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Brands Represented */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Brands Supplied ({relationships.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                Commercial Relationships
              </span>
            </div>

            {relationships.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
                No explicit brand distribution relationships recorded for this supplier.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {relationships.map((rel) => {
                  const brand = SEED_BRANDS.find((b) => b.id === rel.brandId)
                  return (
                    <div key={rel.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <Link href={`/admin/procurement/brands/${rel.brandId}`} style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-xs)', textDecoration: 'none' }}>
                          {brand?.name ?? rel.brandId}
                        </Link>
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: rel.verificationStatus === 'VERIFIED' ? 'var(--colour-halo-10)' : 'var(--colour-carbon)', color: rel.verificationStatus === 'VERIFIED' ? 'var(--colour-halo)' : '#f59e0b', fontFamily: 'var(--font-mono)' }}>
                          {rel.verificationStatus}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                        {rel.relationshipType.replace(/_/g, ' ')} • Territory: {rel.territory} {rel.isExclusive ? '• [EXCLUSIVE]' : ''}
                      </div>
                      {rel.evidenceNotes && (
                        <div style={{ fontSize: '10px', color: 'var(--colour-smoke)', marginTop: 4 }}>
                          Source: {rel.evidenceSourceType} — {rel.evidenceNotes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Section 3: Contacts Directory */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Key Contacts ({contacts.length})
              </span>
            </div>

            {contacts.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
                No individual contact persons recorded for this supplier.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {contacts.map((ct) => (
                  <div key={ct.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                        {ct.firstName ? `${ct.firstName} ${ct.lastName}` : ct.name}
                        {ct.isPrimary && <span style={{ marginLeft: 6, color: 'var(--colour-halo)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>[PRIMARY]</span>}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                        {ct.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                      {ct.title ? `${ct.title} • ` : ''}{ct.email ?? 'No email'} {ct.phone ? `• ${ct.phone}` : ''}
                    </div>
                    {ct.notes && (
                      <div style={{ fontSize: '10px', color: 'var(--colour-smoke)', marginTop: 4 }}>
                        {ct.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Section 4: Trade Account Applications */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', marginBottom: 'var(--space-4)' }}>
              Trade Account Status &amp; Onboarding
            </span>

            {application ? (
              <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--colour-steel)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--colour-white)' }}>
                    Application: {application.status}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                    {application.stage.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', marginBottom: 'var(--space-3)' }}>
                  Applicant: {application.applicantEntityName} • Ref: {application.accountReference ?? 'Pending approval'}
                </div>
                {application.creditLimitMinorUnits && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', marginBottom: 'var(--space-3)', fontFamily: 'var(--font-mono)' }}>
                    Approved Credit Limit: {application.creditCurrency === 'USD' ? '$' : '£'}{(application.creditLimitMinorUnits / 100).toLocaleString()}
                  </div>
                )}
                {application.notes && (
                  <div style={{ fontSize: '11px', color: 'var(--colour-silver)', borderTop: '1px solid var(--colour-steel)', paddingTop: 'var(--space-2)' }}>
                    {application.notes}
                  </div>
                )}
              </div>
            ) : supplier.dealerApplicationUrl ? (
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: '#a78bfa', display: 'block', marginBottom: 2 }}>
                  Application Route Available
                </span>
                <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                  A dealer application route exists for this supplier. Not yet submitted.
                </span>
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
                No active trade account application on file.
              </p>
            )}
          </div>

          {/* Section 5: Commercial Terms */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'var(--space-4)' }}>
              Commercial Terms
            </span>

            {terms ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Payment Terms</span>
                  <span style={{ color: 'var(--colour-white)', fontWeight: 600 }}>{terms.paymentTerms.replace(/_/g, ' ')} ({terms.paymentTermsDays ?? 0} days)</span>
                </div>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Standard Margin</span>
                  <span style={{ color: 'var(--colour-halo)', fontWeight: 600 }}>{terms.standardDiscountTierPercent ? `${terms.standardDiscountTierPercent}%` : 'Unknown'}</span>
                </div>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Carriage Paid Limit</span>
                  <span style={{ color: 'var(--colour-white)' }}>{terms.freeFreightThresholdMinorUnits ? `£${terms.freeFreightThresholdMinorUnits / 100}` : 'None'}</span>
                </div>
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--colour-smoke)', display: 'block', marginBottom: 2 }}>Drop-Shipping</span>
                  <span style={{ color: terms.dropShipAvailable ? 'var(--colour-halo)' : 'var(--colour-ash)' }}>{terms.dropShipAvailable ? 'Available' : 'No'}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
                Commercial terms not yet recorded or terms pending approval.
              </p>
            )}
          </div>

          {/* Section 6: Communication Log */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'var(--space-4)' }}>
              Communication History ({communications.length})
            </span>

            {communications.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
                No communications logged for this supplier.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {communications.map((comm) => (
                  <div key={comm.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--colour-steel)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                        {comm.subject}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--colour-ash)' }}>
                        {comm.occurredAt.slice(0, 10)}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--colour-silver)' }}>
                      {comm.summary}
                    </div>
                    {comm.nextFollowUpDate && (
                      <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        Follow-up scheduled: {comm.nextFollowUpDate}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Procurement Tasks */}
          <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 'var(--space-4)' }}>
              Procurement Tasks ({tasks.length})
            </span>

            {tasks.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontStyle: 'italic', margin: 0 }}>
                No active tasks assigned to this supplier.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {tasks.map((task) => (
                  <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                        {task.title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--colour-ash)', display: 'block' }}>
                        Due: {task.dueDate ?? 'None'} • Priority: {task.priority}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--colour-carbon)', color: task.status === 'COMPLETED' ? 'var(--colour-halo)' : 'var(--colour-smoke)' }}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
