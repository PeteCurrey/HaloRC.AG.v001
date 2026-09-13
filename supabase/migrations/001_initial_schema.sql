-- =============================================================================
-- Halo RC — Supabase Migration 001
-- Full schema, indexes, RLS policies, and triggers
-- =============================================================================

-- Enable required extensions
create extension if not exists "pg_trgm";
create extension if not exists "uuid-ossp";

-- =============================================================================
-- AUTH ENVIRONMENT SEPARATION
-- Production: Relies exclusively on native Supabase Auth (`auth.users`).
-- Test/CI: Controlled standalone mock infrastructure created conditionally.
-- =============================================================================
do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'auth') then
    create schema auth;
  end if;
  if not exists (select 1 from information_schema.tables where table_schema = 'auth' and table_name = 'users') then
    create table auth.users (
      id uuid primary key default gen_random_uuid(),
      email text
    );
  end if;
end $$;

-- =============================================================================
-- ENUMS
-- =============================================================================

create type product_tier as enum ('STANDARD', 'PREMIUM', 'HALO', 'COLLECTOR', 'SPECIAL_ORDER');
create type record_status as enum ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
create type lifecycle_status as enum ('ACTIVE', 'PREORDER', 'SPECIAL_ORDER', 'ALLOCATED', 'DISCONTINUED', 'REPLACED', 'ARCHIVED');
create type data_confidence as enum ('VERIFIED', 'KNOWN', 'INFERRED', 'UNKNOWN');
create type brand_tier as enum ('FLAGSHIP', 'PREMIUM_COMPETITION', 'HALO_SCALE', 'DRIFT', 'ENGINES', 'ELECTRONICS', 'AFTERMARKET');
create type brand_status as enum ('TARGET', 'RESEARCHED', 'CONTACTED', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'DISCONTINUED');
create type supply_route as enum ('DIRECT_MANUFACTURER', 'UK_DISTRIBUTOR', 'US_DISTRIBUTOR', 'GREY_IMPORT', 'SPECIAL_ORDER', 'ALLOCATION', 'PREORDER');
create type availability_status as enum ('IN_STOCK', 'LOW_STOCK', 'PRE_ORDER', 'SPECIAL_ORDER', 'OUT_OF_STOCK', 'NOT_AVAILABLE', 'ALLOCATED');
create type product_type as enum (
  'VEHICLE', 'PART', 'RTR_MACHINE', 'KIT', 'CHASSIS', 'BODY', 'MOTOR', 'ESC', 'SERVO',
  'RADIO_SYSTEM', 'BATTERY', 'CHARGER', 'TYRE', 'WHEEL', 'SUSPENSION', 'DRIVETRAIN',
  'AERODYNAMIC', 'HARDWARE', 'TOOLS', 'ACCESSORY', 'REPLACEMENT_PART', 'OPTION_PART',
  'APPAREL', 'COLLECTIBLE', 'DOCUMENT_PRODUCT'
);
create type power_type as enum ('ELECTRIC', 'NITRO', 'PETROL', 'NONE');
create type drive_config as enum ('2WD', '4WD', 'AWD', 'RWD');
create type compatibility_rule_type as enum (
  'FITS', 'RECOMMENDED_FOR', 'REPLACES', 'REQUIRES', 'IMPROVES', 'INCOMPATIBLE', 'MATCHED_WITH',
  'RECOMMENDED', 'REPLACEMENT', 'OPTION', 'UPGRADE', 'REQUIRED', 'COMPATIBLE', 'RELATED'
);
create type document_type as enum ('MANUAL', 'EXPLODED_DIAGRAM', 'SETUP_SHEET', 'HOMOLOGATION', 'TECHNICAL_SHEET', 'INSTALLATION_GUIDE', 'PARTS_LIST');
create type media_type as enum ('HERO', 'GALLERY', 'COMPONENT', 'LIFESTYLE', 'EXPLODED', 'VIDEO', 'THUMBNAIL');
create type licence_type as enum ('MANUFACTURER_PRESS', 'LICENSED', 'OWNED', 'CREATIVE_COMMONS', 'RESTRICTED');
create type storage_provider as enum ('SUPABASE', 'CLOUDINARY', 'S3', 'EXTERNAL');
create type source_type as enum ('MANUFACTURER_SPEC', 'DISTRIBUTOR_CATALOGUE', 'PRESS_RELEASE', 'COMMUNITY', 'MEASURED', 'INFERRED');
create type build_type as enum ('CUSTOMER_BUILD', 'EDITORIAL_BUILD', 'RACE_BUILD', 'RECOMMENDED_BUILD');
create type build_slot_role as enum ('BASE_MACHINE', 'MOTOR', 'ESC', 'BATTERY', 'CHARGER', 'SERVO_STEERING', 'SERVO_THROTTLE', 'RADIO', 'RECEIVER', 'TYRES', 'TYRE_FRONT', 'TYRE_REAR', 'WHEELS', 'WHEEL_FRONT', 'WHEEL_REAR', 'BODY', 'ENGINE', 'EXHAUST', 'CLUTCH', 'FLYWHEEL', 'FUEL_TANK', 'PINION_GEAR', 'SPUR_GEAR', 'DIFF_FLUID', 'BEARING_SET', 'TOOLS', 'OPTION_PART', 'OTHER');
create type slot_requirement as enum ('REQUIRED', 'RECOMMENDED', 'OPTIONAL', 'NOT_APPLICABLE');
create type supplier_type as enum ('MANUFACTURER', 'DISTRIBUTOR', 'DEALER', 'AGENT');
create type supplier_status as enum ('PROSPECT', 'CONTACTED', 'ACTIVE', 'INACTIVE');
create type user_role as enum ('CUSTOMER', 'CUSTOMER_SUPPORT', 'CONTENT_EDITOR', 'SUPPLIER_MANAGER', 'CATALOGUE_ADMIN', 'STAFF', 'ADMIN', 'SUPER_ADMIN');
create type tax_mode as enum ('INCLUSIVE', 'EXCLUSIVE');
create type currency as enum ('GBP', 'USD', 'EUR', 'AUD');
create type market_code as enum ('UK', 'US', 'EU', 'AU');
create type usage_scope as enum ('INTERNAL', 'COMMERCIAL', 'ALL');
create type order_payment_status as enum ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
create type order_fulfilment_status as enum ('PENDING', 'PICKING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- =============================================================================
-- TABLES
-- =============================================================================

-- Markets
create table markets (
  code        market_code primary key,
  name        text not null,
  currency    currency not null,
  tax_mode    tax_mode not null,
  active      boolean not null default true
);

create table market_tax_rules (
  id              text primary key default gen_random_uuid()::text,
  market_code     market_code not null references markets(code),
  tax_type        text not null,
  rate            integer not null,
  applies_to_all  boolean not null default true,
  notes           text
);

create table market_shipping_rules (
  id              text primary key default gen_random_uuid()::text,
  market_code     market_code not null references markets(code),
  carrier         text not null,
  service_level   text not null,
  weight_from_g   integer not null default 0,
  weight_to_g     integer,
  price_pence     integer not null,
  lead_time_days  integer,
  active          boolean not null default true
);

-- Brands & Manufacturers
create table brands (
  id                  text primary key default gen_random_uuid()::text,
  slug                text not null unique,
  name                text not null,
  tier                brand_tier not null,
  status              brand_status not null default 'TARGET',
  country_of_origin   text,
  founded_year        integer,
  description         text,
  website             text,
  logo_storage_path   text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table manufacturers (
  id            text primary key default gen_random_uuid()::text,
  brand_id      text not null references brands(id) on delete cascade,
  legal_name    text not null,
  country       text not null,
  headquarters  text,
  created_at    timestamptz not null default now()
);

create table brand_markets (
  brand_id    text not null references brands(id) on delete cascade,
  market_code market_code not null references markets(code),
  active      boolean not null default true,
  notes       text,
  primary key (brand_id, market_code)
);

-- Categories
create table categories (
  id          text primary key default gen_random_uuid()::text,
  slug        text not null unique,
  name        text not null,
  parent_id   text references categories(id),
  description text,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

-- Vehicle Platforms
create table vehicle_platforms (
  id                text primary key default gen_random_uuid()::text,
  slug              text not null unique,
  name              text not null,
  brand_id          text not null references brands(id),
  chassis_material  text,
  drive_config      drive_config,
  wheelbase_mm      integer,
  description       text,
  status            record_status not null default 'DRAFT',
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index vehicle_platforms_brand_idx on vehicle_platforms(brand_id);

-- Products
create table products (
  id                      text primary key default gen_random_uuid()::text,
  slug                    text not null unique,
  sku                     text unique,
  brand_id                text not null references brands(id),
  platform_id             text references vehicle_platforms(id),
  name                    text not null,
  short_name              text,
  category_id             text references categories(id),
  subcategory_id          text references categories(id),
  scale                   text,
  power_type              power_type,
  product_type            product_type not null default 'VEHICLE',
  tier                    product_tier not null default 'STANDARD',
  status                  record_status not null default 'DRAFT',
  lifecycle               lifecycle_status not null default 'ACTIVE',
  replacement_product_id  text references products(id),
  halo_classification     text,
  editorial_summary       text,
  published               boolean not null default false,
  -- Full-text search
  search_vector           tsvector generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(sku, '') || ' ' ||
      coalesce(short_name, '')
    )
  ) stored,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index products_brand_idx on products(brand_id);
create index products_platform_idx on products(platform_id);
create index products_category_idx on products(category_id);
create index products_tier_idx on products(tier);
create index products_lifecycle_idx on products(lifecycle);
create index products_search_idx on products using gin(search_vector);
create index products_trgm_idx on products using gin(name gin_trgm_ops);

-- Product Variants
create table product_variants (
  id            text primary key default gen_random_uuid()::text,
  product_id    text not null references products(id) on delete cascade,
  sku           text unique,
  name          text not null,
  colour        text,
  configuration text,
  weight_g      integer,
  status        record_status not null default 'DRAFT',
  lifecycle     lifecycle_status not null default 'ACTIVE',
  published     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index product_variants_product_idx on product_variants(product_id);

-- Suppliers (defined before market_offers so supplier_id foreign key resolves cleanly)
create table suppliers (
  id          text primary key default gen_random_uuid()::text,
  slug        text not null unique,
  name        text not null,
  type        supplier_type not null,
  country     text not null,
  website     text,
  status      supplier_status not null default 'PROSPECT',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Market Offers (no prices on products/variants directly)
create table market_offers (
  id                  text primary key default gen_random_uuid()::text,
  product_variant_id  text not null references product_variants(id) on delete cascade,
  market_code         market_code not null references markets(code),
  retail_price        integer not null, -- minor units (pence / cents)
  currency            currency not null,
  tax_mode            tax_mode not null,
  availability        availability_status not null default 'NOT_AVAILABLE',
  supplier_id         text references suppliers(id),
  supply_route        supply_route,
  lead_time_days      integer,
  preorder_date       date,
  allocation_qty      integer,
  notes               text,
  updated_at          timestamptz not null default now()
);

create index market_offers_variant_market_idx on market_offers(product_variant_id, market_code);
create index market_offers_market_idx on market_offers(market_code);
create index market_offers_availability_idx on market_offers(availability);

-- Inventory Sources
create table inventory_sources (
  id               text primary key default gen_random_uuid()::text,
  market_offer_id  text not null references market_offers(id) on delete cascade,
  source           text not null,
  quantity         integer not null default 0,
  reserved_qty     integer not null default 0,
  updated_at       timestamptz not null default now()
);

-- Specifications (with full provenance)
create table specifications (
  id                text primary key default gen_random_uuid()::text,
  entity_type       text not null,
  entity_id         text not null,
  key               text not null,
  value             text not null,
  unit              text,
  confidence        data_confidence not null default 'UNKNOWN',
  source_type       source_type,
  source_url        text,
  source_document   text,
  source_date       date,
  verified_by       text,
  verified_at       timestamptz,
  notes             text
);

create index specs_entity_idx on specifications(entity_type, entity_id);
create index specs_confidence_idx on specifications(confidence);
create index specs_key_idx on specifications(key);

-- Media Assets (with licensing)
create table media_assets (
  id                          text primary key default gen_random_uuid()::text,
  entity_type                 text not null,
  entity_id                   text not null,
  media_type                  media_type not null,
  storage_provider            storage_provider not null default 'SUPABASE',
  storage_path                text,
  source_url                  text,
  alt_text                    text not null,
  caption                     text,
  credit                      text,
  licence_type                licence_type not null,
  licence_source              text,
  usage_scope                 usage_scope not null default 'INTERNAL',
  approved_for_commercial_use boolean not null default false,
  focal_point_x               real not null default 0.5,
  focal_point_y               real not null default 0.5,
  width_px                    integer,
  height_px                   integer,
  sort_order                  integer not null default 0,
  status                      record_status not null default 'DRAFT',
  created_at                  timestamptz not null default now()
);

create index media_entity_idx on media_assets(entity_type, entity_id);
create index media_approved_idx on media_assets(approved_for_commercial_use);

-- Documents
create table documents (
  id                text primary key default gen_random_uuid()::text,
  entity_type       text not null,
  entity_id         text not null,
  document_type     document_type not null,
  title             text not null,
  version           text,
  language          text not null default 'en',
  storage_provider  storage_provider not null default 'SUPABASE',
  storage_path      text,
  source_url        text,
  licence_type      licence_type,
  approved_for_use  boolean not null default false,
  published         boolean not null default false,
  created_at        timestamptz not null default now()
);

create index docs_entity_idx on documents(entity_type, entity_id);

-- Compatibility Rules
create table compatibility_rules (
  id                    text primary key default gen_random_uuid()::text,
  source_entity_type    text not null,
  source_entity_id      text not null,
  target_entity_type    text not null,
  target_entity_id      text not null,
  rule_type             compatibility_rule_type not null,
  verified              boolean not null default false,
  source_type           source_type,
  source_url            text,
  verified_by           text,
  verified_at           timestamptz,
  notes                 text,
  created_at            timestamptz not null default now()
);

create index compat_source_idx on compatibility_rules(source_entity_type, source_entity_id);
create index compat_target_idx on compatibility_rules(target_entity_type, target_entity_id);
create index compat_verified_idx on compatibility_rules(verified);

create table supplier_contacts (
  id            text primary key default gen_random_uuid()::text,
  supplier_id   text not null references suppliers(id) on delete cascade,
  name          text not null,
  role          text,
  email         text,
  phone         text,
  is_primary    boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now()
);

create index supplier_contacts_supplier_idx on supplier_contacts(supplier_id);

create table supplier_brand_relationships (
  id            text primary key default gen_random_uuid()::text,
  supplier_id   text not null references suppliers(id) on delete cascade,
  brand_id      text not null references brands(id),
  market_code   market_code not null references markets(code),
  exclusive     boolean not null default false,
  supply_route  supply_route,
  status        text not null default 'ACTIVE',
  notes         text,
  created_at    timestamptz not null default now()
);

-- COMMERCIALLY SENSITIVE: service_role access only
create table supplier_terms (
  id                    text primary key default gen_random_uuid()::text,
  supplier_id           text not null references suppliers(id) on delete cascade,
  brand_id              text references brands(id),
  market_code           market_code references markets(code),
  opening_order_min     integer,
  minimum_order_qty     integer,
  credit_terms_days     integer,
  payment_method        text,
  map_policy            boolean not null default false,
  dropship_available    boolean not null default false,
  preorder_available    boolean not null default false,
  allocation_model      text,
  notes                 text,
  valid_from            timestamptz,
  valid_until           timestamptz,
  created_at            timestamptz not null default now()
);

create table supplier_documents (
  id              text primary key default gen_random_uuid()::text,
  supplier_id     text not null references suppliers(id) on delete cascade,
  document_type   text not null,
  title           text not null,
  version         text,
  storage_path    text,
  valid_from      timestamptz,
  valid_until     timestamptz,
  created_at      timestamptz not null default now()
);

create table supplier_activity_log (
  id              text primary key default gen_random_uuid()::text,
  supplier_id     text not null references suppliers(id) on delete cascade,
  date            timestamptz not null default now(),
  activity_type   text not null,
  summary         text not null,
  user_id         text,
  created_at      timestamptz not null default now()
);

create index supplier_activity_supplier_idx on supplier_activity_log(supplier_id);

-- Builds
create table builds (
  id                  text primary key default gen_random_uuid()::text,
  slug                text not null unique,
  build_type          build_type not null,
  platform_id         text references vehicle_platforms(id),
  base_product_id     text references products(id),
  market_code         market_code not null,
  name                text not null,
  description         text,
  status              record_status not null default 'DRAFT',
  total_minor_units   integer,
  user_id             text,
  published           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index builds_type_idx on builds(build_type);
create index builds_user_idx on builds(user_id);

create table build_slots (
  id                    text primary key default gen_random_uuid()::text,
  build_id              text not null references builds(id) on delete cascade,
  role                  build_slot_role not null,
  requirement           slot_requirement not null,
  selected_product_id   text references products(id),
  selected_variant_id   text references product_variants(id),
  notes                 text,
  sort_order            integer not null default 0
);

create index build_slots_build_idx on build_slots(build_id);

create table build_alternatives (
  id              text primary key default gen_random_uuid()::text,
  build_slot_id   text not null references build_slots(id) on delete cascade,
  product_id      text not null references products(id),
  sort_order      integer not null default 0
);

-- Profiles (mirrors auth.users.id)
create table profiles (
  id                    text primary key,
  username              text unique,
  display_name          text,
  market_preference     market_code not null default 'UK',
  currency_preference   currency not null default 'GBP',
  role                  user_role not null default 'CUSTOMER',
  created_at            timestamptz not null default now()
);

-- Garages
create table garages (
  id          text primary key default gen_random_uuid()::text,
  user_id     text not null,
  name        text not null default 'My Garage',
  created_at  timestamptz not null default now()
);

create index garages_user_idx on garages(user_id);

create table garage_vehicles (
  id              text primary key default gen_random_uuid()::text,
  garage_id       text not null references garages(id) on delete cascade,
  product_id      text references products(id),
  platform_id     text references vehicle_platforms(id),
  nickname        text,
  colour          text,
  purchase_date   date,
  serial_number   text,
  qr_code_token   text unique default gen_random_uuid()::text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index garage_vehicles_garage_idx on garage_vehicles(garage_id);
create index garage_vehicles_qr_idx on garage_vehicles(qr_code_token);

create table garage_builds (
  id                  text primary key default gen_random_uuid()::text,
  garage_vehicle_id   text not null references garage_vehicles(id) on delete cascade,
  build_id            text references builds(id),
  name                text not null,
  status              text not null default 'CONCEPT',
  notes               text,
  created_at          timestamptz not null default now()
);

create table garage_service_log (
  id                  text primary key default gen_random_uuid()::text,
  garage_vehicle_id   text not null references garage_vehicles(id) on delete cascade,
  date                date not null,
  service_type        text not null,
  description         text not null,
  parts_used          text,
  notes               text,
  created_at          timestamptz not null default now()
);

create index service_log_vehicle_idx on garage_service_log(garage_vehicle_id);

create table garage_documents (
  id                  text primary key default gen_random_uuid()::text,
  garage_vehicle_id   text not null references garage_vehicles(id) on delete cascade,
  document_id         text references documents(id),
  media_asset_id      text references media_assets(id),
  user_note           text,
  created_at          timestamptz not null default now()
);

-- Orders
create table orders (
  id                          text primary key default gen_random_uuid()::text,
  user_id                     text,
  market_code                 market_code not null,
  stripe_payment_intent_id    text unique,
  stripe_checkout_session_id  text unique,
  payment_status              order_payment_status not null default 'PENDING',
  fulfilment_status           order_fulfilment_status not null default 'PENDING',
  total_minor_units           integer not null,
  currency                    currency not null,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index orders_user_idx on orders(user_id);
create index orders_payment_status_idx on orders(payment_status);

create table order_items (
  id                      text primary key default gen_random_uuid()::text,
  order_id                text not null references orders(id) on delete cascade,
  market_offer_id         text references market_offers(id),
  product_variant_id      text references product_variants(id),
  quantity                integer not null,
  unit_price_minor_units  integer not null,
  tax_minor_units         integer not null default 0
);

create index order_items_order_idx on order_items(order_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-create profile on Supabase Auth user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, created_at)
  values (new.id, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Role protection trigger: prevent non-superadmins from escalating user_role
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if current_user in ('service_role', 'postgres') or exists (
      select 1 from public.profiles
      where id = auth.uid()::text and role = 'SUPER_ADMIN'
    ) then
      return new;
    else
      raise exception 'Security violation: Only SUPER_ADMIN can modify user role';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role_trigger
  before update on public.profiles
  for each row execute procedure public.protect_profile_role();

-- updated_at timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger brands_updated_at before update on brands for each row execute procedure handle_updated_at();
create trigger products_updated_at before update on products for each row execute procedure handle_updated_at();
create trigger product_variants_updated_at before update on product_variants for each row execute procedure handle_updated_at();
create trigger vehicle_platforms_updated_at before update on vehicle_platforms for each row execute procedure handle_updated_at();
create trigger suppliers_updated_at before update on suppliers for each row execute procedure handle_updated_at();
create trigger builds_updated_at before update on builds for each row execute procedure handle_updated_at();
create trigger orders_updated_at before update on orders for each row execute procedure handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on every table
alter table markets enable row level security;
alter table market_tax_rules enable row level security;
alter table market_shipping_rules enable row level security;
alter table brands enable row level security;
alter table manufacturers enable row level security;
alter table brand_markets enable row level security;
alter table categories enable row level security;
alter table vehicle_platforms enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table market_offers enable row level security;
alter table inventory_sources enable row level security;
alter table specifications enable row level security;
alter table media_assets enable row level security;
alter table documents enable row level security;
alter table compatibility_rules enable row level security;
alter table suppliers enable row level security;
alter table supplier_contacts enable row level security;
alter table supplier_brand_relationships enable row level security;
alter table supplier_terms enable row level security;
alter table supplier_documents enable row level security;
alter table supplier_activity_log enable row level security;
alter table builds enable row level security;
alter table build_slots enable row level security;
alter table build_alternatives enable row level security;
alter table profiles enable row level security;
alter table garages enable row level security;
alter table garage_vehicles enable row level security;
alter table garage_builds enable row level security;
alter table garage_service_log enable row level security;
alter table garage_documents enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- ── PUBLIC DATA POLICIES ──────────────────────────────────────────────────────

create policy "markets_public_read"
  on markets for select to anon, authenticated
  using (active = true);

create policy "brands_public_read"
  on brands for select to anon, authenticated
  using (status in ('ACTIVE', 'APPROVED'));

create policy "manufacturers_public_read"
  on manufacturers for select to anon, authenticated
  using (true);

create policy "brand_markets_public_read"
  on brand_markets for select to anon, authenticated
  using (active = true);

create policy "categories_public_read"
  on categories for select to anon, authenticated
  using (active = true);

create policy "vehicle_platforms_public_read"
  on vehicle_platforms for select to anon, authenticated
  using (published = true);

create policy "products_public_read"
  on products for select to anon, authenticated
  using (published = true and status = 'PUBLISHED');

create policy "product_variants_public_read"
  on product_variants for select to anon, authenticated
  using (published = true and status = 'PUBLISHED');

-- Market offers: retail price visible; cost_price never exposed (no column on this table)
-- Only exposed if parent product & variant are actively published
create policy "market_offers_public_read"
  on market_offers for select to anon, authenticated
  using (
    availability != 'NOT_AVAILABLE'
    and exists (
      select 1 from product_variants pv
      join products p on p.id = pv.product_id
      where pv.id = market_offers.product_variant_id
        and p.published = true
        and p.status = 'PUBLISHED'
        and pv.published = true
        and pv.status = 'PUBLISHED'
    )
  );

create policy "inventory_sources_public_read"
  on inventory_sources for select to anon, authenticated
  using (
    exists (
      select 1 from market_offers mo
      join product_variants pv on pv.id = mo.product_variant_id
      join products p on p.id = pv.product_id
      where mo.id = inventory_sources.market_offer_id
        and mo.availability != 'NOT_AVAILABLE'
        and p.published = true
        and p.status = 'PUBLISHED'
    )
  );

-- Specifications: UNKNOWN confidence never shown publicly; unpublished product specs protected
create policy "specifications_public_read"
  on specifications for select to anon, authenticated
  using (
    confidence != 'UNKNOWN'
    and (
      entity_type != 'product'
      or exists (
        select 1 from products p
        where p.id = specifications.entity_id
          and p.published = true
          and p.status = 'PUBLISHED'
      )
    )
  );

-- Media: only approved commercial assets for published entities visible publicly
create policy "media_assets_public_read"
  on media_assets for select to anon, authenticated
  using (
    approved_for_commercial_use = true
    and status = 'PUBLISHED'
    and (
      entity_type != 'product'
      or exists (
        select 1 from products p
        where p.id = media_assets.entity_id
          and p.published = true
          and p.status = 'PUBLISHED'
      )
    )
  );

create policy "documents_public_read"
  on documents for select to anon, authenticated
  using (published = true and approved_for_use = true);

create policy "compatibility_rules_public_read"
  on compatibility_rules for select to anon, authenticated
  using (verified = true);

-- Builds: editorial/race/recommended builds are public; customer builds are private
create policy "builds_public_read"
  on builds for select to anon, authenticated
  using (
    published = true
    and build_type in ('EDITORIAL_BUILD', 'RACE_BUILD', 'RECOMMENDED_BUILD')
  );

create policy "build_slots_public_read"
  on build_slots for select to anon, authenticated
  using (
    exists (
      select 1 from builds b
      where b.id = build_slots.build_id
        and b.published = true
        and b.build_type in ('EDITORIAL_BUILD', 'RACE_BUILD', 'RECOMMENDED_BUILD')
    )
  );

create policy "build_alternatives_public_read"
  on build_alternatives for select to anon, authenticated
  using (
    exists (
      select 1 from build_slots bs
      join builds b on b.id = bs.build_id
      where bs.id = build_alternatives.build_slot_id
        and b.published = true
    )
  );

-- ── USER-SPECIFIC DATA POLICIES ───────────────────────────────────────────────

create policy "profiles_own_read"
  on profiles for select to authenticated
  using (id = auth.uid()::text);

create policy "profiles_own_update"
  on profiles for update to authenticated
  using (id = auth.uid()::text)
  with check (id = auth.uid()::text);

create policy "garages_own_all"
  on garages for all to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create policy "garage_vehicles_own_all"
  on garage_vehicles for all to authenticated
  using (
    exists (
      select 1 from garages g
      where g.id = garage_vehicles.garage_id
        and g.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from garages g
      where g.id = garage_vehicles.garage_id
        and g.user_id = auth.uid()::text
    )
  );

create policy "garage_builds_own_all"
  on garage_builds for all to authenticated
  using (
    exists (
      select 1 from garage_vehicles gv
      join garages g on g.id = gv.garage_id
      where gv.id = garage_builds.garage_vehicle_id
        and g.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from garage_vehicles gv
      join garages g on g.id = gv.garage_id
      where gv.id = garage_builds.garage_vehicle_id
        and g.user_id = auth.uid()::text
    )
  );

create policy "garage_service_log_own_all"
  on garage_service_log for all to authenticated
  using (
    exists (
      select 1 from garage_vehicles gv
      join garages g on g.id = gv.garage_id
      where gv.id = garage_service_log.garage_vehicle_id
        and g.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from garage_vehicles gv
      join garages g on g.id = gv.garage_id
      where gv.id = garage_service_log.garage_vehicle_id
        and g.user_id = auth.uid()::text
    )
  );

create policy "garage_documents_own_all"
  on garage_documents for all to authenticated
  using (
    exists (
      select 1 from garage_vehicles gv
      join garages g on g.id = gv.garage_id
      where gv.id = garage_documents.garage_vehicle_id
        and g.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from garage_vehicles gv
      join garages g on g.id = gv.garage_id
      where gv.id = garage_documents.garage_vehicle_id
        and g.user_id = auth.uid()::text
    )
  );

-- Customer builds
create policy "customer_builds_own_all"
  on builds for all to authenticated
  using (build_type = 'CUSTOMER_BUILD' and user_id = auth.uid()::text)
  with check (build_type = 'CUSTOMER_BUILD' and user_id = auth.uid()::text);

create policy "orders_own_read"
  on orders for select to authenticated
  using (user_id = auth.uid()::text);

create policy "order_items_own_read"
  on order_items for select to authenticated
  using (
    exists (
      select 1 from orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()::text
    )
  );

-- ── SUPPLIER DATA: SERVICE_ROLE ONLY ─────────────────────────────────────────
-- No anon or authenticated policies — service_role bypasses RLS

-- suppliers: staff can read; public cannot
create policy "suppliers_staff_read"
  on suppliers for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- supplier_terms: NO public or authenticated policy
-- Only service_role (server-side) can access. This is intentional.

-- supplier_contacts: staff only
create policy "supplier_contacts_staff_read"
  on supplier_contacts for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

create policy "supplier_brand_relationships_staff_read"
  on supplier_brand_relationships for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

create policy "supplier_documents_staff_read"
  on supplier_documents for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

create policy "supplier_activity_log_staff_read"
  on supplier_activity_log for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- Market config: staff write access
create policy "market_tax_rules_public_read"
  on market_tax_rules for select to anon, authenticated
  using (true);

create policy "market_shipping_rules_public_read"
  on market_shipping_rules for select to anon, authenticated
  using (active = true);
