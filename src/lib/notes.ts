import { useSyncExternalStore } from "react"
import { load, save } from "./store"
import { cloudEnabled, getState, putState } from "./cloud"

/* ═══════════════════════════════════════════════════════════
   Notes she pins to the desk.

   The same life as a doodle — pin it, take it down to the Trash, put it
   back, or destroy it — but a note is text, and text stays text. It is
   never rendered to an image, so it is still searchable, still
   selectable, and still readable in a plain mail.

   That also means it needs no file storage and no new table: the whole
   collection is a small JSON array in the `desk_state` row `notes`, the
   same place the theme and the tape position live. Nothing to migrate,
   and it syncs to her other devices for free.
   ═══════════════════════════════════════════════════════════ */

export interface Note {
  id: string
  title: string
  body: string
  /** Created, or last edited. Decides which device wins a merge. */
  at: number
  /** When she put it in the bin. Absent means it is on the desk. */
  trashed?: number
}

const KEY = "khinsaos.notes.v1"
/** As many as the desk can hold before it stops reading as a desk. */
const MAX = 6
const TRASH_MAX = 24
/** A note is a note, not an essay. Also keeps the desk_state row small. */
export const MAX_BODY = 4000

let notes: Note[] = sanitise(load<Note[]>(KEY, []))
const subscribers = new Set<() => void>()

/* Recomputed on commit, not filtered in the hook: useSyncExternalStore
   compares snapshots by identity, and a fresh array every render is a loop. */
let deskView: Note[] = []
let trashView: Note[] = []

function sanitise(value: unknown): Note[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (n): n is Note =>
      !!n && typeof n.id === "string" && typeof n.title === "string" && typeof n.body === "string",
  )
}

/** When this note last changed in any way. */
const touched = (n: Note) => Math.max(n.at, n.trashed ?? 0)

function commit(next: Note[], sync = true) {
  const desk = next.filter((n) => !n.trashed).sort((a, b) => b.at - a.at).slice(0, MAX)
  const binned = next
    .filter((n) => n.trashed)
    .sort((a, b) => (b.trashed ?? 0) - (a.trashed ?? 0))
    .slice(0, TRASH_MAX)

  let attempt = [...desk, ...binned]
  while (!save(KEY, attempt) && attempt.length > 1) attempt = attempt.slice(0, -1)

  notes = attempt
  deskView = attempt.filter((n) => !n.trashed)
  trashView = attempt.filter((n) => n.trashed)
  subscribers.forEach((fn) => fn())

  if (sync && cloudEnabled) void putState("notes", attempt)
}

commit(notes, false)

/** One note by id, for the editor to load. */
export function getNote(id: string) {
  return notes.find((n) => n.id === id) ?? null
}

/** Saves an edit in place. Keeps the id, so the card on the desk is the
    same card — this is editing a document, not making a second one. */
export function updateNote(id: string, title: string, body: string) {
  commit(
    notes.map((n) =>
      n.id === id
        ? { ...n, title: title.slice(0, 60), body: body.slice(0, MAX_BODY), at: Date.now() }
        : n,
    ),
  )
}

export function pinNote(title: string, body: string) {
  const note: Note = {
    id: crypto.randomUUID(),
    title: title.slice(0, 60),
    body: body.slice(0, MAX_BODY),
    at: Date.now(),
  }
  commit([note, ...notes])
  return note
}

/** Off the desk, into the bin. Nothing is destroyed. */
export function binNote(id: string) {
  commit(notes.map((n) => (n.id === id ? { ...n, trashed: Date.now() } : n)))
}

export function restoreNote(id: string) {
  commit(notes.map((n) => (n.id === id ? { ...n, trashed: undefined, at: Date.now() } : n)))
}

export function destroyNote(id: string) {
  commit(notes.filter((n) => n.id !== id))
}

export function emptyNoteTrash() {
  commit(notes.filter((n) => !n.trashed))
}

/** Reconciles with the cloud once, at startup. Newest edit of each note wins. */
export async function syncNotes() {
  if (!cloudEnabled) return
  const remote = sanitise(await getState<Note[]>("notes"))
  if (!remote.length && !notes.length) return

  const merged = new Map(notes.map((n) => [n.id, n]))
  for (const incoming of remote) {
    const mine = merged.get(incoming.id)
    if (!mine || touched(incoming) > touched(mine)) merged.set(incoming.id, incoming)
  }

  /* Push back only when this device actually knows something the server does
     not — otherwise every open would write the same array again. */
  const next = [...merged.values()]
  const changed =
    next.length !== remote.length ||
    next.some((n) => {
      const there = remote.find((r) => r.id === n.id)
      return !there || touched(there) !== touched(n)
    })
  commit(next, changed)
}

function subscribe(fn: () => void) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** What is on the desk. */
export function useNotes() {
  return useSyncExternalStore(subscribe, () => deskView)
}

/** What is in the bin. */
export function useNoteTrash() {
  return useSyncExternalStore(subscribe, () => trashView)
}
