import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  INTRO, QUESTIONS, RESULT, RIGHT_LINES, VERDICTS, WRONG_LINES, type Question,
} from "../content/quiz"
import { CONFIG } from "../content/config"
import { load, save } from "../lib/store"
import { setQuizLocked } from "../lib/quizLock"

/* ═══════════════════════════════════════════════════════════
   THE QUIZ

   intro → one question at a time → the result card.

   Starting locks the machine (see lib/quizLock). Every answer is saved
   the moment she picks it, so a reload drops her back on the same
   question with the lock still on — there is no way out but through.
   Reaching the result card lifts the lock and mails the whole sheet
   to Hassan, once, retrying on a later open if the first try fails.
   ═══════════════════════════════════════════════════════════ */

type Phase = "intro" | "question" | "result"

interface Sheet {
  phase: Phase
  /** Which question is on screen. */
  at: number
  /** Her pick per question, null until answered. */
  picks: (number | null)[]
  attempt: number
  startedAt: number | null
  finishedAt: number | null
  mailed: boolean
  /** Fingerprint of the questions this sheet was answered against. If the
      questions are edited after she's taken it, an old sheet is discarded
      rather than scored against the wrong answers. */
  set: string
}

const KEY = "khinsa.quiz.sheet"
const LETTERS = ["A", "B", "C", "D", "E", "F"]

const SET = String(
  QUESTIONS.reduce((h, q) => {
    const s = q.q + q.options.join("|") + q.answer
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
    return h
  }, QUESTIONS.length),
)

function blank(attempt = 1): Sheet {
  return {
    phase: "intro", at: 0, picks: QUESTIONS.map(() => null), attempt,
    startedAt: null, finishedAt: null, mailed: false, set: SET,
  }
}

/* Checked once, when the machine boots and before anything renders, so the
   lock and the saved sheet can never disagree. A sheet from an older set of
   questions has nothing left to finish; a half-done one keeps her locked in. */
const RESTORED: Sheet = (() => {
  const s = load<Sheet | null>(KEY, null)
  if (!s || s.set !== SET || !Array.isArray(s.picks)) {
    setQuizLocked(false)
    return blank(s?.attempt ?? 1)
  }
  setQuizLocked(s.phase === "question")
  return s
})()

/** The latest saved sheet — reopening the window picks up where it was left. */
function restore(): Sheet {
  const s = load<Sheet | null>(KEY, null)
  return s && s.set === SET && Array.isArray(s.picks) ? s : RESTORED
}

const pick = <T,>(list: T[], seed: number) => list[Math.abs(seed) % list.length]

function scoreOf(picks: (number | null)[]) {
  return picks.reduce<number>((n, p, i) => n + (p === QUESTIONS[i].answer ? 1 : 0), 0)
}

function verdictFor(score: number) {
  const frac = QUESTIONS.length ? score / QUESTIONS.length : 0
  return VERDICTS.find((v) => frac >= v.min) ?? VERDICTS[VERDICTS.length - 1]
}

/* Only one mail in flight, however many times the result card mounts —
   React's dev double-mount would otherwise send two. */
let sending = false

export function Quiz() {
  const [sheet, setSheet] = useState<Sheet>(restore)
  const [mail, setMail] = useState<"idle" | "sending" | "sent" | "failed">(
    sheet.mailed ? "sent" : "idle",
  )

  function update(next: Sheet) {
    setSheet(next)
    save(KEY, next)
  }

  function start() {
    setQuizLocked(true)
    update({ ...blank(sheet.attempt), phase: "question", startedAt: Date.now() })
  }

  function answer(i: number) {
    if (sheet.picks[sheet.at] !== null) return
    const picks = [...sheet.picks]
    picks[sheet.at] = i
    update({ ...sheet, picks })
  }

  function next() {
    if (sheet.picks[sheet.at] === null) return
    if (sheet.at + 1 < QUESTIONS.length) {
      update({ ...sheet, at: sheet.at + 1 })
      return
    }
    update({ ...sheet, phase: "result", finishedAt: Date.now() })
    setQuizLocked(false)
  }

  function again() {
    setMail("idle")
    update(blank(sheet.attempt + 1))
  }

  /* Mail the sheet once the result card is up. */
  useEffect(() => {
    if (sheet.phase !== "result" || sheet.mailed || sending) return
    sending = true
    setMail("sending")
    void mailSheet(sheet).then((ok) => {
      sending = false
      setMail(ok ? "sent" : "failed")
      if (ok) {
        setSheet((s) => {
          const done = { ...s, mailed: true }
          save(KEY, done)
          return done
        })
      }
    })
  }, [sheet])

  /* Keys: A–D or 1–4 to answer, Enter to move on. */
  useEffect(() => {
    if (sheet.phase !== "question") return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const opts = QUESTIONS[sheet.at].options.length
      const k = e.key.toUpperCase()
      const byLetter = LETTERS.indexOf(k)
      const byNumber = Number(k) - 1
      if (byLetter >= 0 && byLetter < opts) answer(byLetter)
      else if (byNumber >= 0 && byNumber < opts) answer(byNumber)
      else if (e.key === "Enter") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (!QUESTIONS.length) {
    return (
      <div className="grid min-h-full place-items-center bg-paper p-8 text-center font-serif italic text-ink-soft">
        No questions yet. Add some to src/content/quiz.ts.
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col bg-paper">
      {sheet.phase === "intro" && <Intro onStart={start} attempt={sheet.attempt} />}

      {sheet.phase === "question" && (
        <AnimatePresence mode="wait">
          <Asking
            key={sheet.at}
            index={sheet.at}
            question={QUESTIONS[sheet.at]}
            picked={sheet.picks[sheet.at]}
            onPick={answer}
            onNext={next}
          />
        </AnimatePresence>
      )}

      {sheet.phase === "result" && <ResultCard sheet={sheet} mail={mail} onAgain={again} />}
    </div>
  )
}

/* ── the instruction page ──────────────────────────────────── */

function Intro({ onStart, attempt }: { onStart: () => void; attempt: number }) {
  return (
    <div className="flex flex-1 flex-col p-5 sm:p-8">
      <div className="font-chrome text-[11px] tracking-tight text-ink">
        {INTRO.heading}
        {attempt > 1 && <span className="ml-2 text-ink-faint">· ATTEMPT {attempt}</span>}
      </div>

      <div className="edge mt-5 bg-card p-5 sm:p-6">
        <div className="mb-3 font-chrome text-[9px] tracking-tight text-red">INSTRUCTIONS</div>
        {INTRO.body.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.35, duration: 0.35 }}
            className="mt-2 font-serif text-[17px] leading-relaxed text-ink first:mt-0"
          >
            {line}
          </motion.p>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 border border-dashed border-red/60 p-3">
        <span className="font-chrome text-[12px] leading-none text-red">!</span>
        <p className="font-serif text-[13px] italic leading-snug text-ink-soft">{INTRO.warning}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-7">
        <span className="font-mono text-[11px] text-ink-faint">
          {QUESTIONS.length} question{QUESTIONS.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={onStart}
          className="edge bg-card px-5 py-2 font-chrome text-[10px] tracking-tight text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
        >
          {INTRO.start}
        </button>
      </div>
    </div>
  )
}

/* ── one question ──────────────────────────────────────────── */

function Asking({
  index, question, picked, onPick, onNext,
}: {
  index: number
  question: Question
  picked: number | null
  onPick: (i: number) => void
  onNext: () => void
}) {
  const done = picked !== null
  const right = picked === question.answer
  const last = index + 1 === QUESTIONS.length

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex flex-1 flex-col p-5 sm:p-8"
    >
      {/* progress */}
      <div className="flex items-center justify-between font-chrome text-[9px] tracking-tight text-ink-soft">
        <span>QUESTION {String(index + 1).padStart(2, "0")} / {String(QUESTIONS.length).padStart(2, "0")}</span>
        <span className="text-red">NO WAY OUT</span>
      </div>
      <div className="edge-in mt-2 h-2 bg-shade">
        <motion.div
          className="h-full bg-ink"
          initial={{ width: `${(index / QUESTIONS.length) * 100}%` }}
          animate={{ width: `${((index + (done ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <h2 className="mt-6 font-serif text-[21px] leading-snug text-ink sm:text-[23px]">{question.q}</h2>

      <div className="mt-5 flex flex-col gap-2.5">
        {question.options.map((opt, i) => {
          const isAnswer = i === question.answer
          const isPick = i === picked
          /* Before answering every option is plain. After: the right one goes
             olive, her wrong pick goes red, the rest fade. */
          const tone = !done
            ? "bg-card text-ink hover:bg-ink hover:text-card"
            : isAnswer
              ? "bg-olive text-card"
              : isPick
                ? "bg-red text-card"
                : "bg-card text-ink opacity-45"
          return (
            <motion.button
              key={i}
              onClick={() => onPick(i)}
              disabled={done}
              animate={done && isPick && !right ? { x: [0, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.35 }}
              className={`edge group flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${tone} ${
                done ? "cursor-default" : "active:translate-x-px active:translate-y-px"
              }`}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center border border-current font-chrome text-[9px]">
                {done && isAnswer ? "✓" : done && isPick ? "✕" : LETTERS[i]}
              </span>
              <span className="font-serif text-[16px] leading-snug">{opt}</span>
            </motion.button>
          )
        })}
      </div>

      {/* the verdict on this one */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`mt-5 border-l-2 pl-3 ${right ? "border-olive" : "border-red"}`}
          >
            <div className={`font-chrome text-[10px] tracking-tight ${right ? "text-olive" : "text-red"}`}>
              {right ? pick(RIGHT_LINES, index) : pick(WRONG_LINES, index)}
            </div>
            {!right && (
              <p className="mt-1 font-serif text-[15px] text-ink">
                The correct answer is{" "}
                <span className="font-semibold">
                  {LETTERS[question.answer]}. {question.options[question.answer]}
                </span>
              </p>
            )}
            {question.note && (
              <p className="mt-1 font-serif text-[14px] italic text-ink-soft">{question.note}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex justify-end pt-6">
        <button
          onClick={onNext}
          disabled={!done}
          className="edge bg-card px-5 py-2 font-chrome text-[10px] tracking-tight text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px disabled:pointer-events-none disabled:opacity-30"
        >
          {last ? "SEE RESULT" : "NEXT →"}
        </button>
      </div>
    </motion.div>
  )
}

/* ── the result card ───────────────────────────────────────── */

function ResultCard({
  sheet, mail, onAgain,
}: {
  sheet: Sheet
  mail: "idle" | "sending" | "sent" | "failed"
  onAgain: () => void
}) {
  const score = scoreOf(sheet.picks)
  const verdict = verdictFor(score)
  const date = new Date(sheet.finishedAt ?? sheet.startedAt ?? 0).toLocaleDateString(undefined, {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="p-4 sm:p-7">
      <motion.div
        initial={{ opacity: 0, y: 16, rotate: -0.6 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="edge-lg relative bg-card"
      >
        {/* header */}
        <div className="pinstripe flex h-7 items-center justify-center border-b border-ink">
          <span className="bg-card px-2 font-chrome text-[10px] tracking-tight text-ink">{RESULT.heading}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-4 border-b border-ink/20 p-5">
          <div>
            <div className="font-chrome text-[8px] tracking-tight text-ink-faint">CANDIDATE</div>
            <div className="font-serif text-[22px] leading-tight text-ink">{CONFIG.name}</div>
            <div className="mt-1 font-mono text-[10px] text-ink-faint">
              {date}{sheet.attempt > 1 ? ` · attempt ${sheet.attempt}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="font-chrome text-[8px] tracking-tight text-ink-faint">SCORE</div>
            <div className="font-serif text-[44px] leading-none text-ink">
              {score}
              <span className="text-[22px] text-ink-faint">/{QUESTIONS.length}</span>
            </div>
          </div>
        </div>

        {/* the stamp */}
        <div className="flex items-center gap-4 p-5">
          <motion.div
            initial={{ scale: 1.8, opacity: 0, rotate: -14 }}
            animate={{ scale: 1, opacity: 1, rotate: -7 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 420, damping: 16 }}
            className="shrink-0 border-2 border-red px-2.5 py-1.5 font-chrome text-[11px] tracking-tight text-red"
          >
            {verdict.title}
          </motion.div>
          <p className="font-serif text-[15px] italic leading-snug text-ink-soft">{verdict.line}</p>
        </div>

        {/* the answer sheet */}
        <div className="border-t border-ink/20 px-5 pb-5 pt-4">
          <div className="mb-2 font-chrome text-[8px] tracking-tight text-ink-faint">ANSWER SHEET</div>
          <ol className="flex flex-col">
            {QUESTIONS.map((q, i) => {
              const p = sheet.picks[i]
              const ok = p === q.answer
              return (
                <li key={i} className="flex gap-3 border-b border-ink/10 py-2 last:border-b-0">
                  <span className="w-5 shrink-0 pt-0.5 text-right font-mono text-[10px] text-ink-faint">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`shrink-0 pt-px text-[12px] ${ok ? "text-olive" : "text-red"}`}>
                    {ok ? "✓" : "✕"}
                  </span>
                  <div className="min-w-0">
                    <div className="font-serif text-[14px] leading-snug text-ink">{q.q}</div>
                    <div className="mt-0.5 font-serif text-[13px] leading-snug text-ink-soft">
                      {ok ? (
                        <>{q.options[q.answer]}</>
                      ) : (
                        <>
                          <span className="line-through decoration-red/70">
                            {p === null ? "no answer" : q.options[p]}
                          </span>
                          <span className="mx-1.5 text-ink-faint">→</span>
                          <span className="text-ink">{q.options[q.answer]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="border-t border-ink/20 px-5 py-3 font-mono text-[10px] text-ink-faint">
          signed, the examiner — {CONFIG.from}
        </div>
      </motion.div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className={`font-serif text-[13px] italic ${mail === "failed" ? "text-red" : "text-ink-soft"}`}>
          {mail === "sent" ? RESULT.mailed : mail === "failed" ? RESULT.mailFailed : RESULT.mailing}
        </span>
        <button
          onClick={onAgain}
          className="edge bg-card px-4 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
        >
          {RESULT.again}
        </button>
      </div>
    </div>
  )
}

/* ── mailing it ────────────────────────────────────────────── */

function sheetAsText(sheet: Sheet) {
  const score = scoreOf(sheet.picks)
  const verdict = verdictFor(score)
  const when = (t: number | null) => (t ? new Date(t).toLocaleString() : "—")
  const lines = [
    `${CONFIG.name}'s quiz — attempt ${sheet.attempt}`,
    `Score: ${score}/${QUESTIONS.length} — ${verdict.title}`,
    `Started: ${when(sheet.startedAt)}`,
    `Finished: ${when(sheet.finishedAt)}`,
    "",
  ]
  QUESTIONS.forEach((q, i) => {
    const p = sheet.picks[i]
    const ok = p === q.answer
    lines.push(`${i + 1}. ${q.q}`)
    lines.push(`   Her answer: ${p === null ? "(none)" : `${LETTERS[p]}. ${q.options[p]}`}  ${ok ? "✓" : "✗"}`)
    if (!ok) lines.push(`   Correct:    ${LETTERS[q.answer]}. ${q.options[q.answer]}`)
    lines.push("")
  })
  return lines.join("\n")
}

async function mailSheet(sheet: Sheet): Promise<boolean> {
  const score = scoreOf(sheet.picks)
  try {
    const res = await fetch("/api/send-doodle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "quiz",
        note: {
          title: `${score}/${QUESTIONS.length} · attempt ${sheet.attempt}`,
          body: sheetAsText(sheet),
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
