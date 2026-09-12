-- Marlo (seekmarlo.com) — Supabase database schema
-- Run this once in Supabase: open your project -> SQL Editor -> New query -> paste this whole file -> Run.

create extension if not exists "pgcrypto";

-- ============================================================
-- CLINICS — the list Emma manages from the admin page
-- ============================================================
create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  neighborhood text not null,
  address text,
  phone text,
  website text,
  languages text[] not null default '{}',              -- e.g. {English,Spanish}
  insurance text[] not null default '{}',               -- e.g. {"Uninsured / no insurance","Medi-Cal"}
  sliding_scale boolean not null default false,
  population text not null default 'all'
    check (population in ('all','adult','pediatric')),  -- who the clinic serves
  serves_undocumented boolean not null default false,
  lgbtq_affirming boolean not null default false,
  walk_in boolean not null default false,
  near_transit boolean not null default false,
  active boolean not null default true,                 -- uncheck instead of deleting to hide a clinic temporarily
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PATIENT_SUBMISSIONS — every search a patient runs
-- ============================================================
create table if not exists patient_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  age integer,
  zip_code text,                          -- collected now, not yet used in matching (single-city pilot) — ready for when Marlo expands past SF
  language text,
  insurance text,
  has_car boolean,
  needs_walk_in boolean,
  undocumented_pref boolean not null default false,
  lgbtq_pref boolean not null default false,
  matched_clinic_ids uuid[] default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- SECURITY — this is the part your notes flagged as critical:
-- "don't expose DB/API publicly." These rules are what enforce that.
-- ============================================================
alter table clinics enable row level security;
alter table patient_submissions enable row level security;

-- Anyone using the public site can VIEW only active clinics.
create policy "Public can view active clinics"
  on clinics for select
  to anon
  using (active = true);

-- Anyone using the public site can SUBMIT a search, but can never read
-- submissions back (not their own, not anyone else's).
create policy "Public can submit a search"
  on patient_submissions for insert
  to anon
  with check (true);

-- Only a signed-in admin (you) can add/edit/delete clinics.
create policy "Admin manages clinics"
  on clinics for all
  to authenticated
  using (true)
  with check (true);

-- Only a signed-in admin (you) can read patient submissions.
create policy "Admin reads submissions"
  on patient_submissions for select
  to authenticated
  using (true);

-- Keep updated_at accurate automatically.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists clinics_updated_at on clinics;
create trigger clinics_updated_at
  before update on clinics
  for each row execute function set_updated_at();

-- ============================================================
-- One starter row so you can confirm everything works end-to-end
-- before you load your real ~30 SF clinics. Delete or edit it
-- from the admin page once you've tested.
-- ============================================================
insert into clinics (name, neighborhood, phone, languages, insurance, sliding_scale, population, serves_undocumented, lgbtq_affirming, walk_in, near_transit)
values (
  'Test Clinic — replace or delete me',
  'Mission District',
  '(415) 555-0100',
  array['English','Spanish'],
  array['Uninsured / no insurance','Medi-Cal'],
  true,
  'all',
  true,
  false,
  true,
  true
);
