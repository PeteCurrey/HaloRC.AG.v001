import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { resolveVehiclePublicIdentity } from '@halo-rc/db'
import styles from './vehicle-identity.module.css'

interface VehicleIdentityPageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: VehicleIdentityPageProps): Promise<Metadata> {
  const { token } = await params
  const identity = await resolveVehiclePublicIdentity(token)

  if (!identity) {
    return {
      title: 'Vehicle Not Found — Halo RC',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${identity.vehicleName} — Halo RC`,
    description: identity.machineName
      ? `${identity.vehicleName} — ${identity.machineName} — verified RC build profile on Halo RC.`
      : `${identity.vehicleName} — RC vehicle build profile on Halo RC.`,
    robots: { index: true, follow: true },
    openGraph: {
      title: `${identity.vehicleName} — Halo RC`,
      description: identity.machineName ?? undefined,
    },
  }
}

export default async function VehicleIdentityPage({ params }: VehicleIdentityPageProps) {
  const { token } = await params
  const identity = await resolveVehiclePublicIdentity(token)

  if (!identity) notFound()

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* QR Header */}
        <div className={styles.qrHeader}>
          <p className={styles.eyebrow}>Halo RC — Vehicle Identity</p>
          <h1 className={styles.vehicleName}>{identity.vehicleName}</h1>
          {identity.machineName && (
            <p className={styles.machineName}>{identity.machineName}</p>
          )}
          {identity.brandName && (
            <p className={styles.brandName}>{identity.brandName}</p>
          )}
          <div className={styles.tags}>
            {identity.scale && (
              <span className={styles.tag}>{identity.scale}</span>
            )}
            {identity.discipline && (
              <span className={styles.tag}>{identity.discipline.replace(/_/g, ' ')}</span>
            )}
            {identity.platformName && (
              <span className={styles.tag}>{identity.platformName}</span>
            )}
          </div>
        </div>

        {/* Active Build Summary */}
        {identity.publicBuildSummary && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Build Configuration</h2>
            <div className={styles.buildGrid}>
              {identity.publicBuildSummary.motor && (
                <BuildItem label="Motor" value={identity.publicBuildSummary.motor} />
              )}
              {identity.publicBuildSummary.esc && (
                <BuildItem label="ESC" value={identity.publicBuildSummary.esc} />
              )}
              {identity.publicBuildSummary.servo && (
                <BuildItem label="Servo" value={identity.publicBuildSummary.servo} />
              )}
            </div>
          </section>
        )}

        {/* Specifications */}
        {identity.specifications.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Verified Specifications</h2>
            <div className={styles.specGrid}>
              {identity.specifications.map((s, i) => (
                <div key={i} className={styles.specItem}>
                  <span className={styles.specKey}>{s.key}</span>
                  <span className={styles.specValue}>
                    {s.value}{s.unit ? ` ${s.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
            <p className={styles.specNote}>
              Specifications sourced from verified manufacturer data. UNKNOWN confidence values are never displayed.
            </p>
          </section>
        )}

        {/* Halo RC attribution */}
        <footer className={styles.footer}>
          <p>
            Build profile verified by{' '}
            <a href="/" className={styles.footerLink}>Halo RC</a>
          </p>
        </footer>
      </div>
    </div>
  )
}

function BuildItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.buildItem}>
      <span className={styles.buildLabel}>{label}</span>
      <span className={styles.buildValue}>{value}</span>
    </div>
  )
}
