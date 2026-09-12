import { useState } from "react"
import { destroyPin, emptyTrash, pinSrc, restorePin, useTrash, type Pin } from "../lib/pins"
import {
  destroyNote, emptyNoteTrash, restoreNote, useNoteTrash, type Note,
} from "../lib/notes"
import { TRASH_EMPTY, TRASH_WARNING } from "../content/doodle"

/* ═══════════════════════════════════════════════════════════
   Trash.

   Everything she takes off the desk lands here — drawings and notes in
   one list, newest first, because "where did that thing go" is not a
   question anyone answers by remembering which app made it.

   A binned doodle keeps its full-size file in storage, so Put Back
   restores the real drawing rather than the small local thumbnail. Only
   the buttons in here destroy anything, and every one of them asks
   twice: there is no undo past this point, and a mis-tap on a phone
   should not be able to end a drawing.
   ═══════════════════════════════════════════════════════════ */

type Item =
  | { kind: "doodle"; at: number; pin: Pin }
  | { kind: "note"; at: number; note: Note }

export function Trash() {
  const pins = useTrash()
  const notes = useNoteTrash()
  /* Which button is currently showing "sure?" — one at a time. */
  const [confirming, setConfirming] = useState<string | null>(null)

  const items: Item[] = [
    ...pins.map((pin): Item => ({ kind: "doodle", at: pin.trashed ?? pin.at, pin })),
    ...notes.map((note): Item => ({ kind: "note", at: note.trashed ?? note.at, note })),
  ].sort((a, b) => b.at - a.at)

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="edge grid h-12 w-12 place-items-center bg-paper text-lg text-ink-faint">♺</div>
        <div className="font-chrome text-[9px] tracking-tight text-ink-faint">EMPTY</div>
        <p className="max-w-xs font-serif text-[15px] leading-relaxed text-ink-soft">
          {TRASH_EMPTY}
        </p>
      </div>
    )
  }

  const restore = (item: Item) =>
    item.kind === "doodle" ? restorePin(item.pin.id) : restoreNote(item.note.id)
  const destroy = (item: Item) =>
    item.kind === "doodle" ? destroyPin(item.pin.id) : destroyNote(item.note.id)
  const idOf = (item: Item) => (item.kind === "doodle" ? item.pin.id : item.note.id)

  return (
    <div className="min-h-full bg-paper">
      <div className="flex items-center gap-3 border-b border-ink/20 bg-card px-5 py-3">
        <span className="font-chrome text-[9px] tracking-tight text-ink-faint">
          {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => {
            if (confirming === "all") { emptyTrash(); emptyNoteTrash(); setConfirming(null) }
            else setConfirming("all")
          }}
          onBlur={() => setConfirming((c) => (c === "all" ? null : c))}
          className={`edge px-3 py-1.5 font-chrome text-[9px] tracking-tight ${
            confirming === "all"
              ? "bg-red text-card"
              : "bg-paper text-ink hover:bg-ink hover:text-card"
          }`}
        >
          {confirming === "all" ? "SURE? THIS IS FOREVER" : "EMPTY TRASH"}
        </button>
      </div>

      <ul>
        {items.map((item) => {
          const id = idOf(item)
          return (
            <li key={id} className="flex items-center gap-3 border-b border-ink/10 px-5 py-3">
              {item.kind === "doodle" ? (
                <img
                  src={pinSrc(item.pin)}
                  alt={item.pin.caption || "A doodle"}
                  className="edge-in h-12 w-[72px] shrink-0 bg-card object-cover"
                  draggable={false}
                  onError={(e) => {
                    const img = e.currentTarget
                    if (item.pin.thumb && img.src !== item.pin.thumb) img.src = item.pin.thumb
                    else img.style.visibility = "hidden"
                  }}
                />
              ) : (
                /* The note's own first lines are a better thumbnail than any icon. */
                <div className="edge-in h-12 w-[72px] shrink-0 overflow-hidden bg-card px-1.5 py-1">
                  <p className="line-clamp-3 whitespace-pre-wrap font-serif text-[7px] leading-[9px] text-ink-soft">
                    {item.note.body}
                  </p>
                </div>
              )}

              <span className="min-w-0 flex-1">
                <span className="block truncate font-serif text-[15px] leading-tight text-ink">
                  {(item.kind === "doodle" ? item.pin.caption : item.note.title) || "untitled"}
                </span>
                <span className="block font-mono text-[10px] text-ink-faint">
                  {item.kind === "doodle" ? "drawing" : "note"} · thrown out{" "}
                  {new Date(item.at).toLocaleDateString([], { day: "numeric", month: "short" })}
                </span>
              </span>

              <button
                onClick={() => restore(item)}
                className="edge shrink-0 bg-card px-2.5 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card"
              >
                ↺ PUT BACK
              </button>

              <button
                onClick={() => {
                  if (confirming === id) { destroy(item); setConfirming(null) }
                  else setConfirming(id)
                }}
                onBlur={() => setConfirming((c) => (c === id ? null : c))}
                aria-label="Delete this forever"
                className={`edge shrink-0 px-2.5 py-1.5 font-chrome text-[9px] tracking-tight ${
                  confirming === id
                    ? "bg-red text-card"
                    : "bg-card text-ink hover:bg-red hover:text-card"
                }`}
              >
                {confirming === id ? "SURE?" : "✕ FOREVER"}
              </button>
            </li>
          )
        })}
      </ul>

      <p className="px-5 py-4 font-serif text-[13px] italic leading-relaxed text-ink-faint">
        {TRASH_WARNING}
      </p>
    </div>
  )
}
