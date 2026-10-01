import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, animate, motion } from "framer-motion"
import { SOURCES, cardsFor, statsFor, type Card, type Source } from "../content/numbers"

/* ═══════════════════════════════════════════════════════════
   THE NUMBERS

   A Wrapped-style story: one card at a time, a big number, a line
   underneath. Tap the right side (or →) for the next card, the left
   side (or ←) to go back. No auto-advance — the lines are the point,
   and she reads at her own speed.

   Three boxes along the top switch the whole story between Instagram,
   WhatsApp, and both together. Switching keeps her on the same card,
   so she can flip one number between the apps and compare.
   ═══════════════════════════════════════════════════════════ */

/* Each card takes the next of these, so the story changes colour as it goes.
   All theme tokens, so every desktop pattern still works. */
const TONES = [
  { bg: "bg-card", fg: "text-ink", soft: "text-ink-soft", bar: "bg-ink", faint: "bg-ink/15", onBar: "text-card" },
  { bg: "bg-red", fg: "text-card", soft: "text-card/80", bar: "bg-card", faint: "bg-card/25", onBar: "text-red" },
  { bg: "bg-blue", fg: "text-card", soft: "text-card/80", bar: "bg-card", faint: "bg-card/25", onBar: "text-blue" },
  { bg: "bg-paper", fg: "text-ink", soft: "text-ink-soft", bar: "bg-red", faint: "bg-ink/15", onBar: "text-card" },
  { bg: "bg-olive", fg: "text-card", soft: "text-card/80", bar: "bg-card", faint: "bg-card/25", onBar: "text-olive" },
]
type Tone = (typeof TONES)[number]

/* Both, unless an export is missing — then whichever one is there. */
const FIRST_SOURCE: Source = (["both", "instagram", "whatsapp"] as Source[]).find((s) => statsFor(s)) ?? "both"

export function Numbers() {
  const [source, setSource] = useState<Source>(FIRST_SOURCE)
  const CARDS = useMemo(() => cardsFor(source), [source])
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const card = CARDS[Math.min(i, CARDS.length - 1)]
  const tone = card.kind === "intro" || card.kind === "outro" ? TONES[0] : TONES[i % TONES.length]

  /* From the latest index rather than the one this render saw, so rapid taps
     each count instead of all landing on the same card. */
  const go = (d: number) => {
    setDir(d)
    setI((cur) => Math.min(Math.max(cur + d, 0), CARDS.length - 1))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1)
      else if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  return (
    <div className={`relative flex h-full min-h-[520px] select-none flex-col overflow-hidden transition-colors duration-500 ${tone.bg}`}>
      {/* story progress */}
      <div className="relative z-10 flex gap-1 px-3 pt-3">
        {CARDS.map((_, n) => (
          <div key={n} className={`h-[3px] flex-1 ${tone.faint}`}>
            <motion.div
              className={`h-full ${tone.bar}`}
              initial={false}
              animate={{ width: n <= i ? "100%" : "0%" }}
              transition={{ duration: n === i ? 0.4 : 0 }}
            />
          </div>
        ))}
      </div>

      {/* which chat — above the tap zones so tapping a box never turns the page */}
      <div className="relative z-30 grid grid-cols-3 gap-1.5 px-3 pt-2.5">
        {SOURCES.map((s) => {
          const on = s.id === source
          const has = !!statsFor(s.id)
          return (
            <button
              key={s.id}
              onClick={() => { setDir(0); setSource(s.id) }}
              disabled={!has}
              aria-pressed={on}
              className={`border py-1.5 font-chrome text-[9px] tracking-tight transition-colors disabled:opacity-30 ${
                on
                  ? `${tone.bar} border-transparent ${tone.onBar}`
                  : `border-current bg-transparent ${tone.fg} hover:opacity-70`
              }`}
            >
              {s.label.toUpperCase()}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={`${source}-${i}`}
          custom={dir}
          initial={{ opacity: 0, x: dir * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -30 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-1 flex-col justify-center px-7 py-8 sm:px-10"
        >
          <CardBody card={card} tone={tone} />
        </motion.div>
      </AnimatePresence>

      {/* footer: where she is, and how to move */}
      <div className={`relative z-10 flex items-center justify-between px-4 pb-3 font-chrome text-[8px] tracking-tight ${tone.soft}`}>
        <span>{String(i + 1).padStart(2, "0")} / {String(CARDS.length).padStart(2, "0")}</span>
        <span>{i === CARDS.length - 1 ? "THE END" : "TAP →"}</span>
      </div>

      {/* tap zones: a third to go back, the rest to go on */}
      <button aria-label="Previous" onClick={() => go(-1)} className="absolute inset-y-0 left-0 z-20 w-1/3 cursor-w-resize" />
      <button aria-label="Next" onClick={() => go(1)} className="absolute inset-y-0 right-0 z-20 w-2/3 cursor-e-resize" />
    </div>
  )
}

/* ── the cards ─────────────────────────────────────────────── */

function CardBody({ card, tone }: { card: Card; tone: Tone }) {
  const eyebrow = (text: string) => (
    <div className={`font-chrome text-[10px] tracking-tight ${tone.soft}`}>{text}</div>
  )
  const line = (text: string, delay = 0.5) => (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`mt-5 max-w-sm font-serif text-[17px] italic leading-snug ${tone.fg}`}
    >
      {text}
    </motion.p>
  )

  switch (card.kind) {
    case "intro":
      return (
        <div>
          <div className="font-chrome text-[10px] tracking-tight text-red">KHINSAOS · WRAPPED</div>
          <h1 className={`mt-3 font-serif text-[46px] leading-[0.95] ${tone.fg}`}>{card.title}</h1>
          <div className="mt-3 font-mono text-[11px] text-ink-faint">{card.sub}</div>
          {line(card.line, 0.4)}
        </div>
      )

    case "big":
      return (
        <div>
          {eyebrow(card.eyebrow)}
          <div className={`mt-2 font-serif text-[72px] leading-none tracking-tight sm:text-[84px] ${tone.fg}`}>
            <CountUp value={card.value} />
          </div>
          {card.unit && <div className={`mt-2 font-mono text-[12px] ${tone.soft}`}>{card.unit}</div>}
          {line(card.line)}
        </div>
      )

    case "versus": {
      const max = Math.max(card.her, card.me, 1)
      const rows: [string, number][] = [["You", card.her], ["Me", card.me]]
      return (
        <div>
          {eyebrow(card.eyebrow)}
          <div className="mt-5 flex flex-col gap-4">
            {rows.map(([who, n], r) => (
              <div key={who}>
                <div className="flex items-baseline justify-between">
                  <span className={`font-chrome text-[10px] tracking-tight ${tone.soft}`}>{who.toUpperCase()}</span>
                  <span className={`font-serif text-[34px] leading-none ${tone.fg}`}>
                    <CountUp value={n.toLocaleString("en-US")} />
                  </span>
                </div>
                <div className={`mt-1.5 h-3 ${tone.faint}`}>
                  <motion.div
                    className={`h-full ${tone.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(n / max) * 100}%` }}
                    transition={{ delay: 0.15 + r * 0.15, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            ))}
          </div>
          {line(card.line, 0.9)}
        </div>
      )
    }

    case "streak":
      return (
        <div>
          {eyebrow(card.eyebrow)}
          <div className={`mt-2 font-serif text-[72px] leading-none ${tone.fg}`}>
            <CountUp value={String(card.active)} />
            <span className={`text-[28px] ${tone.soft}`}> / {card.days}</span>
          </div>
          <div className="mt-5 grid max-w-xs grid-cols-7 gap-1.5">
            {Array.from({ length: card.days }, (_, n) => (
              <motion.span
                key={n}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 + n * 0.025, type: "spring", stiffness: 500, damping: 22 }}
                className={`aspect-square ${n < card.active ? tone.bar : tone.faint}`}
              />
            ))}
          </div>
          {line(card.line, 1.2)}
        </div>
      )

    case "hours": {
      const max = Math.max(...card.hours)
      return (
        <div>
          {eyebrow(card.eyebrow)}
          <div className="mt-4 flex h-28 items-end gap-[3px]">
            {card.hours.map((n, h) => (
              <motion.div
                key={h}
                title={`${h % 12 || 12}${h < 12 ? "am" : "pm"}: ${n}`}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((n / max) * 100, 2)}%` }}
                transition={{ delay: 0.1 + h * 0.025, duration: 0.5, ease: "easeOut" }}
                className={`flex-1 ${h < 5 ? "bg-red" : tone.bar} ${n === max ? "" : "opacity-70"}`}
              />
            ))}
          </div>
          <div className={`mt-1 flex justify-between font-mono text-[9px] ${tone.soft}`}>
            <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
          </div>
          <div className={`mt-5 font-serif text-[56px] leading-none text-red`}>
            <CountUp value={card.value} />
          </div>
          {line(card.line, 0.9)}
        </div>
      )
    }

    case "spellings": {
      const max = card.words[0]?.[1] ?? 1
      return (
        <div>
          {eyebrow(card.eyebrow)}
          <div className={`mt-2 font-serif text-[72px] leading-none ${tone.fg}`}>
            <CountUp value={card.value} />
          </div>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {card.words.map(([w, n], k) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + k * 0.05 }}
                title={`${n}×`}
                className={`font-serif italic ${w === "yaar" ? "text-red underline decoration-2" : tone.fg}`}
                style={{ fontSize: 12 + (n / max) * 16 }}
              >
                {w}
              </motion.span>
            ))}
          </div>
          {line(card.line, 1.3)}
        </div>
      )
    }

    case "emoji":
      return (
        <div>
          {eyebrow(card.eyebrow)}
          <motion.div
            initial={{ scale: 0.3, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="mt-3 text-[96px] leading-none"
          >
            {card.emoji}
          </motion.div>
          <div className="mt-5 grid max-w-xs grid-cols-2 gap-4">
            {([["YOU", card.her], ["ME", card.me]] as const).map(([who, n]) => (
              <div key={who}>
                <div className={`font-chrome text-[9px] tracking-tight ${tone.soft}`}>{who}</div>
                <div className={`font-serif text-[36px] leading-none ${tone.fg}`}>
                  <CountUp value={n.toLocaleString("en-US")} />
                </div>
              </div>
            ))}
          </div>
          {line(card.line, 0.8)}
        </div>
      )

    case "outro":
      return (
        <div className="text-center">
          <div className={`font-serif text-[64px] leading-none ${tone.fg}`}>
            <CountUp value={card.value} />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className={`mx-auto mt-4 max-w-xs font-serif text-[20px] italic leading-snug ${tone.fg}`}
          >
            {card.line}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.8 }}
            className="mt-5 font-mono text-[12px] text-red"
          >
            {card.sign}
          </motion.div>
        </div>
      )
  }
}

/** Counts up to a number, keeping its formatting ("12,204" counts with commas).
    Anything that isn't a plain number is shown as-is. */
function CountUp({ value }: { value: string }) {
  const target = Number(value.replace(/,/g, ""))
  const [shown, setShown] = useState(Number.isFinite(target) ? "0" : value)

  useEffect(() => {
    if (!Number.isFinite(target)) return
    const controls = animate(0, target, {
      duration: Math.min(1.4, 0.5 + target / 8000),
      ease: "easeOut",
      onUpdate: (v) => setShown(Math.round(v).toLocaleString("en-US")),
    })
    return () => controls.stop()
  }, [target])

  return <>{Number.isFinite(target) ? shown : value}</>
}
