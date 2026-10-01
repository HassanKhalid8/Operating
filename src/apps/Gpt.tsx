import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ANTICLIMAX, ASLEEP, GPT, PEAK, SUGGESTIONS } from "../content/gpt"
import { createBrain } from "../lib/gptBrain"

/* ═══════════════════════════════════════════════════════════
   KhinsaGPT.

   A chat window with nobody on the other end. What she types goes to
   lib/gptBrain.ts, which works out what was asked and answers it in
   her own catchphrases; this file is the window, and the wait that is
   long enough to feel like someone deciding what to say. Nothing is
   sent anywhere.

   Replies are queued rather than cancelled: if she sends three things
   quickly, she gets three answers in order, late, which is accurate.
   ═══════════════════════════════════════════════════════════ */

interface Msg {
  id: number
  from: "her" | "bot"
  text: string
}

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const between = (lo: number, hi: number) => lo + Math.random() * (hi - lo)

function hourMode(): "asleep" | "peak" | "normal" {
  const h = new Date().getHours()
  return h >= 4 && h < 11 ? "asleep" : h >= 1 && h < 4 ? "peak" : "normal"
}

export function Gpt() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  /* null: nobody typing. Otherwise the label under the dots. */
  const [typing, setTyping] = useState<string | null>(null)
  const [mode] = useState(hourMode)

  /* One brain per conversation: it remembers what was just said. */
  const brain = useRef(createBrain())
  const nextId = useRef(0)
  /* Bumped by New Chat and on unmount, so a reply already on its way
     notices the conversation it belonged to is gone. */
  const session = useRef(0)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => () => { session.current++ }, [])

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" })
  }, [msgs, typing])

  const sent = msgs.filter((m) => m.from === "her").length
  const limited = sent >= GPT.limit

  const add = (from: Msg["from"], text: string) =>
    setMsgs((m) => [...m, { id: nextId.current++, from, text }])

  async function respond(text: string, s: number) {
    const live = () => session.current === s
    const asleep = mode === "asleep"
    await sleep(between(400, 1100) * (asleep ? 3 : 1))
    if (!live()) return

    /* Every so often: a very long think, for a very small answer. */
    if (Math.random() < 0.06) {
      setTyping(GPT.typing)
      await sleep(4200)
      if (!live()) return
      setTyping(GPT.typingLong)
      await sleep(3600)
      if (!live()) return
      setTyping(null)
      add("bot", pick(ANTICLIMAX) as string)
      return
    }

    for (const line of brain.current.reply(text, asleep)) {
      setTyping(GPT.typing)
      await sleep(between(650, 1500) + line.length * 28)
      if (!live()) return
      setTyping(null)
      add("bot", line)
      await sleep(between(180, 420))
      if (!live()) return
    }
  }

  function send(raw: string) {
    const text = raw.trim()
    if (!text || limited) return
    add("her", text)
    setDraft("")
    const s = session.current
    queue.current = queue.current.then(() => respond(text, s))
  }

  function reset() {
    session.current++
    brain.current = createBrain()
    queue.current = Promise.resolve()
    setTyping(null)
    setMsgs([])
    setDraft("")
  }

  return (
    <div className="flex h-full flex-col bg-paper">
      <header className="flex shrink-0 items-center gap-3 border-b border-ink bg-card px-4 py-2.5">
        <Avatar />
        <div className="min-w-0 flex-1">
          <div className="font-chrome text-[11px] leading-tight tracking-tight text-ink">{GPT.name}</div>
          <div className="truncate font-mono text-[10px] text-ink-faint">{GPT.model} · {GPT.tagline}</div>
        </div>
        <button
          onClick={reset}
          disabled={msgs.length === 0}
          className="edge shrink-0 bg-paper px-2.5 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card disabled:text-ink-faint disabled:hover:bg-paper"
        >
          {GPT.newChat}
        </button>
      </header>

      {mode !== "normal" && (
        <div className="shrink-0 border-b border-ink/20 bg-shade px-4 py-1.5 font-mono text-[10px] text-ink-soft">
          {mode === "asleep" ? `☾ ${ASLEEP.banner}` : `✦ ${PEAK}`}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {msgs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <div className="font-serif text-[22px] italic leading-snug text-ink">{GPT.empty}</div>
            <div className="flex max-w-sm flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="edge bg-card px-3 py-1.5 font-serif text-[13px] text-ink hover:bg-ink hover:text-card active:translate-x-px active:translate-y-px"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {msgs.map((m, n) => {
              /* Her bursts read as one turn: only the first line gets the avatar. */
              const lead = m.from === "bot" && msgs[n - 1]?.from !== "bot"
              return (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14 }}
                  className={`flex items-end gap-2 ${m.from === "her" ? "justify-end" : ""} ${lead ? "mt-2" : ""}`}
                >
                  {m.from === "bot" && (lead ? <Avatar small /> : <span className="w-6 shrink-0" />)}
                  <span
                    className={`max-w-[78%] whitespace-pre-wrap break-words border border-ink px-3 py-1.5 text-[14px] leading-snug ${
                      m.from === "her" ? "bg-ink text-card" : "bg-card text-ink"
                    }`}
                  >
                    {m.text}
                  </span>
                </motion.li>
              )
            })}
          </ul>
        )}

        {typing && (
          <div className="mt-2 flex items-center gap-2">
            <span className="w-6 shrink-0" />
            <span className="flex items-center gap-1 border border-ink bg-card px-3 py-2.5">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: d * 0.18 }}
                  className="h-1.5 w-1.5 bg-ink"
                />
              ))}
            </span>
            <span className="font-mono text-[10px] text-ink-faint">{typing}</span>
          </div>
        )}
        <div ref={end} className="h-1" />
      </div>

      {limited ? (
        <div className="shrink-0 border-t border-ink bg-card px-4 py-4">
          <div className="font-chrome text-[10px] tracking-tight text-red">{GPT.limitTitle.toUpperCase()}</div>
          <p className="mt-1.5 font-serif text-[14px] leading-relaxed text-ink-soft">{GPT.limitBody}</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); send(draft) }}
          className="shrink-0 border-t border-ink bg-card px-3 pb-2 pt-3"
        >
          <div className="flex gap-2">
            {/* 16px, or iOS zooms the whole desk in when the field takes focus. */}
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={GPT.placeholder}
              aria-label={GPT.placeholder}
              autoComplete="off"
              className="edge-in min-w-0 flex-1 bg-paper px-3 py-2 text-[16px] text-ink outline-none placeholder:text-ink-faint"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Send"
              className="edge shrink-0 bg-ink px-4 font-chrome text-[12px] text-card hover:bg-red disabled:bg-shade disabled:text-ink-faint"
            >
              ↑
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[9px] text-ink-faint">{GPT.disclaimer}</p>
        </form>
      )}
    </div>
  )
}

function Avatar({ small }: { small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center border border-ink bg-red font-chrome text-card ${
        small ? "h-6 w-6 text-[9px]" : "h-8 w-8 text-[11px]"
      }`}
    >
      K
    </span>
  )
}
