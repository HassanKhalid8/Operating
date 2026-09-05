import { useState } from "react"
import { CONFIG, osVersion } from "../content/config"

const MENUS: Record<string, string[]> = {
  File: ["New Memory…  ⌘N", "Close  ⌘W", "———", "Forget Everything  (disabled)"],
  Edit: ["Undo Last Year  ⌘Z", "Cut", "Copy", "Paste", "———", "Select All Feelings  ⌘A"],
  Special: ["Empty Trash", "Restart", "———", "Shut Down  (don't)"],
}

/** The strip along the top. Menus open, but every item is a joke that does
    nothing — the point is that the machine feels real, not that it works. */
export function MenuBar({ now, daysLeft }: { now: number; daysLeft: number }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div
      className="relative z-[200] flex h-7 shrink-0 select-none items-center border-b border-ink bg-card px-2 font-chrome text-[10px] tracking-tight"
      onPointerLeave={() => setOpen(null)}
    >
      <span className="px-2 text-red">✻</span>

      {Object.keys(MENUS).map((m) => (
        <div key={m} className="relative">
          <button
            onClick={() => setOpen((o) => (o === m ? null : m))}
            onPointerEnter={() => setOpen((o) => (o ? m : o))}
            className={`px-2 py-1 ${open === m ? "bg-ink text-card" : "hover:bg-ink/10"}`}
          >
            {m}
          </button>

          {open === m && (
            <div className="edge absolute left-0 top-full min-w-52 bg-card py-1">
              {MENUS[m].map((item, i) =>
                item === "———" ? (
                  <div key={i} className="my-1 h-px bg-ink/20" />
                ) : (
                  <div
                    key={i}
                    className="cursor-default px-3 py-1 text-[10px] text-ink-faint"
                    title="Nothing here works. That's the joke."
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ))}

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
