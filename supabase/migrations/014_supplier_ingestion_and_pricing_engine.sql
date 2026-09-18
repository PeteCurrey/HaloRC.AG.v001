-- =============================================================================
-- Migration 014: Supplier Ingestion and Pricing Engine
-- Tables:
--   - supplier_price_lists
--   - supplier_items
--   - ingest_exceptions
--   - pricing_rules
--   - fx_rates
-- Tier separation: Service-role and staff access only. Strict RLS.
-- =============================================================================

-- 1. supplier_price_lists
CREATE TABLE IF NOT EXISTS public.supplier_price_lists (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  effective_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  row_count INTEGER NOT NULL DEFAULT 0,
  ingest_run_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS spl_supplier_idx ON public.supplier_price_lists(supplier_id);
CREATE INDEX IF NOT EXISTS spl_date_idx ON public.supplier_price_lists(effective_date);

-- 2. supplier_items
CREATE TABLE IF NOT EXISTS public.supplier_items (
  id TEXT PRIMARY KEY,
  supplier_id TEXT NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  price_list_id TEXT REFERENCES public.supplier_price_lists(id) ON DELETE SET NULL,
  supplier_item_code TEXT NOT NULL,
  sku TEXT NOT NULL,
  raw_name TEXT NOT NULL,
  raw_description TEXT,
  english_name TEXT,
  name_confidence TEXT NOT NULL DEFAULT 'VERIFIED',
  net_price NUMERIC(10, 4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  ean TEXT,
  product_type TEXT NOT NULL,
  category TEXT NOT NULL,
  source_file TEXT NOT NULL,
  source_date DATE NOT NULL,
  exception_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS si_supplier_sku_idx ON public.supplier_items(supplier_id, sku);
CREATE INDEX IF NOT EXISTS si_supplier_code_idx ON public.supplier_items(supplier_item_code);
CREATE INDEX IF NOT EXISTS si_source_date_idx ON public.supplier_items(source_date);
CREATE INDEX IF NOT EXISTS si_product_type_idx ON public.supplier_items(product_type);

-- 3. ingest_exceptions
CREATE TABLE IF NOT EXISTS public.ingest_exceptions (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  reason TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ie_file_idx ON public.ingest_exceptions(file_name);
CREATE INDEX IF NOT EXISTS ie_reason_idx ON public.ingest_exceptions(reason);

-- 4. pricing_rules
CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  markup_percentage NUMERIC(5, 2),
  rounding_rule TEXT,
  minimum_margin_percentage NUMERIC(5, 2),
  configured BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed pricing_rules with fail-closed unconfigured defaults
INSERT INTO public.pricing_rules (id, category, markup_percentage, rounding_rule, minimum_margin_percentage, configured)
VALUES
  ('pr-complete-kit', 'COMPLETE_KIT', NULL, 'ROUND_WHOLE', NULL, FALSE),
  ('pr-option-part', 'OPTION_PART', NULL, 'ROUND_50', NULL, FALSE),
  ('pr-replacement-part', 'REPLACEMENT_PART', NULL, 'ROUND_50', NULL, FALSE),
  ('pr-tools', 'TOOLS', NULL, 'ROUND_50', NULL, FALSE),
  ('pr-accessory', 'ACCESSORY', NULL, 'ROUND_50', NULL, FALSE),
  ('pr-engine', 'ENGINE', NULL, 'ROUND_WHOLE', NULL, FALSE),
  ('pr-document-product', 'DOCUMENT_PRODUCT', NULL, 'ROUND_50', NULL, FALSE),
  ('pr-other', 'OTHER', NULL, 'ROUND_50', NULL, FALSE)
ON CONFLICT (category) DO NOTHING;

-- 5. fx_rates
CREATE TABLE IF NOT EXISTS public.fx_rates (
  id TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate NUMERIC(12, 6) NOT NULL,
  source TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS fx_pair_idx ON public.fx_rates(base_currency, target_currency);

-- Seed explicit, dated FX rates from European Central Bank reference rates
INSERT INTO public.fx_rates (id, base_currency, target_currency, rate, source, captured_at)
VALUES
  ('fx-eur-gbp', 'EUR', 'GBP', 0.854200, 'ECB_REFERENCE_2026_09_18', NOW()),
  ('fx-eur-usd', 'EUR', 'USD', 1.082500, 'ECB_REFERENCE_2026_09_18', NOW())
ON CONFLICT (base_currency, target_currency) DO UPDATE
SET rate = EXCLUDED.rate, source = EXCLUDED.source, captured_at = EXCLUDED.captured_at;

-- 6. Row-Level Security (RLS)
ALTER TABLE public.supplier_price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingest_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;

-- Staff and service_role full access policies
CREATE POLICY "Admins full access supplier_price_lists"
  ON public.supplier_price_lists FOR ALL
  USING (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

CREATE POLICY "Admins full access supplier_items"
  ON public.supplier_items FOR ALL
  USING (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

CREATE POLICY "Admins full access ingest_exceptions"
  ON public.ingest_exceptions FOR ALL
  USING (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

CREATE POLICY "Admins full access pricing_rules"
  ON public.pricing_rules FOR ALL
  USING (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

CREATE POLICY "Admins full access fx_rates"
  ON public.fx_rates FOR ALL
  USING (auth.jwt() ->> 'role' in ('service_role', 'admin', 'super_admin', 'supplier_manager'));

