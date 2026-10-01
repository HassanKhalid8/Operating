import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CASES, COURT, RECORD, type Case } from "../content/court"
import { load, save } from "../lib/store"

/* ═══════════════════════════════════════════════════════════
   Khinsa Court.

   A docket of cases, each tried the same way: the charge is read, the
   evidence is entered, she pleads, the bench answers the plea, and the
   stamp comes down. There is no path to an acquittal and no state in
   which one could exist — the verdict is not computed, only delayed.

   What she pleaded is remembered, so the docket still shows her record
   the next time she opens the window.
   ═══════════════════════════════════════════════════════════ */

const KEY = "khinsaos.court.v1"

/** Per case, by index: which plea she entered, and whether she appealed. */
type Rulings = Record<number, { plea: number; appealed: boolean }>

type View = { at: "docket" } | { at: "case"; i: number } | { at: "record" }

const caseNo = (i: number) => `KC-${String(i + 1).padStart(3, "0")}/26`

export function Court() {
  const [rulings, setRulings] = useState<Rulings>(() => load<Rulings>(KEY, {}))
  const [view, setView] = useState<View>({ at: "docket" })

  function rule(i: number, patch: { plea: number; appealed: boolean }) {
    setRulings((r) => {
      const next = { ...r, [i]: patch }
      save(KEY, next)
      return next
    })
  }

  const heard = CASES.filter((_, i) => rulings[i]).length
  const allHeard = heard === CASES.length

  if (view.at === "case") {
    const i = view.i
    /* The next case she hasn't stood for yet, wrapping past the end. */
    const order = [...CASES.keys()]
    const pending = [...order.slice(i + 1), ...order.slice(0, i)].find((n) => !rulings[n])
    return (
      <Trial
        key={i}
        c={CASES[i]}
        no={caseNo(i)}
        ruling={rulings[i]}
        onRule={(p) => rule(i, p)}
        onNext={pending === undefined ? undefined : () => setView({ at: "case", i: pending })}
        onRecord={() => setView({ at: "record" })}
        onDocket={() => setView({ at: "docket" })}
      />
    )
  }

  if (view.at === "record") {
    return (
      <Record
        appeals={Object.values(rulings).filter((r) => r.appealed).length}
        onDocket={() => setView({ at: "docket" })}
        onAgain={() => { save(KEY, {}); setRulings({}); setView({ at: "docket" }) }}
      />
    )
  }

  return (
    <div className="min-h-full bg-paper">
      <header className="border-b border-ink bg-card px-5 py-5 text-center sm:px-7">
        <div className="text-2xl leading-none text-ink">⚖</div>
        <h1 className="mt-2 font-chrome text-[13px] tracking-tight text-ink">{COURT.name}</h1>
        <div className="mt-1 font-mono text-[10px] text-ink-faint">{COURT.division}</div>
        <div className="mt-3 font-serif text-xl italic text-ink">{COURT.versus}</div>
      </header>

      <div className="p-5 sm:p-7">
        <dl className="edge-in grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 bg-card px-4 py-3">
          {COURT.bench.map(([role, who]) => (
            <div key={role} className="contents">
              <dt className="font-chrome text-[9px] leading-5 tracking-tight text-ink-faint">
                {role.toUpperCase()}
              </dt>
              <dd className="m-0 font-serif text-[14px] leading-5 text-ink">{who}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 font-serif text-[15px] leading-relaxed text-ink-soft">{COURT.intro}</p>

        <div className="mt-6 flex items-baseline justify-between">
          <span className="font-chrome text-[10px] tracking-tight text-ink">TODAY'S DOCKET</span>
          <span className="font-mono text-[10px] text-ink-faint">
            {heard} of {CASES.length} heard
          </span>
        </div>

        <ul className="mt-2 border-t border-ink/20">
          {CASES.map((c, i) => (
            <li key={c.title} className="border-b border-ink/20">
              <button
                onClick={() => setView({ at: "case", i })}
                className="group flex w-full items-center gap-3 py-3 text-left"
              >
                <span className="w-[74px] shrink-0 font-mono text-[10px] text-ink-faint">{caseNo(i)}</span>
                <span className="min-w-0 flex-1 font-serif text-[15px] leading-snug text-ink group-hover:text-red">
                  {c.title}
                </span>
                <span
                  className={`shrink-0 border px-1.5 py-0.5 font-chrome text-[8px] tracking-tight ${
                    rulings[i] ? "border-red text-red" : "border-ink/40 text-ink-faint"
                  }`}
                >
                  {rulings[i] ? COURT.guilty : "PENDING"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {allHeard && (
          <button
            onClick={() => setView({ at: "record" })}
            className="edge mt-6 bg-ink px-5 py-2 font-chrome text-[10px] tracking-tight text-card hover:bg-red active:translate-x-px active:translate-y-px"
          >
            VIEW YOUR {RECORD.heading}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── one trial ─────────────────────────────────────────────── */

type Phase = "plead" | "deliberating" | "verdict"

function Trial({
  c, no, ruling, onRule, onNext, onRecord, onDocket,
}: {
  c: Case
  no: string
  ruling?: { plea: number; appealed: boolean }
  onRule: (r: { plea: number; appealed: boolean }) => void
  onNext?: () => void
  onRecord: () => void
  onDocket: () => void
}) {
  /* A case she has already stood for opens on its verdict — the bench does
     not hear the same matter twice. */
  const [phase, setPhase] = useState<Phase>(ruling ? "verdict" : "plead")
  const [plea, setPlea] = useState<number | null>(ruling?.plea ?? null)
  const foot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase !== "deliberating") return
    const t = setTimeout(() => setPhase("verdict"), 2600)
    return () => clearTimeout(t)
  }, [phase])

  /* Each stage adds to the bottom of the page; follow it down. */
  useEffect(() => {
    if (phase !== "plead") foot.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [phase, ruling?.appealed])

  function enter(n: number) {
    setPlea(n)
    setPhase("deliberating")
    onRule({ plea: n, appealed: false })
  }

  return (
    <div className="relative min-h-full bg-paper p-5 sm:p-7">
      <button
        onClick={onDocket}
        className="font-chrome text-[9px] tracking-tight text-ink-faint hover:text-ink"
      >
        ← {COURT.docket}
      </button>

      <div className="edge-lg relative mt-4 bg-card p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 border-b border-ink/20 pb-3">
          <span className="font-chrome text-[9px] tracking-tight text-ink-faint">CHARGE SHEET</span>
          <span className="font-mono text-[10px] text-ink-faint">{no}</span>
        </div>

        <h2 className="mt-4 font-serif text-[26px] leading-tight text-ink">{c.title}</h2>
        <p className="mt-3 font-serif text-[15px] leading-relaxed text-ink-soft">{c.charge}</p>

        <ol className="mt-5 space-y-2">
          {c.exhibits.map((text, n) => (
            <li key={n} className="flex gap-3">
              <span className="mt-0.5 h-fit shrink-0 border border-blue px-1 font-chrome text-[8px] leading-4 tracking-tight text-blue">
                EXHIBIT {String.fromCharCode(65 + n)}
              </span>
              <span className="font-serif text-[14px] leading-snug text-ink">{text}</span>
            </li>
          ))}
        </ol>

        <AnimatePresence>
          {phase === "verdict" && (
            <motion.div
              initial={{ scale: 2.4, opacity: 0, rotate: -24 }}
              animate={{ scale: 1, opacity: 1, rotate: -11 }}
              transition={{ type: "spring", stiffness: 520, damping: 22 }}
              className="pointer-events-none absolute right-4 top-12 border-[3px] border-red px-3 py-1 font-chrome text-[18px] tracking-tight text-red sm:right-6"
            >
              {COURT.guilty}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── the plea ── */}
      <div className="mt-6">
        <div className="font-chrome text-[10px] tracking-tight text-ink">{COURT.howPlead}</div>
        <div className="mt-3 flex flex-col items-start gap-2">
          {c.pleas.map((p, n) => {
            const chosen = plea === n
            return (
              <button
                key={n}
                disabled={phase !== "plead"}
                onClick={() => enter(n)}
                className={`edge px-4 py-2 text-left font-serif text-[15px] leading-snug ${
                  chosen
                    ? "bg-ink text-card"
                    : phase === "plead"
                      ? "bg-card text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
                      : "bg-card text-ink-faint"
                }`}
              >
                “{p.label}”
              </button>
            )
          })}
        </div>
      </div>

      {plea !== null && phase !== "plead" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 border-l-2 border-ink pl-4"
        >
          <div className="font-chrome text-[9px] tracking-tight text-ink-faint">THE BENCH</div>
          <p className="mt-1 font-serif text-[17px] italic leading-snug text-ink">
            {c.pleas[plea].reply}
          </p>
        </motion.div>
      )}

      {phase === "deliberating" && (
        <div className="mt-6 flex items-center gap-3">
          <motion.span
            animate={{ rotate: [0, -38, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, ease: "easeIn" }}
            className="inline-block origin-bottom-right text-lg text-ink"
          >
            ⚒
          </motion.span>
          <span className="font-mono text-[11px] text-ink-soft">{COURT.deliberating}</span>
        </div>
      )}

      {phase === "verdict" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <div className="edge-in mt-6 bg-card px-4 py-3">
            <div className="font-chrome text-[9px] tracking-tight text-red">SENTENCE</div>
            <p className="mt-1.5 font-serif text-[15px] leading-relaxed text-ink">{c.sentence}</p>
          </div>

          {ruling?.appealed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-4"
            >
              <motion.span
                initial={{ scale: 2, rotate: 18 }}
                animate={{ scale: 1, rotate: 6 }}
                transition={{ type: "spring", stiffness: 520, damping: 22 }}
                className="mt-1 shrink-0 border-2 border-red px-2 py-0.5 font-chrome text-[9px] tracking-tight text-red"
              >
                {COURT.appealRejected}
              </motion.span>
              <p className="font-serif text-[14px] italic leading-snug text-ink-soft">{c.appeal}</p>
            </motion.div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {!ruling?.appealed && (
              <button
                onClick={() => onRule({ plea: plea ?? 0, appealed: true })}
                className="edge bg-card px-4 py-2 font-chrome text-[10px] tracking-tight text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
              >
                {COURT.appealButton}
              </button>
            )}
            <button
              onClick={onNext ?? onRecord}
              className="edge bg-ink px-4 py-2 font-chrome text-[10px] tracking-tight text-card hover:bg-red active:translate-x-px active:translate-y-px"
            >
              {onNext ? `${COURT.next} →` : `${RECORD.heading} →`}
            </button>
          </div>
        </motion.div>
      )}

      <div ref={foot} className="h-2" />
    </div>
  )
}

/* ── the record ────────────────────────────────────────────── */

function Record({
  appeals, onDocket, onAgain,
}: { appeals: number; onDocket: () => void; onAgain: () => void }) {
  return (
    <div className="min-h-full bg-paper p-5 sm:p-7">
      <button
        onClick={onDocket}
        className="font-chrome text-[9px] tracking-tight text-ink-faint hover:text-ink"
      >
        ← {COURT.docket}
      </button>

      <div className="edge-lg mt-4 bg-card p-6 text-center">
        <div className="text-2xl leading-none text-ink">⚖</div>
        <div className="mt-2 font-chrome text-[12px] tracking-tight text-ink">{RECORD.heading}</div>
        <div className="mt-1 font-serif text-lg italic text-ink-soft">{COURT.versus}</div>

        <div className="mt-6 font-serif text-[64px] leading-none text-red">
          {CASES.length}/{CASES.length}
        </div>
        <p className="mt-3 font-serif text-[16px] text-ink">{RECORD.summary(CASES.length)}</p>
        <p className="mt-1 font-mono text-[11px] text-ink-faint">{RECORD.appeals(appeals)}</p>

        <ul className="mt-6 border-t border-ink/20 text-left">
          {CASES.map((c, i) => (
            <li key={c.title} className="flex items-baseline gap-3 border-b border-ink/10 py-1.5">
              <span className="w-[74px] shrink-0 font-mono text-[10px] text-ink-faint">{caseNo(i)}</span>
              <span className="min-w-0 flex-1 font-serif text-[14px] leading-snug text-ink">{c.title}</span>
              <span className="shrink-0 font-chrome text-[8px] tracking-tight text-red">{COURT.guilty}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-left font-serif text-[15px] leading-relaxed text-ink-soft">
          {RECORD.remarks}
        </p>

        <div className="mt-6 text-right">
          <div className="font-serif text-xl italic text-ink">{RECORD.signed}</div>
          <div className="font-chrome text-[8px] tracking-tight text-ink-faint">PRESIDING</div>
        </div>
      </div>

      <p className="mt-5 font-serif text-[13px] italic text-ink-faint">{RECORD.note}</p>
      <button
        onClick={onAgain}
        className="edge mt-4 bg-card px-4 py-2 font-chrome text-[10px] tracking-tight text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
      >
        {RECORD.again.toUpperCase()}
      </button>
    </div>
  )
}
