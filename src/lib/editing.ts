import { useSyncExternalStore } from "react"

/* ═══════════════════════════════════════════════════════════
   What she is currently editing.

   Clicking a pinned card opens its app with that drawing or note already
   loaded, rather than a blank page — so the pinned thing is the document
   and the app is the editor, which is the way every desktop has worked
   since 1984.

   One id at a time, held outside React because the desk sets it and the
   app reads it and neither should have to know the other exists.
   ═══════════════════════════════════════════════════════════ */

type Kind = "note" | "doodle"

let target: { kind: Kind; id: string } | null = null
const subscribers = new Set<() => void>()

function announce() {
  subscribers.forEach((fn) => fn())
}

export function edit(kind: Kind, id: string) {
  target = { kind, id }
  announce()
}

/** Back to a blank page — what opening the app from its icon should mean. */
export function clearEdit() {
  if (!target) return
  target = null
  announce()
}

function subscribe(fn: () => void) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/** The id being edited for this kind, or null. A primitive, so the snapshot
    stays stable between renders. */
export function useEditing(kind: Kind) {
  return useSyncExternalStore(subscribe, () => (target?.kind === kind ? target.id : null))
}
