import { useState } from "react"
import { CONFIG, osVersion } from "../content/config"
import { setTheme, THEMES, useTheme } from "../lib/theme"

/** The strip along the top. One menu, and everything in it works — the jokes
    that used to sit under File and Special were a menu full of dead ends. */
export function MenuBar({ now, daysLeft }: { now: number; daysLeft: number }) {
  const [open, setOpen] = useState(false)
  const theme = useTheme()

  return (
    <div
      className="relative z-[200] flex h-7 shrink-0 select-none items-center border-b border-ink bg-card px-2 font-chrome text-[10px] tracking-tight"
      onPointerLeave={() => setOpen(false)}
    >
      <span className="px-2 text-red">✻</span>

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`px-2 py-1 ${open ? "bg-ink text-card" : "hover:bg-ink/10"}`}
        >
          Edit
        </button>

        {open && (
          <div className="edge absolute left-0 top-full min-w-52 bg-card py-1">
            <div className="px-3 py-1 text-[9px] text-ink-faint/70">Desktop Pattern</div>
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false) }}
                title={t.note}
                className="flex w-full items-center gap-2 px-3 py-1 text-left text-[10px] text-ink hover:bg-ink hover:text-card"
              >
                {/* The tick keeps its column whether or not it is shown, so the
                    labels do not shuffle sideways. */}
                <span className="w-2 shrink-0 text-red">{theme === t.id ? "✓" : ""}</span>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1" />

      <span className="hidden px-2 text-ink-faint sm:inline">KhinsaOS {osVersion}</span>
      <span className="px-2 text-red">
        {daysLeft > 0 ? `${daysLeft}d` : CONFIG.name.toUpperCase()}
      </span>
      <span className="px-2 text-ink">
        {new Date(now).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
      </span>
    </div>
  )
}
