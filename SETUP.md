# Setup

Three services, in this order. Each one is a few minutes. Until they are done
the site still shows the plan (and any dress-rehearsal memories), but the
journal is locked. Nothing is visible until someone signs in.

### The gate login

One username and password. Send it round the family. The same login opens
Admin, where photos, story text and videos are added.

| Username | Password |
|---|---|
| `1edgXWXFJALPwSD4` | `W4oZcabh6s1LBOjp` |

To change them, hash each value and put the hex in `js/config.js`:

```bash
python3 -c "import hashlib; print(hashlib.sha256(b'YOUR-VALUE').hexdigest())"
```

The GitHub repo should be **private**. A login on the website does not hide
files that are public on GitHub.

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

Quest Game uses a fifth file, `supabase/05_quest.sql`. Run it when you
want shared Quest progress across phones. It adds Quest-only tables and
does not change the journal. Safe to re-run. Shared rows are readable
and writable only after the family viewer (or admin) is signed in.
Anonymous visitors cannot read or wipe them. A facilitator reset of the
shared copy requires the admin account in `app_admins`. Until this file
has been run, or until `js/config.js` has the two keys, or until someone
is signed in, Quest progress stays on each phone.

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

The gate login above is the website password. It is not a Supabase user.
After someone signs in, the public anon key still reads and posts the
album. Quest shared rows stay locked to a real Supabase session.

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

- Open the site signed out and confirm you only see the sign-in screen
- Sign in with the gate username and password
- Open **Admin**, add a photo, a short story and a YouTube link, then open
  that day and confirm they appear
- Sign out entirely and confirm you see nothing again

That last one is the important test.

---

## Storage, roughly

The free tier gives 1GB of storage and 5GB of bandwidth a month. With
in-browser compression the whole trip should land around 500 to 600MB of
photos, which fits, but the bandwidth is the tighter constraint once family
start browsing.

If it gets close, the Pro plan at $25 a month for two months is the simplest
fix. Watch **Reports, Storage** in the dashboard around the end of September.
