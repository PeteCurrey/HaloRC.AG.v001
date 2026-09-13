import Link from 'next/link'
import {
  getTradeAccountApplications,
  getSuppliers,
  getHaloBusinessProfile,
} from '@halo-rc/db'
import { ProcurementNav } from '../ProcurementNav'

export default async function TradeApplicationsPage() {
  const applications = await getTradeAccountApplications()
  const suppliers = await getSuppliers()
  const companyProfile = getHaloBusinessProfile()

  const appsWithSupplier = applications.map((app) => {
    const supplier = suppliers.find((s) => s.id === app.supplierId)
    const verifiedReqs = app.requirements.filter((r) => r.status === 'VERIFIED').length
    const totalReqs = app.requirements.length
    return {
      ...app,
      supplier,
      verifiedReqs,
      totalReqs,
    }
  })

  return (
    <div>
      <ProcurementNav currentTab="applications" />

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
            Trade Account Applications
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Trade account onboarding lifecycle, compliance document tracking, credit limits, and verified dealer applications.
          </p>
        </div>
      </div>

      {/* Halo Business Profile Reference Pack */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Halo RC Company Pack • Trade Application Authority
            </span>
          </div>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
            Co. No: {companyProfile.companyNumber} • VAT: {companyProfile.vatNumber} • EORI: {companyProfile.eoriNumber}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
              REGISTERED ENTITY
            </span>
            <span style={{ color: 'var(--colour-white)', fontWeight: 600, display: 'block' }}>
              {companyProfile.legalName} (Trading as {companyProfile.tradingName})
            </span>
            <span style={{ color: 'var(--colour-ash)' }}>
              {companyProfile.registeredAddress.line1}, {companyProfile.registeredAddress.city} {companyProfile.registeredAddress.postalCode}
            </span>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
              COMMERCIAL BANK DETAILS
            </span>
            <span style={{ color: 'var(--colour-white)', fontWeight: 600, display: 'block' }}>
              {companyProfile.bankDetails.bankName}
            </span>
            <span style={{ color: 'var(--colour-ash)' }}>
              Sort: {companyProfile.bankDetails.sortCode} • Acc: {companyProfile.bankDetails.accountNumber} • IBAN: {companyProfile.bankDetails.iban}
            </span>
          </div>

          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--colour-charcoal)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ color: 'var(--colour-smoke)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 2 }}>
              TRADE REFERENCES
            </span>
            <span style={{ color: 'var(--colour-white)', fontWeight: 600, display: 'block' }}>
              {companyProfile.tradeReferences[0]?.companyName} &amp; {companyProfile.tradeReferences[1]?.companyName}
            </span>
            <span style={{ color: 'var(--colour-ash)' }}>
              2 Verified positive trade accounts with 2+ years clean trading records
            </span>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Supplier
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Status
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Pipeline Stage
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Requirements
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Credit Limit
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Timestamps
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', textAlign: 'right' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {appsWithSupplier.map((app) => (
              <tr key={app.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                <td style={{ padding: 'var(--space-4)' }}>
                  <Link
                    href={`/admin/procurement/applications/${app.id}`}
                    style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none', display: 'block', marginBottom: 2 }}
                  >
                    {app.supplier?.name ?? app.supplierId}
                  </Link>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    Entity: {app.applicantEntityName} • Ref: {app.accountReference ?? 'Pending'}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      backgroundColor: app.status === 'APPROVED' ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                      color: app.status === 'APPROVED' ? 'var(--colour-halo)' : 'var(--colour-smoke)',
                      border: `1px solid ${app.status === 'APPROVED' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                    }}
                  >
                    {app.status}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    {app.stage.replace('_', ' ')}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: app.verifiedReqs === app.totalReqs ? 'var(--colour-halo)' : 'var(--colour-white)' }}>
                      {app.verifiedReqs} / {app.totalReqs}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>verified</span>
                  </div>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--colour-white)' }}>
                    {app.creditLimitMinorUnits
                      ? `${app.creditCurrency === 'USD' ? '$' : '£'}${app.creditLimitMinorUnits / 100}`
                      : 'None'}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    {app.approvedAt ? `Approved: ${app.approvedAt.slice(0, 10)}` : app.submittedAt ? `Submitted: ${app.submittedAt.slice(0, 10)}` : 'Draft'}
                  </div>
                </td>

                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                  <Link
                    href={`/admin/procurement/applications/${app.id}`}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--colour-halo)',
                      textDecoration: 'none',
                      padding: 'var(--space-1) var(--space-3)',
                      backgroundColor: 'var(--colour-charcoal)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    Manage &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
