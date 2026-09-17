import Link from 'next/link'
import {
  searchSuppliers,
  getSupplierContacts,
  getBrandSupplierRelationships,
  getTradeAccountApplications,
  SEED_BRANDS,
} from '@halo-rc/db'
import type { ProcurementStatus, SupplierRecord } from '@halo-rc/types'
import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminAction,
  AdminToolbar,
  AdminSearch,
  AdminFilter,
} from '@/components/admin'
import { ProcurementNav } from '../ProcurementNav'

interface PageProps {
  searchParams: Promise<{
    q?: string
    country?: string
    status?: string
    type?: string
  }>
}

export default async function ProcurementSuppliersDirectoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query = params.q ?? null
  const country = params.country ?? null
  const status = (params.status as ProcurementStatus) ?? null
  const type = (params.type as SupplierRecord['supplierType']) ?? null

  const suppliers = await searchSuppliers({ query, country, procurementStatus: status, supplierType: type })

  // Decorate with contacts, brands, and application status
  const suppliersWithMeta = await Promise.all(
    suppliers.map(async (supplier) => {
      const contacts = await getSupplierContacts(supplier.id)
      const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null
      const brandRels = await getBrandSupplierRelationships(undefined, supplier.id)
      const applications = await getTradeAccountApplications(supplier.id)
      const latestApp = applications[0] ?? null

      const brandNames = brandRels
        .map((r) => {
          const b = SEED_BRANDS.find((brand) => brand.id === r.brandId)
          return b?.name ?? null
        })
        .filter(Boolean) as string[]

      return {
        supplier,
        primaryContact,
        brandCount: brandRels.length,
        brandNames: brandNames.slice(0, 3),
        remainingBrands: Math.max(0, brandRels.length - 3),
        latestApp,
      }
    })
  )

  const countries = Array.from(new Set(suppliers.map((s) => s.country).filter(Boolean))).sort()

  return (
    <>
      <AdminPageHeader
        category="Procurement Master Database"
        title="Supplier Directory & CRM Pipeline"
        description="Authoritative master index of manufacturers, official distributors, and specialist partners. Controlled pipeline tracking from research through active trading."
        status={
          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#767A85', backgroundColor: '#EFEFED', padding: '2px 8px', borderRadius: 3 }}>
            {suppliers.length} Records Found
          </span>
        }
      />

      <ProcurementNav currentTab="suppliers" />

      {/* Search & Filter Toolbar */}
      <AdminSection>
        <form method="GET">
          <AdminToolbar
            actions={
              Boolean(query || status || country) && (
                <AdminAction href="/admin/procurement/suppliers" variant="ghost" size="sm">
                  Clear filters
                </AdminAction>
              )
            }
          >
            <AdminSearch
              name="q"
              defaultValue={query ?? ''}
              placeholder="Search suppliers, brands, emails, notes..."
              width={280}
            />

            <AdminFilter name="status" defaultValue={status ?? ''}>
              <option value="">All Pipeline Stages</option>
              <option value="RESEARCH">Research</option>
              <option value="TARGET">Target</option>
              <option value="CONTACT_TO_MAKE">Contact to Make</option>
              <option value="CONTACTED">Contacted</option>
              <option value="APPLICATION_AVAILABLE">Application Available</option>
              <option value="APPLICATION_SUBMITTED">Application Submitted</option>
              <option value="AWAITING_RESPONSE">Awaiting Response</option>
              <option value="APPROVED">Approved</option>
              <option value="ACCOUNT_OPEN">Account Open</option>
              <option value="TERMS_RECEIVED">Terms Received</option>
              <option value="TRADING">Trading</option>
              <option value="PAUSED">Paused</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
            </AdminFilter>

            <AdminFilter name="country" defaultValue={country ?? ''}>
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </AdminFilter>

            <button
              type="submit"
              style={{
                height: 30,
                padding: '0 12px',
                backgroundColor: '#111317',
                border: 'none',
                borderRadius: 3,
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Filter
            </button>
          </AdminToolbar>
        </form>
      </AdminSection>

      {/* Dense Supplier Master Table */}
      <AdminSection>
        <AdminPanel padding="none">
          <AdminTable
            columns={[
              'Supplier Entity',
              'Type & Country',
              'Procurement Pipeline Status',
              'Brands Supplied',
              'Primary Contact',
              'Application / Trade',
              { header: 'Action', align: 'right' },
            ]}
          >
            {suppliersWithMeta.map(({ supplier, primaryContact, brandCount, brandNames, remainingBrands, latestApp }) => {
              const currentStatus = supplier.procurementStatus ?? 'RESEARCH'

              return (
                <AdminTableRow
                  key={supplier.id}
                  cells={[
                    <div key="entity">
                      <Link
                        href={`/admin/procurement/suppliers/${supplier.id}`}
                        style={{ color: '#111317', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none', display: 'block', marginBottom: 2 }}
                      >
                        {supplier.name}
                      </Link>
                      <div style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                        {supplier.legalName ? `Legal: ${supplier.legalName}` : supplier.website ? (
                          <a href={supplier.website} target="_blank" rel="noopener noreferrer" style={{ color: '#494D55', textDecoration: 'none' }}>
                            {supplier.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : 'Unknown'}
                      </div>
                    </div>,

                    <div key="type">
                      <span style={{ fontSize: '0.75rem', color: '#111317', display: 'block', fontWeight: 500 }}>
                        {supplier.supplierType.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)' }}>
                        {supplier.country}
                      </span>
                    </div>,

                    <AdminStatus
                      key="status"
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
                    />,

                    <div key="brands">
                      {brandCount > 0 ? (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#111317' }}>
                            {brandNames.join(', ')}
                            {remainingBrands > 0 ? ` +${remainingBrands}` : ''}
                          </span>
                          <span style={{ fontSize: '0.625rem', color: '#767A85', display: 'block' }}>
                            {brandCount} brand{brandCount !== 1 ? 's' : ''} mapped
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: '#767A85', fontStyle: 'italic' }}>None linked</span>
                      )}
                    </div>,

                    <div key="contact">
                      {primaryContact ? (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#111317', display: 'block', fontWeight: 500 }}>
                            {primaryContact.firstName ? `${primaryContact.firstName} ${primaryContact.lastName}` : primaryContact.name}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                            {primaryContact.email ?? primaryContact.phone ?? primaryContact.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ) : supplier.contactEmail ? (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#767A85' }}>
                            {supplier.contactEmail}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>Unknown</span>
                      )}
                    </div>,

                    <div key="app">
                      {latestApp ? (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: latestApp.status === 'APPROVED' ? '#1A6E34' : '#111317', fontWeight: 500 }}>
                            {latestApp.status}
                          </span>
                          <span style={{ fontSize: '0.625rem', color: '#767A85', display: 'block' }}>
                            {latestApp.accountReference ? `Ref: ${latestApp.accountReference}` : latestApp.stage.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ) : supplier.dealerApplicationUrl ? (
                        <span style={{ fontSize: '0.6875rem', color: '#8b5cf6', fontFamily: 'var(--font-mono, monospace)', fontWeight: 500 }}>
                          Route available
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.6875rem', color: '#767A85' }}>No app on file</span>
                      )}
                    </div>,

                    <AdminAction key="action" href={`/admin/procurement/suppliers/${supplier.id}`} variant="secondary" size="sm">
                      Profile →
                    </AdminAction>,
                  ]}
                />
              )
            })}
          </AdminTable>
        </AdminPanel>
      </AdminSection>
    </>
  )
}
