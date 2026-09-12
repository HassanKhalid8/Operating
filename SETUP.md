# Connecting KhinsaOS to the cloud

Two separate things, each usable without the other:

1. **Supabase** — so her theme, her doodles and where the tape is up to survive a
   reset, a new phone, and clearing her browser.
2. **Gmail** — so the Send button in Doodle mails you the drawing, attached, with
   nothing for her to do by hand.

**Neither is required.** With none of this configured the site behaves exactly as it
did before: everything saved to her browser and nowhere else. Every cloud call in the
app is allowed to fail, times out after 8 seconds, and falls back to the local copy.
That is deliberate — the one night this has to work is not a night to depend on
somebody else's free tier.

---

## Why Supabase

| | |
|---|---|
| **Postgres + file storage in one** | The drawings need somewhere to be *files*. A database alone would mean base64 in a text column, which is slow and wasteful. |
| **No SDK needed** | Supabase is plain HTTP, so `src/lib/cloud.ts` talks to it with `fetch`. The bundle grew **0.5 KB** for all of this. Firebase's SDK would have cost about 100 KB. |
| **You can see her doodles** | The dashboard has a table browser and a file browser. Her drawings show up as rows and thumbnails you can look at. |
| **Free covers this a thousand times over** | 500 MB database, 1 GB storage. Six doodles is under 2 MB. |

**The one catch:** free projects **pause after ~7 days with no requests**, and a
paused project answers every request with an error until you restore it from the
dashboard. Two things to do about it:

- Open the site (or the Supabase dashboard) once a week between now and the 15th.
- Open it on the 14th, deliberately, and confirm the desk still loads.

If that risk bothers you, Firebase never sleeps and would be the swap — it costs a
bigger bundle and a rewrite of `cloud.ts`, nothing else. I'd stay on Supabase, because
the app already degrades to local-only if the project is asleep: she'd see her own
device's doodles and theme, not an error.

---

## Part 1 — Supabase (10 minutes)

1. Sign up at **supabase.com** → **New project**. Any name. Pick the region closest
   to Lahore (Singapore or Mumbai). Save the database password somewhere; you will
   not need it for this, but losing it is annoying later.
2. Wait for it to finish provisioning (~2 min).
3. **SQL Editor** → **New query** → paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. That creates both tables,
   the storage bucket, and the access rules. It is safe to run more than once.
4. **Project Settings → API**, and copy two things:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **anon public** key → a long `eyJ...` string. The **anon** one. Never the
     `service_role` one — that key bypasses every rule and must never go in a browser.
5. Locally: copy `.env.example` to `.env.local` and fill in:

   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

   Restart `npm run dev` — Vite only reads env files at startup.
6. On Vercel: **Settings → Environment Variables**, add the same two, then redeploy.

### Checking it worked

Open the site, change the theme, pin a doodle. Then in the Supabase dashboard:

- **Table Editor → desk_state** — a `theme` row and a `tape` row.
- **Table Editor → doodles** — one row per pinned drawing.
- **Storage → doodles** — the PNGs, which you can click and look at.

The honest test is the one that matters: open DevTools → Application → Clear site
data, reload, and watch her theme and her doodles come back anyway.

### About that key being public

The anon key ships inside the JavaScript, so anyone who has the link has it. The rules
in `schema.sql` let that role read, add and delete rows in these two tables. For a
private URL sent to one person that is a fair trade, and it is why nothing sensitive
goes in these tables — the letter, the photos and the voice notes are all still files
in the build, not database rows.

If you ever want it locked down: the mail endpoint proves you can run server code, so
the same trick works for writes — move them behind `/api` with the `service_role` key
in the environment, and take the anon policies away.

---

## Part 2 — mailing yourself the doodles (5 minutes)

`api/send-doodle.ts` runs on Vercel, takes the PNG, and mails it to you with the
drawing attached. The mailbox password lives only in Vercel's environment — it is
never in the bundle and never reaches her browser.

1. Your Google account needs **2-Step Verification on** (App Passwords do not exist
   without it): myaccount.google.com → Security → 2-Step Verification.
2. Go to **myaccount.google.com/apppasswords**, name it `KhinsaOS`, and copy the
   16-character password it gives you. Spaces don't matter.
3. Vercel → **Settings → Environment Variables**:

   ```
   GMAIL_USER          hassank8125@gmail.com
   GMAIL_APP_PASSWORD  the 16 characters from step 2
   MAIL_TO             hassank8125@gmail.com
   ```

   **Do not** put `VITE_` in front of these. That prefix is what tells Vite to bake a
   value into the browser bundle, and these must never go there.
4. Redeploy.

That is what "connect my gmail" means here — an App Password, not OAuth. It is
revocable from the same page the moment you want it gone, and it can only send mail.

### Testing it

The mail route only exists on Vercel, so `npm run dev` will not have it — the Send
button falls back to the phone's share sheet, which is the correct behaviour and not
a bug. To run it locally: `npm i -g vercel`, then `vercel dev`, with the mail
variables in `.env.local` too.

### What the Send button does now

1. **Posts to `/api/send-doodle`** — one tap, and it is in your inbox.
2. If that endpoint is missing or down, **her phone's share sheet**, PNG attached.
3. If that does not exist either, the PNG downloads and her mail client opens
   pre-addressed, and she attaches it herself.

She never sees which one happened.

---

## What is stored where

| | Where | Survives |
|---|---|---|
| Theme | `desk_state` row `theme` | new device, cleared browser |
| Tape position | `desk_state` row `tape` | new device, cleared browser |
| Doodles | `doodles` table + `doodles` bucket | new device, cleared browser |
| The desk pet's mood | this browser only | nothing — it is meant to be forgetful |
| Window positions | nothing | reload |

Doodles are written to her browser **first** and uploaded after, so a pin appears
instantly and is never lost to a failed request. If the upload fails, the drawing sits
in a queue and goes up the next time the site opens.
