"use client"

import { useState, useEffect } from 'react'

const CANONICAL_FIELDS = [
  'IGNORE', 'supplier_sku', 'manufacturer_sku', 'ean', 'product_name',
  'description', 'brand', 'category', 'net_price', 'rrp', 'currency',
  'stock_quantity', 'availability', 'product_url', 'image_url', 'weight_grams', 'notes',
]

const FIELD_LABELS: Record<string, string> = {
  IGNORE: '— Ignore —',
  supplier_sku: 'Supplier SKU',
  manufacturer_sku: 'Manufacturer SKU / Part No.',
  ean: 'EAN / GTIN',
  product_name: 'Product Name',
  description: 'Description',
  brand: 'Brand',
  category: 'Category',
  net_price: 'Net Price (Supplier Cost)',
  rrp: 'RRP',
  currency: 'Currency',
  stock_quantity: 'Stock Quantity',
  availability: 'Availability',
  product_url: 'Product URL',
  image_url: 'Image URL',
  weight_grams: 'Weight (grams)',
  notes: 'Notes',
}

interface FieldMappingEditorProps {
  supplierId: string
  detectedColumns?: string[]
}

export function FieldMappingEditor({ supplierId, detectedColumns = [] }: FieldMappingEditorProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [mapName, setMapName] = useState('Default')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/suppliers/${supplierId}/field-map`)
      .then((r) => r.json())
      .then((data) => {
        if (data.fieldMap) {
          setMappings(data.fieldMap.mappings ?? {})
          setMapName(data.fieldMap.mapName ?? 'Default')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [supplierId])

  const columns = detectedColumns.length > 0 ? detectedColumns : Object.keys(mappings)

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/field-map`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapName, mappings }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(body.error)
      }
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ color: '#767A85', fontSize: '0.8125rem' }}>Loading field map…</div>

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: '0.8125rem', color: '#494D55' }}>
          Map this supplier&apos;s CSV column headers to Avorria&apos;s canonical fields.
          Columns marked <strong>Ignore</strong> will not be imported.
        </div>
      </div>

      {columns.length === 0 && (
        <div style={{ padding: '16px', backgroundColor: '#FAFAF9', border: '1px solid #E2E2DE', borderRadius: 4, fontSize: '0.8125rem', color: '#767A85' }}>
          Upload a CSV first to see its columns, or map manually by adding column names below.
        </div>
      )}

      {columns.length > 0 && (
        <div style={{ border: '1px solid #E2E2DE', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #E2E2DE' }}>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#767A85', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier Column</th>
                <th style={{ padding: '8px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#767A85', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maps To</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col} style={{ borderBottom: '1px solid #EBEBEB' }}>
                  <td style={{ padding: '8px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111317' }}>{col}</td>
                  <td style={{ padding: '6px 16px' }}>
                    <select
                      value={mappings[col] ?? 'IGNORE'}
                      onChange={(e) => setMappings((prev) => ({ ...prev, [col]: e.target.value }))}
                      style={{
                        padding: '4px 8px', border: '1px solid #D0D0CC', borderRadius: 3,
                        fontSize: '0.8125rem', color: '#111317', backgroundColor: '#FFFFFF',
                        fontFamily: 'inherit', minWidth: 200,
                      }}
                    >
                      {CANONICAL_FIELDS.map((f) => (
                        <option key={f} value={f}>{FIELD_LABELS[f] ?? f}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={mapName}
          onChange={(e) => setMapName(e.target.value)}
          placeholder="Map name"
          style={{ padding: '6px 10px', border: '1px solid #D0D0CC', borderRadius: 3, fontSize: '0.8125rem', color: '#111317', minWidth: 160 }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '6px 16px', backgroundColor: '#111317', color: '#FFFFFF', border: 'none', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save Field Map'}
        </button>
        {saved && <span style={{ fontSize: '0.8125rem', color: '#1A6E34' }}>✓ Saved</span>}
        {error && <span style={{ fontSize: '0.8125rem', color: '#C8001A' }}>{error}</span>}
      </div>
    </div>
  )
}
