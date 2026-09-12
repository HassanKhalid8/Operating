import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { CONFIG } from "../content/config"
import { AWAY, BORED, GREET, NEEDY, PETTED, SAD, SPOILED } from "../content/pet"
import { load, save } from "../lib/store"
import { useNow } from "../lib/hooks"

/* ═══════════════════════════════════════════════════════════
   The desk pet.

   A small machine with a face, named after you, that wanders along the
   bottom of the desk and sulks if it is left alone. Mood is derived from
   how long ago it was last petted rather than kept in state, so there is
   no timer to drift and no way for the face to disagree with the line in
   the bubble. The last pet is written to localStorage, which means it
   also knows she closed the tab and went to sleep.
   ═══════════════════════════════════════════════════════════ */

const KEY = "khinsaos.pet.v1"

/** Since the last pet. Tuned for someone poking around for ten minutes. */
const BORED_AT = 30_000
const NEEDY_AT = 80_000
const SAD_AT = 165_000
/** Longer than this between visits and it makes a thing of it. */
const AWAY_AT = 10 * 3_600_000

type Mood = "happy" | "bored" | "needy" | "sad"

interface Memory {
  lastPet: number
  pets: number
}

const pick = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)]

function moodOf(idleMs: number): Mood {
  if (idleMs > SAD_AT) return "sad"
  if (idleMs > NEEDY_AT) return "needy"
  if (idleMs > BORED_AT) return "bored"
  return "happy"
}

export function Pet() {
  const reduced = useReducedMotion()
  const now = useNow()

  const [memory, setMemory] = useState<Memory>(() => load<Memory>(KEY, { lastPet: 0, pets: 0 }))
  const [bubble, setBubble] = useState("")
  const [hearts, setHearts] = useState<number[]>([])
  /* Starts near the middle of the desk rather than at x=0, where it would
     stand on top of the signature until its first walk. */
  const [x, setX] = useState(() => Math.round(Math.max(24, Math.min(320, window.innerWidth * 0.4))))
  const [facing, setFacing] = useState(1)
  const [striding, setStriding] = useState(false)
  const bubbleTimer = useRef<number | undefined>(undefined)

  /* Never petted reads as "idle forever", which is the right answer: she has
     not touched it, and it should say so. */
  const idle = memory.lastPet === 0 ? SAD_AT + 1 : now - memory.lastPet
  const mood = moodOf(idle)

  /* Near the right edge the bubble would hang off a phone screen, so it
     switches sides. Recomputed on every tick, which is cheap and means a
     rotated phone fixes itself. */
  const flip = x + 200 > window.innerWidth - 8

  function say(line: string) {
    setBubble(line)
    window.clearTimeout(bubbleTimer.current)
    bubbleTimer.current = window.setTimeout(() => setBubble(""), 4500)
  }

  /* ── the opening line ──
     Read from a ref so this stays a mount-only greeting: it is a reaction to
     how she arrived, not to anything that happens while she is here. */
  const arrivedWith = useRef(memory.lastPet)
  useEffect(() => {
    const last = arrivedWith.current
    const first = last === 0
    const gone = !first && Date.now() - last > AWAY_AT
    if (!first && !gone) return
    const t = window.setTimeout(() => say(pick(first ? GREET : AWAY)), first ? 5200 : 2600)
    return () => window.clearTimeout(t)
  }, [])

  /* ── complaining ──
     One line each time it slips a notch, then an occasional nag once it is
     properly unhappy. Any more often and it stops being funny. */
  const spoke = useRef<Mood>("happy")
  useEffect(() => {
    if (mood === spoke.current) return
    spoke.current = mood
    if (mood === "bored") say(pick(BORED))
    if (mood === "needy") say(pick(NEEDY))
    if (mood === "sad") say(pick(SAD))
  }, [mood])

  useEffect(() => {
    if (mood !== "needy" && mood !== "sad") return
    const t = window.setInterval(() => say(pick(mood === "sad" ? SAD : NEEDY)), 45_000)
    return () => window.clearInterval(t)
  }, [mood])

  /* A sad pet stays put. That is most of what makes it read as sad — and it
     is derived rather than stored, so the legs stop on the same render the
     face falls. */
  const walking = striding && mood !== "sad" && !reduced

  /* ── wandering ── */
  useEffect(() => {
    if (reduced || mood === "sad") return
    let stop = 0
    const step = () => {
      const max = Math.max(24, window.innerWidth - 108)
      const target = Math.round(24 + Math.random() * (max - 24))
      setX((from) => {
        setFacing(target < from ? -1 : 1)
        setStriding(Math.abs(target - from) > 12)
        return target
      })
      stop = window.setTimeout(() => setStriding(false), 2400)
    }
    const t = window.setInterval(step, 7000 + Math.random() * 5000)
    return () => {
      window.clearInterval(t)
      window.clearTimeout(stop)
    }
  }, [reduced, mood])

  function petIt() {
    const next: Memory = { lastPet: Date.now(), pets: memory.pets + 1 }
    setMemory(next)
    save(KEY, next)
    spoke.current = "happy"
    say(next.pets % 10 === 0 ? pick(SPOILED) : pick(PETTED))
    const id = Date.now()
    setHearts((h) => [...h, id])
    window.setTimeout(() => setHearts((h) => h.filter((n) => n !== id)), 1100)
  }

  return (
    <motion.div
      /* Below the windows (z 40+) so it never covers what she opened, above
         the desk furniture so it walks in front of the widgets. */
      className="pointer-events-none fixed bottom-5 left-0 z-30 select-none"
      animate={{ x }}
      transition={{ duration: reduced ? 0 : 2.2, ease: "easeInOut" }}
    >
      <div className="pointer-events-auto relative w-[84px]">
        <AnimatePresence>
          {bubble && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className={`edge absolute bottom-[92px] w-[196px] bg-card px-3 py-2 ${
                flip ? "right-0" : "left-0"
              }`}
            >
              <p className="font-serif text-[13px] italic leading-snug text-ink">{bubble}</p>
              {/* The tail: a square rotated 45°, masked on two sides by the
                  card so it reads as one shape rather than a diamond. */}
              <span
                className={`absolute -bottom-[5px] h-[9px] w-[9px] rotate-45 border-b border-r border-ink bg-card ${
                  flip ? "right-5" : "left-5"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hearts.map((id) => (
            <motion.span
              key={id}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -46, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className="pointer-events-none absolute left-12 top-2 text-[15px] text-red"
            >
              ♥
            </motion.span>
          ))}
        </AnimatePresence>

        <button
          onClick={petIt}
          aria-label={`Pet ${CONFIG.from}`}
          className="block cursor-pointer active:translate-y-px"
        >
          <motion.div
            animate={
              reduced
                ? {}
                : mood === "sad"
                  ? { y: 0, rotate: -3 }
                  : { y: [0, -2.5, 0], rotate: 0 }
            }
            transition={
              mood === "sad"
                ? { duration: 0.4 }
                : { duration: mood === "needy" ? 0.5 : 2.4, repeat: Infinity, ease: "easeInOut" }
            }
            style={{ scaleX: facing }}
          >
            <PetFace mood={mood} walking={walking} />
          </motion.div>
        </button>

        {/* The nameplate, because it is you. */}
        <div className="mx-auto mt-1 w-fit bg-card px-1.5 font-chrome text-[8px] leading-4 tracking-tight text-ink">
          {CONFIG.from.toUpperCase()}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   The creature: a little cream machine with a screen for a face,
   drawn in the same 1px ink line as the Alarm Clock. Not an animal,
   but it blinks, so she will treat it like one.
   ═══════════════════════════════════════════════════════════ */
function PetFace({ mood, walking }: { mood: Mood; walking: boolean }) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 130)
        schedule()
      }, 2600 + Math.random() * 4200)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [])

  const shut = blink || mood === "bored"

  /* Eyes: two paths, mirrored. A closed eye is a flat line, a happy one arcs
     up, a sad one arcs down, and needy is a wide-open circle. */
  const eye = (cx: number) => {
    if (shut) {
      return <path d={`M${cx - 4} 32 h8`} />
    }
    if (mood === "sad") {
      return <path d={`M${cx - 4} 30 q4 5 8 0`} />
    }
    if (mood === "needy") {
      return (
        <>
          <circle cx={cx} cy={31.5} r="3.6" fill="var(--color-ink)" stroke="none" />
          <circle cx={cx + 1.2} cy={30.2} r="1.1" fill="var(--color-card)" stroke="none" />
        </>
      )
    }
    return <path d={`M${cx - 4} 33 q4 -5 8 0`} />
  }

  const mouth =
    mood === "sad"
      ? "M27 42 q5 -4 10 0"
      : mood === "needy"
        ? "M28 40 q4 5 8 0"
        : mood === "bored"
          ? "M28 41 h8"
          : "M27 39 q5 5 10 0"

  return (
    <svg viewBox="0 0 64 76" width="84" height="100" aria-hidden>
      <g stroke="var(--color-ink)" strokeWidth="1.6" fill="none" strokeLinecap="round">
        {/* aerial — the only part that is red, and it droops when sad */}
        <path d={mood === "sad" ? "M32 15 q0 -6 -5 -8" : "M32 15 v-8"} />
        <circle
          cx={mood === "sad" ? 27 : 32}
          cy={mood === "sad" ? 7 : 5.6}
          r="2.6"
          fill="var(--color-red)"
          strokeWidth="1.2"
        />

        {/* legs — they alternate while it is walking */}
        <g strokeWidth="2.4">
          <path d="M22 60 v7" style={walking ? { animation: "pet-step 0.42s steps(2) infinite" } : undefined} />
          <path d="M42 60 v7" style={walking ? { animation: "pet-step 0.42s steps(2) infinite reverse" } : undefined} />
        </g>

        {/* case */}
        <rect x="8" y="14" width="48" height="47" rx="9" fill="var(--color-card)" />
        {/* screen */}
        <rect x="14" y="20" width="36" height="27" rx="4" fill="var(--color-paper)" strokeWidth="1.2" />

        {/* face */}
        <g strokeWidth="1.8">
          {eye(24)}
          {eye(40)}
          <path d={mouth} strokeWidth="1.6" />
        </g>

        {/* the disk slot, and a status lamp that only lights when it is happy */}
        <path d="M21 53.5 h22" strokeWidth="2.6" stroke="var(--color-shade)" />
        <circle
          cx="15.5"
          cy="53.5"
          r="1.5"
          fill={mood === "happy" ? "var(--color-olive)" : "var(--color-shade)"}
          strokeWidth="0.9"
        />

        {mood === "happy" && (
          <g stroke="none" fill="var(--color-red)" opacity="0.35">
            <ellipse cx="15" cy="40" rx="3.4" ry="2" />
            <ellipse cx="49" cy="40" rx="3.4" ry="2" />
          </g>
        )}

        {/* one tear, and it stays put */}
        {mood === "sad" && (
          <ellipse cx="24" cy="38" rx="1.6" ry="2.4" fill="var(--color-blue)" strokeWidth="0.8" />
        )}
      </g>
    </svg>
  )
}
