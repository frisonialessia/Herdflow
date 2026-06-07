-- ============================================================
-- HerdFlow — migration 0002: husbandry records, history, cases, breeding
-- ============================================================
-- Additive & idempotent (safe to re-apply). Apply after db/schema.sql:
--   psql "$DATABASE_URL" -f db/migrations/0002_husbandry.sql
-- ============================================================

-- ── Ficha (husbandry) columns on animals ────────────────────
alter table animals
  add column if not exists sex             text,           -- 'female' | 'male'
  add column if not exists breed           text,
  add column if not exists birth_date      date,
  add column if not exists origin          text,
  add column if not exists location        text,
  add column if not exists diet            text,
  add column if not exists feeding_times   text,
  add column if not exists water_l         numeric(8,2),
  add column if not exists medical_history text;

-- ── Vaccination card ────────────────────────────────────────
create table if not exists vaccinations (
  id         uuid primary key default gen_random_uuid(),
  animal_id  uuid not null references animals(id) on delete cascade,
  org_id     uuid not null,
  name       text not null,
  applied_on date,
  created_at timestamptz not null default now()
);
create index if not exists idx_vax_animal on vaccinations (animal_id);

-- ── Per-animal history (the "expediente"): enrollment, edits, vaccines,
--    health flags, case events, breeding — one chronological log. ──────
create table if not exists animal_events (
  id         uuid primary key default gen_random_uuid(),
  animal_id  uuid not null references animals(id) on delete cascade,
  org_id     uuid not null,
  at         timestamptz not null default now(),
  kind       text not null,                                  -- enrolled|edit|vaccine|watch|critical|case|bred…
  title      text not null,
  detail     text
);
create index if not exists idx_events_animal on animal_events (animal_id, at desc);

-- ── Case workflow (operational loop on an alert) ────────────
create table if not exists cases (
  id         uuid primary key default gen_random_uuid(),
  animal_id  uuid not null references animals(id) on delete cascade,
  org_id     uuid not null,
  status     text not null default 'open',                   -- open|acknowledged|treating|resolved
  assignee   text,
  opened_at  timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (animal_id)                                          -- one case record per animal
);
create index if not exists idx_cases_open on cases (org_id, animal_id) where status <> 'resolved';

create table if not exists case_events (
  id      uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  org_id  uuid not null,
  at      timestamptz not null default now(),
  label   text not null
);

-- ── Breeding events (inseminations / services) ──────────────
create table if not exists breeding_events (
  id        uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animals(id) on delete cascade,
  org_id    uuid not null,
  kind      text not null default 'bred',                    -- bred|confirmed…
  at        timestamptz not null default now()
);
create index if not exists idx_breeding_animal on breeding_events (animal_id, at desc);

-- ── Row-Level Security (same org-scoped predicate as v1) ────
alter table vaccinations    enable row level security;
alter table animal_events   enable row level security;
alter table cases           enable row level security;
alter table case_events     enable row level security;
alter table breeding_events enable row level security;

drop policy if exists vax_access      on vaccinations;
drop policy if exists events_access   on animal_events;
drop policy if exists cases_access    on cases;
drop policy if exists case_evt_access on case_events;
drop policy if exists breeding_access on breeding_events;

create policy vax_access      on vaccinations    for all using (org_id in (select app_accessible_org_ids()));
create policy events_access   on animal_events   for all using (org_id in (select app_accessible_org_ids()));
create policy cases_access    on cases           for all using (org_id in (select app_accessible_org_ids()));
create policy case_evt_access on case_events     for all using (org_id in (select app_accessible_org_ids()));
create policy breeding_access on breeding_events for all using (org_id in (select app_accessible_org_ids()));
