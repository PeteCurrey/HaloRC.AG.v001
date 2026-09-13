import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getCustomerGarage, getGarageVehicles } from '@halo-rc/db'
import { signOutAction } from '@/actions/auth'
import styles from './garage.module.css'

export const metadata: Metadata = {
  title: 'My Garage — Halo RC',
  description: 'Your fleet, builds, maintenance logs, and verified parts compatibility repository.',
  robots: { index: false, follow: false },
}

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'Active',
  STORED: 'Stored',
  SOLD: 'Sold',
  ARCHIVED: 'Archived',
}

export default async function GaragePage() {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const garage = await getCustomerGarage(user.id)
  const vehicles = await getGarageVehicles(garage.id, user.id, { includeArchived: false })

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Vehicle Ownership &amp; Ecosystem</p>
            <h1 className={styles.heading}>The Garage</h1>
            <p className={styles.sub}>
              {user.email}
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/garage/new" className={styles.btnPrimary}>
              + Add Vehicle
            </Link>
            <form action={signOutAction}>
              <button type="submit" className={styles.btnGhost}>
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Vehicle Grid */}
        {vehicles.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>No vehicles yet</p>
            <p className={styles.emptySub}>
              Add your first machine to unlock build tracking, service logs, and QR identity.
            </p>
            <Link href="/garage/new" className={styles.btnPrimary}>
              Add First Vehicle
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {vehicles.map((v) => (
              <Link key={v.id} href={`/garage/${v.id}`} className={styles.vehicleCard}>
                <div className={styles.vehicleCardTop}>
                  <span className={styles.vehicleStatus} data-status={v.status}>
                    {STATUS_BADGE[v.status] ?? v.status}
                  </span>
                  {v.isPublic && (
                    <span className={styles.publicBadge}>QR Public</span>
                  )}
                </div>
                <h2 className={styles.vehicleName}>{v.name}</h2>
                {v.product?.name && (
                  <p className={styles.vehicleMachine}>{v.product.name}</p>
                )}
                {v.platform?.name && (
                  <p className={styles.vehiclePlatform}>{v.platform.name}</p>
                )}
                <p className={styles.vehicleArrow}>View →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
