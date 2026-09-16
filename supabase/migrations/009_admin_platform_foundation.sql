-- =============================================================================
-- Migration 009: Admin Platform Foundation
-- Authoritative schema for CMS, Product Content/SEO/Relationships,
-- Leads CRM-lite, Orders Extension, Audit Log, and AI Suggestions.
-- =============================================================================

-- 1. Enums
do $$
begin
  -- Extend order_fulfilment_status
  alter type order_fulfilment_status add value if not exists 'UNFULFILLED';
  alter type order_fulfilment_status add value if not exists 'PROCESSING';
  alter type order_fulfilment_status add value if not exists 'PACKED';

  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type lead_status as enum (
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'QUOTED',
      'WON',
      'LOST',
      'ARCHIVED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_source') then
    create type lead_source as enum (
      'PRODUCT_ENQUIRY',
      'CONTACT_FORM',
      'QUOTE_REQUEST',
      'COMPATIBILITY_QUESTION',
      'TRADE_ENQUIRY',
      'SUPPLIER_ENQUIRY',
      'NEWSLETTER',
      'OTHER'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'lead_priority') then
    create type lead_priority as enum (
      'LOW',
      'NORMAL',
      'HIGH',
      'URGENT'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'cms_page_type') then
    create type cms_page_type as enum (
      'BRAND',
      'BUYING_GUIDE',
      'EDITORIAL',
      'LANDING',
      'ABOUT',
      'SHIPPING',
      'RETURNS',
      'CONTACT',
      'OTHER'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type audit_action as enum (
      'CREATE',
      'UPDATE',
      'DELETE',
      'PUBLISH',
      'UNPUBLISH',
      'ARCHIVE',
      'STATUS_CHANGE',
      'PRICE_CHANGE'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_suggestion_type') then
    create type ai_suggestion_type as enum (
      'DESCRIPTION',
      'SHORT_DESCRIPTION',
      'SEO_TITLE',
      'META_DESCRIPTION',
      'FEATURES',
      'COLLECTION_DESCRIPTION'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_suggestion_status') then
    create type ai_suggestion_status as enum (
      'PENDING',
      'APPROVED',
      'REJECTED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'homepage_section_type') then
    create type homepage_section_type as enum (
      'HERO',
      'FEATURED_MACHINES',
      'FEATURED_BRANDS',
      'EDITORIAL',
      'PROMOTIONAL',
      'COLLECTIONS',
      'HALO_PRODUCT',
      'BUYING_GUIDE'
    );
  end if;
end $$;

-- 2. Alter Existing Tables

-- Products extension
alter table products add column if not exists manufacturer_sku text;
alter table products add column if not exists internal_code text;
alter table products add column if not exists tags text[] default '{}'::text[];

create index if not exists idx_products_manufacturer_sku on products(manufacturer_sku);
create index if not exists idx_products_internal_code on products(internal_code);

-- Orders extension
alter table orders add column if not exists billing_address jsonb;
alter table orders add column if not exists shipping_address jsonb;
alter table orders add column if not exists customer_notes text;
alter table orders add column if not exists internal_notes text;
alter table orders add column if not exists shipping_method_id text;

-- 3. Leads CRM-Lite
create table if not exists leads (
  id                    text primary key default gen_random_uuid()::text,
  name                  text not null,
  email                 text not null,
  phone                 text,
  company               text,
  source                lead_source not null default 'CONTACT_FORM',
  product_interest_id   text references products(id) on delete set null,
  message               text not null,
  status                lead_status not null default 'NEW',
  priority              lead_priority not null default 'NORMAL',
  assigned_user_id      text,
  notes                 text,
  follow_up_date        date,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_source on leads(source);
create index if not exists idx_leads_created_at on leads(created_at);
create index if not exists idx_leads_product_interest on leads(product_interest_id);
create index if not exists idx_leads_assigned on leads(assigned_user_id);

-- Lead Activities / Timeline
create table if not exists lead_activities (
  id          text primary key default gen_random_uuid()::text,
  lead_id     text not null references leads(id) on delete cascade,
  user_id     text,
  user_email  text,
  action      text not null, -- 'STATUS_CHANGE', 'NOTE_ADDED', 'ASSIGNED', 'CONTACTED'
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists idx_lead_activities_lead on lead_activities(lead_id);

-- 4. CMS Pages
create table if not exists cms_pages (
  id                text primary key default gen_random_uuid()::text,
  slug              text not null unique,
  title             text not null,
  status            record_status not null default 'DRAFT',
  page_type         cms_page_type not null default 'EDITORIAL',
  hero_heading      text,
  hero_subheading   text,
  content_json      jsonb not null default '[]'::jsonb,
  seo_title         text,
  seo_description   text,
  canonical_url     text,
  og_title          text,
  og_description    text,
  og_image_url      text,
  index_page        boolean not null default true,
  published_at      timestamptz,
  published_by      text,
  author_id         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_cms_pages_slug on cms_pages(slug);
create index if not exists idx_cms_pages_status on cms_pages(status);
create index if not exists idx_cms_pages_type on cms_pages(page_type);

-- 5. Product Content (Structured Editorial)
create table if not exists product_content (
  id                    text primary key default gen_random_uuid()::text,
  product_id            text not null unique references products(id) on delete cascade,
  short_description     text,
  long_description      text,
  key_features          text[] not null default '{}'::text[],
  whats_included        text[] not null default '{}'::text[],
  requirements          text[] not null default '{}'::text[],
  compatibility_notes   text,
  manufacturer_info     text,
  editorial_notes       text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_product_content_product on product_content(product_id);

-- 6. Product SEO
create table if not exists product_seo (
  id                text primary key default gen_random_uuid()::text,
  product_id        text not null unique references products(id) on delete cascade,
  seo_title         text,
  meta_description  text,
  canonical_url     text,
  og_title          text,
  og_description    text,
  og_image_url      text,
  index_page        boolean not null default true,
  primary_keyword   text,
  seo_notes         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_product_seo_product on product_seo(product_id);

-- 7. Product Relationships (Explicit Database-backed relationships)
create table if not exists product_relationships (
  id                    text primary key default gen_random_uuid()::text,
  product_id            text not null references products(id) on delete cascade,
  related_product_id    text not null references products(id) on delete cascade,
  relationship_type     text not null, -- 'ACCESSORY', 'UPGRADE', 'REPLACEMENT', 'COMPATIBLE', 'RELATED', 'FREQUENTLY_BOUGHT_TOGETHER'
  sort_order            integer not null default 0,
  notes                 text,
  created_at            timestamptz not null default now(),
  constraint uq_product_relation unique (product_id, related_product_id, relationship_type)
);

create index if not exists idx_prod_rel_product on product_relationships(product_id);
create index if not exists idx_prod_rel_related on product_relationships(related_product_id);

-- 8. Audit Log (Administrative Action Ledger)
create table if not exists audit_log (
  id              text primary key default gen_random_uuid()::text,
  user_id         text,
  user_email      text,
  action          audit_action not null,
  entity_type     text not null, -- 'PRODUCT', 'ORDER', 'LEAD', 'CMS_PAGE', 'SEO', 'PRICING', etc.
  entity_id       text not null,
  previous_state  jsonb,
  new_state       jsonb,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_log_entity on audit_log(entity_type, entity_id);
create index if not exists idx_audit_log_created_at on audit_log(created_at);
create index if not exists idx_audit_log_user on audit_log(user_id);

-- 9. AI Suggestions (Staff Review Gate)
create table if not exists ai_suggestions (
  id                text primary key default gen_random_uuid()::text,
  product_id        text references products(id) on delete cascade,
  suggestion_type   ai_suggestion_type not null,
  draft_content     text not null,
  model_provider    text not null default 'google-gemini',
  model_id          text not null default 'gemini-1.5-pro',
  reviewed_by       text,
  reviewed_at       timestamptz,
  status            ai_suggestion_status not null default 'PENDING',
  created_at        timestamptz not null default now()
);

create index if not exists idx_ai_suggestions_product on ai_suggestions(product_id);
create index if not exists idx_ai_suggestions_status on ai_suggestions(status);

-- 10. CMS Homepage Configuration
create table if not exists cms_homepage_config (
  id            text primary key default gen_random_uuid()::text,
  section_key   text not null unique,
  section_type  homepage_section_type not null,
  title         text not null,
  subtitle      text,
  content_json  jsonb not null default '{}'::jsonb,
  active        boolean not null default true,
  sort_order    integer not null default 0,
  updated_at    timestamptz not null default now(),
  updated_by    text
);

create index if not exists idx_cms_hp_active_sort on cms_homepage_config(active, sort_order);

-- 11. Navigation Configuration
create table if not exists navigation_config (
  id            text primary key default gen_random_uuid()::text,
  nav_key       text not null unique,
  label         text not null,
  href          text not null,
  parent_id     text references navigation_config(id) on delete cascade,
  badge         text,
  sub_text      text,
  sort_order    integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists idx_nav_parent_sort on navigation_config(parent_id, sort_order);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table cms_pages enable row level security;
alter table product_content enable row level security;
alter table product_seo enable row level security;
alter table product_relationships enable row level security;
alter table audit_log enable row level security;
alter table ai_suggestions enable row level security;
alter table cms_homepage_config enable row level security;
alter table navigation_config enable row level security;

-- Public / Anonymous can insert new leads (from contact / product enquiry forms)
create policy "Public can insert leads"
  on leads for insert to anon, authenticated
  with check (true);

-- Staff / Admin full access to leads
create policy "Staff manage leads"
  on leads for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMER_SUPPORT', 'CATALOGUE_ADMIN')
    )
  );

-- Lead activities: Staff only
create policy "Staff manage lead activities"
  on lead_activities for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMER_SUPPORT', 'CATALOGUE_ADMIN')
    )
  );

-- CMS Pages: Public can read published only
create policy "Public read published cms_pages"
  on cms_pages for select to anon, authenticated
  using (status = 'PUBLISHED');

-- CMS Pages: Staff manage all
create policy "Staff manage cms_pages"
  on cms_pages for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR', 'CATALOGUE_ADMIN')
    )
  );

-- Product Content: Public read for published products
create policy "Public read published product_content"
  on product_content for select to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_content.product_id
        and p.published = true
        and p.status = 'PUBLISHED'
    )
  );

-- Product Content: Staff manage all
create policy "Staff manage product_content"
  on product_content for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR', 'CATALOGUE_ADMIN')
    )
  );

-- Product SEO: Public read for published products
create policy "Public read published product_seo"
  on product_seo for select to anon, authenticated
  using (
    exists (
      select 1 from products p
      where p.id = product_seo.product_id
        and p.published = true
        and p.status = 'PUBLISHED'
    )
  );

-- Product SEO: Staff manage all
create policy "Staff manage product_seo"
  on product_seo for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR', 'CATALOGUE_ADMIN')
    )
  );

-- Product Relationships: Public read
create policy "Public read product_relationships"
  on product_relationships for select to anon, authenticated
  using (true);

-- Product Relationships: Staff manage
create policy "Staff manage product_relationships"
  on product_relationships for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CATALOGUE_ADMIN')
    )
  );

-- Audit Log: Staff read-only; no client direct updates or deletes
create policy "Staff view audit_log"
  on audit_log for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN')
    )
  );

-- AI Suggestions: Staff only
create policy "Staff manage ai_suggestions"
  on ai_suggestions for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR', 'CATALOGUE_ADMIN')
    )
  );

-- CMS Homepage: Public read active
create policy "Public read active homepage config"
  on cms_homepage_config for select to anon, authenticated
  using (active = true);

-- CMS Homepage: Staff manage
create policy "Staff manage homepage config"
  on cms_homepage_config for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR')
    )
  );

-- Navigation: Public read active
create policy "Public read active navigation"
  on navigation_config for select to anon, authenticated
  using (active = true);

-- Navigation: Staff manage
create policy "Staff manage navigation"
  on navigation_config for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_EDITOR')
    )
  );

-- Orders: Staff view and manage
create policy "Staff view orders"
  on orders for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMER_SUPPORT')
    )
  );

create policy "Staff update orders"
  on orders for update to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMER_SUPPORT')
    )
  )
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMER_SUPPORT')
    )
  );

create policy "Staff view order_items"
  on order_items for select to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()::text
        and p.role in ('STAFF', 'ADMIN', 'SUPER_ADMIN', 'CUSTOMER_SUPPORT')
    )
  );
