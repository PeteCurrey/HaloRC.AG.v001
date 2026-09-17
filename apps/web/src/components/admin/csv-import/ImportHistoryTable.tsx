"use client"

import { useState, useEffect } from 'react'

interface ImportJob {
  id: string
  status: string
  filenames: string[]
  uploadedBy: string | null
  createdAt: string
  committedAt: string | null
  rowsTotal: number
  rowsValid: number
  rowsInvalid: number
  rowsDuplicate: number
  rowsCommitted: number
  newProducts: number
  updatedProducts: number
  errors: string[]
}

interface ImportHistoryTableProps {
  supplierId: string
  onSelectJob: (jobId: string) => void
  selectedJobId?: string | null
}

const STATUS_COLOUR: Record<string, string> = {
  COMMITTED: '#1A6E34',
  ROLLED_BACK: '#C8001A',
  REJECTED: '#C8001A',
  FAILED: '#C8001A',
  REVIEW_REQUIRED: '#B8935A',
  READY: '#B8935A',
  PROCESSING: '#494D55',
  UPLOADED: '#767A85',
}

export function ImportHistoryTable({ supplierId, onSelectJob, selectedJobId }: ImportHistoryTableProps) {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/suppliers/${supplierId}/import/jobs`)
      .then((r) => r.json())
      .then((data) => setJobs(data.jobs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [supplierId])

  if (loading) return <div style={{ padding: '16px', color: '#767A85', fontSize: '0.8125rem' }}>Loading import history…</div>

  if (jobs.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#767A85', fontSize: '0.8125rem' }}>
        No imports yet. Upload a CSV file above to begin.
      </div>
    )
  }

  return (
    <div style={{ border: '1px solid #E2E2DE', borderRadius: 4, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#FAFAF9', borderBottom: '1px solid #E2E2DE' }}>
            {['Import ID', 'Filename(s)', 'Uploaded By', 'Date', 'Rows', 'Created', 'Updated', 'Rejected', 'Status', ''].map((h) => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#767A85', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              style={{
                borderBottom: '1px solid #EBEBEB',
                backgroundColor: selectedJobId === job.id ? 'rgba(184,147,90,0.05)' : 'transparent',
                cursor: 'pointer',
              }}
              onClick={() => onSelectJob(job.id)}
            >
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#B8935A' }}>{job.id.slice(0, 16)}…</td>
              <td style={{ padding: '8px 12px', color: '#494D55', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.filenames.join(', ')}</td>
              <td style={{ padding: '8px 12px', color: '#767A85' }}>{job.uploadedBy ?? 'Unknown'}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#767A85', fontSize: '0.625rem' }}>
                {new Date(job.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
              </td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>{job.rowsTotal}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#1A6E34' }}>{job.newProducts}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: '#B8935A' }}>{job.updatedProducts}</td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', color: job.rowsInvalid > 0 ? '#C8001A' : '#767A85' }}>{job.rowsInvalid}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 700,
                  color: STATUS_COLOUR[job.status] ?? '#767A85',
                }}>{job.status}</span>
              </td>
              <td style={{ padding: '8px 12px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectJob(job.id) }}
                  style={{ fontSize: '0.625rem', color: '#B8935A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Inspect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
