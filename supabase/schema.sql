-- ============================================================
-- HerdFlow — Supabase schema (run when ready to connect a backend)
-- ============================================================

create extension if not exists "uuid-ossp";

-- Herds / farms
create table if not exists herds (
  id          uuid primary key default uuid_generate_v4(),
  owner_id    uuid references auth.users(id) on delete cascade,
  name        text not null,
  location    text,
  created_at  timestamptz default now()
);

-- Animals
create table if not exists animals (
  id          uuid primary key default uuid_generate_v4(),
  herd_id     uuid references herds(id) on delete cascade,
  tag_id      text not null,
  name        text,
  species     text not null check (species in ('dairy','beef','sheep','horse','poultry')),
  lot         text,
  paddock     text,
  status      text default 'active',
  created_at  timestamptz default now(),
  unique (herd_id, tag_id)
);

-- Time-series health metrics (the table that grows)
create table if not exists health_metrics (
  id              bigint generated always as identity primary key,
  animal_id       uuid references animals(id) on delete cascade,
  recorded_at     timestamptz not null default now(),
  temperature_c   numeric(4,1),
  activity_index  integer,
  rumination_min  integer,
  intake_kg       numeric(6,2)
);

-- Detected anomalies (output of the z-score engine)
create table if not exists anomalies (
  id            uuid primary key default uuid_generate_v4(),
  animal_id     uuid references animals(id) on delete cascade,
  detected_at   timestamptz default now(),
  metric_type   text not null,
  severity      text check (severity in ('healthy','watch','critical')),
  z_score       numeric(5,2),
  baseline      numeric(10,2),
  observed      numeric(10,2),
  resolved      boolean default false
);

create index if not exists idx_metrics_animal_time on health_metrics (animal_id, recorded_at desc);
create index if not exists idx_anomalies_open on anomalies (animal_id) where resolved = false;

-- Row Level Security: an owner only sees their own herds
alter table herds enable row level security;
alter table animals enable row level security;
alter table health_metrics enable row level security;
alter table anomalies enable row level security;

create policy "owner_herds" on herds
  for all using (owner_id = auth.uid());

create policy "owner_animals" on animals
  for all using (herd_id in (select id from herds where owner_id = auth.uid()));

create policy "owner_metrics" on health_metrics
  for all using (animal_id in (
    select a.id from animals a join herds h on a.herd_id = h.id where h.owner_id = auth.uid()
  ));

create policy "owner_anomalies" on anomalies
  for all using (animal_id in (
    select a.id from animals a join herds h on a.herd_id = h.id where h.owner_id = auth.uid()
  ));

-- ============================================================
-- Profiles — one row per auth user, created automatically on signup
-- ============================================================

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  farm_name   text,
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

create policy "own_profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Trigger: when a new auth user is created, seed their profile row.
-- `security definer` lets it write past RLS during the auth transaction.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
