"use client"

import { useState, useEffect, useCallback } from 'react'

type PipelineStage =
  | 'UPLOAD' | 'FILE_VALIDATION' | 'COLUMN_DETECTION' | 'FIELD_MAPPING'
  | 'NORMALISING' | 'SKU_MATCHING' | 'DEDUP' | 'VALIDATION'
  | 'MEDIA_ENRICHMENT' | 'REVIEW' | 'COMMITTED' | 'ROLLED_BACK' | 'REJECTED'

const STAGE_ORDER: PipelineStage[] = [
  'UPLOAD', 'FILE_VALIDATION', 'COLUMN_DETECTION', 'FIELD_MAPPING',
  'NORMALISING', 'SKU_MATCHING', 'DEDUP', 'VALIDATION', 'MEDIA_ENRICHMENT', 'REVIEW',
]

const STAGE_LABELS: Record<string, string> = {
  UPLOAD: 'Upload', FILE_VALIDATION: 'File Validation', COLUMN_DETECTION: 'Column Detection',
  FIELD_MAPPING: 'Field Mapping', NORMALISING: 'Normalise', SKU_MATCHING: 'SKU Match',
  DEDUP: 'Dedup', VALIDATION: 'Validate', MEDIA_ENRICHMENT: 'Media', REVIEW: 'Review',
}

interface ImportRow {
  id: string
  sourceFilename: string
  sourceRowNumber: number
  supplierSku: string | null
  productName: string | null
  rowAction: string
  matchConfidence: string
  rowStatus: string
  validationErrors: string[]
  validationWarnings: string[]
}

interface Job {
  id: string
  status: string
  currentStage: string
  rowsTotal: number
  rowsValid: number
  rowsInvalid: number
  rowsDuplicate: number
  rowsCommitted: number
  newProducts: number
  updatedProducts: number
  priceChanges: number
  stockChanges: number
  filenames: string[]
  errors: string[]
  warnings: string[]
  committedAt: string | null
  rolledBackAt: string | null
}

interface Preview {
  rowsDetected: number
  validRows: number
  invalidRows: number
  newProducts: number
  existingProducts: number
  duplicateRows: number
  missingRequiredFields: number
  missingImagery: number
  priceChanges: number
  stockChanges: number
}

interface ImportPipelineViewProps {
  jobId: string
  supplierId: string
}

export function ImportPipelineView({ jobId, supplierId }: ImportPipelineViewProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [rowFilter, setRowFilter] = useState<string>('ALL')

  const refresh = useCallback(async () => {
    try {
      const [jobRes, rowsRes] = await Promise.all([
        fetch(`/api/suppliers/${supplierId}/import/${jobId}`),
        fetch(`/api/suppliers/${supplierId}/import/${jobId}/rows?limit=500`),
      ])
      if (jobRes.ok) {
        const data = await jobRes.json()
        setJob(data.job)
        setPreview(data.preview)
      }
      if (rowsRes.ok) {
        const data = await rowsRes.json()
        setRows(data.rows)
      }
    } finally {
      setLoading(false)
    }
  }, [jobId, supplierId])

  useEffect(() => { refresh() }, [refresh])

  const handleCommit = async () => {
    if (!confirm('Commit all valid rows? This will create/update supplier products.')) return
    setActionInProgress(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/import/${jobId}/commit`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Commit failed' }))
        throw new Error(body.error)
      }
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Commit failed')
    } finally {
      setActionInProgress(false)
    }
  }

  const handleRollback = async () => {
    const reason = prompt('Rollback reason (required):')
    if (!reason) return
    setActionInProgress(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/import/${jobId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Rollback failed' }))
        throw new Error(body.error)
      }
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Rollback failed')
    } finally {
      setActionInProgress(false)
    }
  }

  if (loading) return <div style={{ padding: 32, color: '#767A85', fontSize: '0.8125rem' }}>Loading import job…</div>
  if (!job) return <div style={{ padding: 32, color: '#C8001A', fontSize: '0.8125rem' }}>Job not found.</div>

  const currentStageIdx = STAGE_ORDER.indexOf(job.currentStage as PipelineStage)

  const filteredRows = rows.filter((r) => rowFilter === 'ALL' || r.rowStatus === rowFilter)

  const statusColour = (s: string) => {
    if (s === 'COMMITTED') return '#1A6E34'
    if (s === 'ROLLED_BACK' || s === 'REJECTED' || s === 'FAILED') return '#C8001A'
    if (s === 'REVIEW_REQUIRED' || s === 'READY') return '#B8935A'
    return '#767A85'
  }

  return (
    <div>
      {/* Job header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: '#767A85', marginBottom: 2 }}>JOB ID: {job.id}</div>
          <div style={{ fontSize: '0.75rem', color: '#494D55' }}>
            {job.filenames.join(', ')} · {job.rowsTotal} rows
          </div>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
          padding: '3px 8px', borderRadius: 3,
          backgroundColor: 'rgba(184,147,90,0.1)', color: statusColour(job.status), fontWeight: 700,
        }}>
          {job.status}
        </span>
      </div>

      {/* Pipeline stage visualiser */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {STAGE_ORDER.map((stage, idx) => {
          const isPast = idx < currentStageIdx
          const isCurrent = idx === currentStageIdx
          const isTerminal = ['COMMITTED', 'ROLLED_BACK', 'REJECTED'].includes(job.status)
          return (
            <div
              key={stage}
              style={{
                padding: '4px 10px',
                borderRadius: 3,
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.05em',
                backgroundColor: isCurrent && !isTerminal ? '#111317' : isPast || isTerminal ? '#EFEFED' : '#F9F9F8',
                color: isCurrent && !isTerminal ? '#FFFFFF' : isPast ? '#B8935A' : '#AAAAAA',
                fontWeight: isCurrent ? 700 : 400,
                textTransform: 'uppercase',
              }}
            >
              {STAGE_LABELS[stage] || stage}
            </div>
          )
        })}
      </div>

      {/* Summary stats */}
      {preview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            ['Rows Detected', preview.rowsDetected, '#111317'],
            ['Valid', preview.validRows, '#1A6E34'],
            ['Invalid', preview.invalidRows, preview.invalidRows > 0 ? '#C8001A' : '#767A85'],
            ['Duplicates', preview.duplicateRows, '#767A85'],
            ['New Products', preview.newProducts, '#111317'],
            ['Updates', preview.existingProducts, '#494D55'],
            ['Price Changes', preview.priceChanges, '#B8935A'],
            ['Stock Changes', preview.stockChanges, '#494D55'],
            ['Missing Fields', preview.missingRequiredFields, preview.missingRequiredFields > 0 ? '#C8001A' : '#767A85'],
            ['Missing Imagery', preview.missingImagery, '#B8935A'],
          ].map(([label, val, colour]) => (
            <div key={String(label)} style={{ backgroundColor: '#FAFAF9', border: '1px solid #E2E2DE', borderRadius: 4, padding: '10px 12px' }}>
              <div style={{ fontSize: '0.6875rem', color: '#767A85', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: String(colour) }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Errors */}
      {actionError && (
        <div style={{ padding: '8px 12px', backgroundColor: 'rgba(200,0,26,0.06)', border: '1px solid rgba(200,0,26,0.2)', borderRadius: 4, fontSize: '0.8125rem', color: '#C8001A', marginBottom: 12 }}>
          {actionError}
        </div>
      )}

      {/* Actions */}
      {(job.status === 'READY' || job.status === 'REVIEW_REQUIRED') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            onClick={handleCommit}
            disabled={actionInProgress}
            style={{ padding: '8px 20px', backgroundColor: '#1A6E34', color: '#FFFFFF', border: 'none', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 600, cursor: actionInProgress ? 'not-allowed' : 'pointer' }}
          >
            {actionInProgress ? 'Working…' : 'Commit Valid Rows →'}
          </button>
          <button
            onClick={async () => {
              if (!confirm('Reject this import? No data will be written.')) return
              setActionInProgress(true)
              try {
                await fetch(`/api/suppliers/${supplierId}/import/${jobId}/rollback`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reason: 'Rejected by administrator' }),
                })
                await refresh()
              } finally { setActionInProgress(false) }
            }}
            disabled={actionInProgress}
            style={{ padding: '8px 20px', backgroundColor: 'transparent', color: '#C8001A', border: '1px solid #C8001A', borderRadius: 4, fontSize: '0.8125rem', fontWeight: 600, cursor: actionInProgress ? 'not-allowed' : 'pointer' }}
          >
            Reject Import
          </button>
        </div>
      )}

      {job.status === 'COMMITTED' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: '0.8125rem', color: '#1A6E34', fontWeight: 600, padding: '8px 0' }}>
            ✓ Committed {job.rowsCommitted} rows · {job.newProducts} created · {job.updatedProducts} updated
          </div>
          <button
            onClick={handleRollback}
            disabled={actionInProgress}
            style={{ marginLeft: 'auto', padding: '6px 16px', backgroundColor: 'transparent', color: '#C8001A', border: '1px solid rgba(200,0,26,0.4)', borderRadius: 4, fontSize: '0.75rem', cursor: actionInProgress ? 'not-allowed' : 'pointer' }}
          >
            Rollback
          </button>
        </div>
      )}

      {/* Row-level table */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {['ALL', 'VALID', 'WARNING', 'INVALID', 'DUPLICATE', 'COMMITTED', 'REJECTED'].map((f) => (
            <button
              key={f}
              onClick={() => setRowFilter(f)}
              style={{
                padding: '3px 10px',
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono)',
                border: '1px solid',
                borderRadius: 3,
                cursor: 'pointer',
                backgroundColor: rowFilter === f ? '#111317' : 'transparent',
                color: rowFilter === f ? '#FFFFFF' : '#494D55',
                borderColor: rowFilter === f ? '#111317' : '#D0D0CC',
                letterSpacing: '0.05em',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid #E2E2DE', borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #E2E2DE' }}>
                {['Row', 'File', 'Supplier SKU', 'Product', 'Action', 'Confidence', 'Status', 'Issues'].map((h) => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#767A85', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.slice(0, 200).map((row) => {
                const statusBg = row.rowStatus === 'INVALID' ? 'rgba(200,0,26,0.04)' : row.rowStatus === 'DUPLICATE' ? 'rgba(184,147,90,0.04)' : 'transparent'
                const statusClr = row.rowStatus === 'INVALID' || row.rowStatus === 'REJECTED' ? '#C8001A' : row.rowStatus === 'COMMITTED' ? '#1A6E34' : row.rowStatus === 'WARNING' ? '#B45309' : row.rowStatus === 'DUPLICATE' ? '#B8935A' : '#494D55'
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #EBEBEB', backgroundColor: statusBg }}>
                    <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', color: '#767A85' }}>{row.sourceRowNumber}</td>
                    <td style={{ padding: '6px 12px', color: '#767A85', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.sourceFilename}</td>
                    <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#111317' }}>{row.supplierSku ?? '—'}</td>
                    <td style={{ padding: '6px 12px', color: '#494D55', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.productName ?? '—'}</td>
                    <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#494D55' }}>{row.rowAction}</td>
                    <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: row.matchConfidence === 'VERIFIED' ? '#1A6E34' : row.matchConfidence === 'UNKNOWN' ? '#767A85' : '#B8935A' }}>{row.matchConfidence}</td>
                    <td style={{ padding: '6px 12px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: statusClr, fontWeight: 600 }}>{row.rowStatus}</span>
                    </td>
                    <td style={{ padding: '6px 12px', color: '#C8001A', fontSize: '0.625rem' }}>
                      {row.validationErrors.length > 0 && <div>{row.validationErrors[0]}</div>}
                      {row.validationWarnings.length > 0 && <div style={{ color: '#B45309' }}>{row.validationWarnings[0]}</div>}
                    </td>
                  </tr>
                )
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '24px 12px', textAlign: 'center', color: '#767A85' }}>No rows match filter.</td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredRows.length > 200 && (
            <div style={{ padding: '8px 12px', fontSize: '0.75rem', color: '#767A85', borderTop: '1px solid #EBEBEB' }}>
              Showing 200 of {filteredRows.length} rows. Use the filter to narrow results.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
