import {
  AdminPageHeader,
  AdminPanel,
  AdminTable,
  AdminTableRow,
  AdminStatus,
  AdminSection,
  AdminAction,
  AdminPagination,
  AdminEmptyState,
} from '@/components/admin'
import { getAdminCmsPages } from '@halo-rc/db'
import type { CmsPageType, RecordStatus } from '@halo-rc/types'

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    status?: string
    pageType?: string
    search?: string
    page?: string
  }>
}

export default async function AdminCmsPagesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const status = params.status as RecordStatus | undefined
  const pageType = params.pageType as CmsPageType | undefined
  const search = params.search || ''

  const { items, total } = await getAdminCmsPages(
    { status, pageType, search: search || undefined },
    { page, perPage: 25 }
  )

  const totalPages = Math.ceil(total / 25)

  return (
    <>
      <AdminPageHeader
        category="Content Management System"
        title="Authoritative Website Pages"
        description="Editorial storytelling, brand biographies, buying guides, and legal policies."
        actions={
          <AdminAction href="/admin/content/pages/new" variant="primary">
            + Create CMS Page
          </AdminAction>
        }
      />

      <AdminSection>
        <AdminPanel padding="none">
          {items.length === 0 ? (
            <div style={{ padding: 32 }}>
              <AdminEmptyState
                title="No CMS pages yet"
                description='Click "+ Create CMS Page" to create the first editorial document.'
              />
            </div>
          ) : (
            <>
              <AdminTable columns={['Page Title / Slug', 'Type', 'Status', 'Updated', 'Actions']}>
                {items.map((cms) => (
                  <AdminTableRow key={cms.id} cells={[
                    <div key="title">
                      <AdminAction href={`/admin/content/pages/${cms.id}`} variant="ghost">
                        {cms.title}
                      </AdminAction>
                      <div style={{ fontFamily: 'var(--font-mono)', color: '#767A85', fontSize: '0.6875rem', marginTop: 2 }}>
                        /{cms.slug}
                      </div>
                    </div>,
                    <span key="type" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', padding: '1px 5px', borderRadius: 2, backgroundColor: '#EFEFED', color: '#494D55' }}>
                      {cms.pageType}
                    </span>,
                    <AdminStatus key="status" status={cms.status === 'PUBLISHED' ? 'published' : 'draft'} />,
                    <span key="updated" style={{ fontFamily: 'var(--font-mono)', color: '#767A85', fontSize: '0.6875rem' }}>
                      {new Date(cms.updatedAt).toLocaleDateString()}
                    </span>,
                    <AdminAction key="edit" href={`/admin/content/pages/${cms.id}`} variant="secondary">
                      Edit →
                    </AdminAction>,
                  ]} />
                ))}
              </AdminTable>

              {totalPages > 1 && (
                <AdminPagination
                  currentPage={page}
                  totalPages={totalPages}
                  createPageUrl={(p) => `/admin/content/pages?page=${p}`}
                />
              )}
            </>
          )}
        </AdminPanel>
      </AdminSection>
    </>
  )
}
