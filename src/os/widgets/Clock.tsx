import { Widget } from "./Widget"
import { useNow } from "../../lib/hooks"

/** The Alarm Clock desk accessory: an analog face with ink hands, and the
    date spelled out underneath. */
export function Clock() {
  const now = useNow()
  const d = new Date(now)

  const s = d.getSeconds()
  const m = d.getMinutes() + s / 60
  const h = (d.getHours() % 12) + m / 60

  /* -90° so 0 points at 12 rather than at 3. */
  const hand = (turns: number, per: number) => turns * (360 / per) - 90

  return (
    <Widget title="ALARM CLOCK" rotate={-1.2} delay={0.55} width={230}>
      <div className="flex flex-col items-center px-4 pb-4 pt-5">
        <svg viewBox="0 0 100 100" width="150" height="150" aria-hidden>
          <g stroke="var(--color-ink)" fill="none">
            <circle cx="50" cy="50" r="46" strokeWidth="1.5" fill="var(--color-paper)" />
            {/* hour ticks — long on the quarters */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = ((i * 30 - 90) * Math.PI) / 180
              const inner = i % 3 === 0 ? 36 : 40
              return (
                <line
                  key={i}
                  x1={50 + inner * Math.cos(a)} y1={50 + inner * Math.sin(a)}
                  x2={50 + 44 * Math.cos(a)}    y2={50 + 44 * Math.sin(a)}
                  strokeWidth={i % 3 === 0 ? 2 : 1}
                />
              )
            })}
            <line
              x1="50" y1="50"
              x2={50 + 24 * Math.cos((hand(h, 12) * Math.PI) / 180)}
              y2={50 + 24 * Math.sin((hand(h, 12) * Math.PI) / 180)}
              strokeWidth="3.2" strokeLinecap="round"
            />
            <line
              x1="50" y1="50"
              x2={50 + 34 * Math.cos((hand(m, 60) * Math.PI) / 180)}
              y2={50 + 34 * Math.sin((hand(m, 60) * Math.PI) / 180)}
              strokeWidth="2.2" strokeLinecap="round"
            />
            <line
              x1={50 - 8 * Math.cos((hand(s, 60) * Math.PI) / 180)}
              y1={50 - 8 * Math.sin((hand(s, 60) * Math.PI) / 180)}
              x2={50 + 38 * Math.cos((hand(s, 60) * Math.PI) / 180)}
              y2={50 + 38 * Math.sin((hand(s, 60) * Math.PI) / 180)}
              stroke="var(--color-red)" strokeWidth="1" strokeLinecap="round"
            />
          </g>
          <circle cx="50" cy="50" r="2.6" fill="var(--color-ink)" />
        </svg>

        <div className="mt-2.5 font-mono text-[11px] tracking-wide text-ink-soft">
          {d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}
        </div>
      </div>
    </Widget>
  )
}
