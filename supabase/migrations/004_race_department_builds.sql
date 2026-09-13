-- =============================================================================
-- Migration 004: Race Department & Halo Builds
-- Authoritative schema for engineered competition vehicle configurations,
-- versioning, immutable historical snapshots, and audit logging.
-- =============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'halo_build_type') then
    create type halo_build_type as enum (
      'HALO_BUILD',
      'RACE_BUILD',
      'CLUB_BUILD',
      'BASELINE_BUILD'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'halo_build_status') then
    create type halo_build_status as enum (
      'DRAFT',
      'REVIEW',
      'PUBLISHED',
      'RETIRED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'halo_build_provenance') then
    create type halo_build_provenance as enum (
      'HALO_ENGINEERED',
      'MANUFACTURER_BASED',
      'CUSTOMER_CONFIGURED',
      'RESEARCH_BASED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'race_discipline') then
    create type race_discipline as enum (
      'TOURING',
      'OFF_ROAD',
      'BUGGY',
      'SHORT_COURSE',
      'ROCK_CRAWLER',
      'DRIFT',
      'FORMULA',
      'GT',
      'LARGE_SCALE',
      'OTHER'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'halo_build_subsystem') then
    create type halo_build_subsystem as enum (
      'CHASSIS',
      'POWERTRAIN',
      'CONTROL',
      'ENERGY',
      'AERODYNAMICS',
      'RUNNING_GEAR',
      'HARDWARE'
    );
  end if;
end $$;

-- 2. Halo Builds Table (Master Record)
create table if not exists halo_builds (
  id                    text primary key default gen_random_uuid()::text,
  slug                  text not null unique,
  title                 text not null,
  subtitle              text,
  build_type            halo_build_type not null default 'HALO_BUILD',
  provenance            halo_build_provenance not null default 'HALO_ENGINEERED',
  discipline            race_discipline not null default 'TOURING',
  scale                 text not null,
  platform_id           text not null references vehicle_platforms(id),
  base_product_id       text not null references products(id),
  status                halo_build_status not null default 'DRAFT',
  published             boolean not null default false,
  hero_image_url        text,
  engineering_summary   text not null,
  track_conditions      text,
  current_version       text not null default '1.0',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists halo_builds_discipline_idx on halo_builds(discipline);
create index if not exists halo_builds_platform_idx on halo_builds(platform_id);
create index if not exists halo_builds_status_idx on halo_builds(status);
create index if not exists halo_builds_published_idx on halo_builds(published);

-- 3. Halo Build Versions Table (Immutable Engineering Releases)
create table if not exists halo_build_versions (
  id                    text primary key default gen_random_uuid()::text,
  build_id              text not null references halo_builds(id) on delete cascade,
  version               text not null, -- e.g. "1.0", "1.1"
  status                halo_build_status not null default 'DRAFT',
  changelog_notes       text,
  engineering_notes     text,
  created_at            timestamptz not null default now(),
  published_at          timestamptz,
  validated_at          timestamptz,
  unique (build_id, version)
);

create index if not exists halo_build_versions_build_idx on halo_build_versions(build_id);
create index if not exists halo_build_versions_status_idx on halo_build_versions(status);

-- 4. Halo Build Components Table (Historical Configuration Truth)
create table if not exists halo_build_components (
  id                    text primary key default gen_random_uuid()::text,
  build_version_id      text not null references halo_build_versions(id) on delete cascade,
  role                  build_slot_role not null,
  subsystem             halo_build_subsystem not null,
  product_id            text not null references products(id),
  product_variant_id    text references product_variants(id),
  sku                   text not null,
  product_name          text not null,
  brand_name            text not null,
  brand_id              text not null references brands(id),
  requirement           slot_requirement not null default 'REQUIRED',
  notes                 text,
  compatibility_rule_id text,
  compatibility_rule_description text,
  verified              boolean not null default true,
  sort_order            integer not null default 0
);

create index if not exists halo_build_components_version_idx on halo_build_components(build_version_id);
create index if not exists halo_build_components_product_idx on halo_build_components(product_id);

-- 5. Halo Build Audit Logs (Change Management & Provenance Trail)
create table if not exists halo_build_audit_logs (
  id                    text primary key default gen_random_uuid()::text,
  build_id              text not null references halo_builds(id) on delete cascade,
  build_version         text,
  action                text not null, -- CREATED, EDITED, VALIDATED, PUBLISHED, VERSION_BUMPED, RETIRED
  details               jsonb not null default '{}'::jsonb,
  user_id               text not null,
  created_at            timestamptz not null default now()
);

create index if not exists halo_build_audit_build_idx on halo_build_audit_logs(build_id);

-- 6. Row Level Security (RLS)
alter table halo_builds enable row level security;
alter table halo_build_versions enable row level security;
alter table halo_build_components enable row level security;
alter table halo_build_audit_logs enable row level security;

-- Public can read ONLY published halo builds
create policy "Public can view published halo builds"
  on halo_builds for select
  using (status = 'PUBLISHED' and published = true);

-- Public can read ONLY published versions
create policy "Public can view published halo build versions"
  on halo_build_versions for select
  using (status = 'PUBLISHED');

-- Public can read components belonging to published versions
create policy "Public can view components of published versions"
  on halo_build_components for select
  using (
    exists (
      select 1 from halo_build_versions
      where halo_build_versions.id = halo_build_components.build_version_id
        and halo_build_versions.status = 'PUBLISHED'
    )
  );

-- Admins full access policy (using service role / admin check)
create policy "Admins have full access to halo builds"
  on halo_builds for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'catalogue_admin'));

create policy "Admins have full access to halo build versions"
  on halo_build_versions for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'catalogue_admin'));

create policy "Admins have full access to halo build components"
  on halo_build_components for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'catalogue_admin'));

create policy "Admins have full access to halo build audit logs"
  on halo_build_audit_logs for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'catalogue_admin'));
