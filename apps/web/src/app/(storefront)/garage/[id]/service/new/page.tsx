import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { getGarageVehicleById } from '@halo-rc/db'
import { addServiceRecordAction } from '@/actions/garage'
import styles from '../../../new/new.module.css'

export const metadata: Metadata = {
  title: 'Log Service \u2014 My Garage \u2014 Halo RC',
  robots: { index: false, follow: false },
}

const SERVICE_TYPES = [
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SETUP', label: 'Setup Change' },
  { value: 'REPAIR', label: 'Repair' },
  { value: 'UPGRADE', label: 'Upgrade' },
  { value: 'INSPECTION', label: 'Inspection' },
  { value: 'OTHER', label: 'Other' },
]

interface ServiceNewPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function ServiceNewPage({ params, searchParams }: ServiceNewPageProps) {
  const user = await getSessionUser()
  if (!user) redirect('/auth/sign-in')

  const { id } = await params
  const { error } = await searchParams
  const vehicle = await getGarageVehicleById(id, user.id)
  if (!vehicle) notFound()

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href={`/garage/${id}`} className={styles.back}>{'\u2190'} Back to {vehicle.name}</Link>
        <p className={styles.eyebrow}>Service Log</p>
        <h1 className={styles.heading}>Log Service Entry</h1>
        <p className={styles.sub}>Record what was done \u2014 builds a permanent, time-stamped service history.</p>

        {error && (
          <div role="alert" style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)', border: '1px solid #ef4444', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: 'var(--text-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-5)' }}>
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={addServiceRecordAction} className={styles.form}>
          <input type="hidden" name="vehicleId" value={id} />

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="serviceType">Service Type</label>
            <select id="serviceType" name="serviceType" className={styles.select}>
              {SERVICE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="title">Title *</label>
            <input id="title" name="title" type="text" required className={styles.input} placeholder="e.g. Full diff service + shock rebuild" />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="date">Date</label>
            <input id="date" name="date" type="date" className={styles.input} />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="description">Description *</label>
            <textarea id="description" name="description" required className={styles.textarea} rows={4} placeholder="Describe the work carried out, parts replaced, settings changed..." />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="notes">Additional Notes</label>
            <textarea id="notes" name="notes" className={styles.textarea} rows={2} placeholder="Track conditions, weather, race result, etc." />
          </div>

          <div className={styles.actions}>
            <Link href={`/garage/${id}`} className={styles.btnGhost}>Cancel</Link>
            <button type="submit" className={styles.btnPrimary}>Save Service Record</button>
          </div>
        </form>
      </div>
    </div>
  )
}
