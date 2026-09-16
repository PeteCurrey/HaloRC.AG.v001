import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminSection,
  AdminAction,
  AdminEmptyState,
} from '@/components/admin'
import { getAdminHomepageSections } from '@halo-rc/db'

export const revalidate = 0

export default async function AdminHomepageConfigPage() {
  const sections = await getAdminHomepageSections()

  return (
    <>
      <AdminPageHeader
        category="Content Management System"
        title="Homepage Layout & Sections"
        description="Configure active modules, featured machines, brand carousels, and value propositions."
        actions={
          <AdminAction href="/" target="_blank" variant="secondary">
            View Live Homepage ↗
          </AdminAction>
        }
      />

      <AdminSection>
        {sections.length === 0 ? (
          <AdminEmptyState
            title="No custom homepage sections"
            description="The storefront homepage is currently rendering default high-fidelity layout components. Run seed scripts or insert sections to enable dynamic ordering."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((sec) => (
              <AdminPanel key={sec.id} padding="md">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '1px 5px', borderRadius: 2, backgroundColor: '#EFEFED', color: '#B8935A' }}>
                        {sec.sectionType}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#767A85' }}>
                        Order: {sec.sortOrder}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: '#111317', margin: 0 }}>
                      {sec.title}
                    </h3>
                    {sec.subtitle && (
                      <p style={{ fontSize: 'var(--text-xs)', color: '#494D55', marginTop: 2, marginBottom: 0 }}>
                        {sec.subtitle}
                      </p>
                    )}
                  </div>

                  <AdminStatus status={sec.active ? 'active' : 'inactive'} />
                </div>
              </AdminPanel>
            ))}
          </div>
        )}
      </AdminSection>
    </>
  )
}
