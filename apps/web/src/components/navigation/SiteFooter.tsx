import Link from 'next/link'
import { HaloLogo } from '@/components/brand/HaloLogo'

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--colour-steel)',
        backgroundColor: 'var(--colour-carbon)',
        padding: 'var(--space-10) var(--gutter-md) var(--space-8)',
        color: 'var(--colour-smoke)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--container-2xl)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-8)',
          marginBottom: 'var(--space-10)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <HaloLogo style={{ width: 24, height: 24 }} />
            <span
              style={{
                fontFamily: 'var(--font-primary)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                letterSpacing: 'var(--tracking-widest)',
                textTransform: 'uppercase',
                color: 'var(--colour-white)',
              }}
            >
              Halo RC
            </span>
          </div>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--colour-ash)',
              lineHeight: 'var(--leading-relaxed)',
              maxWidth: '30ch',
            }}
          >
            Remote Control. Without Compromise. Premium competition hardware and specialist racing department.
          </p>
        </div>

        <div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
              color: 'var(--colour-smoke)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Commercial Worlds
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none' }}>
            <li>
              <Link href="/machines" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                The Machines
              </Link>
            </li>
            <li>
              <Link href="/race" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                The Race Department
              </Link>
            </li>
            <li>
              <Link href="/garage" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                The Garage
              </Link>
            </li>
            <li>
              <Link href="/brands" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                Brand Universe
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
              color: 'var(--colour-smoke)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Tools & Consultation
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', listStyle: 'none' }}>
            <li>
              <Link href="/build" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                Build My Rig
              </Link>
            </li>
            <li>
              <Link href="/find" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                Find My Machine
              </Link>
            </li>
            <li>
              <Link href="/garage" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                My Garage & Fleet
              </Link>
            </li>
            <li>
              <Link href="/search" style={{ color: 'var(--colour-ash)', fontSize: 'var(--text-sm)' }}>
                Compatibility Search
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
              color: 'var(--colour-smoke)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Market & Jurisdiction
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--colour-smoke)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
            UK operations: GBP / VAT compliant.<br />
            USA operations: USD / State tax calculated.
          </p>
          <span
            style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.625rem',
              color: 'var(--colour-halo)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            UK & USA Dual-Market Architecture
          </span>
        </div>
      </div>

      <div
        style={{
          maxWidth: 'var(--container-2xl)',
          margin: '0 auto',
          paddingTop: 'var(--space-6)',
          borderTop: '1px solid var(--colour-steel)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          fontSize: 'var(--text-xs)',
          color: 'var(--colour-smoke)',
        }}
      >
        <p>© {new Date().getFullYear()} Halo RC Ltd. All rights reserved.</p>
        <p style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
          VERIFIED RC DATA ARCHITECTURE
        </p>
      </div>
    </footer>
  )
}
