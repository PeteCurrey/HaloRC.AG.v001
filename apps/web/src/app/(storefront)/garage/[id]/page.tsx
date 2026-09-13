import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import {
  getGarageVehicleById,
  getVehicleActiveBuild,
  getVehicleServiceHistory,
  SEED_SPECIFICATIONS,
} from '@halo-rc/db'
import { updateVehicleStatusAction, toggleVehiclePublicAction } from '@/actions/garage'
import styles from './vehicle.module.css'

interface VehiclePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Vehicle ${id} \u2014 My Garage \u2014 Halo RC`,
    robots: { index: false, follow: false },
  }
}

const STATUS_OPTIONS = ['ACTIVE', 'STORED', 'SOLD', 'ARCHIVED'] as const

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const { id } = await params
  const vehicle = await getGarageVehicleById(id, user.id)
  if (!vehicle) notFound()

  const [activeBuild, serviceHistory] = await Promise.all([
    getVehicleActiveBuild(id, user.id),
    getVehicleServiceHistory(id, user.id),
  ])

  const specs = vehicle.productId
    ? SEED_SPECIFICATIONS.filter((s) => s.entityId === vehicle.productId && s.confidence !== 'UNKNOWN')
    : []

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/garage" className={styles.back}>{'\u2190'} Back to Garage</Link>

        {/* Vehicle identity */}
        <div className={styles.header}>
          <div>
            {vehicle.product?.name && <p className={styles.eyebrow}>{vehicle.product.name}</p>}
            <h1 className={styles.heading}>{vehicle.name}</h1>
            {vehicle.platform?.name && <p className={styles.platformLabel}>{vehicle.platform.name}</p>}
          </div>
          <div className={styles.badges}>
            <span className={styles.statusBadge} data-status={vehicle.status}>{vehicle.status}</span>
            {vehicle.isPublic && (
              <span className={styles.publicBadge}>QR Public</span>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className={styles.metaGrid}>
          {vehicle.nickname && <MetaItem label="Nickname" value={vehicle.nickname} />}
          {vehicle.colour && <MetaItem label="Colour" value={vehicle.colour} />}
          {vehicle.purchaseDate && <MetaItem label="Purchased" value={vehicle.purchaseDate} />}
          {vehicle.serialNumber && <MetaItem label="Serial" value={vehicle.serialNumber} />}
        </div>

        {vehicle.notes && <p className={styles.notes}>{vehicle.notes}</p>}

        {/* Specifications */}
        {specs.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionHeading}>Machine Specifications</h2>
            <div className={styles.specGrid}>
              {specs.map((s, i) => (
                <div key={i} className={styles.specItem}>
                  <span className={styles.specKey}>{s.key}</span>
                  <span className={styles.specValue}>{s.value}{s.unit ? ` ${s.unit}` : ''}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Build */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Active Build</h2>
          {activeBuild ? (
            <div className={styles.buildCard}>
              <p className={styles.buildName}>{activeBuild.name}</p>
              <p className={styles.buildMeta}>Saved {new Date(activeBuild.createdAt).toLocaleDateString('en-GB')}</p>
              <div className={styles.buildSlots}>
                {Object.entries(activeBuild.snapshot.slots ?? {}).map(([role, slot]) => (
                  <div key={role} className={styles.buildSlot}>
                    <span className={styles.slotRole}>{role.replace(/_/g, ' ')}</span>
                    <span className={styles.slotProduct}>{slot.productName}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.buildEmpty}>
              <p>No active build saved.</p>
              <Link href="/build" className={styles.linkBtn}>Open Build My Rig {'\u2192'}</Link>
            </div>
          )}
        </section>

        {/* Service History */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionHeading}>Service History</h2>
            <Link href={`/garage/${vehicle.id}/service/new`} className={styles.linkBtn}>+ Log Service</Link>
          </div>
          {serviceHistory.length === 0 ? (
            <p className={styles.emptyText}>No service records yet.</p>
          ) : (
            <div className={styles.serviceList}>
              {serviceHistory.map((s) => (
                <div key={s.id} className={styles.serviceItem}>
                  <div className={styles.serviceTop}>
                    <span className={styles.serviceType}>{s.serviceType}</span>
                    <span className={styles.serviceDate}>{s.date}</span>
                  </div>
                  <p className={styles.serviceTitle}>{s.title}</p>
                  <p className={styles.serviceDesc}>{s.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Vehicle Settings</h2>
          <div className={styles.controls}>
            {/* Status update */}
            <form action={updateVehicleStatusAction}>
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <label className={styles.controlLabel}>Status</label>
              <select name="status" defaultValue={vehicle.status} className={styles.controlSelect}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="submit" className={styles.controlBtn}>Update Status</button>
            </form>

            {/* Toggle public */}
            <form action={toggleVehiclePublicAction}>
              <input type="hidden" name="vehicleId" value={vehicle.id} />
              <input type="hidden" name="isPublic" value={String(vehicle.isPublic)} />
              <p className={styles.controlLabel}>QR Public Identity</p>
              <p className={styles.controlHint}>
                {vehicle.isPublic
                  ? 'Your vehicle QR page is publicly visible.'
                  : 'QR page is private. Only you can see this vehicle.'}
              </p>
              <button type="submit" className={styles.controlBtn}>
                {vehicle.isPublic ? 'Make Private' : 'Make Public'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--colour-smoke)', marginBottom: '2px' }}>
        {label}
      </p>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--colour-off-white)' }}>{value}</p>
    </div>
  )
}
