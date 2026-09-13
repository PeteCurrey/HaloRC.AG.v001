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
  calculateProcurementReadiness,
  calculateSupplierOpportunityScore,
  SEED_BRANDS,
} from '@halo-rc/db'
import { triggerSupplierSyncAction } from '@/actions/procurement'
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
    readiness,
    opportunity,
  ] = await Promise.all([
    getSupplierMappings(supplier.id),
    getSupplierSyncRuns(supplier.id),
    getSupplierChangeEvents(supplier.id, 20),
    getSupplierTerritoryCoverages(supplier.id),
    getBrandSupplierRelationships(undefined, supplier.id),
    getTradeAccountApplications(supplier.id),
    getSupplierCommercialTerms(supplier.id),
    getSupplierPricingPolicies(supplier.id),
    getSupplierContacts(supplier.id),
    getSupplierCommunications(supplier.id),
    getProcurementTasks(supplier.id),
    calculateProcurementReadiness(supplier.id),
    calculateSupplierOpportunityScore(supplier.id),
  ])

  const application = applications[0] ?? null

  return (
    <div>
      <ProcurementNav currentTab="suppliers" />

      {/* Breadcrumb & Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        <Link href="/admin/procurement/suppliers" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          &larr; Back to Suppliers
        </Link>
        <span style={{ color: 'var(--colour-smoke)' }}>/</span>
        <span style={{ color: 'var(--colour-halo)' }}>{supplier.slug}</span>
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
                fontSize: '0.6875rem',
                padding: '2px 8px',
                borderRadius: '2px',
                backgroundColor: supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)',
                color: supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-race)',
                border: `1px solid ${supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-race)'}`,
              }}
            >
              {supplier.relationshipStatus}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
            <span>Entity: <strong style={{ color: 'var(--colour-white)' }}>{supplier.legalName ?? supplier.name}</strong></span>
            <span>Type: <strong style={{ color: 'var(--colour-white)' }}>{supplier.supplierType.replace('_', ' ')}</strong></span>
            <span>Country: <strong style={{ color: 'var(--colour-white)' }}>{supplier.country}</strong></span>
            <span>Account Ref: <strong style={{ color: 'var(--colour-white)' }}>{supplier.accountReference ?? 'Pending'}</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          {application && (
            <Link
              href={`/admin/procurement/applications/${application.id}`}
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--colour-charcoal)',
                border: '1px solid var(--colour-steel)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-white)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textDecoration: 'none',
              }}
            >
              View Application ({application.status})
            </Link>
          )}

          <form action={async () => {
            'use server'
            await triggerSupplierSyncAction(supplier.id)
          }}>
            <button
              type="submit"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                backgroundColor: 'var(--colour-halo-10)',
                border: '1px solid var(--colour-halo)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--colour-halo)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Trigger Feed Sync
            </button>
          </form>
        </div>
      </div>

      {/* Top Profile Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Readiness Gate
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', color: readiness.isProcurementReady ? 'var(--colour-halo)' : 'var(--colour-race)', fontWeight: 700 }}>
            {readiness.score}% {readiness.isProcurementReady ? 'READY' : 'PENDING'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--colour-ash)', display: 'block', marginTop: 2 }}>
            {readiness.state.replace('_', ' ')}
          </span>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Opportunity Rating
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', color: 'var(--colour-white)', fontWeight: 700 }}>
            {opportunity.tier} ({opportunity.overallScore}/100)
          </span>
          <span style={{ fontSize: '11px', color: 'var(--colour-ash)', display: 'block', marginTop: 2 }}>
            Strategic partner score
          </span>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Trading Terms
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--colour-white)', fontWeight: 600 }}>
            {terms ? terms.paymentTerms.replace('_', ' ') : 'PREPAYMENT'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--colour-ash)', display: 'block', marginTop: 2 }}>
            {terms?.standardDiscountTierPercent ? `${terms.standardDiscountTierPercent}% discount tier` : 'Standard wholesale'}
          </span>
        </div>

        <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
            Catalogue Mappings
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)', color: 'var(--colour-white)', fontWeight: 600 }}>
            {mappings.filter((m) => m.status === 'MATCHED').length} Matched
          </span>
          <span style={{ fontSize: '11px', color: 'var(--colour-ash)', display: 'block', marginTop: 2 }}>
            {mappings.length} total supplier items
          </span>
        </div>
      </div>

      {/* 14-Point Profile Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {/* Section 1: Commercial Trading Terms */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-4)', letterSpacing: '0.08em' }}>
            Commercial Terms &amp; Ordering Rules
          </h2>

          {terms ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: 'var(--colour-ash)', display: 'block' }}>Payment Terms:</span>
                <strong style={{ color: 'var(--colour-white)' }}>{terms.paymentTerms.replace('_', ' ')} ({terms.paymentTermsDays ?? 0} days)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)', display: 'block' }}>Settlement Discount:</span>
                <strong style={{ color: 'var(--colour-white)' }}>{terms.earlyPaymentDiscountPercent ? `${terms.earlyPaymentDiscountPercent}% early settlement` : 'None'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)', display: 'block' }}>Minimum Order Qty:</span>
                <strong style={{ color: 'var(--colour-white)' }}>{terms.minimumOrderQuantityUnits ?? 1} unit(s)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)', display: 'block' }}>Minimum Order Value:</span>
                <strong style={{ color: 'var(--colour-white)' }}>
                  {terms.minimumOrderValueMinorUnits ? `${terms.currency === 'USD' ? '$' : '£'}${terms.minimumOrderValueMinorUnits / 100}` : 'None'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)', display: 'block' }}>Free Freight Threshold:</span>
                <strong style={{ color: 'var(--colour-white)' }}>
                  {terms.freeFreightThresholdMinorUnits ? `${terms.currency === 'USD' ? '$' : '£'}${terms.freeFreightThresholdMinorUnits / 100}` : 'No free freight'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--colour-ash)', display: 'block' }}>Dropship Policy:</span>
                <strong style={{ color: 'var(--colour-white)' }}>{terms.dropShipAvailable ? 'Available' : 'Direct Dispatch Only'}</strong>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>No verified commercial terms record.</span>
          )}

          {pricingPolicies.length > 0 && (
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--colour-steel)', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--colour-ash)', display: 'block', marginBottom: 2 }}>Pricing Compliance:</span>
              {pricingPolicies.map((p) => (
                <div key={p.id} style={{ color: 'var(--colour-white)' }}>
                  • {p.policyType} Policy ({p.enforcementLevel}): {p.notes ?? 'Standard manufacturer retail policy'}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Territory Rights & Brand Distribution */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-4)', letterSpacing: '0.08em' }}>
            Territories &amp; Brand Authorizations
          </h2>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Territorial Coverage Rights:
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              {territories.map((t) => (
                <span
                  key={t.id}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: t.state === 'SUPPORTED' ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                    color: t.state === 'SUPPORTED' ? 'var(--colour-halo)' : 'var(--colour-ash)',
                    border: `1px solid ${t.state === 'SUPPORTED' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                  }}
                >
                  {t.territory}: {t.state} {t.restrictionReason ? `(${t.restrictionReason})` : ''}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', display: 'block', marginBottom: 'var(--space-2)' }}>
              Supplied Brands &amp; Evidence:
            </span>
            {relationships.map((r) => {
              const brand = SEED_BRANDS.find((b) => b.id === r.brandId)
              return (
                <div key={r.id} style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <strong style={{ color: 'var(--colour-white)' }}>{brand?.name ?? r.brandId}</strong>
                    <span style={{ color: 'var(--colour-ash)' }}>({r.relationshipType.replace('_', ' ')})</span>
                    <span
                      style={{
                        padding: '1px 5px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        backgroundColor: r.verificationStatus === 'VERIFIED' ? 'var(--colour-halo-10)' : 'var(--colour-race-10)',
                        color: r.verificationStatus === 'VERIFIED' ? 'var(--colour-halo)' : 'var(--colour-race)',
                      }}
                    >
                      {r.verificationStatus}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                    {r.evidenceNotes ?? `Source: ${r.evidenceSourceType}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 3: Direct Contacts Directory */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-4)', letterSpacing: '0.08em' }}>
            Supplier Contacts
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {contacts.map((contact) => (
              <div key={contact.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ color: 'var(--colour-white)', fontWeight: 600 }}>{contact.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--colour-smoke)' }}>
                    {contact.role.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ color: 'var(--colour-ash)' }}>
                  {contact.title ?? 'Commercial Rep'} • {contact.email ?? 'No email'} • {contact.phone ?? 'No phone'}
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>No contacts on file.</span>
            )}
          </div>
        </div>

        {/* Section 4: Operational Tasks & Follow-ups */}
        <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-4)', letterSpacing: '0.08em' }}>
            Procurement Action Tasks
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {tasks.map((task) => (
              <div key={task.id} style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-xs)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ color: 'var(--colour-white)', fontWeight: 600 }}>{task.title}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: task.priority === 'HIGH' ? 'var(--colour-race)' : 'var(--colour-smoke)' }}>
                    {task.priority}
                  </span>
                </div>
                <span style={{ color: 'var(--colour-ash)', display: 'block', marginBottom: 2 }}>
                  {task.description}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)' }}>
                  Due: {task.dueDate ?? 'Ongoing'} • Assigned: {task.assignedTo ?? 'Staff'}
                </span>
              </div>
            ))}
            {tasks.length === 0 && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>No pending tasks for this supplier.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
