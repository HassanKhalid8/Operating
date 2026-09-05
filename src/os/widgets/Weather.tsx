import { useEffect, useState } from "react"
import { Widget } from "./Widget"
import { CONFIG } from "../../content/config"

type Sky = "sun" | "cloud" | "rain" | "storm" | "fog"

/* WMO weather codes, collapsed to the five things worth drawing. */
function readCode(code: number): { sky: Sky; label: string } {
  if (code === 0) return { sky: "sun", label: "Clear" }
  if (code <= 3) return { sky: "cloud", label: "Partly cloudy" }
  if (code <= 48) return { sky: "fog", label: "Fog" }
  if (code <= 57) return { sky: "rain", label: "Drizzle" }
  if (code <= 67) return { sky: "rain", label: "Rain" }
  if (code <= 77) return { sky: "cloud", label: "Snow" }
  if (code <= 82) return { sky: "rain", label: "Showers" }
  return { sky: "storm", label: "Thunderstorm" }
}

/** A one-liner under the temperature. Weather is boring; this isn't. */
function quip(temp: number, sky: Sky) {
  if (sky === "storm") return "dramatic. like someone we know."
  if (sky === "rain") return "long drive cancelled. shocker."
  if (sky === "fog") return "visibility low. like your standards should be."
  if (temp >= 38) return "unbearable. also the weather."
  if (temp >= 30) return "hot. you'd still wear the jacket."
  if (temp <= 12) return "cold enough to need someone. tragic."
  return "perfectly fine. no excuses today."
}

export function Weather() {
  const [data, setData] = useState<{ temp: number; sky: Sky; label: string } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const { lat, lon } = CONFIG.place
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code&timezone=auto`

    /* Open-Meteo is keyless and CORS-open, so this works from a static build
       with nothing to configure. If it's unreachable the widget just says so —
       a birthday page must never sit on a spinner. */
    const ac = new AbortController()
    fetch(url, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        const temp = Math.round(j?.current?.temperature_2m)
        const code = Number(j?.current?.weather_code)
        if (!Number.isFinite(temp) || !Number.isFinite(code)) throw new Error("bad payload")
        setData({ temp, ...readCode(code) })
      })
      .catch((e) => { if (e.name !== "AbortError") setFailed(true) })

    return () => ac.abort()
  }, [])

  return (
    <Widget title="WEATHER" rotate={-0.9} delay={0.68} width={190}>
      <div className="px-4 pb-4 pt-3">
        <div className="font-mono text-[10px] tracking-wide text-ink-faint">
          {CONFIG.place.label.toUpperCase()}
        </div>

        {data ? (
          <>
            <div className="mt-2 flex items-center gap-3">
              <SkyIcon sky={data.sky} />
              <div className="font-serif text-[34px] leading-none text-ink">
                {data.temp}
                <span className="text-[18px] text-ink-faint">°</span>
              </div>
            </div>
            <div className="mt-1 font-mono text-[10px] text-ink-soft">{data.label}</div>
            <p className="mt-3 border-t border-ink/15 pt-2 font-serif text-[12.5px] italic leading-snug text-ink-faint">
              {quip(data.temp, data.sky)}
            </p>
          </>
        ) : failed ? (
          <p className="mt-3 font-serif text-[13px] italic leading-snug text-ink-faint">
            No signal. Look out of a window like it’s 1994.
          </p>
        ) : (
          <p className="mt-3 font-mono text-[10px] text-ink-faint">checking the sky…</p>
        )}
      </div>
    </Widget>
  )
}

function SkyIcon({ sky }: { sky: Sky }) {
  const common = { fill: "none", stroke: "var(--color-ink)", strokeWidth: 1.6, strokeLinecap: "round" as const }
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
      {sky === "sun" && (
        <g {...common}>
          <circle cx="20" cy="20" r="8" />
          <path d="M20 4v4M20 32v4M4 20h4M32 20h4M8.7 8.7l2.8 2.8M28.5 28.5l2.8 2.8M31.3 8.7l-2.8 2.8M11.5 28.5l-2.8 2.8" />
        </g>
      )}
      {sky !== "sun" && (
        <g {...common}>
          {sky === "cloud" && <circle cx="27" cy="13" r="5" opacity="0.5" />}
          <path d="M12 27a6 6 0 0 1 .6-12 8 8 0 0 1 15 2 5 5 0 0 1-.6 10z" fill="var(--color-paper)" />
          {(sky === "rain" || sky === "storm") && <path d="M14 31l-2 5M21 31l-2 5M28 31l-2 5" />}
          {sky === "storm" && (
            <path d="M22 29l-4 5h4l-3 5" stroke="var(--color-red)" strokeWidth="1.8" />
          )}
          {sky === "fog" && <path d="M9 31h22M12 35h16" opacity="0.7" />}
        </g>
      )}
    </svg>
  )
}
