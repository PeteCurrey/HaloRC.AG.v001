import Link from 'next/link'
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
    <div>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
        <Link href="/admin/procurement" style={{ color: 'var(--colour-ash)', textDecoration: 'none' }}>
          ← Back to Procurement
        </Link>
        <span style={{ color: 'var(--colour-smoke)' }}>/</span>
        <span style={{ color: 'var(--colour-race)' }}>Unmatched Products Queue</span>
      </div>

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
          <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-race)', borderRadius: '50%' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-race)', textTransform: 'uppercase' }}>
            Verification Required
          </span>
        </div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
          Unmatched Supplier Product Queue ({unmatched.length})
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '70ch', lineHeight: 'var(--leading-relaxed)' }}>
          Supplier feed items whose identity could not be proven through exact manufacturer SKU, part number, or GTIN.
          In accordance with Halo RC architectural invariants, UNMATCHED items remain strictly unmapped until manually reviewed.
          No fuzzy AI speculation or automated guessing is permitted.
        </p>
      </div>

      {unmatched.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-8)',
            backgroundColor: 'var(--colour-carbon)',
            border: '1px solid var(--colour-steel)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--colour-halo)', display: 'block', marginBottom: 'var(--space-2)' }}>
            QUEUE EMPTY
          </span>
          <p style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)', margin: 0 }}>
            All supplier feed items have been matched against verified canonical products or resolved.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {unmatched.map((item) => {
            const supplier = suppliers.find((s) => s.id === item.supplierId)

            return (
              <div
                key={item.id}
                style={{
                  padding: 'var(--space-5)',
                  backgroundColor: 'var(--colour-carbon)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                {/* Header info */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid var(--colour-steel)', paddingBottom: 'var(--space-3)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-halo)' }}>
                        {supplier?.name ?? item.supplierId}
                      </span>
                      <span style={{ color: 'var(--colour-smoke)' }}>•</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--colour-white)' }}>
                        SKU: {item.supplierSku}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--colour-white)', margin: 0 }}>
                      {item.rawTitle ?? 'Untitled Feed Item'}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    <span style={{ color: 'var(--colour-smoke)', display: 'block' }}>Reported Cost:</span>
                    <span style={{ color: 'var(--colour-white)', fontWeight: 600 }}>
                      {item.rawCostMinorUnits !== null && item.rawCostMinorUnits !== undefined
                        ? `${item.rawCurrency ?? 'GBP'} ${(item.rawCostMinorUnits / 100).toFixed(2)}`
                        : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Match Form */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <form
                    action={async (formData: FormData) => {
                      'use server'
                      const canonicalId = String(formData.get('canonicalProductId') || '')
                      if (!canonicalId) return
                      await manuallyMapSupplierProductAction(item.id, canonicalId, null, 'Manually mapped by admin')
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, minWidth: '320px' }}
                  >
                    <select
                      name="canonicalProductId"
                      required
                      style={{
                        flex: 1,
                        padding: 'var(--space-2) var(--space-3)',
                        backgroundColor: 'var(--colour-void)',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--colour-white)',
                        fontSize: 'var(--text-xs)',
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
                        padding: 'var(--space-2) var(--space-4)',
                        backgroundColor: 'var(--colour-halo)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--colour-void)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
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
                      await rejectSupplierMappingAction(item.id, 'Item not relevant to Halo RC competition catalogue')
                    }}
                  >
                    <button
                      type="submit"
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--colour-race)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--colour-race)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Reject Item
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
