# HerdFlow — Engineering Roadmap (demo → real SaaS)

The path from today's client-side prototype to a multi-tenant, IoT-scale SaaS.
Companion to the product/strategy doc ([`ROADMAP.md`](./ROADMAP.md)) and the
validated engine ([`POC.md`](./POC.md)).

> **One-line reframe:** HerdFlow is an **IoT + time-series + per-animal anomaly
> detection** platform, *not* a CRUD web app. Size and design everything by
> **`active animals × reading frequency`**, never by user count.

---

## 0. Principles (non-negotiable)
1. **Hardware-agnostic ingestion** — a generic API that normalises *any* sensor
   to one canonical reading schema. This is the moat; never lock to one vendor.
2. **Detection is a server-side pipeline**, not a render-time function. The
   browser never computes alerts. (Reuse `lib/anomaly.ts` verbatim on the server.)
3. **Multi-tenant from commit #1** — isolation enforced in the data layer (RLS),
   tested, hierarchical (orgs → sites → zones → animals; coops/vets get grants).
4. **Batch-first, stream-later** — livestock illness develops over hours/days.
   Start with a 15–30 min batch worker; only build streaming when a customer
   pays for sub-minute. Keep the data contract stable so you can swap engines.
5. **Reuse the demo as UI + fixtures, not as the product** — the design system,
   components, and the deterministic generator (as test fixtures) survive; the
   client-side state/“live tick” do not.
6. **Mexico first, region-aware later** — LFPDPPP, SINIIGA, CFDI, MXN from day 1;
   design data residency per region for future countries.

---

## 1. Target architecture

```
 sensors / vendors                 HerdFlow platform
 (bolus, collar, GPS,      ┌───────────────────────────────────────────────┐
  ear tag, CSV, gateway)   │                                               │
        │  push            │   Ingestion API ──► (queue, phase 3) ──►       │
        ├──────────────────┼──►  /v1/readings      detection workers       │
        │  per-site         │   - API key/site     (batch 15–30 min)        │
        │  API key          │   - Zod validate     - rolling baseline       │
        │                   │   - adapter/vendor    - z-score (lib/anomaly)  │
        │                   │   - idempotent        - write anomalies        │
        │                   │        │                      │                │
        │                   │        ▼                      ▼                │
        │                   │   time-series store      app database          │
        │                   │   (Timescale → CH)       animals / baselines   │
        │                   │   hot/warm/cold          anomalies / orgs       │
        │                   │        │                      │                │
        │                   │        └──────► API (REST/tRPC) ◄──────┐       │
        │                   │                     │                  │       │
        │                   │      Dashboard (Next.js, reads API)    Alerts  │
        │                   │      Mobile triage                 WhatsApp/SMS │
        │                   └───────────────────────────────────────────────┘
   Cross-cutting: Auth + RBAC + RLS · Billing (Stripe) · Observability · CI/CD
```

---

## 2. Canonical data model (sketch)
Full DDL is a separate deliverable; this is the shape.

```
organizations  (id, type: farm|cooperative|vet_practice, name, country, created_at)
sites          (id, org_id, name, location)                 -- ranchos
zones          (id, site_id, name)                          -- zonas / lotes
animals        (id, site_id, zone_id, tag_id, siniiga_id, species, name, status)
devices        (id, site_id, vendor, external_id, api_key_hash, last_seen)
readings        (animal_id, recorded_at, metric, value)      -- TIME-SERIES (hypertable)
baselines      (animal_id, metric, mean, stddev, window, updated_at)  -- materialised
anomalies      (id, animal_id, detected_at, metric, severity, z_score, condition, resolved)
users          (id, email, ...)
memberships    (user_id, org_id, role: owner|manager|herdsman|vet|viewer)
access_grants  (grantor_farm_id, grantee_org_id, role, status)   -- coop/vet → farms
subscriptions  (org_id, stripe_customer_id, plan, active_animals)
```

**Key calls:**
- `readings` is the only high-volume table → hypertable + retention + rollups.
- Domain model has **no UI fields** (the demo's `x,y` map position is derived/UI).
- The animal **never embeds its full series** (the demo does); series is queried.
- **RLS** on every tenant table, keyed by `farm/site`, checking *membership OR
  active grant*. Coop/vet access is delegated, auditable, revocable.

---

## 3. Phases

### Phase 0 — Foundations (1–2 weeks)
- Restructure to a monorepo: `apps/web` (current Next.js), `apps/api`,
  `apps/workers`, `packages/core` (move `lib/anomaly.ts`, `lib/conditions.ts`,
  `lib/types.ts` here — the shared, server-portable engine).
- Add **tests** (Vitest) on the engine; reuse `scripts/poc-eval.mjs` as fixtures.
- CI (GitHub Actions), secrets management, env separation.
- Decide & provision: Postgres+**Timescale** (Supabase/Neon), **Auth** (Clerk or
  Supabase), jobs (**Inngest**/Trigger.dev).
- **Exit:** engine is a tested package, server-portable; infra accounts ready.

### Phase 1 — Backend MVP + first real data (4–8 weeks)
- Canonical schema + RLS + org/membership/grant model.
- **Ingestion API** `POST /v1/readings`: per-site API key, Zod, idempotency,
  rate-limit; **adapter #1** for one vendor (dairy bolus/collar).
- **Batch detection worker** (15–30 min): rolling baseline + z-score (reusing the
  engine) + writes anomalies; day-0 uses `SPECIES_NORMS` as provisional baseline.
- Auth + RBAC; dashboard reads the **API** (replace `generateHerd()`; keep the
  generator as test fixtures).
- **Alerting MVP** (WhatsApp/email) on new criticals.
- **Pilot:** 1 dairy farm + 1 integration + the team's **vet validating** alerts.
- **Exit:** one real farm ingesting, getting vet-confirmed alerts. The PoC, but real.

### Phase 2 — Multi-tenant SaaS + first paying customers (2–3 months)
- Full tenancy: onboarding "who are you?" flows (farm / coop / vet), invites,
  access grants, hierarchy (sites/zones).
- **Billing live:** Stripe metered **per active animal/month**, volume tiers,
  no cap, **MXN + OXXO/SPEI**, **CFDI 4.0** via Facturama. Coop pays for member farms.
- Mobile-first triage + WhatsApp as primary channel; **i18n ES-MX**.
- Cold-start UX (provisional baselines, "not enough history yet" states).
- Compliance: LFPDPPP (aviso de privacidad, ARCO), **SINIIGA** ID alignment.
- Observability (Sentry, logs/metrics), backups, status page.
- **Exit:** self-serve onboarding; first paying customers; SLA basics.

### Phase 3 — Scale & real-time (3–6 months)
- Decouple ingestion with a **queue/stream** (Upstash Kafka / Redpanda / SQS).
- Time-series at volume: Timescale continuous aggregates → **ClickHouse** for
  heavy analytics; **Redis** for latest-state; hot/warm/cold tiering + rollups.
- **Realtime per tenant** (Supabase Realtime / SSE), never one global subscription.
- Frontend: server-driven, pagination + **virtualization**, per-animal lazy load
  (kill the "whole herd in Context" pattern).
- **Disease-specific models** (mastitis, estrus) validated vs vet outcomes →
  the labelled-data moat begins.
- **Exit:** thousands of farms / millions of animals; defined SLOs; on-call.

### Phase 4 — Platform & multi-region (6+ months)
- **Edge ingestion** (LoRaWAN / satellite gateways, batching, backpressure) for
  extensive Mexican beef ranches with no cell coverage.
- Stateful **stream processor keyed by `animal_id`**, horizontally scalable.
- Partition/shard time-series by tenant/time; tiered storage; downsampling.
- Region-aware data residency (EU customers → EU region).
- Integration marketplace (adapters per vendor); public API; ESG/methane module.

---

## 4. Scaling triggers (when to add what)
Sized by `writes/sec = animals ÷ interval`. Re-evaluate at each threshold.

| Load (example) | writes/sec | Action |
|---|---|---|
| < ~5k animals, hourly | < 5 | Postgres + Timescale + batch worker (Phase 1) |
| 100k–1M animals, 10–30 min | 100s–1k | Continuous aggregates, retention policy, Redis cache |
| 1M–20M animals, ≤10 min | 1k–30k | **Queue/stream**, ClickHouse, partitioning (Phase 3) |
| 20M+ animals, ≤1 min | 100k+ | Edge ingestion, sharding, stateful stream cluster (Phase 4) |

---

## 5. Security & compliance checklist
- [ ] RLS on every tenant table, **with tests** (the #1 SaaS risk).
- [ ] Device auth: per-site API keys (hashed), rotation, rate-limit, payload Zod.
- [ ] RBAC (owner/manager/herdsman/vet/viewer) + delegated grants, auditable.
- [ ] Secrets in platform vault, never in repo (`.gitignore` already enforces).
- [ ] LFPDPPP (MX): aviso de privacidad, consent, ARCO; **SINIIGA** alignment.
- [ ] CFDI 4.0 invoicing; MXN + local payment methods.
- [ ] Data residency per region; "the farmer owns their data" in ToS/DPA.
- [ ] Dependency scanning (Snyk/Dependabot), secret scanning, audit logs.

---

## 6. Stack
| Area | Choice |
|---|---|
| DB / time-series | Supabase/Neon (Postgres) + **TimescaleDB** → ClickHouse at scale; **Upstash Redis** |
| Ingestion / queue | Generic REST API → Upstash Kafka / Redpanda / SQS (Phase 3) |
| Jobs / detection | **Inngest** or Trigger.dev (cron + workers) |
| Auth | Clerk or Supabase Auth (RBAC) |
| Validation / API | **Zod** + REST/tRPC (OpenAPI) |
| Alerts | Resend (email), **Twilio/WhatsApp**, Knock |
| Billing | **Stripe** (metered) + Facturama (CFDI) |
| Observability | Sentry + Axiom/Datadog + OpenTelemetry |
| CI / quality | Vitest + Playwright + GitHub Actions |
| Frontend | Next.js (current) + TanStack Query/Virtual |

---

## 7. What we reuse from the demo
- **`lib/anomaly.ts`, `lib/conditions.ts`** → `packages/core` (server-side engine). The single most valuable asset.
- **`lib/types.ts`** → the `MetricPoint` / metric contract (minus UI fields).
- **`lib/mock_data_generator.ts`, `scripts/poc-eval.mjs`** → test fixtures + seed data.
- **UI** (dashboard, drawer, `TrendChart`, `PastureMap`, design system) → re-wired to read the real API.
- Everything else (client state, live tick, simulate) is demo-only.

---

## 8. Team (minimum)
- 1 senior full-stack (Next.js + API).
- 1 backend/data engineer (time-series, ingestion, later streaming).
- **1 veterinarian / animal scientist in the core** — defines thresholds,
  validates and labels (not an advisor; this is the data moat + credibility).
- Product/founder.

---
*Living document. Sequence may compress with a strong team; do not skip Phase 0
(the engine-as-package + tests) or the RLS tests — they are load-bearing.*
