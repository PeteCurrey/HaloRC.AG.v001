import Link from 'next/link'
import {
  getSuppliers,
  getSupplierTerritoryCoverages,
  calculateProcurementReadiness,
  calculateSupplierOpportunityScore,
} from '@halo-rc/db'
import { ProcurementNav } from '../ProcurementNav'

export default async function ProcurementSuppliersDirectoryPage() {
  const suppliers = await getSuppliers()

  // Fetch readiness and opportunity scores for all suppliers
  const supplierRows = await Promise.all(
    suppliers.map(async (supplier) => {
      const territories = await getSupplierTerritoryCoverages(supplier.id)
      const readiness = await calculateProcurementReadiness(supplier.id)
      const opportunity = await calculateSupplierOpportunityScore(supplier.id)
      return {
        supplier,
        territories,
        readiness,
        opportunity,
      }
    })
  )

  return (
    <div>
      <ProcurementNav currentTab="suppliers" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Procurement Directory
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Suppliers &amp; Distributors
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Directory of manufacturers, authorised distributors, and wholesale partners. Evaluated on 7-factor readiness and strategic opportunity scoring.
          </p>
        </div>

        <Link
          href="/admin/procurement/import"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: 'var(--space-2) var(--space-4)',
            backgroundColor: 'var(--colour-halo-10)',
            border: '1px solid var(--colour-halo)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--colour-halo)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            textDecoration: 'none',
          }}
        >
          + Add Supplier
        </Link>
      </div>

      {/* Suppliers Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Supplier / Legal Entity
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Type / Region
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Territories
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Status
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Procurement Readiness
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Opportunity
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', textTransform: 'uppercase', textAlign: 'right' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {supplierRows.map(({ supplier, territories, readiness, opportunity }) => (
              <tr key={supplier.id} style={{ borderBottom: '1px solid var(--colour-steel)' }}>
                <td style={{ padding: 'var(--space-4)' }}>
                  <Link
                    href={`/admin/procurement/suppliers/${supplier.id}`}
                    style={{ color: 'var(--colour-white)', fontWeight: 600, textDecoration: 'none', display: 'block', marginBottom: 2 }}
                  >
                    {supplier.name}
                  </Link>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    {supplier.legalName ?? supplier.slug} • {supplier.accountReference ? `Acc: ${supplier.accountReference}` : 'No Acc Ref'}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      backgroundColor: 'var(--colour-charcoal)',
                      border: '1px solid var(--colour-steel)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--colour-smoke)',
                      marginBottom: 2,
                    }}
                  >
                    {supplier.supplierType.replace('_', ' ')}
                  </span>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                    Country: {supplier.country} • Currency: {supplier.currency}
                  </div>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                    {territories.map((t) => (
                      <span
                        key={t.id}
                        style={{
                          padding: '1px 5px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          backgroundColor: t.state === 'SUPPORTED' ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                          color: t.state === 'SUPPORTED' ? 'var(--colour-halo)' : 'var(--colour-ash)',
                          border: `1px solid ${t.state === 'SUPPORTED' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                        }}
                      >
                        {t.territory}: {t.state}
                      </span>
                    ))}
                    {territories.length === 0 && (
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>Unassigned</span>
                    )}
                  </div>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--text-xs)',
                      fontFamily: 'var(--font-mono)',
                      backgroundColor: supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                      color: supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-ash)',
                      border: `1px solid ${supplier.relationshipStatus === 'ACTIVE' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                    }}
                  >
                    {supplier.relationshipStatus}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
                    <div style={{ flex: 1, height: 6, backgroundColor: 'var(--colour-charcoal)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${readiness.score}%`,
                          backgroundColor: readiness.isProcurementReady ? 'var(--colour-halo)' : 'var(--colour-race)',
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: readiness.isProcurementReady ? 'var(--colour-halo)' : 'var(--colour-race)', fontWeight: 600 }}>
                      {readiness.score}%
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                    {readiness.state.replace('_', ' ')}
                  </span>
                </td>

                <td style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        backgroundColor: opportunity.tier === 'HIGH' ? 'var(--colour-halo-10)' : 'var(--colour-charcoal)',
                        color: opportunity.tier === 'HIGH' ? 'var(--colour-halo)' : 'var(--colour-white)',
                        border: `1px solid ${opportunity.tier === 'HIGH' ? 'var(--colour-halo)' : 'var(--colour-steel)'}`,
                      }}
                    >
                      {opportunity.tier} ({opportunity.overallScore})
                    </span>
                  </div>
                </td>

                <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                  <Link
                    href={`/admin/procurement/suppliers/${supplier.id}`}
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
                    View Profile &rarr;
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
