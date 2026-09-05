import { Widget } from "./Widget"
import { useNow } from "../../lib/hooks"
import { msUntilBirthday } from "../../lib/time"

/** A torn desk-calendar page for the 15th, with the time remaining under it. */
export function Countdown() {
  const now = useNow()
  const left = msUntilBirthday(now)
  const here = left <= 0

  const days = Math.floor(left / 86_400_000)
  const hours = Math.floor((left % 86_400_000) / 3_600_000)
  const mins = Math.floor((left % 3_600_000) / 60_000)
  const secs = Math.floor((left % 60_000) / 1000)

  return (
    <Widget title="CALENDAR" rotate={1.4} delay={0.62} width={188}>
      <div className="px-4 pb-4 pt-3 text-center">
        <div className="font-chrome text-[9px] tracking-tight text-ink-soft">SEPTEMBER</div>

        <div className="relative mx-auto mt-1 w-fit">
          <div className="font-serif text-[62px] leading-none text-ink">15</div>
          {/* hand-drawn ring around the date, in red pen */}
          <svg viewBox="0 0 100 80" className="pointer-events-none absolute -inset-2" aria-hidden>
            <ellipse
              cx="50" cy="40" rx="42" ry="34"
              fill="none" stroke="var(--color-red)" strokeWidth="2"
              strokeLinecap="round" strokeDasharray="196 40" transform="rotate(-8 50 40)"
              opacity="0.85"
            />
          </svg>
        </div>

        <div className="mt-4 border-t border-ink/15 pt-3">
          {here ? (
            <div className="font-serif text-[17px] leading-tight text-red">
              it’s today.
              <br />
              <span className="text-ink-soft">happy birthday.</span>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-2 font-mono text-[15px] text-ink">
                <Unit n={days} label="d" />
                <Unit n={hours} label="h" />
                <Unit n={mins} label="m" />
                <Unit n={secs} label="s" />
              </div>
              <div className="mt-2 font-serif text-[12px] italic leading-snug text-ink-faint">
                until you are officially old
              </div>
            </>
          )}
        </div>
      </div>
    </Widget>
  )
}

function Unit({ n, label }: { n: number; label: string }) {
  return (
    <span className="tabular-nums">
      {String(n).padStart(2, "0")}
      <span className="text-[10px] text-ink-faint">{label}</span>
    </span>
  )
}
