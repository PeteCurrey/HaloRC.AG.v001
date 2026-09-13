-- Halo RC — Supabase Migration 002
-- Phase 4: Garage Lifecycle, Persistent Vehicle Records, Historical Build Snapshots, and Public QR Policy

-- 1. Enums
do $$ begin
  create type vehicle_status as enum ('ACTIVE', 'STORED', 'SOLD', 'ARCHIVED');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type service_type as enum ('SETUP', 'MAINTENANCE', 'REPAIR', 'UPGRADE', 'INSPECTION', 'OTHER');
exception
  when duplicate_object then null;
end $$;

-- 2. Profiles Extensions
alter table profiles add column if not exists updated_at timestamptz not null default now();

-- 3. Garages Extensions
alter table garages add column if not exists updated_at timestamptz not null default now();

-- 4. Garage Vehicles Extensions
alter table garage_vehicles add column if not exists status vehicle_status not null default 'ACTIVE';
alter table garage_vehicles add column if not exists variant_id text references product_variants(id);
alter table garage_vehicles add column if not exists is_public boolean not null default false;
alter table garage_vehicles add column if not exists updated_at timestamptz not null default now();

create index if not exists garage_vehicles_status_idx on garage_vehicles(status);
create index if not exists garage_vehicles_public_idx on garage_vehicles(is_public);

-- 5. Garage Builds Extensions (Historical Configuration Snapshot)
alter table garage_builds add column if not exists configuration_snapshot jsonb;
alter table garage_builds add column if not exists updated_at timestamptz not null default now();

-- 6. Garage Service Log Extensions
alter table garage_service_log add column if not exists title text not null default 'Maintenance Entry';
alter table garage_service_log add column if not exists updated_at timestamptz not null default now();

-- 7. Controlled Public QR RLS Policy
-- Public read is strictly limited to vehicles explicitly designated as public (is_public = true).
-- Private vehicles cannot be read by anonymous or unauthorized users.
create policy "garage_vehicles_public_read"
  on garage_vehicles for select to anon, authenticated
  using (is_public = true);
