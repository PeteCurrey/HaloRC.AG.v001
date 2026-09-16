import {
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminAction,
  AdminEmptyState,
} from '@/components/admin'
import {
  getUnmatchedSupplierProducts,
  getSuppliers,
  SEED_PRODUCTS,
} from '@halo-rc/db'
import {
  manuallyMapSupplierProductAction,
  rejectSupplierMappingAction,
} from '@/actions/procurement'

export default async function UnmatchedProductQueuePage() {
  const unmatched = await getUnmatchedSupplierProducts()
  const suppliers = await getSuppliers()

  return (
    <>
      <AdminPageHeader
        breadcrumbs={[
          { label: 'Procurement', href: '/admin/procurement' },
          { label: 'Unmatched Products Queue' },
        ]}
        category="Verification Required"
        title={`Unmatched Supplier Product Queue (${unmatched.length})`}
        description="Supplier feed items whose identity could not be proven through exact manufacturer SKU, part number, or GTIN. In accordance with Avorria RC architectural invariants, UNMATCHED items remain strictly unmapped until manually reviewed. No fuzzy AI speculation or automated guessing is permitted."
      />

      <AdminSection>
        {unmatched.length === 0 ? (
          <AdminEmptyState
            title="QUEUE EMPTY"
            description="All supplier feed items have been matched against verified canonical products or resolved."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {unmatched.map((item) => {
              const supplier = suppliers.find((s) => s.id === item.supplierId)

              return (
                <AdminPanel key={item.id} padding="md">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* Header info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--admin-border-subtle, #EBEBE7)',
                        paddingBottom: 12,
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', color: '#B8935A' }}>
                            {supplier?.name ?? item.supplierId}
                          </span>
                          <span style={{ color: '#767A85' }}>•</span>
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.6875rem', fontWeight: 600, color: '#111317' }}>
                            SKU: {item.supplierSku}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#111317', margin: 0 }}>
                          {item.rawTitle ?? 'Untitled Feed Item'}
                        </h3>
                      </div>

                      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.75rem' }}>
                        <span style={{ color: '#767A85', display: 'block', fontSize: '0.6875rem' }}>Reported Cost:</span>
                        <span style={{ color: '#111317', fontWeight: 600 }}>
                          {item.rawCostMinorUnits !== null && item.rawCostMinorUnits !== undefined
                            ? `${item.rawCurrency ?? 'GBP'} ${(item.rawCostMinorUnits / 100).toFixed(2)}`
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Match Form */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <form
                        action={async (formData: FormData) => {
                          'use server'
                          const canonicalId = String(formData.get('canonicalProductId') || '')
                          if (!canonicalId) return
                          await manuallyMapSupplierProductAction(item.id, canonicalId, null, 'Manually mapped by admin')
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: '320px' }}
                      >
                        <select
                          name="canonicalProductId"
                          required
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            backgroundColor: 'var(--admin-surface, #FFFFFF)',
                            border: '1px solid var(--admin-border, #E2E2DE)',
                            borderRadius: 'var(--admin-radius-sm, 3px)',
                            color: 'var(--admin-text-primary, #111317)',
                            fontSize: '0.75rem',
                            fontFamily: 'inherit',
                          }}
                        >
                          <option value="">Select Canonical Product to Link...</option>
                          {SEED_PRODUCTS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          style={{
                            padding: '6px 14px',
                            backgroundColor: '#111317',
                            border: 'none',
                            borderRadius: 'var(--admin-radius-sm, 3px)',
                            color: '#FFFFFF',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Approve Match
                        </button>
                      </form>

                      {/* Reject Form */}
                      <form
                        action={async () => {
                          'use server'
                          await rejectSupplierMappingAction(item.id, 'Item not relevant to Avorria RC competition catalogue')
                        }}
                      >
                        <button
                          type="submit"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: 'transparent',
                            border: '1px solid #C8001A',
                            borderRadius: 'var(--admin-radius-sm, 3px)',
                            color: '#C8001A',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '0.6875rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Reject Item
                        </button>
                      </form>
                    </div>
                  </div>
                </AdminPanel>
              )
            })}
          </div>
        )}
      </AdminSection>
    </>
  )
}
