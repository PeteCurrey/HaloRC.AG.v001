-- =============================================================================
-- Migration 011: Multi-Supplier Catalogue Ingestion & Synchronisation Engine
-- Authoritative schema for multi-feed supplier integrations, separate raw
-- supplier product records, exception tracking, and lineage auditing.
-- STRICTLY ISOLATED: Supplier data is operational/admin-only.
-- NO public / anonymous access. Admin and service role only.
-- =============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'supplier_feed_type') then
    create type supplier_feed_type as enum (
      'CATALOGUE',
      'STOCK',
      'PRICE',
      'IMAGE',
      'ORDER_STATUS'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_feed_format') then
    create type supplier_feed_format as enum (
      'CSV',
      'XML',
      'JSON',
      'REST_API',
      'MANUAL_UPLOAD'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_auth_type') then
    create type supplier_auth_type as enum (
      'NONE',
      'BASIC',
      'API_KEY',
      'BEARER_TOKEN',
      'OAUTH2',
      'SFTP'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_exception_severity') then
    create type supplier_exception_severity as enum (
      'WARNING',
      'ERROR',
      'CRITICAL'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'supplier_exception_status') then
    create type supplier_exception_status as enum (
      'OPEN',
      'RESOLVED',
      'IGNORED'
    );
  end if;
end $$;

-- 2. Supplier Feeds Table (Multiple feeds per supplier: stock, catalogue, price, etc.)
create table if not exists supplier_feeds (
  id                    text primary key default gen_random_uuid()::text,
  supplier_id           text not null references suppliers(id) on delete cascade,
  feed_name             text not null,
  feed_type             supplier_feed_type not null default 'CATALOGUE',
  format                supplier_feed_format not null default 'CSV',
  source_url            text,
  auth_type             supplier_auth_type not null default 'NONE',
  auth_config           jsonb not null default '{}'::jsonb, -- encrypted or credential references only
  schedule_cron         text,
  is_active             boolean not null default true,
  last_attempted_run    timestamptz,
  last_successful_run   timestamptz,
  next_scheduled_run    timestamptz,
  error_state           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_supplier_feeds_supplier on supplier_feeds(supplier_id);
create index if not exists idx_supplier_feeds_active on supplier_feeds(is_active);

-- 3. Supplier Products Table (Raw, separate supplier product records)
-- Stores supplier data separately from canonical Avorria products.
create table if not exists supplier_products (
  id                    text primary key default gen_random_uuid()::text,
  supplier_id           text not null references suppliers(id) on delete cascade,
  supplier_feed_id      text references supplier_feeds(id) on delete set null,
  supplier_sku          text not null,
  manufacturer_sku      text,
  ean_gtin              text,
  supplier_product_name text not null,
  supplier_description   text,
  supplier_brand        text,
  supplier_category     text,
  supplier_product_url  text,
  raw_cost_minor_units  integer not null default 0,
  raw_rrp_minor_units   integer,
  currency              text not null default 'GBP',
  raw_stock_quantity    integer,
  raw_availability      text not null default 'UNKNOWN',
  is_discontinued       boolean not null default false,
  source_payload        jsonb not null default '{}'::jsonb,
  source_hash           text,
  first_seen_at         timestamptz not null default now(),
  last_seen_at          timestamptz not null default now(),
  import_status         text not null default 'VALID', -- VALID, EXCEPTION, REJECTED, DISCONTINUED
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint uq_supplier_product_sku unique (supplier_id, supplier_sku)
);

create index if not exists idx_supplier_products_supplier on supplier_products(supplier_id);
create index if not exists idx_supplier_products_sku on supplier_products(supplier_id, supplier_sku);
create index if not exists idx_supplier_products_mfr_sku on supplier_products(manufacturer_sku);
create index if not exists idx_supplier_products_ean on supplier_products(ean_gtin);
create index if not exists idx_supplier_products_status on supplier_products(import_status);

-- 4. Supplier Import Exceptions Table (Structured exception queue)
create table if not exists supplier_import_exceptions (
  id                    text primary key default gen_random_uuid()::text,
  sync_run_id           text references supplier_sync_runs(run_id) on delete cascade,
  supplier_id           text not null references suppliers(id) on delete cascade,
  supplier_product_id   text references supplier_products(id) on delete set null,
  supplier_sku          text,
  exception_code        text not null, -- MISSING_SKU, DUPLICATE_SKU, INVALID_PRICE, INVALID_STOCK, etc.
  severity              supplier_exception_severity not null default 'ERROR',
  message               text not null,
  raw_record            jsonb,
  resolution_status     supplier_exception_status not null default 'OPEN',
  resolved_by           text,
  resolved_at           timestamptz,
  resolution_notes      text,
  created_at            timestamptz not null default now()
);

create index if not exists idx_supp_exceptions_run on supplier_import_exceptions(sync_run_id);
create index if not exists idx_supp_exceptions_supplier on supplier_import_exceptions(supplier_id);
create index if not exists idx_supp_exceptions_status on supplier_import_exceptions(resolution_status);
create index if not exists idx_supp_exceptions_code on supplier_import_exceptions(exception_code);

-- 5. Extend supplier_product_mappings with foreign key to supplier_products
alter table supplier_product_mappings
  add column if not exists supplier_product_id text references supplier_products(id) on delete set null;

create index if not exists idx_supp_mappings_product on supplier_product_mappings(supplier_product_id);

-- 6. Row Level Security (RLS) — STRICT ADMIN & SERVICE ROLE ONLY
alter table supplier_feeds enable row level security;
alter table supplier_products enable row level security;
alter table supplier_import_exceptions enable row level security;

-- Strictly isolated: NO public or customer access
create policy "Admins full access supplier feeds"
  on supplier_feeds for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier products"
  on supplier_products for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier import exceptions"
  on supplier_import_exceptions for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));
