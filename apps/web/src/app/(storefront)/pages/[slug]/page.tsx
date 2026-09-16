import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicCmsPageBySlug } from '@halo-rc/db'

export const revalidate = 0

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublicCmsPageBySlug(slug)

  if (!page) {
    return {
      title: 'Page Not Found — Avorria RC',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${page.seoTitle || page.title} — Avorria RC`,
    description: page.seoDescription || page.heroSubheading || undefined,
    alternates: {
      canonical: `https://avorria.com/pages/${page.slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function PublicCmsPage({ params }: PageProps) {
  const { slug } = await params
  const page = await getPublicCmsPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <main
      style={{
        minHeight: '80vh',
        backgroundColor: 'var(--colour-void)',
        paddingTop: 'calc(var(--nav-height) + var(--space-12))',
        paddingBottom: 'var(--space-16)',
        paddingInline: 'var(--gutter-md)',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--colour-smoke)',
            marginBottom: 'var(--space-8)',
          }}
        >
          <Link href="/" style={{ color: 'var(--colour-smoke)', textDecoration: 'none' }}>
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span style={{ color: 'var(--colour-ash)' }}>{page.pageType}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page" style={{ color: 'var(--colour-white)' }}>
            {page.title}
          </span>
        </nav>

        {/* Hero Header */}
        <header style={{ marginBottom: 'var(--space-10)', borderBottom: '1px solid var(--colour-steel)', paddingBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span style={{ width: 8, height: 8, backgroundColor: 'var(--colour-halo)', borderRadius: '50%' }} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6875rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--colour-halo)',
              }}
            >
              {page.pageType.replace('_', ' ')}
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(var(--text-3xl), 5vw, var(--text-5xl))',
              fontWeight: 600,
              color: 'var(--colour-white)',
              lineHeight: 'var(--leading-tight)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {page.heroHeading || page.title}
          </h1>

          {page.heroSubheading && (
            <p
              style={{
                fontSize: 'var(--text-lg)',
                color: 'var(--colour-ash)',
                lineHeight: 'var(--leading-relaxed)',
                maxWidth: '68ch',
              }}
            >
              {page.heroSubheading}
            </p>
          )}

          <div
            style={{
              marginTop: 'var(--space-6)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--colour-smoke)',
            }}
          >
            Last revised: {new Date(page.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        {/* Content Body */}
        <article
          style={{
            fontSize: 'var(--text-base)',
            color: 'var(--colour-off-white)',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-primary)',
          }}
        >
          {typeof page.contentJson === 'string' ? (
            page.contentJson
          ) : Array.isArray(page.contentJson) && page.contentJson.length > 0 ? (
            page.contentJson.map((block: any, i: number) => (
              <p key={i} style={{ marginBottom: 'var(--space-4)' }}>
                {typeof block === 'string' ? block : block.text || JSON.stringify(block)}
              </p>
            ))
          ) : (
            <p style={{ color: 'var(--colour-smoke)', fontStyle: 'italic' }}>
              Content for this page is being curated by the Avorria RC editorial department.
            </p>
          )}
        </article>
      </div>
    </main>
  )
}
