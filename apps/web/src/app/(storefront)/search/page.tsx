import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Search — Halo RC',
  description: 'Search products, platforms, compatible parts, and verified specifications.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SearchPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--colour-void)', padding: 'var(--space-9) var(--gutter-md)' }}>
      <div style={{ maxWidth: 'var(--container-2xl)', margin: '0 auto' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: 'var(--space-2)' }}>
          Product Graph Search
        </p>
        <h1 style={{ fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-4)' }}>
          Hardware & Compatibility
        </h1>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--colour-ash)', maxWidth: '52ch', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-8)' }}>
          Search across brand, vehicle platform, chassis material, part number, scale, or discipline.
        </p>

        <div style={{ maxWidth: '640px', marginBottom: 'var(--space-8)' }}>
          <input
            type="search"
            placeholder="Search by SKU, platform (e.g. X4, X-Maxx), brand, or part..."
            style={{
              width: '100%',
              padding: 'var(--space-4) var(--space-5)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-mist)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--colour-off-white)',
              fontSize: 'var(--text-sm)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ padding: 'var(--space-8)', border: '1px dashed var(--colour-steel)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--colour-smoke)' }}>
            PostgreSQL Full-Text Search (tsvector + pg_trgm) — Connected to Supabase
          </p>
        </div>
      </div>
    </div>
  )
}
