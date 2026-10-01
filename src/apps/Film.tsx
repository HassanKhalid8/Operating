import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { FILM, THEATRE, TICKET } from "../content/film"
import { useMusic } from "../os/MusicProvider"

/* ═══════════════════════════════════════════════════════════
   THE PREMIERE

   The app never opens straight onto the video. First a ticket, which she
   tears; then a small cinema with its curtains shut, which part; and only
   then the film. Afterwards: THE END, watch again, full screen, or save
   it to her phone.

   The <video> is mounted from the start, underneath the ticket, so the
   tear itself can call play(). Phones only allow sound from a play() that
   happens inside a tap — calling it once there (and pausing straight
   away) is what lets the film start with sound after the curtains open.
   ═══════════════════════════════════════════════════════════ */

type Stage = "ticket" | "tearing" | "curtains" | "playing" | "ended"

/** iOS Safari only fullscreens a video through its own prefixed call. */
interface IOSVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void
}

export function Film() {
  const [stage, setStage] = useState<Stage>("ticket")
  const [paused, setPaused] = useState(true)
  const [progress, setProgress] = useState(0)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const video = useRef<HTMLVideoElement>(null)
  const music = useMusic()

  function tear() {
    const v = video.current
    if (v) {
      v.muted = false
      void v.play().then(() => { v.pause(); v.currentTime = 0 }).catch(() => {})
    }
    /* Two films at once is nobody's idea of a premiere. */
    if (music.playing) music.toggle()
    setStage("tearing")
    window.setTimeout(() => setStage("curtains"), 850)
  }

  function roll() {
    const v = video.current
    if (!v) return
    setStage("playing")
    void v.play().catch(() => setPaused(true))
  }

  function again() {
    const v = video.current
    if (!v) return
    v.currentTime = 0
    setStage("playing")
    void v.play().catch(() => setPaused(true))
  }

  function togglePlay() {
    const v = video.current
    if (!v) return
    if (stage === "ended") { again(); return }
    if (v.paused) void v.play().catch(() => {})
    else v.pause()
  }

  function seek(e: React.PointerEvent<HTMLDivElement>) {
    const v = video.current
    if (!v || !v.duration) return
    const r = e.currentTarget.getBoundingClientRect()
    v.currentTime = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1) * v.duration
    if (stage === "ended") setStage("playing")
  }

  function fullscreen() {
    const v = video.current as IOSVideo | null
    if (!v) return
    if (v.requestFullscreen) void v.requestFullscreen().catch(() => v.webkitEnterFullscreen?.())
    else v.webkitEnterFullscreen?.()
  }

  /* On a phone, the share sheet — that is where "Save Video" lives on an
     iPhone, and where Photos/Gallery live on Android. On a computer, a plain
     download. Either way, if the fancy route fails, the plain link. */
  async function save() {
    setSaveState("saving")
    try {
      const blob = await (await fetch(FILM.src)).blob()
      const file = new File([blob], FILM.filename, { type: "video/mp4" })
      const touch = window.matchMedia("(pointer: coarse)").matches
      if (touch && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: TICKET.title })
          setSaveState("saved")
        } catch {
          /* She closed the share sheet. Not an error, just a change of mind. */
          setSaveState("idle")
        }
        return
      }
      const url = URL.createObjectURL(blob)
      download(url)
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setSaveState("saved")
    } catch {
      download(FILM.src)
      setSaveState("saved")
    }
    window.setTimeout(() => setSaveState("idle"), 4000)
  }

  function download(href: string) {
    const a = document.createElement("a")
    a.href = href
    a.download = FILM.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const showing = stage === "playing" || stage === "ended"

  return (
    <div className="relative flex h-full min-h-[560px] flex-col bg-[#110f0e]">
      {/* ── the theatre ── */}
      <div className="flex items-center justify-center gap-2 border-b border-white/15 py-2">
        <Bulbs />
        <span className="font-chrome text-[10px] tracking-tight text-[#f3d98b]">{THEATRE.marquee}</span>
        <Bulbs />
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* the screen */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative aspect-[9/16] h-full max-w-full overflow-hidden border border-white/20 bg-black shadow-[0_0_60px_rgba(243,217,139,0.12)]">
            <video
              ref={video}
              src={FILM.src}
              poster={FILM.poster}
              playsInline
              preload="auto"
              onClick={togglePlay}
              onPlay={() => setPaused(false)}
              onPause={() => setPaused(true)}
              onTimeUpdate={(e) => {
                const v = e.currentTarget
                setProgress(v.duration ? v.currentTime / v.duration : 0)
              }}
              onEnded={() => setStage("ended")}
              /* contain, not cover: the screen is already 9:16 so the two look
                 the same here, but full screen on a landscape laptop stretches
                 the element to 16:9 — and cover would then crop off the top
                 and bottom, which is exactly where the subtitles are. */
              className="h-full w-full cursor-pointer bg-black object-contain"
            />

            {/* paused mid-film: a big friendly play button */}
            {stage === "playing" && paused && (
              <button
                onClick={togglePlay}
                aria-label="Play"
                className="absolute inset-0 grid place-items-center bg-black/25"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full border border-white/70 bg-black/40 pl-1 text-xl text-[#f4efe4]">
                  ▶
                </span>
              </button>
            )}

            {/* the end card */}
            <AnimatePresence>
              {stage === "ended" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 p-6 text-center"
                >
                  <div className="font-serif text-[30px] italic tracking-wide text-[#f3d98b]">{THEATRE.end}</div>
                  <p className="font-serif text-[13px] italic leading-snug text-[#f4efe4]/75">{THEATRE.endLine}</p>
                  <button
                    onClick={again}
                    className="mt-2 border border-white/60 px-4 py-1.5 font-chrome text-[9px] tracking-tight text-[#f4efe4] hover:bg-[#f4efe4] hover:text-[#110f0e]"
                  >
                    ↻ {THEATRE.again}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* the curtains — shut until the ticket is torn, then they part */}
        <Curtains open={showing} onOpened={() => { if (stage === "curtains") roll() }} parting={stage === "curtains"} />

        {/* the ticket, on top of everything until it's torn */}
        <AnimatePresence>
          {(stage === "ticket" || stage === "tearing") && (
            <motion.div
              key="lobby"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="paper-bg absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 p-5"
            >
              <Ticket torn={stage === "tearing"} onTear={tear} />
              <motion.p
                animate={{ opacity: stage === "tearing" ? 0 : 1 }}
                className="font-serif text-[13px] italic text-ink-soft"
              >
                {TICKET.hint}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── controls ── */}
      <motion.div
        animate={{ opacity: showing ? 1 : 0.25 }}
        className={`border-t border-white/15 px-4 pb-4 pt-3 ${showing ? "" : "pointer-events-none"}`}
      >
        <div
          onPointerDown={seek}
          className="group relative h-3 cursor-pointer"
          role="slider"
          aria-label="Seek"
          aria-valuenow={Math.round(progress * 100)}
        >
          <div className="absolute inset-x-0 top-1 h-1 bg-white/20" />
          <div className="absolute left-0 top-1 h-1 bg-[#f3d98b]" style={{ width: `${progress * 100}%` }} />
          <div
            className="absolute top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-[#f3d98b] opacity-0 transition-opacity group-hover:opacity-100"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Ctl onClick={togglePlay} label={paused || stage === "ended" ? "Play" : "Pause"}>
            {paused || stage === "ended" ? "▶" : "❚❚"}
          </Ctl>
          <Ctl onClick={again} label={THEATRE.again}>↻</Ctl>
          <div className="flex-1" />
          <Ctl onClick={fullscreen} label={THEATRE.fullscreen}>⛶ <span className="hidden sm:inline">{THEATRE.fullscreen}</span></Ctl>
          <Ctl onClick={() => void save()} label={THEATRE.save} disabled={saveState === "saving"}>
            ⤓ <span>{saveState === "saving" ? THEATRE.saving : saveState === "saved" ? THEATRE.saved : THEATRE.save}</span>
          </Ctl>
        </div>
      </motion.div>
    </div>
  )
}

/* ── pieces ────────────────────────────────────────────────── */

function Ctl({
  onClick, label, disabled, children,
}: { onClick: () => void; label: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="flex h-8 min-w-8 items-center justify-center gap-1.5 border border-white/40 px-2 font-chrome text-[9px] tracking-tight text-[#f4efe4] hover:bg-[#f4efe4] hover:text-[#110f0e] disabled:opacity-60"
    >
      {children}
    </button>
  )
}

/** Marquee bulbs, chasing. */
function Bulbs() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
          className="h-1.5 w-1.5 rounded-full bg-[#f3d98b]"
        />
      ))}
    </span>
  )
}

/* Velvet: folds drawn with a gradient, so there is no image to load. */
const VELVET = {
  backgroundColor: "#8e1f1a",
  backgroundImage:
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.28) 0 6px, rgba(255,255,255,0.06) 14px, rgba(0,0,0,0.22) 26px 30px)",
}

function Curtains({ open, parting, onOpened }: { open: boolean; parting: boolean; onOpened: () => void }) {
  const apart = open || parting
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* valance */}
      <div
        className="absolute inset-x-0 top-0 z-10 h-5 border-b-2 border-[#f3d98b]/60"
        style={{ ...VELVET, backgroundImage: `${VELVET.backgroundImage}, linear-gradient(rgba(0,0,0,0) 60%, rgba(0,0,0,0.35))` }}
      />
      <motion.div
        initial={false}
        animate={{ x: apart ? "-96%" : "0%" }}
        transition={{ duration: open ? 0 : 1.6, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => { if (parting) onOpened() }}
        className="absolute inset-y-0 left-0 w-1/2 shadow-[6px_0_18px_rgba(0,0,0,0.5)]"
        style={VELVET}
      />
      <motion.div
        initial={false}
        animate={{ x: apart ? "96%" : "0%" }}
        transition={{ duration: open ? 0 : 1.6, ease: [0.65, 0, 0.35, 1] }}
        className="absolute inset-y-0 right-0 w-1/2 shadow-[-6px_0_18px_rgba(0,0,0,0.5)]"
        style={VELVET}
      />
    </div>
  )
}

function Ticket({ torn, onTear }: { torn: boolean; onTear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, rotate: -3 }}
      animate={{ opacity: 1, y: 0, rotate: -2 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex w-full max-w-[380px] select-none"
      style={{ filter: "drop-shadow(4px 4px 0 var(--edge-shadow-lg))" }}
    >
      {/* the main part — she keeps this */}
      <motion.div
        animate={torn ? { x: -18, rotate: -4 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex-1 border border-r-0 border-ink bg-card p-4"
      >
        <div className="font-chrome text-[9px] tracking-tight text-red">{TICKET.admit}</div>
        <div className="mt-1 font-serif text-[22px] leading-tight text-ink">{TICKET.title}</div>
        <div className="font-serif text-[14px] italic text-ink-soft">{TICKET.starring}</div>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {TICKET.details.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-chrome text-[8px] leading-4 tracking-tight text-ink-faint">{k}</dt>
              <dd className="font-mono text-[11px] leading-4 text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </motion.div>

      {/* the perforation */}
      <div className="relative w-0 border-l-2 border-dashed border-ink/50">
        <span className="absolute -left-[9px] -top-[9px] h-4 w-4 rounded-full border border-ink bg-paper" />
        <span className="absolute -bottom-[9px] -left-[9px] h-4 w-4 rounded-full border border-ink bg-paper" />
      </div>

      {/* the stub — this is what tears off */}
      <motion.button
        onClick={onTear}
        disabled={torn}
        animate={torn ? { x: 60, y: 140, rotate: 38, opacity: 0 } : {}}
        whileHover={torn ? {} : { rotate: 4, x: 3 }}
        transition={{ duration: 0.8, ease: "easeIn" }}
        className="flex w-[92px] flex-col items-center justify-center gap-2 border border-l-0 border-ink bg-red px-2 py-4 text-[#f4efe4]"
        style={{ transformOrigin: "0% 100%" }}
      >
        <span className="font-chrome text-[8px] tracking-tight [writing-mode:vertical-rl]">{TICKET.stub}</span>
        <span className="border border-white/70 px-1.5 py-1 font-chrome text-[8px] leading-tight tracking-tight">
          {TICKET.tear}
        </span>
      </motion.button>
    </motion.div>
  )
}
