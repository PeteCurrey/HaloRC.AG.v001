import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Database Schema & Migration Source of Truth', () => {
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/001_initial_schema.sql')
  const migrationSql = fs.readFileSync(migrationPath, 'utf8')

  it('migration file exists and is populated', () => {
    expect(fs.existsSync(migrationPath)).toBe(true)
    expect(migrationSql.length).toBeGreaterThan(10000)
  })

  it('declares all required enum types', () => {
    const expectedEnums = [
      'product_tier',
      'record_status',
      'lifecycle_status',
      'data_confidence',
      'brand_tier',
      'brand_status',
      'supply_route',
      'availability_status',
      'product_type',
      'power_type',
      'drive_config',
      'compatibility_rule_type',
      'document_type',
      'media_type',
      'licence_type',
      'storage_provider',
      'source_type',
      'build_type',
      'build_slot_role',
      'slot_requirement',
      'supplier_type',
      'supplier_status',
      'user_role',
      'tax_mode',
      'currency',
      'market_code',
    ]

    for (const enumName of expectedEnums) {
      expect(migrationSql).toContain(`create type ${enumName} as enum`)
    }
  })

  it('user_role enum includes all explicit RBAC roles', () => {
    const roles = [
      'CUSTOMER',
      'CUSTOMER_SUPPORT',
      'CONTENT_EDITOR',
      'SUPPLIER_MANAGER',
      'CATALOGUE_ADMIN',
      'STAFF',
      'ADMIN',
      'SUPER_ADMIN',
    ]

    for (const role of roles) {
      expect(migrationSql).toContain(`'${role}'`)
    }
  })

  it('defines suppliers BEFORE market_offers to eliminate circular/forward foreign key errors', () => {
    const suppliersIndex = migrationSql.indexOf('create table suppliers (')
    const marketOffersIndex = migrationSql.indexOf('create table market_offers (')

    expect(suppliersIndex).toBeGreaterThan(0)
    expect(marketOffersIndex).toBeGreaterThan(0)
    expect(suppliersIndex).toBeLessThan(marketOffersIndex)
  })

  it('defines vehicle_platforms with distinct identity from individual products', () => {
    expect(migrationSql).toContain('create table vehicle_platforms (')
    expect(migrationSql).toContain('create table products (')
    expect(migrationSql).toContain('platform_id         text references vehicle_platforms(id)')
  })

  it('defines market_offers with independent UK/US market code and tax mode', () => {
    expect(migrationSql).toContain('market_code         market_code not null references markets(code)')
    expect(migrationSql).toContain('retail_price        integer not null')
    expect(migrationSql).toContain('tax_mode            tax_mode not null')
    const marketOffersBlock = migrationSql.match(/create table market_offers \([\s\S]*?\);/)![0]
    // Crucial check: market_offers table must NOT have a cost_price column
    expect(marketOffersBlock).not.toContain('cost_price')
  })

  it('defines protect_profile_role trigger to prevent privilege escalation', () => {
    expect(migrationSql).toContain('function public.protect_profile_role()')
    expect(migrationSql).toContain('create trigger protect_profile_role_trigger')
    expect(migrationSql).toContain("Only SUPER_ADMIN can modify user role")
  })

  it('enables Row Level Security on all tables', () => {
    const tables = [
      'markets',
      'market_tax_rules',
      'market_shipping_rules',
      'brands',
      'manufacturers',
      'brand_markets',
      'categories',
      'vehicle_platforms',
      'products',
      'product_variants',
      'market_offers',
      'inventory_sources',
      'specifications',
      'media_assets',
      'documents',
      'compatibility_rules',
      'suppliers',
      'supplier_contacts',
      'supplier_brand_relationships',
      'supplier_terms',
      'supplier_documents',
      'supplier_activity_log',
      'builds',
      'build_slots',
      'build_alternatives',
      'profiles',
      'garages',
      'garage_vehicles',
      'garage_builds',
      'garage_service_log',
      'garage_documents',
      'orders',
      'order_items',
    ]

    for (const table of tables) {
      expect(migrationSql).toContain(`alter table ${table} enable row level security;`)
    }
  })

  it('protects supplier_terms by defining NO public or authenticated policy', () => {
    expect(migrationSql).not.toContain('on supplier_terms for select to anon')
    expect(migrationSql).not.toContain('on supplier_terms for select to authenticated')
  })
})
