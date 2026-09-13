import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { createVehicleAction } from '@/actions/garage'
import { SEED_PLATFORMS, SEED_PRODUCTS } from '@halo-rc/db'
import styles from './new.module.css'

export const metadata: Metadata = {
  title: 'Add Vehicle \u2014 My Garage \u2014 Halo RC',
  robots: { index: false, follow: false },
}

interface NewPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function GarageNewPage({ searchParams }: NewPageProps) {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const { error } = await searchParams
  const platforms = SEED_PLATFORMS

  // Filter to machines and kits
  const machines = SEED_PRODUCTS.filter(
    (p) => ['RTR_MACHINE', 'KIT', 'ROLLING_CHASSIS', 'CHASSIS'].includes(p.productType) || p.platformId !== null
  )

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/garage" className={styles.back}>{'\u2190'} Back to Garage</Link>
        <p className={styles.eyebrow}>My Garage</p>
        <h1 className={styles.heading}>Add Vehicle</h1>
        <p className={styles.sub}>Register a machine to enable build tracking, service logs, and QR identity.</p>

        {error && (
          <div role="alert" style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: 'var(--text-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-5)' }}>
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={createVehicleAction} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="name">Vehicle Name *</label>
            <input id="name" name="name" type="text" required className={styles.input} placeholder="e.g. My XO1 Circuit Build" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="productId">Link to Catalogue Machine</label>
            <select id="productId" name="productId" className={styles.select}>
              <option value="">{'\u2014'} Unlinked (custom build) {'\u2014'}</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <p className={styles.hint}>Linking unlocks spec lookup, parts compatibility and verified build slots.</p>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="platformId">Platform</label>
            <select id="platformId" name="platformId" className={styles.select}>
              <option value="">{'\u2014'} Not specified {'\u2014'}</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="nickname">Nickname</label>
              <input id="nickname" name="nickname" type="text" className={styles.input} placeholder="e.g. The Beast" />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="colour">Colour</label>
              <input id="colour" name="colour" type="text" className={styles.input} placeholder="e.g. Raw Aluminium" />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="purchaseDate">Purchase Date</label>
              <input id="purchaseDate" name="purchaseDate" type="date" className={styles.input} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="serialNumber">Serial / Chassis Number</label>
              <input id="serialNumber" name="serialNumber" type="text" className={styles.input} placeholder="Optional" />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" className={styles.textarea} rows={3} placeholder="Track notes, setup baseline, etc." />
          </div>

          <div className={styles.actions}>
            <Link href="/garage" className={styles.btnGhost}>Cancel</Link>
            <button type="submit" className={styles.btnPrimary}>Add to Garage</button>
          </div>
        </form>
      </div>
    </div>
  )
}
