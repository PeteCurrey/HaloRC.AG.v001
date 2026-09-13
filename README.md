# Halo RC — Engineering & Commercial Platform

> **A premium RC destination for people who take RC seriously.**
> Built on verified engineering specifications, real platform compatibility, and an authoritative dual-market (UK & USA) architecture.

---

## 01. Architecture Principles

1. **Not a Generic Hobby Shop**: Engineered as a premium automotive showroom + motorsport engineering department + specialist race shop + collector culture.
2. **Authoritative Data Integrity**: Every specification adheres strictly to `VERIFIED`, `KNOWN`, `INFERRED`, or `UNKNOWN`. `UNKNOWN` data is never rendered publicly.
3. **Platform-First Compatibility**: The product graph separates `Brand` → `Platform` → `Vehicle` → `Variant` → `Part`, enabling universal platform compatibility queries without SKU duplication.
4. **Market-Specific Offers**: Commercial attributes (pricing, VAT/sales tax, stock, supply routes, lead times) live in `market_offers` rather than directly on product records.
5. **No Synthetic / Hallucinated Specs**: No AI-generated fake specifications or unlicensed product photos.

---

## 02. Technology Stack

| Layer | Selection | Specification |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | React Server Components, Node.js runtime default |
| **Monorepo** | pnpm workspaces + Turborepo | `apps/web`, `packages/db`, `packages/ui`, `packages/types` |
| **Database** | Supabase PostgreSQL | Authoritative migrations in `/supabase/migrations` |
| **ORM** | Drizzle ORM | Schema-as-code with TypeScript type-safety |
| **Security** | Row Level Security (RLS) | Public / User / Staff / Service Role tier segregation |
| **Authentication** | Supabase Auth | Native JWT validation directly integrated with Postgres RLS |
| **Search** | PostgreSQL FTS + `pg_trgm` | Multi-field `tsvector` weighted search |
| **Payments** | Stripe | Webhook-authoritative payment lifecycle |
| **Styling** | CSS Modules + Custom Properties | Token-first design system without utility frameworks |

---

## 03. Core Commercial Worlds

* **The Machines** (`/machines`): Primary retail destination (Bash, Race, Drift, Crawl, Scale, 1/5 Large Scale).
* **The Race Department** (`/race`): Engineering & competition division (1/5 on-road, 1/8 GT, 1/10 touring, nitro/petrol engines, telemetry electronics, precision setups).
* **The Garage** (`/garage`): Enthusiast ecosystem (Fleet tracking, setup sheets, maintenance logs, QR/serial lookup, smart parts filtering).

---

## 04. Local Development

### Prerequisites
* Node.js >= 20.0.0
* pnpm >= 9.0.0

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment configuration
cp .env.example .env

# 3. Generate database migrations
pnpm db:generate

# 4. Start local development server
pnpm dev
```

The storefront will be available at `http://localhost:3000`.

---

## 05. Database Migration & RLS Security

The authoritative SQL migrations are housed in `/supabase/migrations/001_initial_schema.sql`.

* **Public Tables**: `brands`, `products`, `vehicle_platforms`, `categories`, `market_offers` (filtered by published state and confidence level).
* **User Tables**: `garages`, `garage_vehicles`, `orders` (isolated to `auth.uid()`).
* **Service Role / Staff**: `supplier_terms`, `supplier_contacts`, wholesale margins, and opening order commitments are locked down from all anonymous queries.
