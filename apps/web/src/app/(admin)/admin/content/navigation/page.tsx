import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminSection,
  AdminEmptyState,
} from '@/components/admin'
import { getAdminNavigationItems } from '@halo-rc/db'

export const revalidate = 0

export default async function AdminNavigationPage() {
  const items = await getAdminNavigationItems()

  return (
    <>
      <AdminPageHeader
        category="Content Management System"
        title="Site Navigation Hierarchy"
        description="Authoritative menu structure, dropdown links, and featured header promotions."
      />

      <AdminSection>
        <AdminPanel title="Navigation Items" padding="none">
          {items.length === 0 ? (
            <div style={{ padding: 32 }}>
              <AdminEmptyState
                title="Default navigation active"
                description="Database custom menu items will override once configured."
              />
            </div>
          ) : (
            <AdminTable columns={['Label', 'Route / Link', 'Key', 'Order', 'Status']}>
              {items.map((item) => (
                <AdminTableRow key={item.id} cells={[
                  <span key="label" style={{ fontWeight: 600, color: '#111317' }}>{item.label}</span>,
                  <span key="href" style={{ fontFamily: 'var(--font-mono)', color: '#767A85' }}>{item.href}</span>,
                  <span key="key" style={{ fontFamily: 'var(--font-mono)', color: '#494D55' }}>{item.navKey}</span>,
                  <span key="order" style={{ fontFamily: 'var(--font-mono)', color: '#767A85' }}>{item.sortOrder}</span>,
                  <AdminStatus key="status" status={item.active ? 'active' : 'inactive'} />,
                ]} />
              ))}
            </AdminTable>
          )}
        </AdminPanel>
      </AdminSection>
    </>
  )
}
