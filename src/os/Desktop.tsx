import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { APPS, APP_BY_ID } from "./registry"
import { Window } from "./Window"
import { MenuBar } from "./MenuBar"
import { StickyNote } from "./StickyNote"
import { TapeDeck } from "./TapeDeck"
import { Clock } from "./widgets/Clock"
import { Weather } from "./widgets/Weather"
import { Countdown } from "./widgets/Countdown"
import { About } from "./widgets/About"
import type { Accent, AppId, WindowState } from "./types"
import { CONFIG } from "../content/config"
import { useIsMobile, useNow } from "../lib/hooks"
import { daysUntilBirthday } from "../lib/time"

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
      return [...ws, {
        id,
        x: Math.max(28, Math.round((window.innerWidth - 130 - w) / 2) + step),
        y: Math.max(46, Math.round((window.innerHeight - h) / 2) - 20 + step),
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
              onClick={() => open(app.id)}
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
             A wrap layout rather than pinned coordinates: percentage positions
             collide the moment the window narrows, and each accessory carries
             its own slight rotation so the desk still reads as things someone
             put down. The right padding keeps clear of the icon column. */}
        <div className="flex flex-wrap content-start items-start justify-center gap-5 px-4 pb-10 sm:justify-start sm:gap-7 sm:px-7 sm:pb-14 sm:pt-7 sm:pr-[128px]">
          <StickyNote />
          <Clock />
          <Weather />
          <TapeDeck onOpen={() => open("music")} />
          <Countdown />
          <About />
        </div>

        {/* ── windows ── */}
        <AnimatePresence>
          {wins.map((w) => {
            const app = APP_BY_ID[w.id]
            return (
              <Window
                key={w.id}
                app={app}
                win={w}
                isMobile={isMobile}
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

        {/* ── signature ──
             In the flow, not pinned: the desk scrolls once the widgets outgrow
             the window, and an absolute footer would ride over them. */}
        <div className="pointer-events-none select-none px-5 pb-6 pt-2 sm:px-7 sm:pb-8">
          <div className="font-serif text-[13px] italic leading-tight text-ink/25">
            for {CONFIG.name}, from {CONFIG.from}
          </div>
          <div className="mt-0.5 font-mono text-[9px] tracking-[0.2em] text-ink/20">
            15 · 09 · 2026
          </div>
        </div>
      </div>
    </div>
  )
}
