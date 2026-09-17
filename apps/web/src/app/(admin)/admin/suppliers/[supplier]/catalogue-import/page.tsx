"use client"

import { useState } from 'react'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { AdminSection } from '@/components/admin/AdminSection'
import { CsvDropzone } from '@/components/admin/csv-import/CsvDropzone'
import { ImportPipelineView } from '@/components/admin/csv-import/ImportPipelineView'
import { ImportHistoryTable } from '@/components/admin/csv-import/ImportHistoryTable'
import { FieldMappingEditor } from '@/components/admin/csv-import/FieldMappingEditor'
import { MediaEnrichmentQueue } from '@/components/admin/csv-import/MediaEnrichmentQueue'

interface CatalogueImportTabProps {
  supplierId: string
  supplierName: string
}

export default function CatalogueImportTab({ supplierId, supplierName }: CatalogueImportTabProps) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'upload' | 'history' | 'field-map' | 'media'>('upload')
  const [detectedColumns, setDetectedColumns] = useState<string[]>([])

  return (
    <div>
      {/* Section nav */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid #E2E2DE', paddingBottom: 0 }}>
        {([
          ['upload', 'Upload CSV'],
          ['history', 'Import History'],
          ['field-map', 'Field Mapping'],
          ['media', 'Media Queue'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activeSection === key ? '2px solid #B8935A' : '2px solid transparent',
              backgroundColor: 'transparent',
              fontSize: '0.8125rem',
              fontWeight: activeSection === key ? 700 : 400,
              color: activeSection === key ? '#B8935A' : '#494D55',
              cursor: 'pointer',
              marginBottom: -1,
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Upload section */}
      {activeSection === 'upload' && (
        <div>
          <AdminPanel title="Upload Supplier CSV" subtitle={`Import catalogue data for ${supplierName}. Supports UTF-8, UTF-8 BOM, comma- and semicolon-delimited files.`}>
            <CsvDropzone
              supplierId={supplierId}
              onJobCreated={(jobId) => {
                setActiveJobId(jobId)
              }}
            />
          </AdminPanel>

          {activeJobId && (
            <AdminPanel
              title="Import Pipeline"
              subtitle={`Job: ${activeJobId}`}
              style={{ marginTop: 16 }}
            >
              <ImportPipelineView jobId={activeJobId} supplierId={supplierId} />
            </AdminPanel>
          )}
        </div>
      )}

      {/* Import history */}
      {activeSection === 'history' && (
        <AdminPanel title="Import History" subtitle={`All CSV import jobs for ${supplierName}`}>
          <ImportHistoryTable
            supplierId={supplierId}
            selectedJobId={activeJobId}
            onSelectJob={(jobId) => {
              setActiveJobId(jobId)
              setActiveSection('upload')
            }}
          />
        </AdminPanel>
      )}

      {/* Field mapping */}
      {activeSection === 'field-map' && (
        <AdminPanel
          title="Field Mapping Configuration"
          subtitle="Map this supplier's CSV column headers to Avorria's canonical product fields. This config is reused for every import from this supplier."
        >
          <FieldMappingEditor supplierId={supplierId} detectedColumns={detectedColumns} />
        </AdminPanel>
      )}

      {/* Media enrichment queue */}
      {activeSection === 'media' && (
        <AdminPanel
          title="Media Enrichment Queue"
          subtitle="Products imported without imagery. Source images from the supplier's official website only. AI-generated or unsourced images are not permitted."
        >
          <MediaEnrichmentQueue supplierId={supplierId} />
        </AdminPanel>
      )}
    </div>
  )
}
