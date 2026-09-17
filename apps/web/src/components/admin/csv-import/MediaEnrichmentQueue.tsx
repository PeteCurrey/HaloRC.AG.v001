"use client"

import { useState, useEffect } from 'react'

interface MediaItem {
  id: string
  supplierSku: string
  manufacturerSku: string | null
  eanGtin: string | null
  productName: string
  brand: string | null
  enrichmentStatus: string
  imageUrl: string | null
  imageSourceUrl: string | null
  imageRightsStatus: string
}

interface MediaEnrichmentQueueProps {
  supplierId: string
}

const STATUS_COLOUR: Record<string, string> = {
  PENDING: '#B8935A',
  MATCHED: '#1A6E34',
  UNMATCHED: '#C8001A',
  MANUAL_REQUIRED: '#B45309',
  CLEARED: '#494D55',
}

export function MediaEnrichmentQueue({ supplierId }: MediaEnrichmentQueueProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('PENDING')

  const reload = () => {
    fetch(`/api/suppliers/${supplierId}/media-queue?status=${filter}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [supplierId, filter]) // eslint-disable-line

  if (loading) return <div style={{ padding: '16px', color: '#767A85', fontSize: '0.8125rem' }}>Loading media queue…</div>

  return (
    <div>
      <div style={{ fontSize: '0.8125rem', color: '#494D55', marginBottom: 12 }}>
        Products that arrived without imagery. Source images from the supplier&apos;s official website only.
        Do <strong>not</strong> use AI-generated or unsourced images.
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {['PENDING', 'MATCHED', 'UNMATCHED', 'MANUAL_REQUIRED', 'CLEARED'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '3px 10px', fontSize: '0.625rem', fontFamily: 'var(--font-mono)',
            border: '1px solid', borderRadius: 3, cursor: 'pointer',
            backgroundColor: filter === s ? '#111317' : 'transparent',
            color: filter === s ? '#FFFFFF' : '#494D55',
            borderColor: filter === s ? '#111317' : '#D0D0CC',
            letterSpacing: '0.05em',
          }}>{s}</button>
        ))}
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#767A85', fontSize: '0.8125rem' }}>
          No items with status {filter}.
        </div>
      ) : (
        <div style={{ border: '1px solid #E2E2DE', borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #E2E2DE' }}>
                {['Product Name', 'Supplier SKU', 'MPN', 'EAN', 'Brand', 'Image Status', 'Rights'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#767A85', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #EBEBEB' }}>
                  <td style={{ padding: '8px 12px', color: '#111317', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.productName}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#B8935A' }}>{item.supplierSku}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#494D55' }}>{item.manufacturerSku ?? '—'}</td>
                  <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#494D55' }}>{item.eanGtin ?? '—'}</td>
                  <td style={{ padding: '8px 12px', color: '#494D55' }}>{item.brand ?? '—'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 700, color: STATUS_COLOUR[item.enrichmentStatus] ?? '#767A85' }}>
                      {item.enrichmentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: item.imageRightsStatus === 'CLEARED' ? '#1A6E34' : '#B45309' }}>
                    {item.imageRightsStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
