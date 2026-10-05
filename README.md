# Marlo — deployment guide

Follow these in order. Nothing here requires coding — just following steps.

> **Already live and adding the September redesign?** Skip to
> [Part 8 — Updating an already-live site](#part-8--updating-an-already-live-site-yellow-redesign--turnstile--follow-ups)
> near the bottom. Parts 1–7 below are the original from-scratch setup.
>
> **Already on the September redesign and adding "type of care" (dental,
> vision, wound care, mobile clinics, etc.)?** Skip to
> [Part 9 — Adding "type of care"](#part-9--adding-type-of-care-dental-vision-wound-care-mobile-clinics-etc).
>
> **Already added "type of care" and now narrowing to uninsured/underinsured,
> dropping name/phone collection, and adding click tracking + the Insights
> tab?** Skip to
> [Part 10 — Anonymous search tracking and the Insights tab](#part-10--anonymous-search-tracking-and-the-insights-tab).
>
> **Short on time and haven't called clinics yet?** [Part 10e](#10e-havent-called-clinics-yet-load-them-in-bulk-instead)
> loads all 41 from your outreach tracker in one paste, no calls required first.

## Part 1 — Set up the database (Supabase)

1. Go to your Supabase project (the one you created at supabase.com).
2. In the left sidebar, click **SQL Editor** → **New query**.
3. Open `schema.sql` (in this folder), copy its entire contents, paste into the editor, and click **Run**.
   You should see "Success. No rows returned" — that means your tables were created.
4. In the left sidebar, click **Project Settings** (gear icon) → **API**.
5. Copy the **Project URL** and the **anon public** key — you'll need both in Part 2.

## Part 2 — Lock down admin access (important — do this before going live)

By default, Supabase lets anyone sign themselves up as a user, which would let a stranger get into your clinic admin page. Turn that off and create just your own account instead.

6. In the left sidebar, click **Authentication** → **Sign In / Providers** (or **Settings**, depending on what you see — look for a section about sign-ups).
7. Find **"Allow new users to sign up"** and turn it **off**.
8. In the left sidebar, click **Authentication** → **Users** → **Add user** (or **Invite user**).
9. Enter your own email and set a password — this is the account you'll use to log into `admin.html`. Write the password down somewhere safe.

## Part 3 — Connect the website's code to your database

10. Open `config.js` (in this folder) in any text editor.
11. Replace `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE` with the Project URL you copied in step 5.
12. Replace `PASTE_YOUR_SUPABASE_ANON_KEY_HERE` with the anon public key you copied in step 5.
13. Save the file.

## Part 4 — Put the code on GitHub

14. Go to github.com, and click the **+** icon (top right) → **New repository**.
15. Name it `marlo-site` (or anything you like), keep it **Private** or **Public** (either works), and click **Create repository**.
16. On the new repo's page, click **uploading an existing file** (a link on the setup page).
17. Drag in every file from this folder (`index.html`, `admin.html`, `main.js`, `admin.js`, `config.js`, `styles.css`, `schema.sql`, `README.md`).
18. Scroll down and click **Commit changes**.

## Part 5 — Deploy with Cloudflare Pages

19. Go to your Cloudflare dashboard (where you bought seekmarlo.com).
20. In the left sidebar, find **Workers & Pages** → click **Create** → **Pages** tab → **Connect to Git**.
21. Authorize Cloudflare to see your GitHub account if asked, then select the `marlo-site` repository.
22. On the build settings screen, you don't need a build command or framework — leave those blank/default, since this is a plain static site. Click **Save and Deploy**.
23. Wait about a minute. Cloudflare will give you a working link like `marlo-site.pages.dev` — click it and confirm the site loads and shows clinics.

## Part 6 — Point seekmarlo.com at it

24. Still in that Pages project, click **Custom domains** → **Set up a custom domain**.
25. Type `seekmarlo.com` and follow the prompts. Because you bought the domain through Cloudflare already, this step is automatic — no DNS records to copy by hand.
26. Wait a few minutes, then visit seekmarlo.com in a browser to confirm it loads the real site.

## Part 7 — Test before you tell anyone about it

27. On seekmarlo.com, run through the patient flow yourself with made-up info and confirm you get matched to the one test clinic already in the database.
28. Go to seekmarlo.com/admin.html, sign in with the account you made in step 9, and confirm you can see the dashboard.
29. Delete the "Test Clinic — replace or delete me" entry, then add 3-4 of your real SF clinics to confirm the add-clinic form works end to end.
30. Once that's all working, load in the rest of your ~30 SF clinics.

## Ongoing: adding more clinics later

You never need to touch code again for this — go to seekmarlo.com/admin.html, sign in, and use the **Add a clinic** form. Changes show up for patients immediately.

## If something breaks

- **Patients see "Can't reach the clinic list"**: double check `config.js` has your real Supabase URL and key, not the placeholder text, and that you ran `schema.sql`.
- **Admin login says "Couldn't sign in"**: confirm you created the user in step 9, and that you disabled public sign-up in step 7 (that step doesn't block *your* manually-created login — it only blocks strangers from creating new ones).
- **Changes to the code don't show up on the live site**: make sure you committed the updated file to the GitHub repo — Cloudflare Pages redeploys automatically a few seconds after every commit.
- **Admin dashboard shows 0 clinics after you know you added some**: as of this update, the bottom of the admin page shows "Connected to `<your-project>`.supabase.co" — check that it's the same project you see when you log into supabase.com. If it is, click **Reload list**, and if it's still 0, open your browser's console (F12 → Console tab) and look for a red error starting with "Couldn't load clinics" — the full Postgres error message will be there. Send that exact message along if you need help; it'll say exactly what's blocking the read (a permissions/RLS issue, an expired session, etc.) rather than failing silently like before.

## Part 8 — Updating an already-live site (yellow redesign, Turnstile, follow-ups)

This update replaces the patient-facing design with the yellow-and-black-outline look you approved in the mockup, adds fields for what a clinic requires and provides, adds a "Patient follow-ups" tab so you can track whether someone actually got seen, and adds real bot protection (Cloudflare Turnstile) in place of the old placeholder delay.

### 8a. Get the updated files onto GitHub

Same as Part 4 originally: replace every file in your `Marlo-site` GitHub repo with the updated versions from this folder (including the two new ones: `migration_v2.sql` and the `functions/api/verify-turnstile.js` file — GitHub's upload page lets you drag the whole `functions` folder in and it keeps the folder structure). Cloudflare Pages will redeploy automatically within a minute or so of the commit landing.

### 8b. Run the database migration

1. Supabase dashboard → your project → **SQL Editor** → **New query**.
2. Open `migration_v2.sql`, copy its entire contents, paste in, click **Run**.
3. You should see "Success. No rows returned." This only *adds* new columns — it doesn't touch your existing clinics or submissions.

### 8c. Set up Cloudflare Turnstile (the bot-check step)

1. Cloudflare dashboard → **Turnstile** (left sidebar) → **Add widget**.
2. Give it a name (e.g. "Marlo bot check"), add `seekmarlo.com` as the domain, and choose the **Managed** widget mode (the default — it's invisible for most real visitors).
3. Once created, you'll see a **Site Key** and a **Secret Key**.
4. Open `config.js` and replace `REPLACE_WITH_YOUR_TURNSTILE_SITE_KEY` with the **Site Key**. Commit that change to GitHub like any other file update.
5. Cloudflare dashboard → **Workers & Pages** → your Marlo Pages project → **Settings** → **Environment variables** → **Add variable**.
   - Name: `TURNSTILE_SECRET_KEY`
   - Value: the **Secret Key** from step 3
   - Click the "Encrypt" option if offered, then **Save**.
6. Redeploy (Cloudflare usually does this automatically after an environment variable change — if not, go to **Deployments** and click **Retry deployment** on the latest one).

Until you do this, the site keeps working exactly as it does today — it just shows a friendly "I'm not a robot" checkbox with a short delay instead of a real bot check, and says so quietly in small print. Nothing breaks either way.

### 8d. Using the new "Patient follow-ups" tab

> **Retired as of Part 10.** This tab depended on collecting a patient's name and phone number so you could call them back. As of Part 10 below, Marlo doesn't collect either — searches are anonymous — so this tab was replaced with an **Insights** tab instead. This section is left here for history.

On `admin.html`, next to "Clinics" you'll now see a **Patient follow-ups** tab — every search a patient runs shows up there (name, phone, what they were looking for, and which clinics they were matched to), most recent first. When you check in with someone, set their **Status** (New / Contacted / Appointment scheduled / Completed / No response) and jot a note (e.g. "got in on 9/20, said the wait was short"), then click **Save**. This is exactly the continuity/follow-up tracking you asked about.

### 8e. Using the new clinic fields

When adding or editing a clinic, you'll now see two new toggle chips ("Offers HIV-related care", "Experienced with veteran care") and four new boxes: "What to bring" and "Care provided," each in English and Spanish, one item per line (e.g. `No ID required` on its own line, then `No proof of income required` on the next). These show up on the results page as an optional "See documents & services" expand per clinic — nothing shows if you leave them blank.

## Part 9 — Adding "type of care" (dental, vision, wound care, mobile clinics, etc.)

This update adds a "What kind of care do you need?" question to the very start of the patient flow, so Marlo can list dental clinics, vision/eye care, mental health, reproductive health, wound care, mobile clinics, and pediatric care — not just general primary care — without mixing them all together in results.

### 9a. Get the updated files onto GitHub

Same as before: replace `main.js`, `admin.js`, `schema.sql`, and add the new `migration_v3.sql` file to your `Marlo-site` GitHub repo. Cloudflare Pages redeploys automatically within about a minute of the commit landing.

### 9b. Run the database migration

1. Supabase dashboard → your project → **SQL Editor** → **New query**.
2. Open `migration_v3.sql`, copy its entire contents, paste in, click **Run**.
3. You should see "Success. No rows returned." This works whether or not you've already run `migration_v2.sql` — run that one too if you haven't yet (see Part 8b).

### 9c. Tagging your clinics with the right type(s) of care

On `admin.html`, when you add or edit a clinic, you'll now see a **"Type(s) of care offered"** row of checkboxes near the top of the form — Primary / general medical care, Dental, Vision / eye care, Mental health / counseling, Reproductive & sexual health, Wound care, Mobile clinic, Pediatric care. Check every type that clinic actually offers (most will just be "Primary / general medical care," and some FQHCs offer several — e.g. primary care *and* dental).

**Important:** any clinic you leave unchecked is treated as "Primary / general medical care" automatically, so nothing you've already entered disappears from search results. But it also means a clinic that actually does offer dental, for example, won't show up when a patient specifically searches for dental care until you go back and check that box. Worth a quick pass through your existing clinics once this is live.

### 9d. Listing a mobile clinic (no fixed address)

Address is already optional. For a mobile clinic or street medicine program, leave **Address** blank, check the **Mobile clinic (comes to you)** box under "Type(s) of care offered," and use the **"Care provided"** box to describe its schedule or route in plain language (e.g. `Parks near 16th & Mission St, Tue/Thu 10am-1pm — call ahead to confirm`).

## Part 10 — Anonymous search tracking and the Insights tab

This update does three things: narrows Marlo's insurance dropdown to match its focus on uninsured/underinsured patients, stops collecting a patient's name and phone number entirely, and adds click tracking plus a new **Insights** tab so you have real numbers — searches, clicks, and follow-through rate — broken down by clinic and by type of patient. This is the data you'd eventually show or sell to a clinic.

### 10a. Get the updated files onto GitHub

Replace `main.js`, `admin.js`, `schema.sql`, `styles.css`, and add the new `migration_v4.sql` file to your `Marlo-site` GitHub repo. Cloudflare Pages redeploys automatically within about a minute of the commit landing.

### 10b. Run the database migration

1. Supabase dashboard → your project → **SQL Editor** → **New query**.
2. Open `migration_v4.sql`, copy its entire contents, paste in, click **Run**.
3. You should see "Success. No rows returned." This is independent of `migration_v2.sql` and `migration_v3.sql` — run whichever of those you haven't yet, in any order.

### 10c. What changed for patients

The insurance question now only offers **Uninsured / no coverage**, **Medicaid (Medi-Cal)**, **Medicare**, and **Not sure / other** — "Private insurance or marketplace plan" was removed, since Marlo is meant for people who don't already have easy access through solid private coverage. The intake form no longer asks for name or phone at all — just what kind of care, age, insurance status, and zip code. Existing rows from before this update that do have a name/phone are untouched; nothing was deleted automatically. If you want a fully clean, anonymous history, you can clear those two columns yourself from the Supabase Table Editor (`patient_submissions` table) — that's your call, not something this update does on its own.

### 10d. Using the new "Insights" tab

On `admin.html`, "Patient follow-ups" is gone — replaced by **Insights**. It shows:

- **Overview**: total searches, total clinic clicks (call + website combined), and what share of searches led to a click.
- **By clinic**: for each clinic — how many searches it was matched in, how many calls, how many website visits, and a "followed through" rate (clicks ÷ matches). Click **See profile** on any clinic to expand a full breakdown of just that clinic's matched searches: language, insurance status, and how many needed an interpreter, needed transportation, wanted walk-in, or asked about immigration-status safety / LGBTQ+ care / HIV care / veteran care — each as a percentage, plus its top zip codes. This is the exact "clinic X matched 20 searches, 15% were Cantonese-speaking, 40% needed transportation" kind of number you'd hand to that clinic.
- **By type of care searched / by insurance status / by language**: how many searches and clicks came from each, site-wide, so you can see things like "most Spanish-language searches are for dental care" at a glance.

A "click" is logged the moment a patient taps **Call clinic** or **Visit website** on a match — nothing is shared with any clinic automatically; this tab is for your own eyes until you decide to package and share it.

### 10e. Haven't called clinics yet? Load them in bulk instead

If outreach calls haven't happened yet and you don't want that to block launch, `load_clinics_from_tracker.sql` loads all 41 clinics from your outreach tracker in one paste — name, address, phone, website, and type(s) of care, all already-researched info.

1. Run this only after `schema.sql` and `migration_v3.sql` (it needs the `care_types` column).
2. Supabase dashboard → **SQL Editor** → **New query** → paste the entire contents of `load_clinics_from_tracker.sql` → **Run**.
3. All 41 clinics now show up in `admin.html` → **Clinics**, and in search results on the live site.

It deliberately leaves insurance accepted, sliding-scale, walk-in, languages, and the rest at their defaults — those are exactly what the outreach call or email confirms, so there's no guessing about something that could misdirect a patient. Go back into each clinic's edit form in `admin.html` and fill those in as you actually talk to each clinic — the call becomes a data-accuracy check on top of the partnership ask, not a gate blocking the site from going live.

Only run it once — clinic names aren't enforced unique, so running it twice creates duplicates. If you ever need to re-run it, delete that batch first from `admin.html`.
