-- =============================================================================
-- Migration 010: Authoritative Payment State Machine
-- Phase 32 — Formalise the Halo RC payment state machine.
-- Adds PAYMENT_CANCELLED state, DB trigger protection for terminal states,
-- and hardens the payment_events idempotency ledger.
-- =============================================================================

-- 1. Add PAYMENT_CANCELLED to order_payment_status enum (if not already present)
do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'PAYMENT_CANCELLED'
      and enumtypid = (select oid from pg_type where typname = 'order_payment_status')
  ) then
    alter type order_payment_status add value 'PAYMENT_CANCELLED';
  end if;
end $$;

-- 2. Payment state transition guard function
-- Prevents illegal transitions from terminal states: PAID and PAYMENT_CANCELLED.
-- Terminal invariants:
--   PAID → * is rejected (PAID cannot regress)
--   PAYMENT_CANCELLED → * is rejected
create or replace function check_payment_status_transition()
returns trigger
language plpgsql
as $$
begin
  -- If payment status has not changed, allow
  if OLD.payment_status = NEW.payment_status then
    return NEW;
  end if;

  -- PAID is a terminal state — cannot transition to any other state
  if OLD.payment_status = 'PAID' then
    raise exception
      'Illegal payment state transition: PAID → % is not permitted for order %',
      NEW.payment_status,
      OLD.id
    using errcode = 'P0001';
  end if;

  -- PAYMENT_CANCELLED is a terminal state — cannot transition to any other state
  if OLD.payment_status = 'PAYMENT_CANCELLED' then
    raise exception
      'Illegal payment state transition: PAYMENT_CANCELLED → % is not permitted for order %',
      NEW.payment_status,
      OLD.id
    using errcode = 'P0001';
  end if;

  return NEW;
end;
$$;

-- 3. Attach the trigger to the orders table
drop trigger if exists trg_payment_status_transition on orders;
create trigger trg_payment_status_transition
  before update of payment_status
  on orders
  for each row
  execute function check_payment_status_transition();

-- 4. Ensure payment_events.stripe_event_id unique constraint exists
--    (Provides database-level idempotency across Vercel instances)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'payment_events_stripe_event_id_key'
      and conrelid = 'payment_events'::regclass
  ) then
    alter table payment_events
      add constraint payment_events_stripe_event_id_key unique (stripe_event_id);
  end if;
end $$;

-- 5. Backfill: ensure no existing orders have legacy/null payment statuses
--    that would conflict with the narrowed state machine.
--    Set any legacy 'PENDING' → 'PENDING_PAYMENT'
update orders
  set payment_status = 'PENDING_PAYMENT'
  where payment_status = 'PENDING';

-- Set any legacy 'FAILED' → 'PAYMENT_FAILED'
update orders
  set payment_status = 'PAYMENT_FAILED'
  where payment_status = 'FAILED';

-- Set any legacy 'CANCELLED' → 'PAYMENT_CANCELLED'
update orders
  set payment_status = 'PAYMENT_CANCELLED'
  where payment_status = 'CANCELLED';
