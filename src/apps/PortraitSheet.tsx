import { Portrait } from "./Portrait"
import { ROSTER, LAST_RESORT } from "../content/rishta"

/* Dev-only contact sheet — open /#portraits with the dev server running.
   It exists to check at a glance that no two candidates share a face. Guarded
   by import.meta.env.DEV at the call site, so it is stripped from the build. */
export function PortraitSheet() {
  const all = [...ROSTER, LAST_RESORT]
  return (
    <div className="paper-bg min-h-full overflow-y-auto p-8">
      <div className="font-chrome text-[11px] tracking-tight text-ink">PORTRAIT CONTACT SHEET</div>
      <p className="mt-1 font-serif text-[14px] text-ink-soft">
        Drawn fallbacks only — photos in public/faces/ are ignored here.
      </p>

      <div className="mt-7 flex flex-wrap gap-6">
        {all.map((c) => (
          <div key={c.name} className="edge bg-card p-2 text-center">
            <div className="edge-in bg-paper p-1">
              <Portrait seed={c.seed} bald={c.bald} size={120} />
            </div>
            <div className="mt-1.5 font-mono text-[10px] text-ink-soft">
              {c.name} · seed {c.seed}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
