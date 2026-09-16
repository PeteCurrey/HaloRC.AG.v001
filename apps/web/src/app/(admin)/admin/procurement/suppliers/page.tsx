import Link from 'next/link'
import {
  searchSuppliers,
  getSupplierContacts,
  getBrandSupplierRelationships,
  getTradeAccountApplications,
  SEED_BRANDS,
} from '@halo-rc/db'
import type { ProcurementStatus, SupplierRecord } from '@halo-rc/types'
import { ProcurementNav } from '../ProcurementNav'

interface PageProps {
  searchParams: Promise<{
    q?: string
    country?: string
    status?: string
    type?: string
  }>
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  RESEARCH: { bg: 'rgba(148, 163, 184, 0.1)', text: 'var(--colour-ash)', border: 'var(--colour-steel)' },
  TARGET: { bg: 'rgba(148, 163, 184, 0.15)', text: 'var(--colour-silver)', border: 'var(--colour-steel)' },
  CONTACT_TO_MAKE: { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b', border: '#f59e0b' },
  CONTACTED: { bg: 'rgba(59, 130, 246, 0.1)', text: '#60a5fa', border: '#3b82f6' },
  APPLICATION_AVAILABLE: { bg: 'rgba(139, 92, 246, 0.1)', text: '#a78bfa', border: '#8b5cf6' },
  APPLICATION_SUBMITTED: { bg: 'rgba(236, 72, 153, 0.1)', text: '#f472b6', border: '#ec4899' },
  AWAITING_RESPONSE: { bg: 'rgba(249, 115, 22, 0.1)', text: '#fb923c', border: '#f97316' },
  APPROVED: { bg: 'var(--colour-halo-10)', text: 'var(--colour-halo)', border: 'var(--colour-halo)' },
  ACCOUNT_OPEN: { bg: 'var(--colour-halo-10)', text: 'var(--colour-halo)', border: 'var(--colour-halo)' },
  TERMS_RECEIVED: { bg: 'rgba(16, 185, 129, 0.1)', text: '#34d399', border: '#10b981' },
  TRADING: { bg: 'rgba(5, 150, 105, 0.15)', text: '#10b981', border: '#059669' },
  PAUSED: { bg: 'rgba(100, 116, 139, 0.1)', text: 'var(--colour-slate)', border: 'var(--colour-steel)' },
  REJECTED: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--colour-race)', border: 'var(--colour-race)' },
  CLOSED: { bg: 'rgba(51, 65, 85, 0.2)', text: 'var(--colour-slate)', border: 'var(--colour-steel)' },
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
    <div>
      <ProcurementNav currentTab="suppliers" />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
              Procurement Master Database
            </span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
            Supplier Directory &amp; CRM Pipeline
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-ash)', maxWidth: '64ch', lineHeight: 'var(--leading-relaxed)' }}>
            Authoritative master index of manufacturers, official distributors, and specialist partners. Controlled pipeline tracking from research through active trading.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--colour-ash)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-sm)' }}>
            {suppliers.length} Records Found
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <form
        method="GET"
        style={{
          backgroundColor: 'var(--colour-carbon)',
          border: '1px solid var(--colour-steel)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 240px' }}>
          <input
            type="text"
            name="q"
            defaultValue={query ?? ''}
            placeholder="Search suppliers, brands, emails, notes..."
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-charcoal)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>

        <div style={{ minWidth: 160 }}>
          <select
            name="status"
            defaultValue={status ?? ''}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-charcoal)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
            }}
          >
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
          </select>
        </div>

        <div style={{ minWidth: 140 }}>
          <select
            name="country"
            defaultValue={country ?? ''}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3)',
              backgroundColor: 'var(--colour-charcoal)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-white)',
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            <option value="">All Countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

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
            textTransform: 'uppercase',
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          Filter
        </button>

        {(query || status || country) && (
          <Link
            href="/admin/procurement/suppliers"
            style={{
              padding: 'var(--space-2) var(--space-3)',
              color: 'var(--colour-ash)',
              fontSize: 'var(--text-xs)',
              textDecoration: 'none',
              fontFamily: 'var(--font-mono)',
            }}
          >
            Reset
          </Link>
        )}
      </form>

      {/* Dense Supplier Master Table */}
      <div style={{ backgroundColor: 'var(--colour-carbon)', border: '1px solid var(--colour-steel)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--colour-steel)', backgroundColor: 'var(--colour-charcoal)' }}>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Supplier Entity
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Type &amp; Country
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Procurement Pipeline Status
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Brands Supplied
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Primary Contact
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase' }}>
                Application / Trade
              </th>
              <th style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--colour-smoke)', textTransform: 'uppercase', textAlign: 'right' }}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliersWithMeta.map(({ supplier, primaryContact, brandCount, brandNames, remainingBrands, latestApp }) => {
              const currentStatus = supplier.procurementStatus ?? 'RESEARCH'
              const colorInfo = STATUS_COLOR_MAP[currentStatus] ?? STATUS_COLOR_MAP.RESEARCH

              return (
                <tr key={supplier.id} style={{ borderBottom: '1px solid var(--colour-steel)', transition: 'background-color 0.15s ease' }}>
                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <Link
                      href={`/admin/procurement/suppliers/${supplier.id}`}
                      style={{ color: 'var(--colour-white)', fontWeight: 600, fontSize: 'var(--text-sm)', textDecoration: 'none', display: 'block', marginBottom: 2 }}
                    >
                      {supplier.name}
                    </Link>
                    <div style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                      {supplier.legalName ? `Legal: ${supplier.legalName}` : supplier.website ? (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--colour-smoke)', textDecoration: 'none' }}>
                          {supplier.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : 'Unknown'}
                    </div>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-white)', display: 'block' }}>
                      {supplier.supplierType.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--colour-ash)', fontFamily: 'var(--font-mono)' }}>
                      {supplier.country}
                    </span>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        backgroundColor: colorInfo?.bg ?? 'transparent',
                        color: colorInfo?.text ?? 'var(--colour-ash)',
                        border: `1px solid ${colorInfo?.border ?? 'var(--colour-steel)'}`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {currentStatus.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {brandCount > 0 ? (
                      <div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-white)' }}>
                          {brandNames.join(', ')}
                          {remainingBrands > 0 ? ` +${remainingBrands}` : ''}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--colour-ash)', display: 'block' }}>
                          {brandCount} brand{brandCount !== 1 ? 's' : ''} mapped
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--colour-slate)', fontStyle: 'italic' }}>None linked</span>
                    )}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {primaryContact ? (
                      <div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-white)', display: 'block' }}>
                          {primaryContact.firstName ? `${primaryContact.firstName} ${primaryContact.lastName}` : primaryContact.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--colour-ash)' }}>
                          {primaryContact.email ?? primaryContact.phone ?? primaryContact.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ) : supplier.contactEmail ? (
                      <div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-ash)' }}>
                          {supplier.contactEmail}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--colour-slate)' }}>Unknown</span>
                    )}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                    {latestApp ? (
                      <div>
                        <span style={{ fontSize: 'var(--text-xs)', color: latestApp.status === 'APPROVED' ? 'var(--colour-halo)' : 'var(--colour-white)' }}>
                          {latestApp.status}
                        </span>
                        <span style={{ fontSize: '10px', color: 'var(--colour-ash)', display: 'block' }}>
                          {latestApp.accountReference ? `Ref: ${latestApp.accountReference}` : latestApp.stage.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ) : supplier.dealerApplicationUrl ? (
                      <span style={{ fontSize: '11px', color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>
                        Route available
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--colour-slate)' }}>No app on file</span>
                    )}
                  </td>

                  <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                    <Link
                      href={`/admin/procurement/suppliers/${supplier.id}`}
                      style={{
                        display: 'inline-block',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--colour-halo)',
                        textDecoration: 'none',
                        padding: '2px 8px',
                        backgroundColor: 'var(--colour-charcoal)',
                        border: '1px solid var(--colour-steel)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      Profile &rarr;
                    </Link>
                  </td>
                </tr>
              )
            })}

            {suppliers.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                  No suppliers match the current query and filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
