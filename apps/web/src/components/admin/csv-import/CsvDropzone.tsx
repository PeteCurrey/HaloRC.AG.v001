"use client"

import { useState, useRef, useCallback } from 'react'

interface CsvDropzoneProps {
  supplierId: string
  onJobCreated: (jobId: string) => void
}

interface UploadResult {
  jobId: string
  stats: { totalRows: number; valid: number; invalid: number; duplicate: number }
  files: Array<{ filename: string; rowCount: number; encoding: string }>
  malformedRows: Array<{ filename: string; rowNumber: number; reason: string }>
}

export function CsvDropzone({ supplierId, onJobCreated }: CsvDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.name.toLowerCase().endsWith('.csv')
    )
    if (files.length === 0) {
      setError('Only CSV files are accepted.')
      return
    }
    setSelectedFiles(files)
    setError(null)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setSelectedFiles(files)
    setError(null)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      selectedFiles.forEach((f) => formData.append('files', f))

      const res = await fetch(`/api/suppliers/${supplierId}/import/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(body.error ?? 'Upload failed')
      }

      const data = await res.json()
      setResult(data)
      onJobCreated(data.jobId)
      setSelectedFiles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#B8935A' : '#D0D0CC'}`,
          borderRadius: 6,
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragging ? 'rgba(184,147,90,0.04)' : '#FAFAF9',
          transition: 'border-color 150ms ease, background-color 150ms ease',
          marginBottom: 16,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📂</div>
        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111317', marginBottom: 4 }}>
          Drop CSV files here, or click to select
        </div>
        <div style={{ fontSize: '0.75rem', color: '#767A85' }}>
          Accepts: UTF-8, UTF-8 BOM, comma- or semicolon-delimited. Multiple files supported.
        </div>
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {selectedFiles.map((f) => (
            <div
              key={f.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 12px',
                backgroundColor: '#F4F4F2',
                borderRadius: 4,
                marginBottom: 4,
                fontSize: '0.8125rem',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', color: '#111317' }}>{f.name}</span>
              <span style={{ color: '#767A85' }}>{(f.size / 1024).toFixed(1)} KB</span>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '8px 12px', backgroundColor: 'rgba(200,0,26,0.06)',
          border: '1px solid rgba(200,0,26,0.2)', borderRadius: 4,
          fontSize: '0.8125rem', color: '#C8001A', marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {/* Upload button */}
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            padding: '8px 20px',
            backgroundColor: uploading ? '#9CA3AF' : '#111317',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 4,
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: uploading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.02em',
          }}
        >
          {uploading ? 'Uploading & Processing…' : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
        </button>
      )}

      {/* Result */}
      {result && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          backgroundColor: 'rgba(26,110,52,0.06)',
          border: '1px solid rgba(26,110,52,0.2)',
          borderRadius: 4,
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1A6E34', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Import Job Created — ID: {result.jobId}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: '0.8125rem' }}>
            {[
              ['Total Rows', result.stats.totalRows],
              ['Valid', result.stats.valid],
              ['Invalid', result.stats.invalid],
              ['Duplicates', result.stats.duplicate],
            ].map(([label, val]) => (
              <div key={String(label)}>
                <div style={{ color: '#767A85', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#111317' }}>{val}</div>
              </div>
            ))}
          </div>
          {result.malformedRows.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#B45309' }}>
              ⚠ {result.malformedRows.length} malformed row(s) detected — these have been captured and flagged.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
