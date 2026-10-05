-- Marlo — bulk-load clinics from the outreach tracker
-- Generated from marlo_clinic_outreach.xlsx on 2026-10-01.
--
-- Deliberately minimal: only name, neighborhood, address, phone, website,
-- and type(s) of care are filled in, because those are the fields already
-- verified by research for the outreach list. Everything else (insurance
-- accepted, sliding-scale, walk-in, languages, population served, etc.)
-- is left at its safe default (false / empty array) rather than guessed —
-- guessing those would risk telling a patient a clinic takes their
-- insurance, or serves undocumented patients, when that was never actually
-- confirmed. A clinic with defaults just scores a bit lower / shows a more
-- generic reason in results; it is never hidden or misrepresented.
--
-- Go back into admin.html and fill in the rest for each clinic as you
-- confirm it with them directly — that's exactly the outreach call/email
-- doing double duty as both a partnership ask AND a data-accuracy check.
--
-- Safe to run once, after schema.sql / migration_v3.sql (needs care_types).
-- Re-running it would create duplicate rows, since clinic names aren't
-- enforced unique — if you need to re-run, delete the earlier batch first
-- (admin.html → Delete on each), or ask a future session to make this
-- idempotent with an upsert on name.

insert into clinics (name, neighborhood, address, phone, website, care_types) values
  ('San Francisco Community Health Center', 'SF — Tenderloin', '730 Polk St, 4th Fl, San Francisco, CA 94109', '(415) 292-3400', 'https://sfcommunityhealth.org', '{"Primary / general medical care","Dental","Mobile clinic (comes to you)"}'),
  ('Mission Neighborhood Health Center', 'SF — Mission', '240 Shotwell St, San Francisco, CA 94110', '(415) 552-3870', 'https://mnhc.org', '{"Primary / general medical care"}'),
  ('North East Medical Services (NEMS)', 'SF — Chinatown', '1520 Stockton St, San Francisco, CA 94133', '1-888-500-1886', 'https://nems.org', '{"Primary / general medical care"}'),
  ('Curry Senior Center Clinic', 'SF — Tenderloin', '333 Turk St, San Francisco, CA 94102', '(628) 754-7700', 'https://curryseniorcenter.org', '{"Primary / general medical care"}'),
  ('St. Anthony''s Medical Clinic', 'SF — Tenderloin', '150 Golden Gate Ave, 2nd Fl, San Francisco, CA 94102', '(415) 241-8320', 'https://stanthonysf.org', '{"Primary / general medical care"}'),
  ('San Francisco Free Clinic', 'SF — Richmond', '4900 California St, San Francisco, CA 94118', '(415) 750-9894', 'https://sffc.org', '{"Primary / general medical care"}'),
  ('Native American Health Center', 'SF — Mission', '160 Capp St, San Francisco, CA 94110', '(415) 417-3501', 'https://nativehealth.org', '{"Primary / general medical care","Dental"}'),
  ('HealthRIGHT 360 (Integrated Care Center)', 'SF — SoMa', '1563 Mission St, San Francisco, CA 94103', '(415) 800-8500', 'https://healthright360.org', '{"Primary / general medical care","Mobile clinic (comes to you)"}'),
  ('Southeast Health Center (SF Dept. of Public Health)', 'SF — Bayview', '2401 Keith St, San Francisco, CA 94124', '(415) 671-7000', 'https://sfdph.org', '{"Primary / general medical care","Dental"}'),
  ('Silver Avenue Family Health Center (SFDPH)', 'SF — Excelsior', '1525 Silver Ave, San Francisco, CA 94134', '(628) 754-8000', 'https://sfdph.org', '{"Primary / general medical care"}'),
  ('Potrero Hill Health Center (SFDPH)', 'SF — Potrero Hill', '1050 Wisconsin St, San Francisco, CA 94107', '(628) 217-7900', 'https://sfdph.org', '{"Primary / general medical care"}'),
  ('Lyon-Martin Community Health Services', 'SF — SoMa', '1735 Mission St, San Francisco, CA 94103', '(415) 565-7667', 'https://lyon-martin.org', '{"Primary / general medical care"}'),
  ('GLIDE Health Services', 'SF — Tenderloin', '330 Ellis St, San Francisco, CA 94102', '(415) 674-6000', 'https://glide.org', '{"Primary / general medical care"}'),
  ('La Clínica de La Raza (Fruitvale Village)', 'Oakland', '3451 East 12th St, Oakland, CA 94601', '(510) 535-3500', 'https://laclinica.org', '{"Primary / general medical care"}'),
  ('Asian Health Services', 'Oakland', '818 Webster St, Oakland, CA 94607', '(510) 986-6800', 'https://asianhealthservices.org', '{"Primary / general medical care"}'),
  ('LifeLong Medical Care', 'Berkeley', '2344 Sixth St, Berkeley, CA 94710', '(510) 981-4100', 'https://lifelongmedical.org', '{"Primary / general medical care"}'),
  ('Tiburcio Vasquez Health Center', 'Hayward', '22331 Mission Blvd, Hayward, CA 94541', '(510) 471-5907', 'https://tvhc.org', '{"Primary / general medical care"}'),
  ('Roots Community Health Center', 'Oakland', '9925 International Blvd, Oakland, CA 94603', '(510) 777-1177', 'https://rootscommunityhealth.org', '{"Primary / general medical care"}'),
  ('Ravenswood Family Health Center', 'East Palo Alto', '1885 Bay Rd, East Palo Alto, CA 94303', '(650) 330-7400', 'https://ravenswoodfhn.org', '{"Primary / general medical care"}'),
  ('Samaritan House', 'San Mateo', '4031 Pacific Blvd, San Mateo, CA 94403', '(650) 347-3648', 'https://samaritanhousesanmateo.org', '{"Primary / general medical care"}'),
  ('Gardner Health Center', 'San Jose', '195 E Virginia St, San Jose, CA 95112', '(408) 457-7100', 'https://gardnerhealthservices.org', '{"Primary / general medical care"}'),
  ('Marin Community Clinic', 'San Rafael', '3260 Kerner Blvd, San Rafael, CA 94901', '(415) 448-1500', 'https://marinclinic.org', '{"Primary / general medical care"}'),
  ('Chinatown Public Health Center (SFDPH)', 'SF — Chinatown', '1490 Mason St, San Francisco, CA 94133', '(628) 217-6500', 'https://sfdph.org', '{"Primary / general medical care"}'),
  ('Maxine Hall Health Center (SFDPH)', 'SF — Western Addition', '1301 Pierce St, San Francisco, CA 94115', '(628) 217-5400', 'https://sfdph.org', '{"Primary / general medical care"}'),
  ('Castro-Mission Health Center (SFDPH)', 'SF — Castro/Mission', '3850 17th St, San Francisco, CA 94114', '(628) 217-5700', 'https://sfdph.org', '{"Primary / general medical care"}'),
  ('Larkin Street Youth Services', 'SF — Tenderloin', '134 Golden Gate Ave, San Francisco, CA 94102', '(415) 673-0911', 'https://larkinstreetyouth.org', '{"Primary / general medical care"}'),
  ('St. James Infirmary', 'SF — Tenderloin', '730 Polk St, 4th Fl, San Francisco, CA 94109', '(415) 554-8494', 'https://stjamesinfirmary.org', '{"Primary / general medical care"}'),
  ('Magnet / STRUT (SF AIDS Foundation)', 'SF — Castro', '470 Castro St, 2nd Fl, San Francisco, CA 94114', '(415) 437-3450', 'https://sfaf.org', '{"Primary / general medical care"}'),
  ('Instituto Familiar de la Raza', 'SF — Mission', '2919 Mission St, San Francisco, CA 94110', '(415) 229-0500', 'https://ifrsf.org', '{"Primary / general medical care"}'),
  ('Planned Parenthood — San Francisco Health Center', 'SF — Mission', '1650 Valencia St, San Francisco, CA 94110', '(415) 821-1282', 'https://plannedparenthood.org', '{"Primary / general medical care"}'),
  ('North East Medical Services — Sunset/Noriega Clinic', 'SF — Sunset', '1450 Noriega St, San Francisco, CA 94122', '1-888-500-1886', 'https://nems.org', '{"Primary / general medical care"}'),
  ('North East Medical Services — Clement Clinic', 'SF — Richmond', '1033 Clement St, San Francisco, CA 94118', '1-888-500-1886', 'https://nems.org', '{"Primary / general medical care"}'),
  ('LifeLong Medical Care — Over 60 Health Center', 'Berkeley', '3260 Sacramento St, Berkeley, CA 94703', '(510) 981-4100', 'https://lifelongmedical.org', '{"Primary / general medical care"}'),
  ('LifeLong Medical Care — West Berkeley Health Center', 'Berkeley', '837 Addison St, Berkeley, CA 94710', '(510) 981-4100', 'https://lifelongmedical.org', '{"Primary / general medical care"}'),
  ('Petaluma Health Center', 'Petaluma (Sonoma County)', '1179 N McDowell Blvd, Petaluma, CA 94954', '(707) 559-7500', 'https://phealthcenter.org', '{"Primary / general medical care"}'),
  ('CommuniCare+OLE', 'Napa (Napa County)', '1141 Pear Tree Ln Ste 100, Napa, CA 94558', '(707) 254-1770', 'https://communicareole.org', '{"Primary / general medical care"}'),
  ('Fair Oaks Health Center (San Mateo County Health)', 'Redwood City', '2710 Middlefield Rd, Redwood City, CA 94063', '(650) 578-7141', 'https://smchealth.org', '{"Primary / general medical care"}'),
  ('UCSF Student General Dentistry Clinic', 'SF — Parnassus Heights', '707 Parnassus Ave, Suite D2000, San Francisco, CA 94143', '(415) 502-5800', 'https://dentistry.ucsf.edu', '{"Dental"}'),
  ('Lions Eye Foundation of California-Nevada', 'SF — Van Ness', '711 Van Ness Ave, Suite 250, San Francisco, CA 94102', '(415) 600-3950', 'https://lionseyefoundation.com', '{"Vision / eye care"}'),
  ('SFCCC Street Outreach Services (SOS) Mobile Health Care Clinic', 'SF — citywide', '2720 Taylor St, Suite 430, San Francisco, CA 94133', '(415) 355-2250', 'https://sfccc.org', '{"Mobile clinic (comes to you)"}'),
  ('Zuckerberg SF General — Wound Clinic', 'SF — Potrero Hill', '1001 Potrero Ave, San Francisco, CA 94110', '(628) 206-8000', 'https://zuckerbergsanfranciscogeneral.org', '{"Wound care"}');
