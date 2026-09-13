-- =============================================================================
-- Migration 006: Supplier & Inventory Integrations (Procurement Infrastructure)
-- Authoritative schema for multi-supplier feeds, deterministic matching,
-- supplier offers, inventory authority, and sync audit trails.
-- STRICTLY ISOLATED FROM PUBLIC ACCESS: Procurement data is internal/admin-only.
-- =============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'supplier_integration_type') then
    create type supplier_integration_type as enum (
      'MANUAL',
      'CSV',
      'XML',
      'JSON_API',
      'REST_API',
      'SFTP',
      'WEBHOOK',
      'ERP',
      'DISTRIBUTOR_FEED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_match_method') then
    create type supplier_match_method as enum (
      'EXACT_SKU',
      'EXACT_PART_NUMBER',
      'EXACT_GTIN',
      'EXPLICIT_MAPPING',
      'MANUAL_REVIEW'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_mapping_status') then
    create type supplier_mapping_status as enum (
      'UNMATCHED',
      'PENDING_REVIEW',
      'MATCHED',
      'REJECTED',
      'SUPERSEDED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'inventory_authority') then
    create type inventory_authority as enum (
      'OWN_STOCK',
      'SUPPLIER_STOCK',
      'UNKNOWN'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'data_freshness_state') then
    create type data_freshness_state as enum (
      'FRESH',
      'STALE',
      'EXPIRED',
      'UNKNOWN'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_sync_status') then
    create type supplier_sync_status as enum (
      'RUNNING',
      'COMPLETED',
      'PARTIAL',
      'FAILED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_change_type') then
    create type supplier_change_type as enum (
      'COST_CHANGED',
      'AVAILABILITY_CHANGED',
      'RRP_CHANGED',
      'SKU_CHANGED',
      'DISCONTINUED_BY_SUPPLIER',
      'REMOVED_FROM_FEED'
    );
  end if;
end $$;

-- 2. Alter suppliers table with Phase 8 fields if needed
alter table suppliers add column if not exists legal_name text;
alter table suppliers add column if not exists account_reference text;
alter table suppliers add column if not exists relationship_status text not null default 'ACTIVE';
alter table suppliers add column if not exists currency text not null default 'GBP';
alter table suppliers add column if not exists vat_status text;
alter table suppliers add column if not exists contact_email text;
alter table suppliers add column if not exists contact_phone text;
alter table suppliers add column if not exists integration_type supplier_integration_type not null default 'MANUAL';
alter table suppliers add column if not exists last_sync_at timestamptz;

-- 3. Supplier Integrations Table (Configuration & Schedule)
create table if not exists supplier_integrations (
  id                    text primary key default gen_random_uuid()::text,
  supplier_id           text not null references suppliers(id) on delete cascade,
  name                  text not null,
  integration_type      supplier_integration_type not null default 'MANUAL',
  config                jsonb not null default '{}'::jsonb, -- endpoint, format, headers (NO plain passwords)
  schedule_cron         text,
  is_active             boolean not null default true,
  last_sync_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists supplier_integrations_supplier_idx on supplier_integrations(supplier_id);

-- 4. Supplier Product Mappings (Deterministic Links from Supplier SKU to Canonical Product)
create table if not exists supplier_product_mappings (
  id                    text primary key default gen_random_uuid()::text,
  supplier_id           text not null references suppliers(id) on delete cascade,
  supplier_sku          text not null,
  canonical_product_id  text references products(id) on delete set null,
  canonical_variant_id  text references product_variants(id) on delete set null,
  match_method          supplier_match_method,
  match_confidence      text not null default 'UNVERIFIED', -- EXACT_MATCH | HIGH_CERTAINTY | MANUALLY_VERIFIED | UNVERIFIED
  status                supplier_mapping_status not null default 'UNMATCHED',
  reviewed_by           text,
  reviewed_at           timestamptz,
  rejection_reason      text,
  raw_title             text,
  raw_brand             text,
  raw_cost_minor_units  integer,
  raw_currency          text,
  source_payload        jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (supplier_id, supplier_sku)
);

create index if not exists supplier_mappings_supplier_sku_idx on supplier_product_mappings(supplier_id, supplier_sku);
create index if not exists supplier_mappings_canonical_idx on supplier_product_mappings(canonical_product_id);
create index if not exists supplier_mappings_status_idx on supplier_product_mappings(status);

-- 5. Supplier Offers (Internal Commercial Sourcing Offers)
-- COMMERCIALLY SENSITIVE: Never exposed to public storefront or client browsers
create table if not exists supplier_offers (
  id                    text primary key default gen_random_uuid()::text,
  canonical_product_id  text not null references products(id) on delete cascade,
  canonical_variant_id  text references product_variants(id) on delete set null,
  supplier_id           text not null references suppliers(id) on delete cascade,
  supplier_sku          text not null,
  cost_minor_units      integer not null,
  currency              text not null default 'GBP',
  supplier_rrp_minor_units integer,
  availability          availability_status not null default 'NOT_AVAILABLE',
  inventory_authority   inventory_authority not null default 'SUPPLIER_STOCK',
  quantity              integer,
  lead_time_days        integer,
  lead_time_text        text,
  market_code           market_code not null default 'UK',
  freshness_state       data_freshness_state not null default 'FRESH',
  last_checked_at       timestamptz not null default now(),
  status                text not null default 'ACTIVE', -- ACTIVE | STALE | SUPERSEDED | DISCONTINUED
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists supplier_offers_product_idx on supplier_offers(canonical_product_id);
create index if not exists supplier_offers_supplier_idx on supplier_offers(supplier_id);
create index if not exists supplier_offers_market_idx on supplier_offers(market_code);

-- 6. Supplier Sync Runs (Auditable Ledger of Integrations)
create table if not exists supplier_sync_runs (
  run_id                text primary key default gen_random_uuid()::text,
  supplier_id           text not null references suppliers(id) on delete cascade,
  integration_type      supplier_integration_type not null,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  status                supplier_sync_status not null default 'RUNNING',
  records_received      integer not null default 0,
  records_processed     integer not null default 0,
  records_matched       integer not null default 0,
  records_unmatched     integer not null default 0,
  records_changed       integer not null default 0,
  records_rejected      integer not null default 0,
  errors                jsonb not null default '[]'::jsonb,
  warnings              jsonb not null default '[]'::jsonb
);

create index if not exists supplier_sync_runs_supplier_idx on supplier_sync_runs(supplier_id);
create index if not exists supplier_sync_runs_started_idx on supplier_sync_runs(started_at);

-- 7. Supplier Change Events (Historical Diff Tracking)
create table if not exists supplier_change_events (
  id                    text primary key default gen_random_uuid()::text,
  supplier_id           text not null references suppliers(id) on delete cascade,
  supplier_sku          text not null,
  canonical_product_id  text references products(id) on delete set null,
  change_type           supplier_change_type not null,
  old_value             text,
  new_value             text,
  details               text,
  detected_at           timestamptz not null default now()
);

create index if not exists supplier_change_events_supplier_idx on supplier_change_events(supplier_id);
create index if not exists supplier_change_events_detected_idx on supplier_change_events(detected_at);

-- 8. Row Level Security (RLS) — ADMIN & SERVICE ROLE ONLY
alter table supplier_integrations enable row level security;
alter table supplier_product_mappings enable row level security;
alter table supplier_offers enable row level security;
alter table supplier_sync_runs enable row level security;
alter table supplier_change_events enable row level security;

-- Admin & Service Role full access to procurement tables
create policy "Admins full access supplier integrations"
  on supplier_integrations for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier mappings"
  on supplier_product_mappings for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier offers"
  on supplier_offers for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier sync runs"
  on supplier_sync_runs for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier change events"
  on supplier_change_events for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));
