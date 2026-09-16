import Link from 'next/link'
import { getAdminBrands } from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminAction,
} from '@/components/admin'

export const revalidate = 0

export default async function AdminBrandsPage() {
  const brands = await getAdminBrands()

  const columns = [
    { header: 'Brand Name', width: '25%' },
    { header: 'Slug', width: '20%' },
    { header: 'Tier', width: '15%' },
    { header: 'Origin', width: '15%' },
    { header: 'Status', width: '10%' },
    { header: 'Catalogue Link', width: '15%', align: 'right' as const },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        category="Authoritative Catalogue"
        title="Brands & Supply Partners"
        description="Managed manufacturers, authorized distributors, and tier classifications."
      />

      {/* Brands Table */}
      <AdminTable columns={columns} emptyMessage="No brands registered.">
        {brands.map((b) => (
          <AdminTableRow key={b.id}>
            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
              {b.name}
            </td>

            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-tertiary, #767A85)' }}>
              /{b.slug}
            </td>

            <td style={{ padding: '10px 14px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.6875rem',
                  padding: '2px 6px',
                  borderRadius: 'var(--admin-radius-sm, 3px)',
                  backgroundColor:
                    b.tier === 'HALO_SCALE' || b.tier === 'PREMIUM_COMPETITION'
                      ? 'rgba(184, 147, 90, 0.1)'
                      : 'var(--admin-surface-well, #EFEFED)',
                  color:
                    b.tier === 'HALO_SCALE' || b.tier === 'PREMIUM_COMPETITION'
                      ? 'var(--admin-accent, #B8935A)'
                      : 'var(--admin-text-secondary, #494D55)',
                  border: `1px solid ${
                    b.tier === 'HALO_SCALE' || b.tier === 'PREMIUM_COMPETITION'
                      ? 'var(--admin-accent-border, rgba(184, 147, 90, 0.28))'
                      : 'var(--admin-border, #E2E2DE)'
                  }`,
                }}
              >
                {b.tier}
              </span>
            </td>

            <td style={{ padding: '10px 14px', color: 'var(--admin-text-secondary, #494D55)' }}>
              {b.countryOfOrigin}
            </td>

            <td style={{ padding: '10px 14px' }}>
              <AdminStatus
                status={b.status === 'ACTIVE' ? 'active' : 'neutral'}
                label={b.status}
              />
            </td>

            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
              <AdminAction
                variant="subtle"
                size="sm"
                href={`/admin/products?brandId=${b.id}`}
              >
                View Products &rarr;
              </AdminAction>
            </td>
          </AdminTableRow>
        ))}
      </AdminTable>
    </div>
  )
}
