-- =============================================================================
-- Migration 007: International Markets, Tax Presentation & Shipping Architecture
-- Authoritative schema for multi-market configuration, tax display modes,
-- shipping rate tables, and logistical/legal product shipping constraints.
-- =============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tax_display_mode') then
    create type tax_display_mode as enum (
      'TAX_INCLUDED',
      'TAX_EXCLUDED',
      'TAX_CALCULATED_AT_CHECKOUT',
      'TAX_NOT_APPLICABLE',
      'TAX_UNKNOWN'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'measurement_system') then
    create type measurement_system as enum (
      'METRIC',
      'IMPERIAL'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'shipping_region') then
    create type shipping_region as enum (
      'UK_DOMESTIC',
      'US_DOMESTIC'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'shipping_restriction_type') then
    create type shipping_restriction_type as enum (
      'BATTERY_HAZMAT',
      'OVERSIZE_FREIGHT',
      'PROHIBITED_IMPORT'
    );
  end if;
end $$;

-- 2. Extend markets table with Phase 9 international configuration
alter table markets add column if not exists country_code text not null default 'GB';
alter table markets add column if not exists locale text not null default 'en-GB';
alter table markets add column if not exists tax_display_mode tax_display_mode not null default 'TAX_INCLUDED';
alter table markets add column if not exists default_language text not null default 'en';
alter table markets add column if not exists measurement_system measurement_system not null default 'METRIC';
alter table markets add column if not exists shipping_region shipping_region not null default 'UK_DOMESTIC';
alter table markets add column if not exists created_at timestamptz not null default now();
alter table markets add column if not exists updated_at timestamptz not null default now();

-- Update US market defaults if present
update markets set
  country_code = 'US',
  locale = 'en-US',
  tax_display_mode = 'TAX_EXCLUDED',
  measurement_system = 'IMPERIAL',
  shipping_region = 'US_DOMESTIC'
where code = 'US';

-- 3. Market Shipping Methods Table
create table if not exists market_shipping_methods (
  id                    text primary key default gen_random_uuid()::text,
  market_code           market_code not null references markets(code),
  name                  text not null,
  carrier               text not null,
  service_level         text not null,
  cost_minor_units      integer not null default 0,
  currency              currency not null default 'GBP',
  estimated_days_min    integer not null default 1,
  estimated_days_max    integer not null default 3,
  cutoff_time_utc       text,
  free_threshold_minor_units integer,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists market_shipping_market_idx on market_shipping_methods(market_code);

-- 4. Product Shipping Constraints Table (Logistical & Hazmat Rules)
create table if not exists product_shipping_constraints (
  id                    text primary key default gen_random_uuid()::text,
  product_id            text not null references products(id) on delete cascade,
  is_oversize           boolean not null default false,
  is_hazardous          boolean not null default false,
  max_quantity_per_consignment integer,
  requires_special_handling boolean not null default false,
  prohibited_markets    text[] not null default '{}',
  restriction_note      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(product_id)
);

create index if not exists product_shipping_constraints_product_idx on product_shipping_constraints(product_id);

-- 5. Row Level Security (RLS)
alter table market_shipping_methods enable row level security;
alter table product_shipping_constraints enable row level security;

-- Public can view active shipping methods
create policy "Public read active shipping methods"
  on market_shipping_methods for select
  using (active = true);

-- Public can view shipping constraints
create policy "Public read product shipping constraints"
  on product_shipping_constraints for select
  using (true);

-- Admins full access
create policy "Admins full access shipping methods"
  on market_shipping_methods for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'catalogue_admin'));

create policy "Admins full access shipping constraints"
  on product_shipping_constraints for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'catalogue_admin'));
