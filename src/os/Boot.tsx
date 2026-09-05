import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { CONFIG, osVersion } from "../content/config"

/* Startup items, the way a System 7 machine marched a row of extension icons
   along the bottom of the screen while it woke up. */
const ITEMS: { glyph: string; text: string; ms: number; fail?: boolean }[] = [
  { glyph: "◧", text: "Memory ................ 8192 K", ms: 320 },
  { glyph: "◨", text: "Friendship Extension", ms: 300 },
  { glyph: "◩", text: "Personality Manager", ms: 300 },
  { glyph: "◪", text: "Shareef.dll — failed to load", ms: 620, fail: true },
  { glyph: "◫", text: "Retrying Shareef.dll — failed again", ms: 540, fail: true },
  { glyph: "▤", text: "Giving up. Proceeding anyway.", ms: 640 },
  { glyph: "▥", text: "Bakchodi Index ........ 4,271 entries", ms: 440 },
  { glyph: "▦", text: "Photo Library", ms: 320 },
  { glyph: "▧", text: "locked/ — access denied", ms: 600, fail: true },
  { glyph: "▨", text: "Window Manager", ms: 340 },
]

export function Boot({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(0)
  const [greeting, setGreeting] = useState(false)

  useEffect(() => {
    if (n >= ITEMS.length) {
      const a = setTimeout(() => setGreeting(true), 260)
      const b = setTimeout(onDone, 2800)
      return () => { clearTimeout(a); clearTimeout(b) }
    }
    const t = setTimeout(() => setN((i) => i + 1), ITEMS[n].ms)
    return () => clearTimeout(t)
  }, [n, onDone])

  /* Never trap her in an intro — any tap or key skips to the end. */
  useEffect(() => {
    const skip = () => { setN(ITEMS.length); setGreeting(true); setTimeout(onDone, 900) }
    window.addEventListener("keydown", skip)
    window.addEventListener("pointerdown", skip)
    return () => {
      window.removeEventListener("keydown", skip)
      window.removeEventListener("pointerdown", skip)
    }
  }, [onDone])

  const current = ITEMS[Math.min(n, ITEMS.length - 1)]
  const pct = Math.round((n / ITEMS.length) * 100)

  return (
    <div className="paper-bg grain fixed inset-0 flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="edge-lg w-full max-w-md bg-card px-7 py-8 text-center"
      >
        {!greeting ? (
          <>
            <div className="font-chrome text-lg tracking-tight text-ink">KhinsaOS</div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.25em] text-ink-faint">
              {osVersion.toUpperCase()}
            </div>

            {/* progress trough */}
            <div className="edge-in mt-7 h-4 w-full overflow-hidden bg-shade p-[2px]">
              <motion.div
                className="pinstripe h-full"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.25, ease: "linear" }}
              />
            </div>

            <div className={`mt-3 h-4 font-mono text-[11px] ${current.fail ? "text-red" : "text-ink-soft"}`}>
              {n === 0 ? "Starting up\u2026" : current.text}
            </div>

            {/* the extension row filling in, left to right */}
            <div className="mt-7 flex min-h-[26px] flex-wrap justify-center gap-1.5">
              {ITEMS.slice(0, n).map((it, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`grid h-6 w-6 place-items-center border border-ink text-[11px] ${
                    it.fail ? "bg-red text-card" : "bg-paper text-ink"
                  }`}
                >
                  {it.fail ? "✕" : it.glyph}
                </motion.span>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="font-chrome text-xs tracking-tight text-ink-faint">KhinsaOS {osVersion}</div>
            <div className="mt-4 font-serif text-4xl leading-tight text-ink sm:text-5xl">
              Welcome back,
              <br />
              <em className="not-italic text-red">{CONFIG.name}</em>
            </div>
            <div className="mx-auto mt-6 h-px w-16 bg-ink/25" />
            <div className="mt-5 font-mono text-[11px] tracking-wide text-ink-soft">
              you have 1 unread letter
            </div>
          </motion.div>
        )}
      </motion.div>

      {!greeting && (
        <div className="pointer-events-none mt-6 font-mono text-[10px] tracking-[0.3em] text-ink-faint">
          TAP TO SKIP
        </div>
      )}
    </div>
  )
}
