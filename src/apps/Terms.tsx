import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CLAUSES, SIGNED, SIGNING, TERMS } from "../content/terms"
import { CONFIG } from "../content/config"
import { load, save } from "../lib/store"

/* ═══════════════════════════════════════════════════════════
   Friendship Terms & Conditions.

   A licence agreement she has to scroll through, with two buttons at
   the bottom. Accept works. Decline cannot be pressed: it moves out
   from under the pointer, and under a finger it moves on touch-down,
   before the tap can land. After enough attempts it stops running and
   becomes a second Accept, so every road ends at the signing sheet.

   Once signed, the window opens on the signed copy from then on.
   ═══════════════════════════════════════════════════════════ */

const KEY = "khinsaos.terms.v1"

interface Signed { at: number }

export function Terms() {
  const [signed, setSigned] = useState<Signed | null>(() => load<Signed | null>(KEY, null))
  const [reading, setReading] = useState(signed === null)
  const [signing, setSigning] = useState(false)

  if (signed && !reading) {
    return <Certificate at={signed.at} onAgain={() => setReading(true)} />
  }

  return (
    <div className="relative h-full">
      <Agreement
        alreadySigned={signed !== null}
        onAccept={() => (signed ? setReading(false) : setSigning(true))}
      />
      <AnimatePresence>
        {signing && (
          <SigningSheet
            onDone={() => {
              const s = { at: Date.now() }
              save(KEY, s)
              setSigned(s)
              setSigning(false)
              setReading(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── the document ──────────────────────────────────────────── */

function Agreement({ alreadySigned, onAccept }: { alreadySigned: boolean; onAccept: () => void }) {
  const [pct, setPct] = useState(0)
  const [nag, setNag] = useState(false)
  const scroller = useRef<HTMLDivElement>(null)

  function onScroll() {
    const el = scroller.current
    if (!el) return
    const room = el.scrollHeight - el.clientHeight
    /* The furthest she has got, not where she is now — scrolling back up
       does not un-read anything. */
    setPct((p) => Math.max(p, room <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / room) * 100))))
  }
  useEffect(onScroll, [])

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="shrink-0 border-b border-ink bg-card px-5 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-chrome text-[9px] tracking-tight text-ink">{TERMS.progress(pct)}</span>
          <span className="font-mono text-[10px] text-ink-faint">{CLAUSES.length} clauses</span>
        </div>
        <div className="edge-in mt-1.5 h-2.5 bg-shade p-[2px]">
          <div className="pinstripe h-full" style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
      </div>

      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto max-w-xl px-5 py-6 sm:px-8">
          <div className="text-center">
            <div className="text-xl leading-none text-ink">§</div>
            <h1 className="mt-2 font-serif text-[28px] leading-tight text-ink">{TERMS.title}</h1>
            <div className="mt-2 font-mono text-[10px] leading-relaxed text-ink-faint">{TERMS.version}</div>
          </div>

          <p className="mt-6 font-serif text-[15px] italic leading-relaxed text-ink-soft">{TERMS.preamble}</p>

          <ol className="mt-6 space-y-6">
            {CLAUSES.map((c, n) => (
              <li key={c.title}>
                <h2 className="font-chrome text-[10px] tracking-tight text-ink">
                  <span className="text-red">{n + 1}.</span> {c.title.toUpperCase()}
                </h2>
                {c.body.map((para, k) => (
                  <p key={k} className="mt-2 flex gap-3 font-serif text-[15px] leading-relaxed text-ink">
                    <span className="w-7 shrink-0 pt-[3px] text-right font-mono text-[10px] text-ink-faint">
                      {n + 1}.{k + 1}
                    </span>
                    <span>{para}</span>
                  </p>
                ))}
              </li>
            ))}
          </ol>

          <div className="mt-8 border-t border-ink pt-5">
            <button
              type="button"
              role="checkbox"
              aria-checked="true"
              onClick={() => setNag(true)}
              className="flex items-center gap-3 text-left"
            >
              <span className="edge-in grid h-4 w-4 shrink-0 place-items-center bg-card text-[11px] leading-none text-ink">
                ✓
              </span>
              <span className="font-serif text-[15px] text-ink">{TERMS.checkbox}</span>
            </button>
            <div className="mt-1 h-4 pl-7 font-mono text-[10px] text-red">{nag && TERMS.checkboxLocked}</div>

            <Buttons alreadySigned={alreadySigned} onAccept={onAccept} />
            <p className="mt-2 font-serif text-[13px] italic text-ink-faint">{TERMS.footnote}</p>
          </div>
        </article>
      </div>
    </div>
  )
}

/* ── accept, and the button that runs ──────────────────────── */

const BTN =
  "edge whitespace-nowrap px-5 py-2 font-chrome text-[10px] tracking-tight active:translate-x-px active:translate-y-px"

function Buttons({ alreadySigned, onAccept }: { alreadySigned: boolean; onAccept: () => void }) {
  const arena = useRef<HTMLDivElement>(null)
  const runner = useRef<HTMLButtonElement>(null)
  const [dodges, setDodges] = useState(0)
  /* Starts beside Accept, like a real pair of buttons. */
  const [pos, setPos] = useState({ x: 124, y: 0 })

  /* Out of places to run: from here on it is just another Accept. */
  const caught = dodges >= TERMS.dodges.length

  /* One tap is a touch-down and then a click; one attempt, one dodge. */
  const lastDodge = useRef(0)

  function dodge() {
    const a = arena.current
    const b = runner.current
    if (!a || !b) return
    if (Date.now() - lastDodge.current < 450) return
    lastDodge.current = Date.now()
    const maxX = Math.max(0, a.clientWidth - b.offsetWidth)
    const maxY = Math.max(0, a.clientHeight - b.offsetHeight)
    /* Far enough from where it is now that it visibly leaves, rather than
       twitching a few pixels and staying under the pointer. */
    let next = pos
    for (let tries = 0; tries < 12; tries++) {
      /* Never back onto the top row, where it would sit on Accept. */
      next = { x: Math.random() * maxX, y: 44 + Math.random() * Math.max(0, maxY - 44) }
      if (Math.hypot(next.x - pos.x, next.y - pos.y) > Math.min(maxX, 140)) break
    }
    setPos(next)
    setDodges((d) => d + 1)
  }

  return (
    <div ref={arena} className="relative mt-3 h-36">
      <button onClick={onAccept} className={`${BTN} absolute left-0 top-0 bg-ink text-card hover:bg-red`}>
        {alreadySigned ? "ALREADY SIGNED ✓" : TERMS.accept}
      </button>

      <motion.button
        ref={runner}
        animate={pos}
        transition={{ type: "spring", stiffness: 620, damping: 30 }}
        /* Hover on a mouse; touch-down on a phone, which fires before the
           click a tap would produce. Focus and Enter land on onClick. */
        onPointerEnter={(e) => { if (!caught && e.pointerType === "mouse") dodge() }}
        onPointerDown={(e) => { if (!caught) { e.preventDefault(); dodge() } }}
        onClick={() => {
          /* The click that follows the final dodge's touch-down is not consent. */
          if (!caught) dodge()
          else if (Date.now() - lastDodge.current > 450) onAccept()
        }}
        initial={false}
        className={`${BTN} absolute left-0 top-0 ${
          caught ? "bg-ink text-card hover:bg-red" : "bg-card text-ink"
        }`}
      >
        {caught ? TERMS.accept : dodges === 0 ? TERMS.decline : TERMS.dodges[dodges - 1].toUpperCase()}
      </motion.button>
    </div>
  )
}

/* ── signing ───────────────────────────────────────────────── */

function SigningSheet({ onDone }: { onDone: () => void }) {
  /* How many letters of her name have been written. null: not started. */
  const [written, setWritten] = useState<number | null>(null)
  const name = CONFIG.name
  const finished = written !== null && written >= name.length
  /* onDone is an inline arrow from the parent; the timers must not restart with it. */
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    if (written === null) return
    const t = finished
      ? setTimeout(() => doneRef.current(), 1700)
      : setTimeout(() => setWritten((w) => (w ?? 0) + 1), 130)
    return () => clearTimeout(t)
  }, [written, finished])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 grid place-items-center bg-ink/25 p-5"
    >
      <motion.div
        initial={{ scale: 0.94, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="edge-lg relative w-full max-w-sm bg-card p-6"
      >
        <div className="font-chrome text-[10px] tracking-tight text-ink">{SIGNING.heading}</div>
        <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink-soft">{SIGNING.body}</p>

        <button
          onClick={() => setWritten((w) => w ?? 0)}
          disabled={written !== null}
          aria-label={SIGNING.tap}
          className="mt-6 block w-full text-left"
        >
          <div className="flex h-12 items-end border-b border-ink px-1">
            <span className="mr-2 pb-1 font-serif text-lg text-ink-faint">✕</span>
            <span className="font-serif text-[34px] italic leading-none text-blue">
              {written === null ? "" : name.slice(0, written)}
            </span>
            {written === null && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="pb-2 font-chrome text-[9px] tracking-tight text-red"
              >
                {SIGNING.tap}
              </motion.span>
            )}
          </div>
          <div className="mt-1 font-chrome text-[8px] tracking-tight text-ink-faint">{SIGNING.party}</div>
        </button>

        {finished && <AcceptedStamp className="absolute right-5 top-5" />}
      </motion.div>
    </motion.div>
  )
}

function AcceptedStamp({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ scale: 2.4, opacity: 0, rotate: 20 }}
      animate={{ scale: 1, opacity: 1, rotate: 9 }}
      transition={{ type: "spring", stiffness: 520, damping: 22 }}
      className={`pointer-events-none border-[3px] border-olive px-3 py-1 font-chrome text-[15px] tracking-tight text-olive ${className}`}
    >
      {SIGNING.stamp}
    </motion.div>
  )
}

/* ── the signed copy ───────────────────────────────────────── */

function Certificate({ at, onAgain }: { at: number; onAgain: () => void }) {
  const date = new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  return (
    <div className="min-h-full bg-paper p-5 sm:p-7">
      <div className="edge-lg relative bg-card p-6">
        <div className="absolute right-5 top-5 rotate-[9deg] border-[3px] border-olive px-3 py-1 font-chrome text-[15px] tracking-tight text-olive">
          {SIGNING.stamp}
        </div>

        <div className="font-chrome text-[10px] tracking-tight text-ink-faint">{SIGNED.heading}</div>
        <h1 className="mt-3 max-w-[70%] font-serif text-[26px] leading-tight text-ink">{TERMS.title}</h1>
        <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-faint">{SIGNED.line(date)}</p>

        {SIGNED.body.map((p) => (
          <p key={p} className="mt-4 font-serif text-[16px] leading-relaxed text-ink">{p}</p>
        ))}

        <div className="mt-8 grid grid-cols-2 gap-6">
          {[[CONFIG.name, SIGNING.party], [CONFIG.from, SIGNED.counter.toUpperCase()]].map(([who, role]) => (
            <div key={role}>
              <div className="border-b border-ink px-1 font-serif text-[28px] italic leading-tight text-blue">{who}</div>
              <div className="mt-1 font-chrome text-[8px] tracking-tight text-ink-faint">{role}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onAgain}
        className="edge mt-5 bg-card px-4 py-2 font-chrome text-[10px] tracking-tight text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
      >
        {SIGNED.again}
      </button>
    </div>
  )
}
