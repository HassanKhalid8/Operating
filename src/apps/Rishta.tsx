import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion"
import {
  CRITERIA, CRITERION_BY_ID, ROSTER, ADMIRER, LAST_RESORT, REGRET, INSTAGRAM,
  type Candidate,
} from "../content/rishta"
import { Portrait } from "./Portrait"

type Stage = "intro" | "searching" | "swipe" | "admirer" | "final" | "matched"

export function Rishta() {
  const [stage, setStage] = useState<Stage>("intro")
  const [i, setI] = useState(0)
  const [alert, setAlert] = useState<{ title: string; body: string } | null>(null)

  function nextCandidate() {
    if (i + 1 >= ROSTER.length) { setStage("admirer"); return }
    setI((n) => n + 1)
  }

  return (
    <div className="relative flex min-h-full flex-col bg-paper">
      {stage === "intro" && <Intro onStart={() => setStage("searching")} />}

      {stage === "searching" && (
        <Searching label="Searching all known men…" onDone={() => setStage("swipe")} />
      )}

      {stage === "swipe" && (
        <Swiper
          candidate={ROSTER[i]}
          index={i}
          total={ROSTER.length}
          onReject={nextCandidate}
          onLike={(c) => {
            const fail = CRITERION_BY_ID[c.fatal]
            setAlert({
              title: "MATCH BLOCKED",
              body: `${c.name} fails one requirement — “${fail?.label ?? c.fatal}”.\n\n${c.verdict}\n\nThe match has been blocked for your own good.`,
            })
          }}
        />
      )}

      {stage === "admirer" && <Admirer onYes={() => setStage("final")} />}
      {stage === "final" && <Final onMatch={() => setStage("matched")} />}
      {stage === "matched" && <Matched />}

      <AnimatePresence>
        {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      </AnimatePresence>
    </div>
  )
}

/* ── her criteria, on file ─────────────────────────────────── */

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="p-5 sm:p-7">
      <div className="font-chrome text-[11px] tracking-tight text-ink">RISHTA FINDER 1.0</div>
      <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">
        Your search criteria are on file. All {CRITERIA.length} of them.
      </p>

      <ol className="mt-5 grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
        {CRITERIA.map((c, n) => (
          <li key={c.id} className="flex items-baseline gap-2 border-b border-ink/10 py-1.5">
            <span className="w-5 shrink-0 text-right font-mono text-[10px] text-ink-faint">
              {String(n + 1).padStart(2, "0")}
            </span>
            <span className="shrink-0 text-[11px] text-olive">✓</span>
            <span className="font-serif text-[14px] leading-snug text-ink">{c.label}</span>
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-col items-start gap-3">
        <button
          onClick={onStart}
          className="edge bg-card px-5 py-2 font-chrome text-[10px] tracking-tight text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
        >
          BEGIN SEARCH
        </button>
        <p className="font-serif text-[13px] italic text-ink-faint">
          This may take a while. There are a lot of men and very few of them are lamba.
        </p>
      </div>
    </div>
  )
}

/* ── the scan ──────────────────────────────────────────────── */

function Searching({ label, onDone }: { label: string; onDone: () => void }) {
  const [n, setN] = useState(0)
  /* onDone is an inline arrow from the parent, so it changes identity on every
     render. The counter re-renders 16x a second — depending on it directly would
     tear down and restart the timer before it ever fired. */
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const tick = setInterval(() => setN((v) => v + Math.floor(Math.random() * 900_000) + 200_000), 60)
    const done = setTimeout(() => doneRef.current(), 2200)
    return () => { clearInterval(tick); clearTimeout(done) }
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        className="edge grid h-11 w-11 place-items-center bg-card text-lg text-red"
      >
        ✳
      </motion.div>
      <div className="font-chrome text-[10px] tracking-tight text-ink">{label}</div>
      <div className="font-mono text-[12px] text-ink-soft">{n.toLocaleString()} profiles scanned</div>
    </div>
  )
}

/* ── shared card chrome ────────────────────────────────────── */

function Stamp({ opacity, tone, side, children }: {
  opacity: MotionValue<number>
  tone: "red" | "olive"
  side: "left" | "right"
  children: React.ReactNode
}) {
  return (
    <motion.div
      style={{ opacity }}
      className={`pointer-events-none absolute top-16 z-10 border-[3px] px-3 py-1 font-chrome text-[13px] tracking-tight ${
        side === "right" ? "right-5 -rotate-12" : "left-5 rotate-12"
      } ${tone === "red" ? "border-red text-red" : "border-olive text-olive"}`}
    >
      {children}
    </motion.div>
  )
}

function CardHead({ c }: { c: Candidate }) {
  const pct = Math.round((c.meets.length / CRITERIA.length) * 100)
  return (
    <div className="flex gap-4 border-b border-ink/15 p-4">
      <div className="edge-in shrink-0 bg-paper p-1">
        <Portrait seed={c.seed} src={c.photo} bald={c.bald} size={92} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-serif text-2xl leading-tight text-ink">{c.name}, {c.age}</div>
        <div className="font-mono text-[11px] text-ink-faint">{c.city}</div>
        <div className="mt-3 font-chrome text-[9px] tracking-tight text-ink-soft">
          COMPATIBILITY {pct}%
        </div>
        <div className="edge-in mt-1 h-3 bg-shade p-[2px]">
          <div className="pinstripe h-full" style={{ width: `${Math.max(pct, 4)}%` }} />
        </div>
        <div className="mt-1 font-mono text-[10px] text-ink-faint">
          meets {c.meets.length} of {CRITERIA.length}
        </div>
      </div>
    </div>
  )
}

/* ── one candidate ─────────────────────────────────────────── */

/* Its own component, keyed by name from the parent, so every card gets a fresh
   motion value. Sharing one across cards left the next card wearing the tilt of
   the swipe that dismissed the last. */
function CandidateCard({
  candidate, onReject, onLike,
}: { candidate: Candidate; onReject: () => void; onLike: (c: Candidate) => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-9, 9])
  const rejectStamp = useTransform(x, [-140, -60, 0], [1, 0, 0])
  const blockStamp = useTransform(x, [0, 60, 140], [0, 0, 1])
  const fatal = CRITERION_BY_ID[candidate.fatal]

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.55}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -110) onReject()
        else if (info.offset.x > 110) onLike(candidate)
      }}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      className="edge-lg relative w-full max-w-md cursor-grab touch-pan-y bg-card active:cursor-grabbing"
    >
      <Stamp opacity={rejectStamp} tone="red" side="right">REJECTED</Stamp>
      <Stamp opacity={blockStamp} tone="olive" side="left">BLOCKED</Stamp>

      <CardHead c={candidate} />

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-4 pb-3">
        {candidate.meets.slice(0, 8).map((id) => (
          <div key={id} className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-olive">✓</span>
            <span className="truncate font-serif text-[13px] text-ink-soft">
              {CRITERION_BY_ID[id]?.label}
            </span>
          </div>
        ))}
        {candidate.meets.length > 8 && (
          <div className="col-span-2 pt-1 font-mono text-[10px] text-ink-faint">
            + {candidate.meets.length - 8} more
          </div>
        )}
      </div>

      <div className="border-t border-ink/15 bg-paper p-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] text-red">✗</span>
          <span className="font-serif text-[14px] font-medium text-red">
            {fatal?.label ?? candidate.fatal}
          </span>
        </div>
        <p className="mt-1.5 font-serif text-[13.5px] leading-relaxed text-ink-soft">
          {candidate.verdict}
        </p>
      </div>
    </motion.div>
  )
}

function Swiper({
  candidate, index, total, onReject, onLike,
}: {
  candidate: Candidate
  index: number
  total: number
  onReject: () => void
  onLike: (c: Candidate) => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6">
      <div className="mb-3 w-full max-w-md font-mono text-[10px] tracking-wide text-ink-faint">
        CANDIDATE {index + 1} OF {total}
      </div>

      <AnimatePresence mode="wait">
        <CandidateCard
          key={candidate.name}
          candidate={candidate}
          onReject={onReject}
          onLike={onLike}
        />
      </AnimatePresence>

      <div className="mt-5 flex items-center gap-5">
        <button
          onClick={onReject}
          aria-label="Reject"
          className="edge grid h-12 w-12 place-items-center bg-card text-lg text-red hover:bg-red hover:text-card active:translate-x-px active:translate-y-px"
        >
          ✕
        </button>
        <span className="font-mono text-[10px] text-ink-faint">swipe or tap</span>
        <button
          onClick={() => onLike(candidate)}
          aria-label="Like"
          className="edge grid h-12 w-12 place-items-center bg-card text-lg text-olive hover:bg-olive hover:text-card active:translate-x-px active:translate-y-px"
        >
          ♡
        </button>
      </div>
    </div>
  )
}

/* ── classic alert dialog ──────────────────────────────────── */

function Alert({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
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
        className="edge-lg w-full max-w-sm bg-card p-5"
      >
        <div className="flex gap-4">
          <div className="edge grid h-10 w-10 shrink-0 place-items-center bg-paper text-lg text-red">!</div>
          <div className="min-w-0">
            <div className="font-chrome text-[10px] tracking-tight text-ink">{title}</div>
            <p className="mt-2 whitespace-pre-line font-serif text-[14px] leading-relaxed text-ink-soft">
              {body}
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="edge bg-card px-6 py-1.5 font-chrome text-[10px] text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── the note, once the roster runs out ────────────────────── */

function Admirer({ onYes }: { onYes: () => void }) {
  const [nos, setNos] = useState(-1)

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="edge-lg w-full max-w-md bg-card p-7 text-center"
      >
        <div className="font-chrome text-[9px] tracking-tight text-ink-faint">{ADMIRER.heading}</div>

        <div className="mt-4 font-serif text-[21px] leading-snug text-ink">
          {ADMIRER.body.map((line, n) => (
            <div key={n} className={n === 1 ? "text-red" : undefined}>{line}</div>
          ))}
        </div>

        <div className="mx-auto my-5 h-px w-16 bg-ink/20" />

        <p className="font-serif text-[14.5px] leading-relaxed text-ink-soft">{ADMIRER.detail}</p>
        <p className="mt-4 font-serif text-[15px] text-ink">{ADMIRER.question}</p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onYes}
            className="edge bg-card px-5 py-2 font-chrome text-[10px] text-ink hover:bg-olive hover:text-card active:translate-x-px active:translate-y-px"
          >
            {ADMIRER.yes.toUpperCase()}
          </button>
          <button
            onClick={() => setNos((n) => Math.min(n + 1, ADMIRER.noReplies.length - 1))}
            className="edge bg-card px-5 py-2 font-chrome text-[10px] text-ink-faint hover:bg-shade active:translate-x-px active:translate-y-px"
          >
            {ADMIRER.no.toUpperCase()}
          </button>
        </div>

        {nos >= 0 && (
          <p className="mt-4 font-serif text-[13px] italic text-red">{ADMIRER.noReplies[nos]}</p>
        )}
      </motion.div>
    </div>
  )
}

/* ── his card: right only ──────────────────────────────────── */

function Final({ onMatch }: { onMatch: () => void }) {
  const c = LAST_RESORT
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-9, 9])
  const regretStamp = useTransform(x, [-140, -60, 0], [1, 0, 0])
  const yesStamp = useTransform(x, [0, 60, 140], [0, 0, 1])
  const [regret, setRegret] = useState<string | null>(null)

  /* Left is a dead end by design: the card springs back and says so. */
  function refuse() {
    setRegret(REGRET[Math.floor(Math.random() * REGRET.length)])
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-5 sm:p-7">
      <div className="mb-3 w-full max-w-md text-center font-mono text-[10px] tracking-wide text-ink-faint">
        1 PROFILE REMAINING IN DATABASE
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.55}
        style={{ x, rotate }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 110) onMatch()
          else if (info.offset.x < -110) refuse()
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="edge-lg relative w-full max-w-md cursor-grab touch-pan-y bg-card active:cursor-grabbing"
      >
        <Stamp opacity={regretStamp} tone="red" side="right">THINK AGAIN</Stamp>
        <Stamp opacity={yesStamp} tone="olive" side="left">YES</Stamp>

        <CardHead c={c} />

        <div className="p-4 pb-3">
          {c.meets.map((id) => (
            <div key={id} className="flex items-baseline gap-1.5">
              <span className="text-[10px] text-olive">✓</span>
              <span className="font-serif text-[13.5px] text-ink-soft">{CRITERION_BY_ID[id]?.label}</span>
            </div>
          ))}
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[10px] text-red">✗</span>
            <span className="font-serif text-[13.5px] text-red">
              the other {CRITERIA.length - c.meets.length}
            </span>
          </div>
        </div>

        <div className="border-t border-ink/15 bg-paper p-4">
          <p className="font-serif text-[14px] leading-relaxed text-ink-soft">{c.verdict}</p>
        </div>
      </motion.div>

      <div className="mt-5 flex items-center gap-5">
        <button
          onClick={refuse}
          aria-label="Reject"
          className="edge grid h-12 w-12 place-items-center bg-card text-lg text-red hover:bg-red hover:text-card active:translate-x-px active:translate-y-px"
        >
          ✕
        </button>
        <span className="font-mono text-[10px] text-ink-faint">swipe right</span>
        <button
          onClick={onMatch}
          aria-label="Accept"
          className="edge grid h-12 w-12 place-items-center bg-card text-lg text-olive hover:bg-olive hover:text-card active:translate-x-px active:translate-y-px"
        >
          ♡
        </button>
      </div>

      {regret && (
        <motion.p
          key={regret}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 font-serif text-[14px] italic text-red"
        >
          {regret}
        </motion.p>
      )}
    </div>
  )
}

/* ── the payoff ────────────────────────────────────────────── */

function Matched() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="edge-lg w-full max-w-md bg-card p-8 text-center"
      >
        <div className="font-chrome text-[10px] tracking-tight text-red">{INSTAGRAM.heading}</div>

        <p className="mt-5 font-serif text-[16px] leading-relaxed text-ink">{INSTAGRAM.body}</p>

        <a
          href={INSTAGRAM.url}
          target="_blank"
          rel="noopener noreferrer"
          className="edge mt-7 inline-block bg-paper px-6 py-3 font-serif text-[17px] text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
        >
          {INSTAGRAM.handle}
        </a>

        <div className="mt-2 font-chrome text-[8px] tracking-tight text-ink-faint">
          {INSTAGRAM.cta.toUpperCase()}
        </div>

        <div className="mx-auto my-6 h-px w-16 bg-ink/20" />

        <p className="font-serif text-[14px] italic text-ink-soft">{INSTAGRAM.footer}</p>
      </motion.div>
    </div>
  )
}
