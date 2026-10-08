import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { flushSync } from "react-dom"
import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion"
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
import { useQuizLocked } from "../lib/quizLock"
import { daysUntilBirthday } from "../lib/time"
import {
  DESK_KEY, ICONS_KEY, WINDOWS_KEY, resolveIcons, useLayout,
  type Cell, type Point,
} from "../lib/layout"

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

/* Once she has moved something, her arrangement wins. The pieces she placed
   stay exactly there (pulled back inside if the screen got smaller), and
   anything new — a doodle pinned since — takes the first gap that fits, read
   top to bottom, left to right. */
const SCAN = 10

function overlaps(a: Placed["at"], as: Footprint, b: Placed["at"], bs: Footprint) {
  return a.left < b.left + bs.w + GAP && b.left < a.left + as.w + GAP
    && a.top < b.top + bs.h + GAP && b.top < a.top + as.h + GAP
}

function layoutDesk(pieces: Piece[], stored: Record<string, Point>, deskW: number, deskH: number): Placed[] {
  if (!pieces.some((p) => stored[p.key])) return packDesk(pieces, deskW, deskH)

  const at = new Map<string, Placed["at"]>()
  const taken: { at: Placed["at"]; size: Footprint }[] = []
  for (const piece of pieces) {
    const pos = stored[piece.key]
    if (!pos) continue
    const spot = {
      left: Math.round(Math.min(Math.max(0, pos.x), Math.max(0, deskW - piece.size.w))),
      top: Math.round(Math.min(Math.max(0, pos.y), Math.max(0, deskH - piece.size.h))),
    }
    at.set(piece.key, spot)
    taken.push({ at: spot, size: piece.size })
  }

  for (const piece of pieces) {
    if (at.has(piece.key)) continue
    const { w, h } = piece.size
    search: for (let top = 0; top + h <= deskH; top += SCAN) {
      for (let left = 0; left + w <= deskW; left += SCAN) {
        const spot = { left, top }
        if (taken.some((t) => overlaps(spot, piece.size, t.at, t.size))) continue
        at.set(piece.key, spot)
        taken.push({ at: spot, size: piece.size })
        break search
      }
    }
  }

  return pieces.filter((p) => at.has(p.key)).map((p) => ({ ...p, at: at.get(p.key)! }))
}

/* ── icons ──
   A grid measured off the right edge, as tall as the screen allows. When a
   column is full the next icon starts a new column to its left, so nothing
   is ever pushed off the bottom. She can drag an icon to any cell on the
   desk; dropping it on another icon swaps the two. */
const CELL = { w: 84, h: 76 }
const ICON_PAD = 12

/** Holds a drag's last offset until the drop has been committed, then lets
    go — in that order, so the thing never flashes back to where it started. */
function useDragOffset() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  /* A drag ends in a click on whatever it was dropped on. This swallows that
     one click, and clears itself straight after in case none comes. */
  const dragged = useRef(false)
  const pickUp = () => { dragged.current = true }
  /** True right after a drop, for the one click it produces. */
  const justDropped = () => dragged.current
  const settle = (moved: boolean) => {
    if (moved) {
      x.set(0)
      y.set(0)
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 40 })
      animate(y, 0, { type: "spring", stiffness: 500, damping: 40 })
    }
    setTimeout(() => { dragged.current = false })
  }
  return { x, y, pickUp, justDropped, settle }
}

type App = (typeof APPS)[number]

function IconFace({ app }: { app: App }) {
  return (
    <>
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
    </>
  )
}

function DeskIcon({ app, index, cell, bounds, onOpen, onDrop }: {
  app: App
  index: number
  cell: Cell
  bounds: RefObject<HTMLDivElement | null>
  onOpen: () => void
  /** Returns whether the icon actually changed cell. */
  onDrop: (point: Point) => boolean
}) {
  const { x, y, pickUp, justDropped, settle } = useDragOffset()
  return (
    <motion.button
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={bounds}
      onDragStart={pickUp}
      onDragEnd={(_, info) => {
        let moved = false
        flushSync(() => { moved = onDrop(info.point) })
        settle(moved)
      }}
      onClick={() => { if (!justDropped()) onOpen() }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.04 * index, duration: 0.3 }}
      whileDrag={{ scale: 1.06, zIndex: 35, cursor: "grabbing" }}
      style={{ x, y, right: ICON_PAD + cell.c * CELL.w, top: ICON_PAD + cell.r * CELL.h, width: CELL.w - 4 }}
      className="group pointer-events-auto absolute z-10 flex touch-none flex-col items-center gap-1 px-1 py-1.5 active:scale-95"
    >
      <IconFace app={app} />
    </motion.button>
  )
}

/** One card on the desk. Picked up from anywhere; a drop never counts as a click. */
function DeskPiece({ at, z, bounds, onPickUp, onDrop, children }: {
  at: Placed["at"]
  z: number
  bounds: RefObject<HTMLDivElement | null>
  onPickUp: () => void
  onDrop: (to: Point) => void
  children: ReactNode
}) {
  const { x, y, pickUp, justDropped, settle } = useDragOffset()
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={bounds}
      onDragStart={() => { pickUp(); onPickUp() }}
      onDragEnd={() => {
        const to = { x: at.left + x.get(), y: at.top + y.get() }
        flushSync(() => onDrop(to))
        settle(true)
      }}
      /* Dropping a doodle or a note ends in a click on it, which would open it. */
      onClickCapture={(e) => {
        if (justDropped()) { e.stopPropagation(); e.preventDefault() }
      }}
      whileDrag={{ scale: 1.02, zIndex: 30, cursor: "grabbing" }}
      className="absolute"
      style={{ left: at.left, top: at.top, x, y, zIndex: z }}
    >
      {children}
    </motion.div>
  )
}

/** Where the quiz window sits while it is running: above every other window. */
const QUIZ_Z = 100_000

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
  /* While the quiz runs, the quiz is the only thing on this machine. */
  const locked = useQuizLocked()
  const [iconLayout, setIconLayout] = useLayout<Cell>(ICONS_KEY)
  const [deskLayout, setDeskLayout] = useLayout<Point>(DESK_KEY)
  const [winLayout, setWinLayout] = useLayout<Point>(WINDOWS_KEY)
  /* The card she last picked up sits on top of the others. */
  const [topPiece, setTopPiece] = useState<string | null>(null)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const deskRef = useRef<HTMLDivElement>(null)

  function open(id: AppId) {
    const z = ++zRef.current
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) {
        return ws.map((w) => (w.id === id ? { ...w, z } : w))
      }
      const app = APP_BY_ID[id]
      const w = Math.min(app.size.w, window.innerWidth - 200)
      const h = Math.min(app.size.h, window.innerHeight - 110)
      /* x and y are relative to the window layer, whose origin is the top-left
         corner under the menu bar. A window comes back where she last left it,
         pulled inside if the screen has shrunk since. */
      const last = winLayout[id]
      if (last) {
        return [...ws, {
          id,
          x: Math.min(Math.max(last.x, 140 - w), window.innerWidth - 140),
          y: Math.min(Math.max(last.y, 0), window.innerHeight - 28 - 40),
          w, h, z,
        }]
      }
      /* Cascade, so a second window never lands exactly on the first. */
      const step = ws.length * 26
      return [...ws, {
        id,
        x: Math.max(28, Math.round((window.innerWidth - 130 - w) / 2) + step),
        y: Math.max(18, Math.round((window.innerHeight - 28 - h) / 2) - 10 + step),
        w, h, z,
      }]
    })
  }

  /* Locked at boot means she reloaded mid-quiz: put her straight back in it. */
  useEffect(() => {
    if (locked) open("quiz")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked])

  const close = (id: AppId) => setWins((ws) => ws.filter((w) => w.id !== id))
  const move = (id: AppId, x: number, y: number) => {
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)))
    setWinLayout((m) => ({ ...m, [id]: { x: Math.round(x), y: Math.round(y) } }))
  }
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

  /* Icons first, because the desk gets whatever width they leave. */
  const rows = Math.max(1, Math.floor((viewport.h - 28 - ICON_PAD * 2) / CELL.h))
  const cols = Math.max(1, Math.floor((viewport.w - ICON_PAD * 2) / CELL.w))
  const ids = APPS.map((a) => a.id)
  const cells = resolveIcons(ids, iconLayout, rows, cols)
  /* The columns the icons need when left alone. An icon she drags out onto
     the desk floats above the cards rather than shoving them around. */
  const iconCols = Math.ceil(APPS.length / rows)
  const iconsW = ICON_PAD + iconCols * CELL.w + 16

  function dropIcon(id: string, point: Point) {
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (!rect) return false
    const c = Math.min(cols - 1, Math.max(0, Math.floor((rect.right - ICON_PAD - point.x) / CELL.w)))
    const r = Math.min(rows - 1, Math.max(0, Math.floor((point.y - rect.top - ICON_PAD) / CELL.h)))
    const from = cells[id]
    if (from.c === c && from.r === r) return false
    const other = ids.find((k) => k !== id && cells[k].c === c && cells[k].r === r)
    setIconLayout(() => ({ ...cells, [id]: { c, r }, ...(other ? { [other]: from } : {}) }))
    return true
  }

  /* The desk is exactly what is on screen: the window, less the menu bar, the
     icon columns, and a margin for the signature in the corner. */
  const deskW = Math.max(280, viewport.w - 20 - iconsW)
  const deskH = Math.max(240, viewport.h - 28 - 24 - 56)
  const placed = isMobile ? [] : layoutDesk(pieces, deskLayout, deskW, deskH)
  const hidden = isMobile ? 0 : pieces.length - placed.length

  /* Moving one card pins the whole arrangement as it stands, so nothing else
     on the desk jumps to fill the gap she just made. */
  function dropPiece(key: string, to: Point) {
    setDeskLayout(() => {
      const next: Record<string, Point> = {}
      for (const p of placed) next[p.key] = { x: p.at.left, y: p.at.top }
      next[key] = { x: Math.round(to.x), y: Math.round(to.y) }
      return next
    })
  }

  const daysLeft = daysUntilBirthday(now)
  const frontId = wins.length
    ? wins.reduce((a, b) => (b.z >= a.z ? b : a)).id
    : null

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0" inert={locked}>
        <MenuBar now={now} daysLeft={daysLeft} />
      </div>
      {locked && <div className="pointer-events-none fixed inset-x-0 top-0 z-[250] h-7 bg-ink/35" />}

      <div
        ref={surfaceRef}
        inert={locked}
        className={`paper-bg grain relative min-h-0 flex-1 overflow-x-hidden ${
          isMobile ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {/* ── icons: a draggable grid off the right edge, a plain grid on phones ── */}
        {isMobile ? (
          <div className="grid grid-cols-4 content-start gap-x-1 gap-y-3 p-4 pt-6">
            {APPS.map((app, i) => (
              <motion.button
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.3 }}
                onClick={() => { clearEdit(); open(app.id) }}
                className="group flex flex-col items-center gap-1 px-1 py-1.5 active:scale-95"
              >
                <IconFace app={app} />
              </motion.button>
            ))}
          </div>
        ) : (
          APPS.map((app, i) => (
            <DeskIcon
              key={app.id}
              app={app}
              index={i}
              cell={cells[app.id]}
              bounds={surfaceRef}
              onOpen={() => { clearEdit(); open(app.id) }}
              onDrop={(point) => dropIcon(app.id, point)}
            />
          ))
        )}

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
          <div ref={deskRef} className="relative ml-5 mt-5" style={{ height: deskH, width: deskW }}>
            {placed.map((piece) => (
              <DeskPiece
                key={piece.key}
                at={piece.at}
                z={topPiece === piece.key ? 2 : 1}
                bounds={deskRef}
                onPickUp={() => setTopPiece(piece.key)}
                onDrop={(to) => dropPiece(piece.key, to)}
              >
                {piece.node}
              </DeskPiece>
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
        {/* The rest of the machine, dimmed and switched off, under the quiz. */}
        <AnimatePresence>
          {locked && (
            <motion.div
              key="quiz-dim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto absolute inset-0 bg-ink/35"
              style={{ zIndex: 40 + QUIZ_Z - 1 }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {wins.map((w) => {
            const app = APP_BY_ID[w.id]
            return (
              <Window
                key={w.id}
                app={app}
                win={locked && w.id === "quiz" ? { ...w, z: QUIZ_Z } : w}
                locked={locked && w.id === "quiz"}
                inert={locked && w.id !== "quiz"}
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
