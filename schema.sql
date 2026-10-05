-- Marlo (seekmarlo.com) — Supabase database schema
-- Run this once in Supabase: open your project -> SQL Editor -> New query -> paste this whole file -> Run.
--
-- If you already ran an earlier version of this file, don't re-run this one —
-- use migration_v2.sql instead, which only adds what's new.

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
  insurance text[] not null default '{}',               -- e.g. {"Uninsured / no coverage","Medicaid (called Medi-Cal in California)"}
  sliding_scale boolean not null default false,
  population text not null default 'all'
    check (population in ('all','adult','pediatric')),  -- who the clinic serves
  serves_undocumented boolean not null default false,
  lgbtq_affirming boolean not null default false,
  walk_in boolean not null default false,
  near_transit boolean not null default false,
  hiv_care boolean not null default false,
  veteran_friendly boolean not null default false,
  care_types text[] not null default '{}',              -- e.g. {"Primary / general medical care","Dental"} — empty means primary/general care
  docs_en text[] not null default '{}',                 -- what a patient needs to bring (English)
  docs_es text[] not null default '{}',                 -- what a patient needs to bring (Spanish)
  services_en text[] not null default '{}',             -- care provided (English)
  services_es text[] not null default '{}',             -- care provided (Spanish)
  active boolean not null default true,                 -- uncheck instead of deleting to hide a clinic temporarily
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PATIENT_SUBMISSIONS — every search a patient runs
-- Anonymous by design: no name or phone is collected or sent by the site.
-- The columns stay in place (harmless, always null going forward) so this
-- table doesn't have to change shape again if that ever comes back.
-- ============================================================
create table if not exists patient_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  age integer,
  zip_code text,                          -- collected now, not yet used in matching (single-city pilot) — ready for when Marlo expands past SF
  language text,
  care_type text,                         -- what type of care they searched for (Primary care, Dental, Vision, etc.)
  insurance text,
  has_car boolean,
  needs_walk_in boolean,
  needs_interpreter boolean not null default false,
  interpreter_language text,
  undocumented_pref boolean not null default false,
  lgbtq_pref boolean not null default false,
  hiv_pref boolean not null default false,
  veteran_pref boolean not null default false,
  matched_clinic_ids uuid[] default '{}',
  followup_status text not null default 'new'
    check (followup_status in ('new', 'contacted', 'appointment_scheduled', 'completed', 'no_response')),
  followup_notes text,                    -- e.g. how the appointment/clinic actually went
  created_at timestamptz not null default now()
);

-- ============================================================
-- CLINIC_CLICKS — every time a patient taps "Call clinic" or "Visit
-- website" on a match. This, plus matched_clinic_ids above, is the raw
-- material for the Insights tab: which kinds of searches (care type,
-- insurance, language, etc.) actually turn into contact with a clinic.
-- Still anonymous — no name or phone here either.
-- ============================================================
create table if not exists clinic_clicks (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete set null,
  submission_id uuid references patient_submissions(id) on delete set null,
  action text not null check (action in ('call', 'website')),
  care_type text,
  insurance text,
  language text,
  needs_interpreter boolean,
  undocumented_pref boolean,
  lgbtq_pref boolean,
  hiv_pref boolean,
  veteran_pref boolean,
  zip_code text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SECURITY — this is the part your notes flagged as critical:
-- "don't expose DB/API publicly." These rules are what enforce that.
-- ============================================================
alter table clinics enable row level security;
alter table patient_submissions enable row level security;
alter table clinic_clicks enable row level security;

-- Anyone using the public site can log a click, but never read them back.
create policy "Public can log clicks"
  on clinic_clicks for insert
  to anon
  with check (true);

-- Only a signed-in admin (you) can read logged clicks — this is what the Insights tab uses.
create policy "Admin reads clicks"
  on clinic_clicks for select
  to authenticated
  using (true);

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

-- Only a signed-in admin (you) can update follow-up status/notes on submissions.
create policy "Admin updates submissions"
  on patient_submissions for update
  to authenticated
  using (true)
  with check (true);

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
insert into clinics (name, neighborhood, phone, languages, insurance, sliding_scale, population, serves_undocumented, lgbtq_affirming, walk_in, near_transit, hiv_care, veteran_friendly, care_types, docs_en, docs_es, services_en, services_es)
values (
  'Test Clinic — replace or delete me',
  'Mission District',
  '(415) 555-0100',
  array['English','Spanish'],
  array['Uninsured / no coverage','Medicaid (called Medi-Cal in California)'],
  true,
  'all',
  true,
  false,
  true,
  true,
  false,
  false,
  array['Primary / general medical care'],
  array['No ID required', 'No proof of income required'],
  array['No se requiere identificación', 'No se requiere comprobante de ingresos'],
  array['Primary care', 'Vaccinations'],
  array['Atención primaria', 'Vacunas']
);
