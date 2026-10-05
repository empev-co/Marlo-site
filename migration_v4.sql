-- Marlo (seekmarlo.com) — migration v4
-- Two changes:
-- 1) Adds clinic_clicks — logs every time a patient taps "Call clinic" or
--    "Visit website" on a match, tagged with the same anonymous filters
--    (care type, insurance, language, etc.) they searched with. Combined
--    with the matched_clinic_ids already recorded on each search, this is
--    what powers the new "Insights" tab in admin.html — per-clinic demand
--    and follow-through, and breakdowns by type of patient.
-- 2) The site no longer collects a patient's name or phone number at all —
--    only demographics and filters. The name/phone columns on
--    patient_submissions are left in place (they were already nullable) so
--    nothing breaks; new searches just won't populate them.
--
-- Safe to run on your existing database, and independent of migration_v2
-- and migration_v3 — run in any order.
--
-- Supabase dashboard -> your project -> SQL Editor -> New query -> paste
-- this whole file -> Run.

-- ============================================================
-- CLINIC_CLICKS — new table
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

comment on table clinic_clicks is
  'One row per tap of "Call clinic" or "Visit website" on the results page. '
  'Anonymous — no name or phone — tagged with the same filters the patient '
  'searched with, so it can be grouped by clinic or by type of patient.';

alter table clinic_clicks enable row level security;

drop policy if exists "Public can log clicks" on clinic_clicks;
create policy "Public can log clicks"
  on clinic_clicks for insert
  to anon
  with check (true);

drop policy if exists "Admin reads clicks" on clinic_clicks;
create policy "Admin reads clicks"
  on clinic_clicks for select
  to authenticated
  using (true);
