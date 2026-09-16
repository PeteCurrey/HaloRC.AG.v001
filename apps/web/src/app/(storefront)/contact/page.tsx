import type { Metadata } from 'next'
import Link from 'next/link'
import { submitPublicLeadAction } from '@/actions/admin'

export const metadata: Metadata = {
  title: 'Specialist Consultation & Enquiries — Halo RC',
  description: 'Connect with the Halo RC engineering team and Race Department specialists for bespoke build advice, kit selection, or trade enquiries.',
  alternates: {
    canonical: 'https://halo-rc.com/contact',
  },
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string
    error?: string
    productInterestId?: string
    productName?: string
  }>
}) {
  const { success, error, productInterestId, productName } = await searchParams

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
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
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
            marginBottom: 'var(--space-6)',
          }}
        >
          <Link href="/" style={{ color: 'var(--colour-smoke)', textDecoration: 'none' }}>
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" style={{ color: 'var(--colour-white)' }}>
            Specialist Consultation
          </span>
        </nav>

        {/* Heading */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
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
              Direct Engineering Consultation
            </span>
          </div>
          <h1
            style={{
              fontSize: 'clamp(var(--text-3xl), 4vw, var(--text-4xl))',
              fontWeight: 600,
              color: 'var(--colour-white)',
              letterSpacing: 'var(--tracking-tight)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Race Department Advisory
          </h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--colour-ash)', lineHeight: 'var(--leading-relaxed)' }}>
            Submit an enquiry regarding bespoke competition builds, chassis geometry setups, commercial partnerships, or specialist parts compatibility. All requests are handled directly by Halo RC staff.
          </p>
        </div>

        {success ? (
          <div
            style={{
              padding: 'var(--space-6)',
              backgroundColor: 'rgba(57, 255, 20, 0.05)',
              border: '1px solid var(--colour-verified)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--colour-white)', marginBottom: 'var(--space-2)' }}>
              Enquiry Logged with Race Department
            </h2>
            <p style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
              Your consultation request has been assigned to a technical advisor. We will review your specifications and contact you via email shortly.
            </p>
            <Link
              href="/machines"
              style={{
                display: 'inline-block',
                padding: 'var(--space-3) var(--space-6)',
                backgroundColor: 'var(--colour-halo)',
                color: 'var(--colour-void)',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
              }}
            >
              Return to The Machines
            </Link>
          </div>
        ) : (
          <form
            action={async (formData: FormData) => {
              'use server'
              const res = await submitPublicLeadAction(formData)
              if (!res.success) {
                // Return or handle error via redirect with query param
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)',
              backgroundColor: 'var(--colour-carbon)',
              border: '1px solid var(--colour-steel)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-6)',
            }}
          >
            <input type="hidden" name="source" value={productInterestId ? 'PRODUCT_ENQUIRY' : 'CONTACT_FORM'} />
            {productInterestId && <input type="hidden" name="productInterestId" value={productInterestId} />}

            {productName && (
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--colour-graphite)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--colour-halo)', textTransform: 'uppercase' }}>
                  Specific Machine:
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-white)', fontWeight: 600 }}>
                  {productName}
                </span>
              </div>
            )}

            {error && (
              <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(255, 45, 85, 0.1)', border: '1px solid var(--colour-race)', borderRadius: 'var(--radius-sm)', color: 'var(--colour-race)', fontSize: 'var(--text-xs)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="e.g. Lewis Evans"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="name@domain.com"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+44 7..."
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Club / Team / Company (Optional)
                </label>
                <input
                  type="text"
                  name="company"
                  placeholder="e.g. BRCA Club / Privateer"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--colour-graphite)',
                    border: '1px solid var(--colour-steel)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--colour-white)',
                    fontSize: 'var(--text-sm)',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--colour-smoke)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                Message / Specification Details *
              </label>
              <textarea
                required
                name="message"
                rows={5}
                placeholder="Detail your racing class, target track surface, electronics preference, or bespoke requirements..."
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  backgroundColor: 'var(--colour-graphite)',
                  border: '1px solid var(--colour-steel)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--colour-white)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 'var(--leading-relaxed)',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                padding: 'var(--space-4) var(--space-6)',
                backgroundColor: 'var(--colour-halo)',
                color: 'var(--colour-void)',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                marginTop: 'var(--space-2)',
              }}
            >
              Submit Consultation Request
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
