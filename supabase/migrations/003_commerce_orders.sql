-- =============================================================================
-- Migration 003: Commerce, Baskets, Order Management & Stripe Event Ledger
-- Authoritative, additive migration extending schema for Phase 5.
-- =============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'basket_status') then
    create type basket_status as enum (
      'ACTIVE',
      'CHECKOUT_PENDING',
      'CONVERTED',
      'ABANDONED',
      'EXPIRED'
    );
  end if;
end $$;

-- Extend order_payment_status if values missing
alter type order_payment_status add value if not exists 'PENDING_PAYMENT';
alter type order_payment_status add value if not exists 'PAYMENT_FAILED';
alter type order_payment_status add value if not exists 'CANCELLED';
alter type order_payment_status add value if not exists 'PARTIALLY_REFUNDED';

-- 2. Baskets
create table if not exists baskets (
  id                  text primary key default gen_random_uuid()::text,
  user_id             text,
  market_code         market_code not null,
  currency            currency not null,
  status              basket_status not null default 'ACTIVE',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists baskets_user_idx on baskets(user_id);
create index if not exists baskets_status_idx on baskets(status);

-- 3. Basket Items
create table if not exists basket_items (
  id                      text primary key default gen_random_uuid()::text,
  basket_id               text not null references baskets(id) on delete cascade,
  product_id              text not null references products(id),
  product_variant_id      text references product_variants(id),
  market_offer_id         text references market_offers(id),
  sku                     text not null,
  product_name            text not null,
  quantity                integer not null default 1,
  unit_price_minor_units  integer not null,
  currency                currency not null,
  tax_mode                tax_mode not null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists basket_items_basket_idx on basket_items(basket_id);

-- 4. Payment Events (Stripe Webhook Idempotency & Audit Trail)
create table if not exists payment_events (
  id                  text primary key default gen_random_uuid()::text,
  stripe_event_id     text unique not null,
  event_type          text not null,
  order_id            text references orders(id),
  status              text not null,
  payload             jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists payment_events_stripe_event_idx on payment_events(stripe_event_id);
create index if not exists payment_events_order_idx on payment_events(order_id);

-- 5. Extend Orders
alter table orders add column if not exists order_reference text unique;
alter table orders add column if not exists subtotal_minor_units integer;
alter table orders add column if not exists tax_minor_units integer not null default 0;
alter table orders add column if not exists tax_mode tax_mode not null default 'INCLUSIVE';

create index if not exists orders_order_reference_idx on orders(order_reference);

-- 6. Extend Order Items
alter table order_items add column if not exists product_id text references products(id);
alter table order_items add column if not exists sku text;
alter table order_items add column if not exists product_name text;
alter table order_items add column if not exists line_total_minor_units integer;
alter table order_items add column if not exists currency currency;
alter table order_items add column if not exists tax_mode tax_mode;
alter table order_items add column if not exists snapshot jsonb;
alter table order_items add column if not exists garage_vehicle_id text references garage_vehicles(id) on delete set null;

create index if not exists order_items_garage_vehicle_idx on order_items(garage_vehicle_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

alter table baskets enable row level security;
alter table basket_items enable row level security;
alter table payment_events enable row level security;

-- Baskets: customer owns all operations on their own baskets
create policy "baskets_own_all"
  on baskets for all to authenticated
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Basket Items: customer owns all operations on items in their own baskets
create policy "basket_items_own_all"
  on basket_items for all to authenticated
  using (
    exists (
      select 1 from baskets b
      where b.id = basket_items.basket_id
        and b.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from baskets b
      where b.id = basket_items.basket_id
        and b.user_id = auth.uid()::text
    )
  );

-- Payment Events: strictly server-side / service_role only (no public/authenticated policies)
