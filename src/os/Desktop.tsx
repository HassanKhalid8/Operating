import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { APPS, APP_BY_ID } from "./registry"
import { Window } from "./Window"
import { MenuBar } from "./MenuBar"
import { TapeDeck } from "./TapeDeck"
import { PinnedDoodle } from "./PinnedDoodles"
import { PinnedNote } from "./PinnedNotes"
import { Pet } from "./Pet"
import { Clock } from "./widgets/Clock"
import { Weather } from "./widgets/Weather"
import { Countdown } from "./widgets/Countdown"
import type { Accent, AppId, WindowState } from "./types"
import { CONFIG } from "../content/config"
import { useIsMobile, useNow, useViewport } from "../lib/hooks"
import { usePins } from "../lib/pins"
import { useNotes } from "../lib/notes"
import { clearEdit, edit } from "../lib/editing"
import { daysUntilBirthday } from "../lib/time"

/* ── laying out the desk ──

   A desktop does not scroll. It is a surface of a fixed size, and things
   on it either fit or do not — so instead of hand-placed coordinates on a
   canvas that grew downwards, the desk measures itself and packs what it
   can into the space it actually has.

   Left to right, wrapping to a new row when the next thing would hang off
   the edge, stopping entirely when the next row would fall off the bottom.
   Nothing is ever placed on top of anything else, and nothing is ever
   placed where she would have to scroll to see it.

   Each piece has to declare its footprint, because the packer runs before
   anything is rendered and cannot measure a card that does not exist yet.
   These are the real measured sizes, rounded up a little; being generous
   costs a few pixels of air, while being mean costs an overlap. */
interface Footprint {
  w: number
  h: number
}

const SIZE: Record<string, Footprint> = {
  clock:     { w: 236, h: 246 },
  weather:   { w: 258, h: 232 },
  tape:      { w: 346, h: 300 },
  countdown: { w: 256, h: 252 },
  doodle:    { w: 258, h: 244 },
  note:      { w: 274, h: 200 },
}

/** Space between pieces. Also the budget the stagger below borrows from. */
const GAP = 20

interface Piece {
  key: string
  node: React.ReactNode
  size: Footprint
}

interface Placed extends Piece {
  at: { left: number; top: number }
}

/* A tiny deterministic offset per piece, so a packed grid still reads as
   things someone put down rather than a spreadsheet. Derived from the key
   rather than Math.random so a re-render never makes the desk twitch, and
   kept well inside GAP so it can never close the gap to zero. */
function stagger(key: string) {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return ((Math.abs(h) % 13) - 6)
}

/** Packs what fits and drops the rest. Never overlaps, never overflows. */
function packDesk(pieces: Piece[], deskW: number, deskH: number): Placed[] {
  const placed: Placed[] = []
  let x = 0
  let y = 0
  let rowH = 0

  for (const piece of pieces) {
    const { w, h } = piece.size
    /* Wrap — unless this is the first thing in the row, in which case it goes
       in regardless or a card wider than the desk would loop forever. */
    if (x > 0 && x + w > deskW) {
      x = 0
      y += rowH + GAP
      rowH = 0
    }
    if (y + h > deskH) break
    placed.push({ ...piece, at: { left: x, top: y + stagger(piece.key) } })
    x += w + GAP
    rowH = Math.max(rowH, h)
  }

  return placed
}

const ACCENT: Record<Accent, string> = {
  red: "var(--color-red)",
  blue: "var(--color-blue)",
  olive: "var(--color-olive)",
  ink: "var(--color-ink)",
}

export function Desktop() {
  const [wins, setWins] = useState<WindowState[]>([])
  /* The stacking counter lives in a ref, not state: two opens fired in the same
     tick would both read the same stale value and end up sharing a z-index,
     which leaves neither window looking focused. */
  const zRef = useRef(1)
  const isMobile = useIsMobile()
  const now = useNow()
  const viewport = useViewport()
  const pins = usePins()
  const notes = useNotes()

  function open(id: AppId) {
    const z = ++zRef.current
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) {
        return ws.map((w) => (w.id === id ? { ...w, z } : w))
      }
      const app = APP_BY_ID[id]
      const w = Math.min(app.size.w, window.innerWidth - 200)
      const h = Math.min(app.size.h, window.innerHeight - 110)
      /* Cascade, so a second window never lands exactly on the first. */
      const step = ws.length * 26
      /* x and y are relative to the window layer, whose origin is the top-left
         corner under the menu bar. */
      return [...ws, {
        id,
        x: Math.max(28, Math.round((window.innerWidth - 130 - w) / 2) + step),
        y: Math.max(18, Math.round((window.innerHeight - 28 - h) / 2) - 10 + step),
        w, h, z,
      }]
    })
  }

  const close = (id: AppId) => setWins((ws) => ws.filter((w) => w.id !== id))
  const move = (id: AppId, x: number, y: number) =>
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)))
  const focus = (id: AppId) => {
    const z = ++zRef.current
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z } : w)))
  }

  /* One list, so the desk can place every piece the same way — the widgets
     that are always there, then whatever she has pinned, newest first. */
  const pieces: Piece[] = [
    { key: "clock", node: <Clock />, size: SIZE.clock },
    { key: "weather", node: <Weather />, size: SIZE.weather },
    { key: "tape", node: <TapeDeck onOpen={() => open("music")} />, size: SIZE.tape },
    { key: "countdown", node: <Countdown />, size: SIZE.countdown },
    ...pins.map((pin, i) => ({
      key: pin.id,
      node: (
        <PinnedDoodle
          pin={pin}
          index={i}
          onOpen={() => { edit("doodle", pin.id); open("doodle") }}
        />
      ),
      size: SIZE.doodle,
    })),
    ...notes.map((note, i) => ({
      key: note.id,
      node: (
        <PinnedNote
          note={note}
          index={i}
          onOpen={() => { edit("note", note.id); open("notepad") }}
        />
      ),
      size: SIZE.note,
    })),
  ]

  /* The desk is exactly what is on screen: the window, less the menu bar, the
     icon column, and a margin for the signature in the corner. */
  const deskW = Math.max(280, viewport.w - 132 - 32)
  const deskH = Math.max(240, viewport.h - 28 - 24 - 56)
  const placed = isMobile ? [] : packDesk(pieces, deskW, deskH)
  const hidden = isMobile ? 0 : pieces.length - placed.length

  const daysLeft = daysUntilBirthday(now)
  const frontId = wins.length
    ? wins.reduce((a, b) => (b.z >= a.z ? b : a)).id
    : null

  return (
    <div className="flex h-full flex-col">
      <MenuBar now={now} daysLeft={daysLeft} />

      <div
        className={`paper-bg grain relative min-h-0 flex-1 overflow-x-hidden ${
          isMobile ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {/* ── icons: right edge on desktop, grid on phones ── */}
        <div className="grid grid-cols-4 content-start gap-x-1 gap-y-3 p-4 pt-6 sm:absolute sm:right-0 sm:top-0 sm:w-[104px] sm:grid-cols-1 sm:gap-y-1 sm:p-3">
          {APPS.map((app, i) => (
            <motion.button
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.3 }}
              onClick={() => { clearEdit(); open(app.id) }}
              className="group flex flex-col items-center gap-1 px-1 py-1.5 active:scale-95"
            >
              <span
                className="edge grid h-10 w-10 place-items-center bg-card text-[15px] transition-transform group-hover:-translate-y-0.5"
                style={{ color: ACCENT[app.accent] }}
              >
                {app.glyph}
              </span>
              {/* Icon labels sit in a paper chip, the way desktop labels always have. */}
              <span className="max-w-full truncate bg-card px-1 font-chrome text-[8px] leading-4 text-ink group-hover:bg-ink group-hover:text-card">
                {app.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* ── desk furniture ──
             Packed into the visible surface on a real screen. A phone is the
             one place a column and a scroll are right: three cards is all that
             fits on a 375px screen, and dropping the rest would hide most of
             what she made. */}
        {isMobile ? (
          <div className="flex flex-wrap content-start items-start justify-center gap-5 px-4 pb-10">
            {pieces.map((piece) => (
              <div key={piece.key}>{piece.node}</div>
            ))}
          </div>
        ) : (
          <div className="relative ml-5 mr-[132px] mt-5" style={{ height: deskH }}>
            {placed.map((piece) => (
              <div key={piece.key} className="absolute" style={piece.at}>
                {piece.node}
              </div>
            ))}

            {/* The desk is full. Saying so beats a doodle that silently is not
                there — she opens the app and finds everything still in it. */}
            {hidden > 0 && (
              <div className="pointer-events-none absolute bottom-0 right-0 bg-card px-2 py-1 font-chrome text-[8px] tracking-tight text-ink-faint">
                +{hidden} MORE — DESK IS FULL
              </div>
            )}
          </div>
        )}

        {/* ── the pet ──
             Fixed to the viewport rather than placed in the flow, so it walks
             along the bottom edge instead of shoving the furniture around. */}
        <Pet />

      </div>

      {/* ── signature ──
           Pinned to the bottom-left corner of the screen rather than sitting at
           the end of the desk, so it reads as something engraved on the machine
           instead of the last item in a list. Below the pet, which walks over
           it, and well below the windows. */}
      <div className="pointer-events-none fixed bottom-0 left-0 z-20 select-none px-5 pb-5 sm:px-7 sm:pb-6">
        <div className="font-serif text-[13px] italic leading-tight text-ink/25">
          for {CONFIG.name}, from {CONFIG.from}
        </div>
        <div className="mt-0.5 font-mono text-[9px] tracking-[0.2em] text-ink/20">
          15 · 09 · 2026
        </div>
      </div>

      {/* ── windows ──
           Their own layer, pinned to the viewport under the menu bar, rather
           than children of the desk: the desk scrolls and clips its overflow,
           so a window living inside it got cut off at the left edge instead of
           moving there, and one dragged low stretched the desk's scroll height.
           The layer ignores the pointer; each window takes it back. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 top-7 z-40">
        <AnimatePresence>
          {wins.map((w) => {
            const app = APP_BY_ID[w.id]
            return (
              <Window
                key={w.id}
                app={app}
                win={w}
                isMobile={isMobile}
                viewport={viewport}
                focused={frontId === w.id}
                onFocus={() => focus(w.id)}
                onClose={() => close(w.id)}
                onMove={(x, y) => move(w.id, x, y)}
              >
                <app.Body />
              </Window>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
