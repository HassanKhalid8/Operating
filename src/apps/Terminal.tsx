import { useEffect, useRef, useState } from "react"
import { COMMANDS, NOT_FOUND } from "../content/terminal"
import { osVersion } from "../content/config"
import { daysUntilBirthday, msUntilBirthday } from "../lib/time"

type Line = { kind: "in" | "out"; text: string }

const BANNER: Line[] = [
  { kind: "out", text: `KhinsaOS ${osVersion} — shell` },
  { kind: "out", text: "type 'help' if you're lost. you are." },
  { kind: "out", text: "" },
]

export function Terminal() {
  const [lines, setLines] = useState<Line[]>(BANNER)
  const [draft, setDraft] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [hIndex, setHIndex] = useState(-1)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }) }, [lines])

  function run(raw: string) {
    const cmd = raw.trim().toLowerCase()
    const next: Line[] = [...lines, { kind: "in", text: raw }]

    if (cmd === "clear") { setLines(BANNER); return }

    if (cmd === "date") {
      const days = daysUntilBirthday()
      next.push({
        kind: "out",
        text:
          msUntilBirthday() <= 0 ? "it's your birthday. act normal."
          : days === 0 ? "later today. brace yourself."
          : `${days} day${days === 1 ? "" : "s"} until you get older.`,
      })
    } else if (cmd === "") {
      /* bare Enter just drops a line, like a real shell */
    } else {
      const hit = COMMANDS[cmd]
      const out = hit === undefined ? [NOT_FOUND(cmd)] : Array.isArray(hit) ? hit : [hit]
      out.forEach((t) => next.push({ kind: "out", text: t }))
    }

    next.push({ kind: "out", text: "" })
    setLines(next)
    if (cmd) { setHistory((h) => [raw, ...h]); setHIndex(-1) }
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="min-h-full bg-card p-4 font-mono text-[12.5px] leading-6"
    >
      {lines.map((l, i) => (
        <div key={i} className={`whitespace-pre-wrap ${l.kind === "in" ? "text-ink" : "text-ink-soft"}`}>
          {l.kind === "in" ? <span className="text-red">khinsa@os:~$ </span> : null}
          {l.text || "\u00A0"}
        </div>
      ))}

      <div className="flex items-center">
        <span className="shrink-0 text-red">khinsa@os:~$&nbsp;</span>
        <input
          ref={inputRef}
          value={draft}
          autoFocus
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { run(draft); setDraft("") }
            /* Up/down walk the history, same as a real shell. */
            else if (e.key === "ArrowUp") {
              e.preventDefault()
              const i = Math.min(hIndex + 1, history.length - 1)
              if (i >= 0) { setHIndex(i); setDraft(history[i]) }
            } else if (e.key === "ArrowDown") {
              e.preventDefault()
              const i = hIndex - 1
              setHIndex(i)
              setDraft(i >= 0 ? history[i] : "")
            }
          }}
          className="w-full flex-1 bg-transparent text-ink caret-red outline-none"
        />
      </div>
      <div ref={endRef} />
    </div>
  )
}
