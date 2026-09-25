-- Marlo (seekmarlo.com) — migration v2
-- Adds: per-clinic "what to bring" / "care provided" lists, HIV-care and
-- veteran-friendly flags, richer patient-submission fields, and a
-- follow-up status/notes pair so you can track whether a patient actually
-- made it to an appointment.
--
-- Safe to run on your existing database: every change is guarded so this
-- can be re-run without error if something partially applied.
--
-- Supabase dashboard -> your project -> SQL Editor -> New query -> paste
-- this whole file -> Run.

-- ============================================================
-- CLINICS — new fields
-- ============================================================
alter table clinics add column if not exists hiv_care boolean not null default false;
alter table clinics add column if not exists veteran_friendly boolean not null default false;
alter table clinics add column if not exists docs_en text[] not null default '{}';
alter table clinics add column if not exists docs_es text[] not null default '{}';
alter table clinics add column if not exists services_en text[] not null default '{}';
alter table clinics add column if not exists services_es text[] not null default '{}';

comment on column clinics.docs_en is 'What a patient needs to bring, in English — e.g. "No ID required".';
comment on column clinics.docs_es is 'What a patient needs to bring, in Spanish.';
comment on column clinics.services_en is 'Types of care this clinic provides, in English — e.g. "Primary care".';
comment on column clinics.services_es is 'Types of care this clinic provides, in Spanish.';

-- ============================================================
-- PATIENT_SUBMISSIONS — new fields
-- ============================================================
alter table patient_submissions add column if not exists needs_interpreter boolean not null default false;
alter table patient_submissions add column if not exists interpreter_language text;
alter table patient_submissions add column if not exists hiv_pref boolean not null default false;
alter table patient_submissions add column if not exists veteran_pref boolean not null default false;

alter table patient_submissions add column if not exists followup_status text not null default 'new';
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'patient_submissions_followup_status_check'
  ) then
    alter table patient_submissions
      add constraint patient_submissions_followup_status_check
      check (followup_status in ('new', 'contacted', 'appointment_scheduled', 'completed', 'no_response'));
  end if;
end $$;
alter table patient_submissions add column if not exists followup_notes text;

comment on column patient_submissions.followup_status is 'Where this patient is in follow-up: new, contacted, appointment_scheduled, completed, no_response.';
comment on column patient_submissions.followup_notes is 'Free-text notes from following up with the patient — how the appointment/clinic went, etc.';

-- ============================================================
-- SECURITY — allow the admin to update follow-up status/notes.
-- (Clinics already had a full "for all" admin policy; submissions only
-- had SELECT before, so UPDATE needs its own policy.)
-- ============================================================
drop policy if exists "Admin updates submissions" on patient_submissions;
create policy "Admin updates submissions"
  on patient_submissions for update
  to authenticated
  using (true)
  with check (true);
