import Link from 'next/link'
import { getAdminCategories } from '@halo-rc/db'
import {
  AdminPageHeader,
  AdminTable,
  AdminTableRow,
  AdminAction,
} from '@/components/admin'

export const revalidate = 0

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories()

  const columns = [
    { header: 'Category Name', width: '35%' },
    { header: 'Slug', width: '30%' },
    { header: 'Sort Order', width: '15%' },
    { header: 'Catalogue Link', width: '20%', align: 'right' as const },
  ]

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <AdminPageHeader
        category="Taxonomy & Hierarchy"
        title="Product Categories & Disciplines"
        description="Catalogue taxonomy organizing competition machines, chassis kits, electronics, and accessories."
      />

      {/* Categories Table */}
      <AdminTable columns={columns} emptyMessage="No categories recorded.">
        {categories.map((c) => (
          <AdminTableRow key={c.id}>
            <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--admin-text-primary, #111317)' }}>
              {c.name}
            </td>

            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-tertiary, #767A85)' }}>
              /{c.slug}
            </td>

            <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--admin-text-secondary, #494D55)' }}>
              {c.sortOrder}
            </td>

            <td style={{ padding: '10px 14px', textAlign: 'right' }}>
              <AdminAction
                variant="subtle"
                size="sm"
                href={`/admin/products?categoryId=${c.id}`}
              >
                Browse Products &rarr;
              </AdminAction>
            </td>
          </AdminTableRow>
        ))}
      </AdminTable>
    </div>
  )
}
