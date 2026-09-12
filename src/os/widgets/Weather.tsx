import { useEffect, useState } from "react"
import { Widget } from "./Widget"
import { CONFIG } from "../../content/config"

type Sky = "sun" | "moon" | "cloud" | "rain" | "storm" | "fog"

interface Sample {
  temp: number
  feels: number
  humidity: number
  sky: Sky
  label: string
}

/** How often the sky is worth asking about again. */
const REFRESH = 10 * 60_000

/* WMO weather codes, collapsed to the handful worth drawing. `day` matters:
   code 0 is "clear", and drawing a blazing sun over Lahore at nine at night is
   the single thing that makes a weather widget look fake. */
function readCode(code: number, day: boolean): { sky: Sky; label: string } {
  if (code === 0) return day ? { sky: "sun", label: "Clear" } : { sky: "moon", label: "Clear night" }
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
  if (sky === "moon") return "go to sleep. you won't."
  return "perfectly fine. no excuses today."
}

export function Weather() {
  const [data, setData] = useState<Sample | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const { lat, lon } = CONFIG.place
    /* apparent_temperature is the one that matches what her phone says: at 71%
       humidity Lahore reads 30° and feels 36°, and showing only the first makes
       the widget look broken to anyone actually standing outside. */
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day` +
      `&timezone=auto`

    /* Open-Meteo is keyless and CORS-open, so this works from a static build
       with nothing to configure. If it's unreachable the widget just says so —
       a birthday page must never sit on a spinner. */
    const ac = new AbortController()

    const read = () =>
      fetch(url, { signal: ac.signal, cache: "no-store" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((j) => {
          const c = j?.current
          const temp = Math.round(c?.temperature_2m)
          const code = Number(c?.weather_code)
          if (!Number.isFinite(temp) || !Number.isFinite(code)) throw new Error("bad payload")
          setData({
            temp,
            feels: Math.round(c.apparent_temperature ?? c.temperature_2m),
            humidity: Math.round(c.relative_humidity_2m ?? 0),
            ...readCode(code, c.is_day !== 0),
          })
          setFailed(false)
        })
        .catch((e) => { if (e.name !== "AbortError") setFailed(true) })

    void read()

    /* A tab left open all evening was showing the afternoon's weather. Refresh
       on a timer, and again whenever she comes back to the tab — a phone that
       has been in a pocket for an hour fires this the moment it wakes. */
    const timer = window.setInterval(() => void read(), REFRESH)
    const onWake = () => { if (document.visibilityState === "visible") void read() }
    document.addEventListener("visibilitychange", onWake)

    return () => {
      ac.abort()
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onWake)
    }
  }, [])

  return (
    <Widget title="WEATHER" rotate={-0.9} delay={0.68} width={252}>
      <div className="px-5 pb-5 pt-4">
        <div className="font-mono text-[11px] tracking-wide text-ink-faint">
          {CONFIG.place.label.toUpperCase()}
        </div>

        {data ? (
          <>
            <div className="mt-3 flex items-center gap-4">
              <SkyIcon sky={data.sky} />
              <div className="font-serif text-[46px] leading-none text-ink">
                {data.temp}
                <span className="text-[24px] text-ink-faint">°</span>
              </div>
            </div>
            <div className="mt-1.5 font-mono text-[11px] text-ink-soft">{data.label}</div>
            {/* Only when it actually disagrees — "feels like 30°" under a 30° is noise. */}
            <div className="mt-0.5 font-mono text-[11px] text-ink-faint">
              {Math.abs(data.feels - data.temp) >= 2 && <>feels {data.feels}° · </>}
              {data.humidity}% humidity
            </div>
            <p className="mt-3 border-t border-ink/15 pt-2 font-serif text-[13.5px] italic leading-snug text-ink-faint">
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
  const common = {
    fill: "none",
    stroke: "var(--color-ink)",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
  }
  return (
    <svg viewBox="0 0 40 40" width="54" height="54" aria-hidden>
      {sky === "sun" && (
        <g {...common}>
          <circle cx="20" cy="20" r="8" />
          <path d="M20 4v4M20 32v4M4 20h4M32 20h4M8.7 8.7l2.8 2.8M28.5 28.5l2.8 2.8M31.3 8.7l-2.8 2.8M11.5 28.5l-2.8 2.8" />
        </g>
      )}
      {sky === "moon" && (
        <g {...common}>
          {/* A crescent cut by offsetting one arc against another. */}
          <path d="M25.5 9a12 12 0 1 0 6.2 16.8A13 13 0 0 1 25.5 9z" fill="var(--color-paper)" />
          <circle cx="31" cy="11" r="0.9" fill="var(--color-ink)" />
          <circle cx="34" cy="16" r="0.7" fill="var(--color-ink)" />
        </g>
      )}
      {sky !== "sun" && sky !== "moon" && (
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
