/* ═══════════════════════════════════════════════════════════
   Supabase, over plain fetch.

   Supabase exposes Postgres and its file storage as ordinary HTTP, so
   there is no SDK here and the bundle does not grow. Two things live up
   there: the `desk_state` table (theme, where the tape is up to) and the
   `doodles` table plus a storage bucket of PNGs.

   Every call in this file is allowed to fail. The site has to work on a
   plane, on hotel wifi, and on the night the free tier decides to have a
   moment — so nothing here throws into the UI, nothing blocks a paint,
   and localStorage stays the thing the desk actually renders from. This
   is a sync layer, not a dependency.

   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to switch it on. With
   them unset the whole module reports disabled and the app is exactly
   what it was before: local-only.
   ═══════════════════════════════════════════════════════════ */

/* These two are public by design and must reach the browser — this is a static
   site, so it cannot talk to Supabase without them. They are literals rather
   than VITE_ environment variables because a host that classifies every
   variable as a secret will refuse to expose a VITE_ one, and the app then
   silently runs local-only with no error shown anywhere. An environment
   variable still wins where one is set, so moving them back is a one-line
   change with nothing else to adjust.

   What protects the data is the row-level-security policy in
   supabase/schema.sql, not the secrecy of this key. The `service_role` key
   bypasses those policies and must never appear here, in this repository, or
   anywhere else the browser can reach. */
const FALLBACK_URL = "https://somutkulkyovdhkvxmqi.supabase.co"
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbXV0a3Vsa3lvdmRoa3Z4bXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMjI4NDAsImV4cCI6MjEwNDU5ODg0MH0.eLpjrSx2vIfxfaWezy-BtbKjOKXn5NrNCIlbO5ngHjE"

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL).replace(/\/+$/, "")
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY
const BUCKET = "doodles"

/** Long enough for a cold start, short enough that she never waits on it. */
const TIMEOUT = 8000

export const cloudEnabled = Boolean(URL_BASE && ANON_KEY)

export interface CloudDoodle {
  id: string
  caption: string
  /** Storage object path, e.g. "a1b2c3.png". */
  path: string
  created_at: string
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    ...extra,
  }
}

/* One warning per session, not one per failed call: a paused project fails
   every request, and thirty identical red lines help nobody. */
let warned = false
function warn(what: string, err: unknown) {
  if (warned) return
  warned = true
  console.warn(`[cloud] ${what} failed — falling back to this device only.`, err)
}

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${URL_BASE}${path}`, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => "")}`)
  return res
}

/* ── desk_state: one row per key, value is jsonb ── */

export async function getState<T>(key: string): Promise<T | null> {
  if (!cloudEnabled) return null
  try {
    const res = await call(`/rest/v1/desk_state?key=eq.${encodeURIComponent(key)}&select=value`, {
      headers: headers(),
    })
    const rows = (await res.json()) as { value: T }[]
    return rows.length ? rows[0].value : null
  } catch (err) {
    warn(`reading "${key}"`, err)
    return null
  }
}

export async function putState(key: string, value: unknown): Promise<boolean> {
  if (!cloudEnabled) return false
  try {
    await call(`/rest/v1/desk_state?on_conflict=key`, {
      method: "POST",
      headers: headers({
        "Content-Type": "application/json",
        /* Upsert. Without this a second write to the same key is a duplicate
           key error rather than an update. */
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
    })
    return true
  } catch (err) {
    warn(`writing "${key}"`, err)
    return false
  }
}

/* ── doodles: a row per drawing, the PNG itself in storage ── */

export function doodleUrl(path: string) {
  return `${URL_BASE}/storage/v1/object/public/${BUCKET}/${path}`
}

export async function listDoodles(limit = 12): Promise<CloudDoodle[]> {
  if (!cloudEnabled) return []
  try {
    const res = await call(
      `/rest/v1/doodles?select=id,caption,path,created_at&order=created_at.desc&limit=${limit}`,
      { headers: headers() },
    )
    return (await res.json()) as CloudDoodle[]
  } catch (err) {
    warn("listing doodles", err)
    return []
  }
}

/** Uploads the PNG, then records the row. Returns null if either half fails.

    Each save gets its own filename rather than overwriting the last one.
    Storage treats a write to an existing path as an UPDATE, which needs its
    own row-level-security policy — so overwriting failed with a 403 the first
    time she edited a drawing, while the very same call succeeded for a new
    one. A fresh path is an INSERT every time, needs no extra policy, and has
    the happy side effect that no browser can serve a stale cached copy. The
    caller deletes the file this one replaces. */
export async function uploadDoodle(
  id: string,
  blob: Blob,
  caption: string,
): Promise<CloudDoodle | null> {
  if (!cloudEnabled) return null
  const path = `${id}-${Date.now().toString(36)}.png`
  try {
    await call(`/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: headers({ "Content-Type": "image/png", "x-upsert": "true" }),
      body: blob,
    })
    const res = await call(`/rest/v1/doodles`, {
      method: "POST",
      headers: headers({
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation",
      }),
      body: JSON.stringify({ id, caption, path }),
    })
    const rows = (await res.json()) as CloudDoodle[]
    return rows[0] ?? { id, caption, path, created_at: new Date().toISOString() }
  } catch (err) {
    warn("uploading a doodle", err)
    return null
  }
}

/** Removes one stored file and nothing else — used to tidy up the copy an
    edit has just replaced. */
export async function removeFile(path: string): Promise<boolean> {
  if (!cloudEnabled) return false
  try {
    await call(`/storage/v1/object/${BUCKET}/${path}`, { method: "DELETE", headers: headers() })
    return true
  } catch {
    /* Deliberately silent. This is best-effort tidying of a file nothing
       points at any more, and the common failure is a 404 — which means the
       file is already gone, which is the outcome we wanted. Warning here only
       spends the one warning a session gets on a non-problem. */
    return false
  }
}

/** Row first, then the file: a stray file is tidier than a row pointing at nothing. */
export async function removeDoodle(id: string, path: string): Promise<boolean> {
  if (!cloudEnabled) return false
  try {
    await call(`/rest/v1/doodles?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers({ Prefer: "return=minimal" }),
    })
    await call(`/storage/v1/object/${BUCKET}/${path}`, {
      method: "DELETE",
      headers: headers(),
    })
    return true
  } catch (err) {
    warn("deleting a doodle", err)
    return false
  }
}
