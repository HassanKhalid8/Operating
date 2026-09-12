import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react"
import { PLAYLIST, type Track } from "../content/music"
import { load, save } from "../lib/store"
import { cloudEnabled, getState, putState } from "../lib/cloud"

/* Where the tape was up to: which song, and how far in. Written to this
   device on every change and to the cloud a moment later, so closing the tab
   mid-song and coming back — on this phone or another one — picks the tape up
   where she left it rather than rewinding to track 01. */
const TAPE_KEY = "khinsaos.tape.v1"

interface Tape {
  index: number
  time: number
  /** When this was written. Decides which device is right on the next open. */
  at: number
}

/** While it is playing. Often enough to be useful, rare enough to be free. */
const SAVE_EVERY = 15_000

function validTape(value: unknown): Tape {
  const t = value as Partial<Tape> | null
  const index = Number(t?.index)
  const time = Number(t?.time)
  const at = Number(t?.at)
  return {
    index: Number.isInteger(index) && index >= 0 && index < PLAYLIST.length ? index : 0,
    time: Number.isFinite(time) && time > 0 ? time : 0,
    at: Number.isFinite(at) && at > 0 ? at : 0,
  }
}

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
  /* Read once, synchronously, so the right track is in the element from the
     first render instead of swapping under her a beat later. */
  const restored = useRef(validTape(load<Tape>(TAPE_KEY, { index: 0, time: 0, at: 0 })))
  /* Applied when the file reports its duration — seeking before then is
     silently ignored by the element. */
  const seekTo = useRef(restored.current.time)
  const [index, setIndex] = useState(restored.current.index)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [failed, setFailed] = useState<Record<number, true>>({})

  const track = PLAYLIST[index]

  /* ── remembering the tape ── */
  const persist = useCallback((next: Omit<Tape, "at">, toCloud = true) => {
    const tape: Tape = { ...next, at: Date.now() }
    save(TAPE_KEY, tape)
    if (toCloud && cloudEnabled) void putState("tape", tape)
  }, [])

  /* What the index effect below has already accounted for. Without it, the
     effect's run on mount reads as "she changed track" and writes time: 0 over
     the position that was just restored. */
  const settled = useRef(index)

  /* The cloud copy may be newer than this device's — she might have been
     listening on her laptop. It lands after the first paint, so the track can
     change under her; that is the point of asking for it. Whichever copy was
     written last wins, which is why Tape carries a timestamp. */
  useEffect(() => {
    if (!cloudEnabled) return
    let cancelled = false
    void getState<Tape>("tape").then((remote) => {
      if (cancelled || !remote) return
      const tape = validTape(remote)
      if (tape.at <= restored.current.at) return

      restored.current = tape
      settled.current = tape.index
      if (tape.index !== index) {
        seekTo.current = tape.time
        setIndex(tape.index)
        return
      }
      /* Same track: drop the needle where she left it, unless she has already
         started playing on this device — never yank a song out from under her. */
      const el = audioRef.current
      if (!el || !el.paused || el.currentTime > 1) return
      if (Number.isFinite(el.duration)) {
        el.currentTime = Math.min(tape.time, Math.max(0, el.duration - 1))
        setCurrentTime(el.currentTime)
      } else {
        seekTo.current = tape.time
      }
    })
    return () => { cancelled = true }
    /* Once, on mount: this is "catch up with the other device", not a subscription. */
  }, [])

  /* A real track change is worth writing down at once — it is the part she
     would notice losing. Position is saved on a timer while it plays. */
  useEffect(() => {
    if (settled.current === index) return
    settled.current = index
    persist({ index, time: 0 })
  }, [index, persist])

  /* Closing the tab is the most likely way she leaves mid-song. A cloud write
     would be cancelled with the page, but the local one lands, and the next
     open sends it up. */
  useEffect(() => {
    const on = () => {
      const el = audioRef.current
      if (el && el.currentTime > 1) persist({ index, time: el.currentTime }, false)
    }
    window.addEventListener("pagehide", on)
    return () => window.removeEventListener("pagehide", on)
  }, [index, persist])

  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => {
      const el = audioRef.current
      if (el && !el.paused) persist({ index, time: el.currentTime })
    }, SAVE_EVERY)
    return () => window.clearInterval(t)
  }, [playing, index, persist])

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
        onLoadedMetadata={(e) => {
          const el = e.currentTarget
          setDuration(el.duration || 0)
          if (seekTo.current > 0 && Number.isFinite(el.duration)) {
            /* Not to the very end — landing on the last half second means the
               tape "resumes" by immediately ending. */
            el.currentTime = Math.min(seekTo.current, Math.max(0, el.duration - 1))
            setCurrentTime(el.currentTime)
          }
          seekTo.current = 0
        }}
        /* Only advance if the track really did run out. A server that ignores
           Range requests cannot seek into an unbuffered part of the file, and
           the browser reacts by firing `ended` — so dragging the scrubber to
           0:30 would silently skip to the next song. Trusting the clock
           instead of the event makes that impossible. */
        onEnded={(e) => {
          const el = e.currentTarget
          const finished = !Number.isFinite(el.duration) || el.currentTime >= el.duration - 1.5
          if (finished) next()
          else setPlaying(false)
        }}
        onPlay={() => setPlaying(true)}
        onPause={(e) => {
          setPlaying(false)
          persist({ index, time: e.currentTarget.currentTime })
        }}
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
