import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Row Level Security (RLS) Policy Verification', () => {
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/001_initial_schema.sql')
  const migrationSql = fs.readFileSync(migrationPath, 'utf8')

  describe('Public vs Unpublished Catalogue Protection', () => {
    it('restricts products_public_read to published = true AND status = PUBLISHED', () => {
      expect(migrationSql).toContain('create policy "products_public_read"')
      expect(migrationSql).toContain("using (published = true and status = 'PUBLISHED')")
    })

    it('prevents anonymous users from querying market_offers of unpublished products', () => {
      // Must verify that market_offers joins to published products and variants
      const policyMatch = migrationSql.match(/create policy "market_offers_public_read"[\s\S]*?;/)
      expect(policyMatch).not.toBeNull()
      const policyContent = policyMatch![0]

      expect(policyContent).toContain("availability != 'NOT_AVAILABLE'")
      expect(policyContent).toContain("p.published = true")
      expect(policyContent).toContain("p.status = 'PUBLISHED'")
    })

    it('protects specifications of unpublished products and strictly omits UNKNOWN confidence', () => {
      const policyMatch = migrationSql.match(/create policy "specifications_public_read"[\s\S]*?;/)
      expect(policyMatch).not.toBeNull()
      const policyContent = policyMatch![0]

      expect(policyContent).toContain("confidence != 'UNKNOWN'")
      expect(policyContent).toContain("p.published = true")
      expect(policyContent).toContain("p.status = 'PUBLISHED'")
    })

    it('protects media_assets by requiring approved_for_commercial_use and parent publication', () => {
      const policyMatch = migrationSql.match(/create policy "media_assets_public_read"[\s\S]*?;/)
      expect(policyMatch).not.toBeNull()
      const policyContent = policyMatch![0]

      expect(policyContent).toContain("approved_for_commercial_use = true")
      expect(policyContent).toContain("status = 'PUBLISHED'")
      expect(policyContent).toContain("p.published = true")
    })

    it('restricts compatibility_rules_public_read strictly to verified rules', () => {
      expect(migrationSql).toContain('create policy "compatibility_rules_public_read"')
      expect(migrationSql).toContain('using (verified = true)')
    })
  })

  describe('User Tenant Isolation (USER_A vs USER_B)', () => {
    it('enforces garages_own_all strictly to auth.uid() with explicit with check', () => {
      const policyMatch = migrationSql.match(/create policy "garages_own_all"[\s\S]*?;/)
      expect(policyMatch).not.toBeNull()
      const policyContent = policyMatch![0]

      expect(policyContent).toContain("using (user_id = auth.uid()::text)")
      expect(policyContent).toContain("with check (user_id = auth.uid()::text)")
    })

    it('enforces garage_vehicles_own_all strictly through garage ownership with with check', () => {
      const policyMatch = migrationSql.match(/create policy "garage_vehicles_own_all"[\s\S]*?;/)
      expect(policyMatch).not.toBeNull()
      const policyContent = policyMatch![0]

      expect(policyContent).toContain("g.user_id = auth.uid()::text")
      expect(policyContent).toContain("with check")
    })

    it('enforces garage_service_log_own_all and garage_documents with with check', () => {
      const logPolicy = migrationSql.match(/create policy "garage_service_log_own_all"[\s\S]*?;/)
      expect(logPolicy).not.toBeNull()
      expect(logPolicy![0]).toContain("with check")

      const docPolicy = migrationSql.match(/create policy "garage_documents_own_all"[\s\S]*?;/)
      expect(docPolicy).not.toBeNull()
      expect(docPolicy![0]).toContain("with check")
    })

    it('enforces customer_builds_own_all strictly to matching user_id', () => {
      const policyMatch = migrationSql.match(/create policy "customer_builds_own_all"[\s\S]*?;/)
      expect(policyMatch).not.toBeNull()
      const policyContent = policyMatch![0]

      expect(policyContent).toContain("build_type = 'CUSTOMER_BUILD'")
      expect(policyContent).toContain("user_id = auth.uid()::text")
    })
  })

  describe('Staff & Supplier Isolation', () => {
    it('restricts suppliers to staff roles and excludes anonymous users', () => {
      expect(migrationSql).toContain('create policy "suppliers_staff_read"')
      expect(migrationSql).not.toContain('on suppliers for select to anon')
      expect(migrationSql).toContain("p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN')")
    })

    it('restricts supplier_contacts to staff roles', () => {
      expect(migrationSql).toContain('create policy "supplier_contacts_staff_read"')
      expect(migrationSql).not.toContain('on supplier_contacts for select to anon')
    })

    it('ensures supplier_terms has zero anon/authenticated policies (service_role only)', () => {
      const termsPolicies = migrationSql.match(/create policy "[^"]*" on supplier_terms/g)
      expect(termsPolicies).toBeNull()
    })
  })

  describe('Role Privilege Escalation Protection', () => {
    it('profiles_own_update has matching with check clause and protect_profile_role trigger', () => {
      const policyMatch = migrationSql.match(/create policy "profiles_own_update"[\s\S]*?;/)
      expect(policyMatch).not.toBeNull()
      expect(policyMatch![0]).toContain("using (id = auth.uid()::text)")
      expect(policyMatch![0]).toContain("with check (id = auth.uid()::text)")

      // Trigger ensures role column cannot be altered by normal user
      expect(migrationSql).toContain("create trigger protect_profile_role_trigger")
      expect(migrationSql).toContain("Security violation: Only SUPER_ADMIN can modify user role")
    })
  })
})
