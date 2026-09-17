import Link from 'next/link'
import {
  getTradeAccountApplications,
  getSuppliers,
  getHaloBusinessProfile,
} from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminAction,
} from '@/components/admin'
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
    <>
      <AdminPageHeader
        category="Procurement Operations"
        title="Trade Account Applications & Onboarding"
        description="Track dealer application submissions, compliance documentation packs, credit line approvals, and account opening stages."
      />

      <ProcurementNav currentTab="applications" />

      {/* Avorria RC Company Pack Authority */}
      <AdminSection>
        <AdminPanel
          title="Avorria RC Commercial Pack • Trade Application Credentials"
          badge={
            <span style={{ fontSize: '0.6875rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)' }}>
              Co. No: {companyProfile.companyNumber || 'Pending'} • VAT: {companyProfile.vatNumber || 'Pending'} • EORI: {companyProfile.eoriNumber || 'Pending'}
            </span>
          }
          padding="md"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, fontSize: '0.75rem' }}>
            <div style={{ padding: '12px 14px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
              <span style={{ color: '#767A85', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4, fontSize: '0.6875rem' }}>
                REGISTERED TRADING ENTITY
              </span>
              <span style={{ color: '#111317', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                {companyProfile.legalName || 'Halo RC Ltd'} {companyProfile.tradingName ? `(Trading as ${companyProfile.tradingName})` : ''}
              </span>
              <span style={{ color: '#494D55' }}>
                {companyProfile.registeredAddress.line1
                  ? `${companyProfile.registeredAddress.line1}, ${companyProfile.registeredAddress.city} ${companyProfile.registeredAddress.postalCode}`
                  : 'Address pending verification'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
              <span style={{ color: '#767A85', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4, fontSize: '0.6875rem' }}>
                COMMERCIAL SETTLEMENT BANK
              </span>
              <span style={{ color: '#111317', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                {companyProfile.bankDetails.bankName || 'Pending Verification'}
              </span>
              <span style={{ color: '#494D55' }}>
                {companyProfile.bankDetails.accountNumber
                  ? `Sort: ${companyProfile.bankDetails.sortCode} • Acc: ${companyProfile.bankDetails.accountNumber} • IBAN: ${companyProfile.bankDetails.iban}`
                  : 'Bank details pending manual verification'}
              </span>
            </div>

            <div style={{ padding: '12px 14px', backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE' }}>
              <span style={{ color: '#767A85', fontFamily: 'var(--font-mono, monospace)', display: 'block', marginBottom: 4, fontSize: '0.6875rem' }}>
                VERIFIED TRADE REFERENCES
              </span>
              <span style={{ color: '#111317', fontWeight: 600, display: 'block', marginBottom: 2 }}>
                {companyProfile.tradeReferences.length > 0
                  ? companyProfile.tradeReferences.map((r) => r.companyName).join(' & ')
                  : 'Pending Verification'}
              </span>
              <span style={{ color: '#494D55' }}>
                {companyProfile.tradeReferences.length > 0
                  ? `${companyProfile.tradeReferences.length} verified trade credit reference(s)`
                  : 'No trade references on file — manual verification required'}
              </span>
            </div>
          </div>
        </AdminPanel>
      </AdminSection>

      {/* Applications Table */}
      <AdminSection>
        <AdminPanel padding="none">
          <AdminTable
            columns={[
              'Supplier Partner',
              'Application Status',
              'Pipeline Stage',
              'Compliance Docs',
              'Credit Limit',
              'Timeline',
              { header: 'Action', align: 'right' },
            ]}
          >
            {appsWithSupplier.map((app) => (
              <AdminTableRow
                key={app.id}
                cells={[
                  <div key="partner">
                    <Link
                      href={`/admin/procurement/suppliers/${app.supplierId}`}
                      style={{ color: '#111317', fontWeight: 600, textDecoration: 'none', display: 'block', marginBottom: 2 }}
                    >
                      {app.supplier?.name ?? app.supplierId}
                    </Link>
                    <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                      Entity: {app.applicantEntityName} • Ref: {app.accountReference ?? 'Pending'}
                    </span>
                  </div>,

                  <AdminStatus
                    key="status"
                    status={app.status === 'APPROVED' ? 'verified' : app.status === 'REJECTED' ? 'alert' : 'neutral'}
                    label={app.status}
                  />,

                  <span key="stage" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#494D55' }}>
                    {app.stage.replace(/_/g, ' ')}
                  </span>,

                  <div key="docs" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', fontWeight: 600, color: app.verifiedReqs === app.totalReqs ? '#1A6E34' : '#111317' }}>
                      {app.verifiedReqs} / {app.totalReqs}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>verified</span>
                  </div>,

                  <span key="credit" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem', color: '#111317' }}>
                    {app.creditLimitMinorUnits
                      ? `${app.creditCurrency === 'USD' ? '$' : '£'}${(app.creditLimitMinorUnits / 100).toLocaleString()}`
                      : 'None'}
                  </span>,

                  <span key="time" style={{ fontSize: '0.75rem', color: '#767A85' }}>
                    {app.approvedAt ? `Approved: ${app.approvedAt.slice(0, 10)}` : app.submittedAt ? `Submitted: ${app.submittedAt.slice(0, 10)}` : 'Draft'}
                  </span>,

                  <AdminAction key="action" href={`/admin/procurement/suppliers/${app.supplierId}`} variant="secondary" size="sm">
                    Supplier Profile →
                  </AdminAction>,
                ]}
              />
            ))}
          </AdminTable>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
