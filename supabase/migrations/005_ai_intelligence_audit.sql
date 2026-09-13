-- =============================================================================
-- Migration 005: AI Intelligence Audit & Feedback
-- Authoritative schema for AI query audit trails, grounding telemetry,
-- and customer feedback. Strictly isolated from core catalogue truth.
-- =============================================================================

-- 1. Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ai_intent_category') then
    create type ai_intent_category as enum (
      'PRODUCT_DISCOVERY',
      'PRODUCT_COMPARISON',
      'COMPATIBILITY_EXPLANATION',
      'BUILD_ASSISTANCE',
      'TECHNICAL_QA',
      'DOCUMENT_QA',
      'SPECIFICATION_EXPLANATION',
      'MARKET_AVAILABILITY',
      'GARAGE_ASSISTANCE',
      'GENERAL_RC_QUERY',
      'UNSUPPORTED_REQUEST'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_grounding_state') then
    create type ai_grounding_state as enum (
      'GROUNDED',
      'PARTIALLY_GROUNDED',
      'INSUFFICIENT_EVIDENCE',
      'UNSUPPORTED'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_feedback_type') then
    create type ai_feedback_type as enum (
      'HELPFUL',
      'NOT_HELPFUL',
      'REPORTED_INCORRECT'
    );
  end if;
end $$;

-- 2. AI Audit Logs Table
create table if not exists ai_audit_logs (
  id                    text primary key default gen_random_uuid()::text,
  request_id            text not null,
  user_id               text,
  market_code           market_code not null default 'UK',
  intent                ai_intent_category not null,
  retrieved_source_ids  text[] not null default '{}',
  model_provider        text not null default 'deterministic-grounded',
  model_id              text not null default 'halo-rc-expert-v1',
  latency_ms            integer not null default 0,
  grounding_state       ai_grounding_state not null default 'GROUNDED',
  tool_calls            jsonb not null default '[]'::jsonb,
  error_state           text,
  created_at            timestamptz not null default now()
);

create index if not exists ai_audit_user_idx on ai_audit_logs(user_id);
create index if not exists ai_audit_intent_idx on ai_audit_logs(intent);
create index if not exists ai_audit_grounding_idx on ai_audit_logs(grounding_state);
create index if not exists ai_audit_created_idx on ai_audit_logs(created_at);

-- 3. AI Feedback Table
create table if not exists ai_feedback (
  id                    text primary key default gen_random_uuid()::text,
  request_id            text not null,
  user_id               text,
  feedback_type         ai_feedback_type not null,
  notes                 text,
  created_at            timestamptz not null default now()
);

create index if not exists ai_feedback_request_idx on ai_feedback(request_id);
create index if not exists ai_feedback_user_idx on ai_feedback(user_id);

-- 4. Row Level Security (RLS)
alter table ai_audit_logs enable row level security;
alter table ai_feedback enable row level security;

-- Users can only view their own AI audit logs
create policy "Users view own ai audit logs"
  on ai_audit_logs for select
  using (auth.uid()::text = user_id);

-- Users can insert feedback
create policy "Users can insert ai feedback"
  on ai_feedback for insert
  with check (true);

-- Users can view own feedback
create policy "Users view own ai feedback"
  on ai_feedback for select
  using (auth.uid()::text = user_id or user_id is null);

-- Admins full access
create policy "Admins full access ai audit logs"
  on ai_audit_logs for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'catalogue_admin'));

create policy "Admins full access ai feedback"
  on ai_feedback for all
  using (auth.jwt() ->> 'role' in ('service_role', 'admin', 'catalogue_admin'));
