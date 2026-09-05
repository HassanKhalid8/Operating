import { Widget } from "./Widget"
import { osVersion } from "../../content/config"

/* The About This Computer box, which on a real machine listed what was eating
   the RAM. Here it lists what is eating her. */
const USAGE: { label: string; k: number; over?: boolean }[] = [
  { label: "Bakchodi",     k: 4271 },
  { label: "Overthinking", k: 2900 },
  { label: "Standards",    k: 9400, over: true },
  { label: "Sleep",        k: 210 },
]

const TOTAL = 8192

export function About() {
  return (
    <Widget title="ABOUT THIS COMPUTER" rotate={0.9} delay={0.75} width={222}>
      <div className="px-4 pb-4 pt-3">
        <div className="font-chrome text-[9px] tracking-tight text-ink">KhinsaOS {osVersion}</div>
        <div className="mt-0.5 flex justify-between font-mono text-[10px] text-ink-faint">
          <span>Total Memory</span>
          <span>{TOTAL.toLocaleString()} K</span>
        </div>

        <div className="mt-3 space-y-2 border-t border-ink/15 pt-3">
          {USAGE.map((u) => (
            <div key={u.label}>
              <div className="flex justify-between font-mono text-[10px] text-ink-soft">
                <span className={u.over ? "text-red" : undefined}>{u.label}</span>
                <span>{u.k.toLocaleString()} K</span>
              </div>
              <div className="edge-in mt-0.5 h-2.5 bg-shade p-[1px]">
                {/* Anything past the total is clamped to a full bar — the number
                    beside it already tells the joke. */}
                <div
                  className={u.over ? "h-full bg-red" : "pinstripe h-full"}
                  style={{ width: `${Math.min((u.k / TOTAL) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-between border-t border-ink/15 pt-2 font-mono text-[10px]">
          <span className="text-ink-faint">Largest Unused Block</span>
          <span className="text-red">0 K</span>
        </div>
      </div>
    </Widget>
  )
}
