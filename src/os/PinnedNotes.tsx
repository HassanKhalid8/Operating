import { motion } from "framer-motion"
import { binNote, type Note } from "../lib/notes"

/* One note she wrote and pinned, lying on the desk as a Note Pad page. Where
   it lies is the desk's business; this just draws the page. */
export function PinnedNote({ note, index: i, onOpen }: {
  note: Note
  index: number
  onOpen: () => void
}) {
  return (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, y: 14, rotate: i % 2 ? -1.2 : 1.4 }}
          animate={{ opacity: 1, y: 0, rotate: i % 2 ? -1.2 : 1.4 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          whileDrag={{ rotate: 0, scale: 1.03, cursor: "grabbing", zIndex: 30 }}
          data-note={note.id}
          className="edge-lg group relative w-[272px] shrink-0 cursor-grab bg-card"
        >
          <div className="pinstripe flex h-6 items-center border-b border-ink px-2">
            <span className="mx-auto truncate bg-card px-2 font-chrome text-[9px] tracking-tight text-ink">
              {note.title || "UNTITLED"}
            </span>
          </div>

          <button
            onClick={onOpen}
            aria-label="Open Notepad"
            className="relative block w-full cursor-pointer px-4 pb-4 pt-3 text-left"
          >
            {/* Ruled lines, the same as the Note Pad page on the desk. */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 top-0 opacity-[0.55]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent 0 21px, color-mix(in srgb, var(--color-blue) 22%, transparent) 21px 22px)",
              }}
            />
            {/* Clamped rather than scrolled: a pinned note is a glance, and
                opening the app is how she reads the rest. */}
            <p className="relative line-clamp-6 whitespace-pre-wrap font-serif text-[14px] leading-[23px] text-ink">
              {note.body}
            </p>
          </button>

          <button
            onClick={() => binNote(note.id)}
            aria-label="Take this note down"
            className="absolute right-1 top-1 grid h-[13px] w-[13px] place-items-center border border-ink bg-card text-[8px] leading-none text-ink opacity-45 transition-opacity hover:bg-red hover:text-card hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
          >
            ✕
          </button>
        </motion.div>
  )
}
