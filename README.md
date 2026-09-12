# Marlo — deployment guide

Follow these in order. Nothing here requires coding — just following steps.

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
