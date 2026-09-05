import { useRef } from "react"
import { motion } from "framer-motion"
import { useMusic } from "./MusicProvider"
import { clock } from "../lib/time"
import { CONFIG } from "../content/config"

/* One reel. Spins only while something is actually playing, so the desk is
   still when the room is. */
function Reel({ spinning }: { spinning: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 40 40" width="34" height="34"
      animate={spinning ? { rotate: 360 } : { rotate: 0 }}
      transition={spinning ? { duration: 2.4, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
      aria-hidden
    >
      <g fill="none" stroke="var(--color-ink)" strokeWidth="1.5">
        <circle cx="20" cy="20" r="18" fill="var(--color-paper)" />
        <circle cx="20" cy="20" r="6" fill="var(--color-card)" />
        {/* spokes */}
        <path d="M20 2 L20 14 M20 26 L20 38 M2 20 L14 20 M26 20 L38 20" />
        <path d="M7.3 7.3 L15.8 15.8 M24.2 24.2 L32.7 32.7 M32.7 7.3 L24.2 15.8 M15.8 24.2 L7.3 32.7"
              strokeWidth="1" opacity="0.5" />
      </g>
    </motion.svg>
  )
}

/** The player that lives on the desktop. Draggable, like the Note Pad, and
    pressing it anywhere but the transport opens the full Music window. */
export function TapeDeck({ onOpen }: { onOpen: () => void }) {
  const { track, index, tracks, playing, missing, currentTime, duration, toggle, next, prev } = useMusic()
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const press = useRef<{ x: number; y: number } | null>(null)

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 16, rotate: 0.8 }}
      animate={{ opacity: 1, y: 0, rotate: 0.8 }}
      transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileDrag={{ rotate: 0, scale: 1.02, cursor: "grabbing", zIndex: 30 }}
      /* A press that stays put is a click; one that travels was a drag. The
         transport buttons stop pointerdown, so `press` is null for those and
         they never open the window. */
      onPointerDown={(e) => { press.current = { x: e.clientX, y: e.clientY } }}
      onPointerUp={(e) => {
        const p = press.current
        press.current = null
        if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) onOpen()
      }}
      className="edge-lg relative w-[260px] shrink-0 cursor-grab bg-card"
    >
      <div className="pinstripe flex h-6 items-center border-b border-ink px-2">
        <span className="mx-auto bg-card px-2 font-chrome text-[9px] tracking-tight text-ink">
          TAPE DECK
        </span>
      </div>

      {/* reels, with the tape strung between them */}
      <div className="relative flex items-center justify-between px-6 pb-1 pt-4">
        <div className="absolute inset-x-10 top-[30px] h-[3px] border-y border-ink bg-shade" />
        <Reel spinning={playing} />
        <Reel spinning={playing} />
      </div>

      {/* the label stuck on the shell, in someone's handwriting */}
      <div className="mx-4 mt-3 border border-ink/30 bg-paper px-2 py-1 text-center">
        <div className="truncate font-serif text-[13px] italic leading-tight text-ink">
          {CONFIG.tapeName}
        </div>
      </div>

      <div className="px-4 pb-1 pt-3">
        <div className="truncate font-serif text-[14px] leading-tight text-ink">
          <span className="font-mono text-[10px] text-ink-faint">
            {String(index + 1).padStart(2, "0")}{" "}
          </span>
          {track.title}
        </div>
        <div className="truncate font-mono text-[10px] text-ink-faint">
          {missing ? "no tape loaded" : track.artist}
        </div>
      </div>

      {/* progress */}
      <div className="px-4">
        <div className="edge-in h-2 bg-shade p-[1px]">
          <div className="pinstripe h-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-ink-faint">
          <span>{clock(currentTime)}</span>
          <span>{duration ? clock(duration) : "--:--"}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 px-4 pb-3 pt-2">
        <DeckButton label="Previous track" onClick={prev}>◀◀</DeckButton>
        <DeckButton label={playing ? "Pause" : "Play"} onClick={toggle} wide>
          {playing ? "❚❚" : "▶"}
        </DeckButton>
        <DeckButton label="Next track" onClick={next}>▶▶</DeckButton>
      </div>

      {missing && (
        <div className="border-t border-ink/15 bg-paper px-4 py-2 font-mono text-[9px] leading-4 text-red">
          {/* The path is a note to self while building; she just gets the joke. */}
          {import.meta.env.DEV
            ? `${track.file} not found — drop the mp3 into public/music/`
            : "tape jammed. blame Hassan."}
        </div>
      )}

      <div className="border-t border-ink/15 px-4 py-1.5 text-center font-mono text-[9px] text-ink-faint">
        side a · {tracks.length} tracks
      </div>
    </motion.div>
  )
}

function DeckButton({
  children, onClick, label, wide,
}: { children: React.ReactNode; onClick: () => void; label: string; wide?: boolean }) {
  return (
    <button
      /* The deck is draggable, so a press on a control must not also start a
         drag of the whole panel. */
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onClick}
      aria-label={label}
      className={`edge grid h-8 place-items-center bg-paper font-mono text-[11px] text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px ${
        wide ? "w-14" : "w-10"
      }`}
    >
      {children}
    </button>
  )
}
