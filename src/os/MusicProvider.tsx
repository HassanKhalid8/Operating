import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react"
import { PLAYLIST, type Track } from "../content/music"

interface MusicApi {
  tracks: Track[]
  index: number
  track: Track
  playing: boolean
  /** true once this track's file has failed to load. */
  missing: boolean
  currentTime: number
  duration: number
  toggle: () => void
  next: () => void
  prev: () => void
  select: (i: number) => void
  seek: (seconds: number) => void
}

const Ctx = createContext<MusicApi | null>(null)

/** One <audio> element for the whole OS, so the desk widget and the Music
    window are the same player rather than two that fight each other. */
export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [failed, setFailed] = useState<Record<number, true>>({})

  const track = PLAYLIST[index]

  /* Swapping the src resets the element, so playback has to be restarted by
     hand — and only if it was already running, or changing tracks would start
     music she never asked for. */
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.src = track.file
    el.load()
    setCurrentTime(0)
    setDuration(0)
    if (playing) el.play().catch(() => setPlaying(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const next = useCallback(() => setIndex((i) => (i + 1) % PLAYLIST.length), [])
  const prev = useCallback(() => setIndex((i) => (i - 1 + PLAYLIST.length) % PLAYLIST.length), [])

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    } else {
      el.pause()
      setPlaying(false)
    }
  }, [])

  const select = useCallback((i: number) => {
    /* Tapping the track that is already loaded toggles it rather than
       silently restarting it from zero. */
    if (i === index) { toggle(); return }
    setIndex(i)
    /* The [index] effect reads `playing` from the render this schedules, so
       setting it here is what tells the effect to start the new track. */
    setPlaying(true)
  }, [index, toggle])

  const seek = useCallback((seconds: number) => {
    const el = audioRef.current
    if (!el || !Number.isFinite(el.duration)) return
    el.currentTime = Math.min(Math.max(seconds, 0), el.duration)
    setCurrentTime(el.currentTime)
  }, [])

  const api = useMemo<MusicApi>(() => ({
    tracks: PLAYLIST, index, track, playing, missing: !!failed[index],
    currentTime, duration, toggle, next, prev, select, seek,
  }), [index, track, playing, failed, currentTime, duration, toggle, next, prev, select, seek])

  return (
    <Ctx.Provider value={api}>
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={next}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        /* A missing file is expected until the mp3s are dropped in, so it is
           surfaced in the UI rather than thrown. */
        onError={() => { setFailed((f) => ({ ...f, [index]: true })); setPlaying(false) }}
      />
      {children}
    </Ctx.Provider>
  )
}

export function useMusic() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useMusic must be used inside <MusicProvider>")
  return ctx
}
