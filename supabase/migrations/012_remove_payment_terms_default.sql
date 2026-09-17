-- Migration: 012_remove_payment_terms_default.sql
-- Description: Drop NOT NULL and DEFAULT 'PREPAYMENT' on payment_terms in supplier_commercial_terms table.
-- Ensures unknown terms can be stored as NULL and never defaulted to an assumed value.

alter table if exists supplier_commercial_terms
  alter column payment_terms drop default,
  alter column payment_terms drop not null;
