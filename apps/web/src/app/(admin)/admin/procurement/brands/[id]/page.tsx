import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  SEED_BRANDS,
  getBrandSourcingView,
  getBrandSupplierRelationships,
  getSuppliers,
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
import { ProcurementNav } from '../../ProcurementNav'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BrandProcurementDetailPage({ params }: PageProps) {
  const { id } = await params
  const brand = SEED_BRANDS.find((b) => b.id === id || b.slug === id)
  if (!brand) notFound()

  const [ukSourcing, usSourcing, allRelationships, suppliers] = await Promise.all([
    getBrandSourcingView(brand.id, 'UK'),
    getBrandSourcingView(brand.id, 'USA'),
    getBrandSupplierRelationships(brand.id),
    getSuppliers(),
  ])

  const relsWithSupplier = allRelationships.map((r) => {
    const supplier = suppliers.find((s) => s.id === r.supplierId)
    return {
      ...r,
      supplier,
    }
  })

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Procurement', href: '/admin/procurement' },
          { label: 'Brands', href: '/admin/procurement/brands' },
          { label: brand.name },
        ]}
        title={brand.name}
        description={`Origin: ${brand.countryOfOrigin ?? 'Unknown'}${brand.website ? ` • ${brand.website.replace(/^https?:\/\//, '')}` : ''}`}
        status={
          <AdminStatus
            status="neutral"
            label={brand.tier}
          />
        }
      />

      <ProcurementNav currentTab="brands" />

      {/* Sourcing Overview Cards */}
      <AdminSection>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
          {/* UK Route */}
          <AdminPanel
            title="UK Sourcing Route"
            badge={
              <AdminStatus
                status={ukSourcing.isPurchasableInTerritory ? 'verified' : 'neutral'}
                label={ukSourcing.isPurchasableInTerritory ? 'Purchasable' : 'No Verified Route'}
              />
            }
            padding="md"
          >
            {ukSourcing.directManufacturer && (
              <div style={{ padding: 12, backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE', marginBottom: 10 }}>
                <span style={{ fontSize: '0.6875rem', color: '#767A85', display: 'block' }}>Direct Manufacturer</span>
                <Link href={`/admin/procurement/suppliers/${ukSourcing.directManufacturer.id}`} style={{ color: '#111317', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                  {ukSourcing.directManufacturer.name}
                </Link>
              </div>
            )}
            {ukSourcing.verifiedDistributors.map((vd) => (
              <div key={vd.relationship.id} style={{ padding: 12, backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE', marginBottom: 10 }}>
                <span style={{ fontSize: '0.6875rem', color: '#B8935A', display: 'block', fontWeight: 600 }}>Official Distributor</span>
                <Link href={`/admin/procurement/suppliers/${vd.supplier.id}`} style={{ color: '#111317', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                  {vd.supplier.name}
                </Link>
                <div style={{ fontSize: '0.6875rem', color: '#767A85', marginTop: 2 }}>
                  Account: {vd.supplier.procurementStatus ?? vd.supplier.relationshipStatus}
                </div>
              </div>
            ))}
            {ukSourcing.verifiedDistributors.length === 0 && !ukSourcing.directManufacturer && (
              <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                No verified UK supply routes.
              </p>
            )}
          </AdminPanel>

          {/* US Route */}
          <AdminPanel
            title="USA Sourcing Route"
            badge={
              <AdminStatus
                status={usSourcing.isPurchasableInTerritory ? 'verified' : 'neutral'}
                label={usSourcing.isPurchasableInTerritory ? 'Purchasable' : 'No Verified Route'}
              />
            }
            padding="md"
          >
            {usSourcing.verifiedDistributors.map((vd) => (
              <div key={vd.relationship.id} style={{ padding: 12, backgroundColor: '#FAFAF9', borderRadius: 4, border: '1px solid #E2E2DE', marginBottom: 10 }}>
                <span style={{ fontSize: '0.6875rem', color: '#494D55', display: 'block' }}>
                  Official Distributor {vd.relationship.isExclusive && '[EXCLUSIVE]'}
                </span>
                <Link href={`/admin/procurement/suppliers/${vd.supplier.id}`} style={{ color: '#111317', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}>
                  {vd.supplier.name}
                </Link>
              </div>
            ))}
            {usSourcing.verifiedDistributors.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: '#767A85', fontStyle: 'italic', margin: 0 }}>
                No verified US supply routes.
              </p>
            )}
          </AdminPanel>
        </div>
      </AdminSection>

      {/* All Suppliers Mapping Table */}
      <AdminSection>
        <AdminPanel
          title={`All Sourcing & Distribution Relationships (${relsWithSupplier.length})`}
          padding="none"
        >
          <AdminTable
            columns={[
              'Supplier',
              'Relationship',
              'Territory',
              'Verification',
              'Evidence',
              { header: 'Action', align: 'right' },
            ]}
          >
            {relsWithSupplier.map((r) => (
              <AdminTableRow
                key={r.id}
                cells={[
                  <Link
                    key="name"
                    href={`/admin/procurement/suppliers/${r.supplierId}`}
                    style={{ color: '#111317', fontWeight: 600, fontSize: '0.8125rem', textDecoration: 'none' }}
                  >
                    {r.supplier?.name ?? r.supplierId}
                  </Link>,

                  <span key="rel" style={{ fontSize: '0.75rem', color: '#494D55' }}>
                    {r.relationshipType.replace(/_/g, ' ')} {r.isExclusive && '• [EXCLUSIVE]'}
                  </span>,

                  <span key="terr" style={{ fontSize: '0.75rem', color: '#767A85', fontFamily: 'var(--font-mono, monospace)' }}>
                    {r.territory}
                  </span>,

                  <AdminStatus
                    key="ver"
                    status={r.verificationStatus === 'VERIFIED' ? 'verified' : 'warning'}
                    label={r.verificationStatus}
                  />,

                  <span key="evidence" style={{ fontSize: '0.6875rem', color: '#767A85' }}>
                    {r.evidenceSourceType} {r.evidenceNotes ? `— ${r.evidenceNotes}` : ''}
                  </span>,

                  <AdminAction key="action" href={`/admin/procurement/suppliers/${r.supplierId}`} variant="secondary" size="sm">
                    Supplier →
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
