-- =============================================================================
-- Migration 013: Supplier CSV Import Pipeline
-- Authoritative schema for the reusable multi-supplier CSV ingestion pipeline.
-- Covers: import jobs, staged files, staged rows, field mapping config,
--         rollback records, media enrichment queue, and import audit trail.
-- STRICTLY ISOLATED: Admin and service_role only. No public access.
-- =============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'import_job_status') then
    create type import_job_status as enum (
      'UPLOADED',
      'PROCESSING',
      'COLUMN_DETECTION',
      'FIELD_MAPPING',
      'NORMALISING',
      'SKU_MATCHING',
      'DEDUP',
      'VALIDATION',
      'MEDIA_ENRICHMENT',
      'REVIEW_REQUIRED',
      'READY',
      'COMMITTED',
      'FAILED',
      'REJECTED',
      'ROLLED_BACK'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'import_row_status') then
    create type import_row_status as enum (
      'VALID',
      'INVALID',
      'DUPLICATE',
      'SKIPPED',
      'WARNING',
      'COMMITTED',
      'REJECTED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'import_row_action') then
    create type import_row_action as enum (
      'CREATE',
      'UPDATE',
      'PRICE_UPDATE',
      'STOCK_UPDATE',
      'NO_CHANGE',
      'REJECT',
      'SKIP'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'import_match_confidence') then
    create type import_match_confidence as enum (
      'VERIFIED',
      'KNOWN',
      'INFERRED',
      'UNKNOWN',
      'NO_MATCH'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'media_enrichment_status') then
    create type media_enrichment_status as enum (
      'PENDING',
      'MATCHED',
      'UNMATCHED',
      'MANUAL_REQUIRED',
      'CLEARED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'image_rights_status') then
    create type image_rights_status as enum (
      'CLEARED',
      'RIGHTS_REVIEW_REQUIRED',
      'RESTRICTED',
      'NOT_APPLICABLE'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'import_audit_action') then
    create type import_audit_action as enum (
      'JOB_CREATED',
      'JOB_COMMITTED',
      'JOB_REJECTED',
      'JOB_ROLLED_BACK',
      'ROW_COMMITTED',
      'ROW_REJECTED',
      'FIELD_MAP_SAVED',
      'MEDIA_ENRICHED'
    );
  end if;
end $$;

-- 2. Import Jobs
create table if not exists supplier_import_jobs (
  id                      text primary key default gen_random_uuid()::text,
  supplier_id             text not null references suppliers(id) on delete cascade,
  uploaded_by             text,
  status                  import_job_status not null default 'UPLOADED',
  current_stage           text not null default 'UPLOAD',
  file_count              integer not null default 0,
  filenames               text[] not null default '{}',
  rows_total              integer not null default 0,
  rows_valid              integer not null default 0,
  rows_invalid            integer not null default 0,
  rows_duplicate          integer not null default 0,
  rows_committed          integer not null default 0,
  rows_rejected           integer not null default 0,
  new_products            integer not null default 0,
  updated_products        integer not null default 0,
  price_changes           integer not null default 0,
  stock_changes           integer not null default 0,
  missing_imagery         integer not null default 0,
  missing_commercial_data integer not null default 0,
  errors                  jsonb not null default '[]'::jsonb,
  warnings                jsonb not null default '[]'::jsonb,
  committed_at            timestamptz,
  committed_by            text,
  rolled_back_at          timestamptz,
  rolled_back_by          text,
  rollback_reason         text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_import_jobs_supplier on supplier_import_jobs(supplier_id);
create index if not exists idx_import_jobs_status on supplier_import_jobs(status);
create index if not exists idx_import_jobs_created on supplier_import_jobs(created_at desc);

-- 3. Import Files
create table if not exists supplier_import_files (
  id                    text primary key default gen_random_uuid()::text,
  job_id                text not null references supplier_import_jobs(id) on delete cascade,
  supplier_id           text not null references suppliers(id) on delete cascade,
  original_filename     text not null,
  file_size_bytes       bigint not null default 0,
  detected_encoding     text not null default 'UTF-8',
  detected_delimiter    text not null default ',',
  source_file_hash      text not null,
  row_count             integer not null default 0,
  duplicate_count       integer not null default 0,
  column_names          text[] not null default '{}',
  uploaded_at           timestamptz not null default now()
);

create index if not exists idx_import_files_job on supplier_import_files(job_id);
create index if not exists idx_import_files_supplier on supplier_import_files(supplier_id);
create index if not exists idx_import_files_hash on supplier_import_files(source_file_hash);

-- 4. Import Rows (Staging Area)
create table if not exists supplier_import_rows (
  id                      text primary key default gen_random_uuid()::text,
  job_id                  text not null references supplier_import_jobs(id) on delete cascade,
  file_id                 text not null references supplier_import_files(id) on delete cascade,
  supplier_id             text not null references suppliers(id) on delete cascade,
  source_filename         text not null,
  source_row_number       integer not null,
  raw_payload             jsonb not null default '{}'::jsonb,
  supplier_sku            text,
  manufacturer_sku        text,
  ean_gtin                text,
  product_name            text,
  description             text,
  brand                   text,
  category                text,
  net_price_minor_units   integer,
  currency                text,
  rrp_minor_units         integer,
  stock_quantity          integer,
  raw_availability        text,
  mapped_product_id       text,
  mapped_variant_id       text,
  match_method            text,
  match_confidence        import_match_confidence not null default 'NO_MATCH',
  row_status              import_row_status not null default 'VALID',
  row_action              import_row_action not null default 'CREATE',
  validation_errors       jsonb not null default '[]'::jsonb,
  validation_warnings     jsonb not null default '[]'::jsonb,
  is_duplicate_of_row_id  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_import_rows_job on supplier_import_rows(job_id);
create index if not exists idx_import_rows_file on supplier_import_rows(file_id);
create index if not exists idx_import_rows_supplier on supplier_import_rows(supplier_id);
create index if not exists idx_import_rows_sku on supplier_import_rows(supplier_sku);
create index if not exists idx_import_rows_ean on supplier_import_rows(ean_gtin);
create index if not exists idx_import_rows_status on supplier_import_rows(row_status);
create index if not exists idx_import_rows_action on supplier_import_rows(row_action);

-- 5. Supplier Field Maps
create table if not exists supplier_import_field_maps (
  id            text primary key default gen_random_uuid()::text,
  supplier_id   text not null references suppliers(id) on delete cascade,
  map_name      text not null,
  is_active     boolean not null default true,
  mappings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    text
);

create index if not exists idx_field_maps_supplier on supplier_import_field_maps(supplier_id);
create index if not exists idx_field_maps_active on supplier_import_field_maps(is_active);
create unique index if not exists uq_field_map_supplier_active
  on supplier_import_field_maps(supplier_id)
  where is_active = true;

-- 6. Rollback Records
create table if not exists supplier_import_rollback_records (
  id              text primary key default gen_random_uuid()::text,
  job_id          text not null references supplier_import_jobs(id) on delete cascade,
  entity_type     text not null check (entity_type in ('supplier_product', 'supplier_offer', 'supplier_mapping')),
  entity_id       text not null,
  action_taken    text not null check (action_taken in ('CREATED', 'UPDATED')),
  previous_state  jsonb,
  new_state       jsonb not null,
  rolled_back_at  timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists idx_rollback_job on supplier_import_rollback_records(job_id);
create index if not exists idx_rollback_entity on supplier_import_rollback_records(entity_type, entity_id);

-- 7. Media Enrichment Queue
create table if not exists supplier_media_enrichment_queue (
  id                    text primary key default gen_random_uuid()::text,
  job_id                text references supplier_import_jobs(id) on delete set null,
  supplier_id           text not null references suppliers(id) on delete cascade,
  supplier_sku          text not null,
  manufacturer_sku      text,
  ean_gtin              text,
  product_name          text not null,
  brand                 text,
  enrichment_status     media_enrichment_status not null default 'PENDING',
  image_url             text,
  image_source_url      text,
  image_source_domain   text,
  image_rights_status   image_rights_status not null default 'RIGHTS_REVIEW_REQUIRED',
  enriched_by           text,
  enriched_at           timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists idx_media_queue_supplier on supplier_media_enrichment_queue(supplier_id);
create index if not exists idx_media_queue_status on supplier_media_enrichment_queue(enrichment_status);
create index if not exists idx_media_queue_job on supplier_media_enrichment_queue(job_id);

-- 8. Import Audit Trail
create table if not exists supplier_import_audit (
  id                text primary key default gen_random_uuid()::text,
  actor             text,
  timestamp         timestamptz not null default now(),
  supplier_id       text not null references suppliers(id) on delete cascade,
  import_job_id     text references supplier_import_jobs(id) on delete set null,
  action            import_audit_action not null,
  entity_type       text,
  entity_id         text,
  previous_value    jsonb,
  new_value         jsonb,
  source_filename   text,
  source_row_number integer,
  notes             text
);

create index if not exists idx_import_audit_supplier on supplier_import_audit(supplier_id);
create index if not exists idx_import_audit_job on supplier_import_audit(import_job_id);
create index if not exists idx_import_audit_action on supplier_import_audit(action);
create index if not exists idx_import_audit_timestamp on supplier_import_audit(timestamp desc);

-- 9. Row Level Security
alter table supplier_import_jobs enable row level security;
alter table supplier_import_files enable row level security;
alter table supplier_import_rows enable row level security;
alter table supplier_import_field_maps enable row level security;
alter table supplier_import_rollback_records enable row level security;
alter table supplier_media_enrichment_queue enable row level security;
alter table supplier_import_audit enable row level security;

create policy "Admins full access import jobs"
  on supplier_import_jobs for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access import files"
  on supplier_import_files for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access import rows"
  on supplier_import_rows for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access import field maps"
  on supplier_import_field_maps for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access import rollback records"
  on supplier_import_rollback_records for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access media enrichment queue"
  on supplier_media_enrichment_queue for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access import audit"
  on supplier_import_audit for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));
