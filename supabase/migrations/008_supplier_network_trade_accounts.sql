-- =============================================================================
-- Migration 008: Supplier Network Activation, Trade Accounts & Procurement
-- Relationship Management (Phase 11)
-- Authoritative schema for distributor networks, territory coverages,
-- brand-supplier verification, trade account lifecycle, commercial terms,
-- contacts, communications, secure documents, and operational tasks.
-- STRICTLY ISOLATED: Supplier relationships and trade terms are confidential.
-- NO public / anonymous access. Admin and service role only.
-- =============================================================================

-- 1. Supplier Territory Coverages
create table if not exists supplier_territory_coverages (
  id                  text primary key default gen_random_uuid()::text,
  supplier_id         text not null references suppliers(id) on delete cascade,
  territory           text not null, -- 'UK', 'USA', 'EU', 'AUSTRALIA', 'CANADA', 'OTHER'
  state               text not null default 'SUPPORTED', -- 'SUPPORTED', 'RESTRICTED', 'NOT_SUPPORTED', 'UNKNOWN'
  restriction_reason  text, -- 'EXCLUSIVE_DISTRIBUTOR', 'DIRECT_ONLY', etc.
  notes               text,
  verified_at         timestamptz,
  verified_by         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint uq_supplier_territory unique (supplier_id, territory)
);

create index if not exists idx_supp_terr_supplier on supplier_territory_coverages(supplier_id);
create index if not exists idx_supp_terr_territory on supplier_territory_coverages(territory);

-- 2. Brand Supplier Relationships (Direct vs Authorized Distributor vs Wholesaler)
create table if not exists brand_supplier_relationships (
  id                    text primary key default gen_random_uuid()::text,
  brand_id              text not null references brands(id) on delete cascade,
  supplier_id           text not null references suppliers(id) on delete cascade,
  relationship_type     text not null, -- 'DIRECT_MANUFACTURER', 'AUTHORISED_DISTRIBUTOR', etc.
  verification_status   text not null default 'UNVERIFIED', -- 'VERIFIED', 'UNVERIFIED', 'EXPIRED', 'DISPUTED', 'REJECTED'
  is_exclusive          boolean not null default false,
  exclusivity_scope     text, -- 'UK_EXCLUSIVE', 'USA_EXCLUSIVE', 'REGION_EXCLUSIVE', 'NONE'
  territory             text not null default 'UK',
  evidence_source_type  text not null default 'OTHER',
  evidence_url          text,
  evidence_notes        text,
  verified_at           timestamptz,
  verified_by           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint uq_brand_supplier_terr unique (brand_id, supplier_id, territory)
);

create index if not exists idx_bsr_brand on brand_supplier_relationships(brand_id);
create index if not exists idx_bsr_supplier on brand_supplier_relationships(supplier_id);
create index if not exists idx_bsr_verification on brand_supplier_relationships(verification_status);

-- 3. Trade Account Applications (Onboarding Lifecycle)
create table if not exists trade_account_applications (
  id                      text primary key default gen_random_uuid()::text,
  supplier_id             text not null references suppliers(id) on delete cascade,
  applicant_entity_name   text not null default 'Halo RC Ltd',
  status                  text not null default 'RESEARCHING', -- 'RESEARCHING', 'READY_TO_APPLY', 'SUBMITTED', 'APPROVED', etc.
  stage                   text not null default 'IDENTIFIED', -- Pipeline stage
  submitted_at            timestamptz,
  reviewed_at             timestamptz,
  approved_at             timestamptz,
  rejected_at             timestamptz,
  assigned_to             text,
  account_reference       text,
  credit_limit_minor_units integer,
  credit_currency         text,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists idx_taa_supplier on trade_account_applications(supplier_id);
create index if not exists idx_taa_status on trade_account_applications(status);
create index if not exists idx_taa_stage on trade_account_applications(stage);

-- 4. Trade Account Requirements (Compliance & Document Checklist)
create table if not exists trade_account_requirements (
  id                text primary key default gen_random_uuid()::text,
  application_id    text not null references trade_account_applications(id) on delete cascade,
  requirement_type  text not null, -- 'COMPANY_REGISTRATION', 'VAT_NUMBER', 'TRADE_REFERENCES', etc.
  title             text not null,
  description       text,
  status            text not null default 'PENDING', -- 'PENDING', 'PROVIDED', 'VERIFIED', 'WAIVED', 'REJECTED'
  document_id       text,
  verified_at       timestamptz,
  verified_by       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_tar_app on trade_account_requirements(application_id);

-- 5. Supplier Commercial Terms (Payment, MOQs, Discounts, Free Freight)
create table if not exists supplier_commercial_terms (
  id                                  text primary key default gen_random_uuid()::text,
  supplier_id                         text not null references suppliers(id) on delete cascade,
  currency                            text not null default 'GBP',
  payment_terms                       text not null default 'PREPAYMENT', -- 'PREPAYMENT', 'NET_30', etc.
  payment_terms_days                  integer,
  early_payment_discount_percent      numeric(5,2),
  minimum_order_quantity_units        integer,
  minimum_order_value_minor_units     integer,
  free_freight_threshold_minor_units  integer,
  standard_discount_tier_percent      numeric(5,2),
  drop_ship_available                 boolean not null default false,
  drop_ship_fee_minor_units           integer,
  ordering_method                     text,
  is_verified                         boolean not null default false,
  verified_at                         timestamptz,
  verified_by                         text,
  notes                               text,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now(),
  constraint uq_supp_terms_currency unique (supplier_id, currency)
);

create index if not exists idx_sct_supplier on supplier_commercial_terms(supplier_id);

-- 6. Supplier Pricing Policies (MAP / RRP enforcement)
create table if not exists supplier_pricing_policies (
  id                                  text primary key default gen_random_uuid()::text,
  supplier_id                         text not null references suppliers(id) on delete cascade,
  brand_id                            text references brands(id) on delete cascade,
  policy_type                         text not null default 'RRP',
  enforcement_level                   text not null default 'STRICT', -- 'STRICT', 'ADVISORY', 'FLEXIBLE', 'NONE'
  minimum_advertised_price_percent    numeric(5,2),
  policy_url                          text,
  notes                               text,
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now()
);

create index if not exists idx_spp_supplier on supplier_pricing_policies(supplier_id);

-- 7. Supplier Contacts Directory
create table if not exists supplier_contacts (
  id            text primary key default gen_random_uuid()::text,
  supplier_id   text not null references suppliers(id) on delete cascade,
  name          text not null,
  role          text not null default 'COMMERCIAL_SALES', -- 'COMMERCIAL_SALES', 'TRADE_ACCOUNTS', etc.
  title         text,
  email         text,
  phone         text,
  is_primary    boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_sc_supplier on supplier_contacts(supplier_id);

-- 8. Supplier Communications Log
create table if not exists supplier_communications (
  id                  text primary key default gen_random_uuid()::text,
  supplier_id         text not null references suppliers(id) on delete cascade,
  contact_id          text references supplier_contacts(id) on delete set null,
  type                text not null default 'EMAIL', -- 'EMAIL', 'PHONE', 'MEETING', etc.
  subject             text not null,
  summary             text not null,
  logged_by           text not null,
  occurred_at         timestamptz not null default now(),
  next_follow_up_date date,
  created_at          timestamptz not null default now()
);

create index if not exists idx_scomms_supplier on supplier_communications(supplier_id);

-- 9. Supplier Trade Documents
create table if not exists supplier_documents (
  id            text primary key default gen_random_uuid()::text,
  supplier_id   text not null references suppliers(id) on delete cascade,
  document_type text not null, -- 'DEALER_APPLICATION', 'PRICE_LIST', etc.
  title         text not null,
  file_url      text not null,
  file_size     integer,
  mime_type     text,
  uploaded_by   text not null,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists idx_sdocs_supplier on supplier_documents(supplier_id);

-- 10. Procurement Operational Tasks
create table if not exists procurement_tasks (
  id            text primary key default gen_random_uuid()::text,
  supplier_id   text not null references suppliers(id) on delete cascade,
  task_type     text not null default 'CONTACT_SUPPLIER',
  title         text not null,
  description   text,
  status        text not null default 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  priority      text not null default 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
  due_date      date,
  assigned_to   text,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_ptasks_supplier on procurement_tasks(supplier_id);
create index if not exists idx_ptasks_status on procurement_tasks(status);

-- =============================================================================
-- Row Level Security (RLS) — ADMIN & SERVICE ROLE ONLY
-- =============================================================================
alter table supplier_territory_coverages enable row level security;
alter table brand_supplier_relationships enable row level security;
alter table trade_account_applications enable row level security;
alter table trade_account_requirements enable row level security;
alter table supplier_commercial_terms enable row level security;
alter table supplier_pricing_policies enable row level security;
alter table supplier_contacts enable row level security;
alter table supplier_communications enable row level security;
alter table supplier_documents enable row level security;
alter table procurement_tasks enable row level security;

-- Admin & Service Role access policies (strictly no public access)
create policy "Admins full access supplier territory coverages"
  on supplier_territory_coverages for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access brand supplier relationships"
  on brand_supplier_relationships for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access trade account applications"
  on trade_account_applications for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access trade account requirements"
  on trade_account_requirements for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier commercial terms"
  on supplier_commercial_terms for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier pricing policies"
  on supplier_pricing_policies for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier contacts"
  on supplier_contacts for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier communications"
  on supplier_communications for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access supplier documents"
  on supplier_documents for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

create policy "Admins full access procurement tasks"
  on procurement_tasks for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));
