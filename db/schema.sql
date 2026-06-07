-- ============================================================
-- HerdFlow — initial database schema (v1)
-- ============================================================
-- Runs on ANY Postgres 14+. No paid infra required to start:
--
--   FREE / LOCAL (recommended while you have no customers):
--     • Option A — Supabase CLI local stack ($0):
--         supabase init && supabase start
--         (drop this file into supabase/migrations/ or run it via psql)
--     • Option B — plain Docker Postgres ($0):
--         docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
--         psql postgresql://postgres:dev@localhost:5432/postgres -f db/schema.sql
--
--   LATER (only when you go live): provision hosted Supabase/Neon and apply
--   the same file. Convert `readings` to a TimescaleDB hypertable then (see end).
--
-- Multi-tenant from day 1: RLS keyed by accessible orgs (membership OR an
-- active grant), so coops/vets see only the farms that granted them access.
-- ============================================================

create extension if not exists "pgcrypto";          -- gen_random_uuid()
-- create extension if not exists timescaledb;       -- enable on a Timescale image (optional, see end)

-- ── Enums ───────────────────────────────────────────────────
create type org_type     as enum ('farm','cooperative','vet_practice');
create type member_role  as enum ('owner','manager','herdsman','vet','viewer');
create type grant_role   as enum ('vet','viewer','manager');
create type grant_status as enum ('pending','active','revoked');
create type species_t    as enum ('dairy','beef','sheep','horse','poultry');
create type severity_t   as enum ('healthy','watch','critical');

-- ── Identity & tenancy ──────────────────────────────────────
create table organizations (
  id         uuid primary key default gen_random_uuid(),
  type       org_type not null,
  name       text not null,
  country    text not null default 'MX',
  created_at timestamptz not null default now()
);

-- On hosted Supabase, mirror auth.users(id) into here (trigger). Locally it's standalone.
create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  full_name  text,
  created_at timestamptz not null default now()
);

create table memberships (
  user_id    uuid not null references users(id)         on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  role       member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (user_id, org_id)
);

-- A farm (grantor) gives a coop/vet (grantee) scoped access to its data.
create table access_grants (
  id             uuid primary key default gen_random_uuid(),
  grantor_org_id uuid not null references organizations(id) on delete cascade,  -- the farm
  grantee_org_id uuid not null references organizations(id) on delete cascade,  -- coop / vet
  role           grant_role  not null default 'vet',
  status         grant_status not null default 'pending',
  created_at     timestamptz not null default now(),
  unique (grantor_org_id, grantee_org_id)
);

-- ── Herd hierarchy:  org → sites → zones → animals ──────────
create table sites (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  name       text not null,
  location   text,
  created_at timestamptz not null default now()
);

create table zones (
  id      uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  name    text not null
);

create table animals (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,  -- denormalised for fast RLS
  site_id    uuid not null references sites(id) on delete cascade,
  zone_id    uuid references zones(id) on delete set null,
  tag_id     text not null,
  siniiga_id text,                                   -- MX national individual ID
  species    species_t not null,
  name       text,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  unique (site_id, tag_id)
);
create index idx_animals_org on animals (org_id);

-- ── Devices / ingestion auth ────────────────────────────────
create table devices (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations(id) on delete cascade,
  site_id      uuid not null references sites(id) on delete cascade,
  vendor       text not null,
  external_id  text,
  api_key_hash text not null,                         -- store only the hash; never the key
  last_seen    timestamptz,
  created_at   timestamptz not null default now()
);

-- ── Time-series readings (the high-volume table) ────────────
-- Plain Postgres now. Convert to a Timescale hypertable + retention +
-- continuous aggregates when you provision (see note at the bottom).
create table readings (
  animal_id   uuid not null references animals(id) on delete cascade,
  org_id      uuid not null,                          -- denormalised for RLS without a join
  recorded_at timestamptz not null,
  metric      text not null,                          -- temperature_c | activity_index | rumination_min | intake_kg | heart_rate | respiration_rate
  value       double precision not null
);
create index idx_readings_animal_time on readings (animal_id, recorded_at desc);

-- Materialised rolling baseline per animal + metric (written by the detection worker).
create table baselines (
  animal_id   uuid not null references animals(id) on delete cascade,
  org_id      uuid not null,
  metric      text not null,
  mean        double precision not null,
  stddev      double precision not null,
  window_days int not null default 14,
  updated_at  timestamptz not null default now(),
  primary key (animal_id, metric)
);

-- Detected anomalies (output of the z-score engine).
create table anomalies (
  id          uuid primary key default gen_random_uuid(),
  animal_id   uuid not null references animals(id) on delete cascade,
  org_id      uuid not null,
  detected_at timestamptz not null default now(),
  metric      text not null,
  severity    severity_t not null,
  z_score     numeric(6,2) not null,
  baseline    numeric(12,2),
  observed    numeric(12,2),
  condition   text,                                   -- inferred: fever/mastitis, estrus, lameness, off-feed…
  resolved    boolean not null default false
);
create index idx_anomalies_open on anomalies (org_id, animal_id) where resolved = false;

-- ── Billing ─────────────────────────────────────────────────
create table subscriptions (
  org_id             uuid primary key references organizations(id) on delete cascade,
  stripe_customer_id text,
  plan               text,
  active_animals     int not null default 0,
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- Row-Level Security
-- ============================================================
-- Current user id. LOCAL: set per request with
--   set local app.user_id = '<uuid>';
-- HOSTED SUPABASE: replace the body with  `select auth.uid()`.
create or replace function app_current_user_id() returns uuid
language sql stable as $$
  select nullif(current_setting('app.user_id', true), '')::uuid
$$;

-- Orgs the current user may read: their own orgs + farms that granted access
-- to any org they belong to (coop / vet delegation).
create or replace function app_accessible_org_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select org_id from memberships where user_id = app_current_user_id()
  union
  select g.grantor_org_id
    from access_grants g
    join memberships m on m.org_id = g.grantee_org_id
   where m.user_id = app_current_user_id()
     and g.status = 'active'
$$;

alter table organizations enable row level security;
alter table sites         enable row level security;
alter table zones         enable row level security;
alter table animals       enable row level security;
alter table devices       enable row level security;
alter table readings      enable row level security;
alter table baselines     enable row level security;
alter table anomalies     enable row level security;
alter table subscriptions enable row level security;
alter table memberships   enable row level security;
alter table access_grants enable row level security;

create policy org_access     on organizations for all
  using (id in (select app_accessible_org_ids()));
create policy site_access    on sites for all
  using (org_id in (select app_accessible_org_ids()));
create policy zone_access    on zones for all
  using (site_id in (select id from sites where org_id in (select app_accessible_org_ids())));
create policy animal_access  on animals       for all using (org_id in (select app_accessible_org_ids()));
create policy device_access  on devices       for all using (org_id in (select app_accessible_org_ids()));
create policy reading_access on readings      for all using (org_id in (select app_accessible_org_ids()));
create policy baseline_access on baselines    for all using (org_id in (select app_accessible_org_ids()));
create policy anomaly_access on anomalies     for all using (org_id in (select app_accessible_org_ids()));
create policy sub_access      on subscriptions for all using (org_id in (select app_accessible_org_ids()));
create policy membership_access on memberships for all
  using (org_id in (select app_accessible_org_ids()) or user_id = app_current_user_id());
create policy grant_access on access_grants for all
  using (grantor_org_id in (select app_accessible_org_ids())
      or grantee_org_id in (select app_accessible_org_ids()));

-- NOTE: the detection worker and ingestion API run with a service role that
-- BYPASSES RLS (they write across tenants). Only the user-facing API uses RLS.

-- ============================================================
-- When you provision (Timescale) — run later, optional:
--   select create_hypertable('readings', 'recorded_at', chunk_time_interval => interval '7 days');
--   select add_retention_policy('readings', interval '90 days');           -- drop raw > 90d
--   -- continuous aggregate for long-term daily rollups (your "divide by years"):
--   create materialized view readings_daily with (timescaledb.continuous) as
--     select animal_id, metric, time_bucket('1 day', recorded_at) as day,
--            avg(value) avg, min(value) min, max(value) max
--     from readings group by 1,2,3;
-- ============================================================
