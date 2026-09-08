# Setup

Three services, in this order. Each one is a few minutes. Until they are done
the site still shows the plan (and any dress-rehearsal memories).

A family login will come back in a later version. The hashes in `js/config.js`
are kept for that. The GitHub repo should be **private** either way: a login
on the website does not hide files that are public on GitHub.

---

## 1. GitHub

The repo is already created locally with a first commit on `main`.

Create an empty repo called `japan-2026` at
<https://github.com/new>. **Private.** Do not add a README, a `.gitignore`
or a licence, because there is already a commit here.

Then:

```bash
cd "japan-2026"
git remote add origin git@github.com:nefastofeles/japan-2026.git
git push -u origin main
```

The SSH key you use for `health-tracker` will work for this too.

---

## 2. Netlify

1. <https://app.netlify.com/start> and pick GitHub
2. Choose `japan-2026`
3. Build command: leave **empty**. Publish directory: `.`
4. Deploy

`netlify.toml` already sets the redirects, the security headers and
`noindex`, so there is nothing to configure by hand.

Under **Site configuration, Build & deploy, Deploy Previews**, make sure
previews are on. That is what gives Saga a live URL for every pull request,
which is the single best part of this for teaching.

Rename the site to something memorable under **Site configuration, Site
details**. Grandparents will type this.

---

## 3. Supabase

### Create the project

<https://supabase.com/dashboard> and make a new project. Pick a region close
to home, not to Japan, since almost all the reading happens in Denmark.

### Run the SQL

Open the SQL editor and run these four files in order, pasting each one in
whole:

1. `supabase/01_schema.sql` — tables
2. `supabase/02_policies.sql` — row level security
3. `supabase/03_storage.sql` — the two private buckets
4. `supabase/04_seed.sql` — the four people and the 24 days

If you later change `data/itinerary.json`, regenerate the last one:

```bash
python3 tools/generate-seed.py
```

and run it again. It is an upsert, so re-running never destroys photos.

### Create the two accounts

**Authentication, Users, Add user** (choose "auto confirm" for both):

| Account | Purpose |
|---|---|
| your own email | admin. Uploads and writes. |
| something like `family@…` | the shared viewer login. Reads. |

Then make yourself the admin. In the SQL editor:

```sql
insert into app_admins (user_id, note)
select id, 'Javier' from auth.users where email = 'YOUR-EMAIL-HERE';
```

Only accounts in `app_admins` can write anything. The viewer account can read
everything, and nothing else.

### Make sessions last

**Authentication, Sessions**: set the refresh token expiry as long as it will
go, and leave "detect and revoke potentially compromised refresh tokens" off.
Grandparents should sign in once in September and stay signed in through
October. Being asked to log in again on day nine is what kills a family site.

### Wire it up

**Project Settings, API**, copy the two values into `js/config.js`:

```js
export const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

The anon key is meant to be public and is safe in a git repo; every table is
protected by row level security. The **service_role** key is not, and must
never go anywhere near this project.

Commit, push, and the site is live with photos switched on.

---

## Checking it worked

- Open the site and confirm Home, a day page and the map load with no login
- Open **Admin**, add a photo, a short story and a YouTube link, then open
  that day and confirm they appear

---

## Storage, roughly

The free tier gives 1GB of storage and 5GB of bandwidth a month. With
in-browser compression the whole trip should land around 500 to 600MB of
photos, which fits, but the bandwidth is the tighter constraint once family
start browsing.

If it gets close, the Pro plan at $25 a month for two months is the simplest
fix. Watch **Reports, Storage** in the dashboard around the end of September.
