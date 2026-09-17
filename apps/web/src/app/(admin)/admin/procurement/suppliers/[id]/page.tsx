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
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminStatus,
} from '@/components/admin'
import { ProcurementNav } from '../../ProcurementNav'

interface PageProps {
  params: Promise<{ id: string }>
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

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Procurement', href: '/admin/procurement' },
          { label: 'Suppliers', href: '/admin/procurement/suppliers' },
          { label: supplier.name },
        ]}
        title={supplier.name}
        description={`Entity: ${supplier.legalName ?? supplier.name} • Type: ${supplier.supplierType.replace(/_/g, ' ')} • Country: ${supplier.country}${supplier.accountReference ? ` • Ref: ${supplier.accountReference}` : ''}`}
        status={
          <AdminStatus
            status={
              currentStatus === 'TRADING' || currentStatus === 'APPROVED' || currentStatus === 'ACCOUNT_OPEN'
                ? 'verified'
                : currentStatus === 'REJECTED'
                ? 'alert'
                : currentStatus === 'CONTACTED' || currentStatus === 'APPLICATION_SUBMITTED'
                ? 'warning'
                : 'neutral'
            }
            label={currentStatus.replace(/_/g, ' ')}
          />
        }
      />

      <ProcurementNav currentTab="suppliers" />

      {/* Main Multi-Section Grid */}
      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Section 1: Overview & Contact Information */}
            <AdminPanel title="Entity Details & Contact Routes" padding="md">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: '0.75rem' }}>
                <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Trading Name</span>
                  <span style={{ color: '#111317', fontWeight: 600 }}>{supplier.tradingName ?? supplier.name}</span>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Currency / VAT</span>
                  <span style={{ color: '#111317', fontWeight: 600 }}>{supplier.currency} • {supplier.vatStatus ?? 'None on file'}</span>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>General Email</span>
                  <span style={{ color: '#111317' }}>{supplier.generalEmail ?? supplier.contactEmail ?? 'Unknown'}</span>
                </div>
                <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Sales / Trade Phone</span>
                  <span style={{ color: '#111317' }}>{supplier.contactPhone ?? 'Unknown'}</span>
                </div>
                {supplier.dealerApplicationUrl && (
                  <div style={{ gridColumn: '1 / -1', padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                    <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Dealer Application Route</span>
                    <a href={supplier.dealerApplicationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#B8935A', wordBreak: 'break-all' }}>
                      {supplier.dealerApplicationUrl} ↗
                    </a>
                  </div>
                )}
              </div>

              {supplier.notes && (
                <div style={{ marginTop: 16, padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, borderLeft: '3px solid #B8935A', borderTop: '1px solid #E2E2DE', borderRight: '1px solid #E2E2DE', borderBottom: '1px solid #E2E2DE' }}>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.625rem', color: '#767A85', textTransform: 'uppercase', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                    Procurement Profile Notes
                  </span>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#494D55', lineHeight: 'var(--leading-relaxed)' }}>
                    {supplier.notes}
                  </p>
                </div>
              )}
            </AdminPanel>

            {/* Section 2: Brands Represented */}
            <AdminPanel
              title={`Brands Supplied (${relationships.length})`}
              subtitle="Commercial Relationships"
              padding="md"
            >
              {relationships.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                  No explicit brand distribution relationships recorded for this supplier.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {relationships.map((rel) => {
                    const brand = SEED_BRANDS.find((b) => b.id === rel.brandId)
                    return (
                      <div key={rel.id} style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Link href={`/admin/procurement/brands/${rel.brandId}`} style={{ color: '#111317', fontWeight: 600, fontSize: '0.75rem', textDecoration: 'none' }}>
                            {brand?.name ?? rel.brandId}
                          </Link>
                          <AdminStatus
                            status={rel.verificationStatus === 'VERIFIED' ? 'verified' : 'warning'}
                            label={rel.verificationStatus}
                          />
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                          {rel.relationshipType.replace(/_/g, ' ')} • Territory: {rel.territory} {rel.isExclusive ? '• [EXCLUSIVE]' : ''}
                        </div>
                        {rel.evidenceNotes && (
                          <div style={{ fontSize: '0.625rem', color: '#767A85', marginTop: 4 }}>
                            Source: {rel.evidenceSourceType} — {rel.evidenceNotes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </AdminPanel>

            {/* Section 3: Contacts Directory */}
            <AdminPanel
              title={`Key Contacts (${contacts.length})`}
              padding="md"
            >
              {contacts.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                  No individual contact persons recorded for this supplier.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {contacts.map((ct) => (
                    <div key={ct.id} style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111317' }}>
                          {ct.firstName ? `${ct.firstName} ${ct.lastName}` : ct.name}
                          {ct.isPrimary && <span style={{ marginLeft: 6, color: '#B8935A', fontSize: '0.625rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>[PRIMARY]</span>}
                        </span>
                        <span style={{ fontSize: '0.625rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)' }}>
                          {ct.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#494D55' }}>
                        {ct.title ? `${ct.title} • ` : ''}{ct.email ?? 'No email'} {ct.phone ? `• ${ct.phone}` : ''}
                      </div>
                      {ct.notes && (
                        <div style={{ fontSize: '0.625rem', color: '#767A85', marginTop: 4 }}>
                          {ct.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Section 4: Trade Account Applications */}
            <AdminPanel
              title="Trade Account Status & Onboarding"
              padding="md"
            >
              {application ? (
                <div style={{ padding: 14, backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#111317' }}>
                      Application: {application.status}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)' }}>
                      {application.stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#494D55', marginBottom: 8 }}>
                    Applicant: {application.applicantEntityName} • Ref: {application.accountReference ?? 'Pending approval'}
                  </div>
                  {application.creditLimitMinorUnits && (
                    <div style={{ fontSize: '0.75rem', color: '#B8935A', marginBottom: 8, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                      Approved Credit Limit: {application.creditCurrency === 'USD' ? '$' : '£'}{(application.creditLimitMinorUnits / 100).toLocaleString()}
                    </div>
                  )}
                  {application.notes && (
                    <div style={{ fontSize: '0.6875rem', color: '#494D55', borderTop: '1px solid #E2E2DE', paddingTop: 8 }}>
                      {application.notes}
                    </div>
                  )}
                </div>
              ) : supplier.dealerApplicationUrl ? (
                <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                  <span style={{ fontSize: '0.75rem', color: '#8b5cf6', display: 'block', marginBottom: 2, fontWeight: 500 }}>
                    Application Route Available
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                    A dealer application route exists for this supplier. Not yet submitted.
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                  No active trade account application on file.
                </p>
              )}
            </AdminPanel>

            {/* Section 5: Commercial Terms */}
            <AdminPanel title="Commercial Terms" padding="md">
              {terms ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, fontSize: '0.75rem' }}>
                  <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                    <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Payment Terms</span>
                    <span style={{ color: '#111317', fontWeight: 600 }}>{(terms.paymentTerms ?? 'UNSPECIFIED').replace(/_/g, ' ')} ({terms.paymentTermsDays ?? 0} days)</span>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                    <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Standard Margin</span>
                    <span style={{ color: '#B8935A', fontWeight: 600 }}>{terms.standardDiscountTierPercent ? `${terms.standardDiscountTierPercent}%` : 'Unknown'}</span>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                    <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Carriage Paid Limit</span>
                    <span style={{ color: '#111317' }}>{terms.freeFreightThresholdMinorUnits ? `£${terms.freeFreightThresholdMinorUnits / 100}` : 'None'}</span>
                  </div>
                  <div style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                    <span style={{ color: '#767A85', display: 'block', marginBottom: 2, fontSize: '0.6875rem' }}>Drop-Shipping</span>
                    <span style={{ color: terms.dropShipAvailable ? '#1A6E34' : '#767A85', fontWeight: 500 }}>{terms.dropShipAvailable ? 'Available' : 'No'}</span>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                  Commercial terms not yet recorded or terms pending approval.
                </p>
              )}
            </AdminPanel>

            {/* Section 6: Communication Log */}
            <AdminPanel
              title={`Communication History (${communications.length})`}
              padding="md"
            >
              {communications.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                  No communications logged for this supplier.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {communications.map((comm) => (
                    <div key={comm.id} style={{ padding: '10px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, borderLeft: '3px solid #B8935A', borderTop: '1px solid #E2E2DE', borderRight: '1px solid #E2E2DE', borderBottom: '1px solid #E2E2DE' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111317' }}>
                          {comm.subject}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.625rem', color: '#767A85' }}>
                          {comm.occurredAt.slice(0, 10)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: '#494D55' }}>
                        {comm.summary}
                      </div>
                      {comm.nextFollowUpDate && (
                        <div style={{ fontSize: '0.625rem', color: '#B86818', marginTop: 4, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                          Follow-up scheduled: {comm.nextFollowUpDate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>

            {/* Section 7: Procurement Tasks */}
            <AdminPanel
              title={`Procurement Tasks (${tasks.length})`}
              padding="md"
            >
              {tasks.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                  No active tasks assigned to this supplier.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tasks.map((task) => (
                    <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#111317' }}>
                          {task.title}
                        </span>
                        <span style={{ fontSize: '0.625rem', color: '#767A85', display: 'block' }}>
                          Due: {task.dueDate ?? 'None'} • Priority: {task.priority}
                        </span>
                      </div>
                      <AdminStatus
                        status={task.status === 'COMPLETED' ? 'verified' : 'neutral'}
                        label={task.status}
                      />
                    </div>
                  ))}
                </div>
              )}
            </AdminPanel>
          </div>
        </div>
      </AdminSection>
    </>
  )
}
