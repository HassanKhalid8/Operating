import { useMusic } from "../os/MusicProvider"
import { clock } from "../lib/time"
import { MISSING_NOTE } from "../content/music"
import { CONFIG } from "../content/config"

/** The full window: the tape's track listing, with the reason each song is
    on it. The desk widget is the transport; this is the liner notes. */
export function Music() {
  const { tracks, index, track, playing, missing, currentTime, duration, toggle, next, prev, select, seek } = useMusic()

  return (
    <div className="min-h-full bg-paper">
      {/* ── now playing ── */}
      <div className="border-b border-ink/20 bg-card p-5">
        {/* the J-card: what the tape is called, before anything else */}
        <div className="edge-in mb-5 bg-paper px-3 py-2.5 text-center">
          <div className="font-chrome text-[8px] tracking-tight text-ink-faint">
            SIDE A · {tracks.length} TRACKS
          </div>
          <div className="mt-1 font-serif text-[19px] italic leading-tight text-ink">
            {CONFIG.tapeName}
          </div>
        </div>

        <div className="font-chrome text-[9px] tracking-tight text-ink-faint">NOW PLAYING</div>
        <div className="mt-1 font-serif text-2xl leading-tight text-ink">{track.title}</div>
        <div className="font-mono text-[11px] text-ink-faint">{track.artist}</div>

        {/* scrubber — a real one; the tape deck's bar is display only */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={!duration}
          aria-label="Seek"
          className="mt-4 h-1 w-full cursor-pointer appearance-none rounded-none bg-shade accent-[var(--color-red)] disabled:cursor-not-allowed disabled:opacity-40"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-faint">
          <span>{clock(currentTime)}</span>
          <span>{duration ? clock(duration) : "--:--"}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={prev} aria-label="Previous track"
            className="edge grid h-9 w-11 place-items-center bg-paper font-mono text-[11px] text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px">
            ◀◀
          </button>
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}
            className="edge grid h-9 w-16 place-items-center bg-paper font-mono text-[12px] text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px">
            {playing ? "❚❚" : "▶"}
          </button>
          <button onClick={next} aria-label="Next track"
            className="edge grid h-9 w-11 place-items-center bg-paper font-mono text-[11px] text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px">
            ▶▶
          </button>
        </div>

        {(missing || track.note.trim()) && (
          <p className="mt-5 border-l-2 border-red pl-3 font-serif text-[14px] italic leading-relaxed text-ink-soft">
            {missing ? MISSING_NOTE : track.note}
          </p>
        )}
      </div>

      {/* ── the tape ── */}
      <ol>
        {tracks.map((t, i) => {
          const active = i === index
          return (
            <li key={t.file}>
              <button
                onClick={() => select(i)}
                className={`flex w-full items-baseline gap-3 border-b border-ink/10 px-5 py-3 text-left hover:bg-card ${
                  active ? "bg-card" : ""
                }`}
              >
                <span className="w-6 shrink-0 font-mono text-[10px] text-ink-faint">
                  {active && playing ? "▶" : String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-serif text-[15px] leading-tight ${active ? "text-red" : "text-ink"}`}>
                    {t.title}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-ink-faint">{t.artist}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

    </div>
  )
}
