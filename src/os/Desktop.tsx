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

/* Where things sit on the desk.

   A desk is not a shelf. The five fixed accessories get hand-placed spots
   with deliberate gaps and overlaps of nothing; anything she pins later
   takes the next spot in SCATTER, which cycles downward so the tenth
   doodle lands below the fourth rather than on top of it.

   Left is a percentage so the layout breathes with the window; top is in
   pixels because the desk scrolls and a percentage of an unknown height
   means nothing. Nothing starts past 56% — the tape deck is 340px wide and
   the desk is only ~700px across at the narrowest desktop width, so that is
   where the right edge stops being safe. */
const PLACES: Record<string, { left: string; top: number }> = {
  weather:   { left: "3%",  top: 24 },
  clock:     { left: "48%", top: 44 },
  tape:      { left: "5%",  top: 322 },
  countdown: { left: "56%", top: 344 },
}

const SCATTER = [
  { left: "4%",  top: 690 },
  { left: "50%", top: 730 },
  { left: "8%",  top: 960 },
  { left: "48%", top: 1010 },
  { left: "2%",  top: 1230 },
  { left: "52%", top: 1290 },
]

/** Keeps cycling down the desk once SCATTER runs out. */
function scatterAt(i: number) {
  const base = SCATTER[i % SCATTER.length]
  return { left: base.left, top: base.top + Math.floor(i / SCATTER.length) * 880 }
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
     that are always there, then whatever she has pinned. */
  const furniture = [
    { key: "clock", node: <Clock />, at: PLACES.clock },
    { key: "weather", node: <Weather />, at: PLACES.weather },
    { key: "tape", node: <TapeDeck onOpen={() => open("music")} />, at: PLACES.tape },
    { key: "countdown", node: <Countdown />, at: PLACES.countdown },
    ...pins.map((pin, i) => ({
      key: pin.id,
      node: (
        <PinnedDoodle
          pin={pin}
          index={i}
          onOpen={() => { edit("doodle", pin.id); open("doodle") }}
        />
      ),
      at: scatterAt(i),
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
      at: scatterAt(pins.length + i),
    })),
  ]

  /* Absolutely positioned children do not give their parent any height, so the
     desk has to be told how far down its furniture reaches. */
  const deskHeight = Math.max(
    760,
    ...furniture.map((f) => f.at.top + 340),
  )

  const daysLeft = daysUntilBirthday(now)
  const frontId = wins.length
    ? wins.reduce((a, b) => (b.z >= a.z ? b : a)).id
    : null

  return (
    <div className="flex h-full flex-col">
      <MenuBar now={now} daysLeft={daysLeft} />

      <div className="paper-bg grain relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
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
             Scattered on a real screen, stacked on a phone. Absolute spots on
             a 375px-wide screen would be a pile, not a desk, so the wrap flow
             is kept for mobile — it is the one place a tidy column is right. */}
        {isMobile ? (
          <div className="flex flex-wrap content-start items-start justify-center gap-5 px-4 pb-10">
            {furniture.map((item) => (
              <div key={item.key}>{item.node}</div>
            ))}
          </div>
        ) : (
          <div
            className="relative mr-[132px] ml-5"
            style={{ minHeight: deskHeight }}
          >
            {furniture.map((item) => (
              <div key={item.key} className="absolute" style={item.at}>
                {item.node}
              </div>
            ))}
          </div>
        )}

        {/* ── the pet ──
             Fixed to the viewport rather than placed in the flow, so it walks
             along the bottom edge instead of shoving the furniture around. */}
        <Pet />

        {/* Keeps the desk from ending flush against the signature pinned
            below it, and gives the pet somewhere to stand. */}
        <div className="h-24" />
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
