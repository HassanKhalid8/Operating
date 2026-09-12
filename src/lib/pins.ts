import { useSyncExternalStore } from "react"
import { load, save } from "./store"
import {
  cloudEnabled, doodleUrl, getState, listDoodles, putState, removeDoodle, removeFile, uploadDoodle,
} from "./cloud"

/* ═══════════════════════════════════════════════════════════
   The doodles she pins to the desk, and the ones she throws away.

   Local first, cloud second. Every pin is written to localStorage
   immediately with a small thumbnail, so it is on the desk the instant
   she hits the button and it is still there with the wifi off. The
   full-resolution PNG goes to Supabase storage in the background; if
   that fails the drawing sits in a pending queue and tries again the
   next time the site opens.

   Taking one down does not delete it — it goes to the Trash, keeping
   both its cloud row and its file, so restoring is lossless rather than
   a re-upload of the small local copy. Which ones are in the bin is
   itself synced, as a list of ids in desk_state, so the Trash looks the
   same on her phone as on her laptop. Only "delete forever" actually
   destroys anything.
   ═══════════════════════════════════════════════════════════ */

export interface Pin {
  id: string
  caption: string
  at: number
  /** Downscaled PNG data URL. This device's copy — instant, and offline. */
  thumb: string
  /** Storage object path, once it has reached the cloud. */
  path?: string
  /** Full-size PNG data URL, held only until the upload succeeds. */
  pending?: string
  /** When she put it in the bin. Absent means it is on the desk. */
  trashed?: number
}

const KEY = "khinsaos.pins.v1"
/** Six is as many as the desk can hold before it stops reading as a desk. */
const MAX = 6
/** The bin holds more, because nothing in it is in the way. */
const TRASH_MAX = 24

let pins: Pin[] = sanitise(load<Pin[]>(KEY, []))
const subscribers = new Set<() => void>()

/* Recomputed on every commit rather than filtered inside the hooks:
   useSyncExternalStore compares snapshots by identity, and a fresh array from
   a .filter() on every render is an infinite loop. */
let deskView: Pin[] = []
let trashView: Pin[] = []

function sanitise(value: unknown): Pin[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (p): p is Pin => !!p && typeof p.id === "string" && typeof p.thumb === "string",
  )
}

/** What the frame actually loads: the cloud copy if it has one, else this
    device's. The ?v is the last-saved time — an edited doodle keeps its id and
    therefore its storage path, so without it the browser would keep showing
    the version it already had cached. */
export function pinSrc(pin: Pin) {
  return pin.path ? `${doodleUrl(pin.path)}?v=${pin.at}` : pin.thumb
}

/** One doodle by id, for the editor to load. */
export function getPin(id: string) {
  return pins.find((p) => p.id === id) ?? null
}

/** Saves an edit in place: same id, same storage path, new picture. */
export function updatePin(id: string, thumb: string, full: string, caption: string) {
  commit(
    pins.map((p) =>
      p.id === id
        ? { ...p, thumb, caption, at: Date.now(), pending: cloudEnabled ? full : undefined }
        : p,
    ),
  )
  const updated = pins.find((p) => p.id === id)
  if (cloudEnabled && updated) void push(updated)
}

/* Images are heavy and localStorage is ~5MB. If the write is refused we drop
   the last entry and try again rather than silently losing the new one — and
   because the bin sorts last, what goes first is the oldest thing she already
   threw away. */
function commit(next: Pin[]) {
  const desk = next.filter((p) => !p.trashed).sort((a, b) => b.at - a.at).slice(0, MAX)
  const binned = next
    .filter((p) => p.trashed)
    .sort((a, b) => (b.trashed ?? 0) - (a.trashed ?? 0))
    .slice(0, TRASH_MAX)

  let attempt = [...desk, ...binned]
  while (!save(KEY, attempt) && attempt.length > 1) attempt = attempt.slice(0, -1)

  pins = attempt
  deskView = attempt.filter((p) => !p.trashed)
  trashView = attempt.filter((p) => p.trashed)
  subscribers.forEach((fn) => fn())
}

commit(pins)

function dataUrlToBlob(dataUrl: string): Blob | null {
  const comma = dataUrl.indexOf(",")
  if (comma < 0) return null
  try {
    const bytes = atob(dataUrl.slice(comma + 1))
    const buf = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
    return new Blob([buf], { type: "image/png" })
  } catch {
    return null
  }
}

/** The bin, as the cloud sees it: just a list of ids. No schema change needed. */
function pushTrashed() {
  if (!cloudEnabled) return
  void putState("trashed", pins.filter((p) => p.trashed).map((p) => p.id))
}

/** Pins immediately, then syncs. `full` is the full-size PNG, `thumb` the small one. */
export function pinDoodle(thumb: string, full: string, caption: string) {
  const pin: Pin = {
    id: crypto.randomUUID(),
    caption,
    at: Date.now(),
    thumb,
    pending: cloudEnabled ? full : undefined,
  }
  commit([pin, ...pins])
  if (cloudEnabled) void push(pin)
  return pin
}

/** Sends one pending pin up. Quietly does nothing if it fails; boot retries. */
async function push(pin: Pin) {
  if (!pin.pending) return
  const blob = dataUrlToBlob(pin.pending)
  if (!blob) return
  const replaced = pin.path
  const row = await uploadDoodle(pin.id, blob, pin.caption)
  if (!row) return
  commit(pins.map((p) => (p.id === pin.id ? { ...p, path: row.path, pending: undefined } : p)))
  /* The version this one just replaced is now referenced by nothing. */
  if (replaced && replaced !== row.path) void removeFile(replaced)
}

/** Off the desk, into the bin. Nothing is destroyed. */
export function unpin(id: string) {
  commit(pins.map((p) => (p.id === id ? { ...p, trashed: Date.now() } : p)))
  pushTrashed()
}

/** Back onto the desk, at the front. */
export function restorePin(id: string) {
  commit(pins.map((p) => (p.id === id ? { ...p, trashed: undefined, at: Date.now() } : p)))
  pushTrashed()
}

/** Actually gone: the row, the file, and this device's copy. */
export function destroyPin(id: string) {
  const pin = pins.find((p) => p.id === id)
  commit(pins.filter((p) => p.id !== id))
  pushTrashed()
  if (pin?.path) void removeDoodle(pin.id, pin.path)
}

export function emptyTrash() {
  const binned = pins.filter((p) => p.trashed)
  commit(pins.filter((p) => !p.trashed))
  pushTrashed()
  for (const pin of binned) if (pin.path) void removeDoodle(pin.id, pin.path)
}

/** Reconciles with the cloud once, at startup. Cloud rows win; local pending survives. */
export async function syncPins() {
  if (!cloudEnabled) return

  for (const pin of pins.filter((p) => p.pending)) await push(pin)

  const [rows, trashedIds] = await Promise.all([
    listDoodles(MAX + TRASH_MAX),
    getState<string[]>("trashed"),
  ])
  if (!rows.length) return

  const binned = new Set(Array.isArray(trashedIds) ? trashedIds : [])
  const local = new Map(pins.map((p) => [p.id, p]))

  const merged: Pin[] = rows.map((row) => {
    const mine = local.get(row.id)
    const at = Date.parse(row.created_at) || Date.now()
    return {
      id: row.id,
      caption: row.caption,
      at: mine?.at ?? at,
      /* Keep this device's thumbnail if it has one — it renders with no network
         round trip. A doodle drawn on her other phone has none, and falls back
         to the storage URL. */
      thumb: mine?.thumb ?? "",
      path: row.path,
      trashed: binned.has(row.id) ? (mine?.trashed ?? at) : undefined,
    }
  })

  /* Anything still waiting to upload is hers too, and must not be dropped just
     because the server has not heard of it yet. */
  const stillPending = pins.filter((p) => p.pending && !rows.some((r) => r.id === p.id))

  commit([...merged, ...stillPending])
}

function subscribe(fn: () => void) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** What is on the desk. */
export function usePins() {
  return useSyncExternalStore(subscribe, () => deskView)
}

/** What is in the bin. */
export function useTrash() {
  return useSyncExternalStore(subscribe, () => trashView)
}
