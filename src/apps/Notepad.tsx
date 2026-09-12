import { useEffect, useRef, useState } from "react"
import { getNote, MAX_BODY, pinNote, updateNote } from "../lib/notes"
import { clearEdit, useEditing } from "../lib/editing"
import { CONFIG } from "../content/config"
import {
  NOTE_CLEARED, NOTE_HINT, NOTE_PINNED, NOTE_SAVED, NOTE_SENT, NOTE_UPDATED,
} from "../content/notepad"

/* ═══════════════════════════════════════════════════════════
   Notepad — Doodle, for people who use words.

   Same four things it can do: pin it to the desk, put it in the Trash,
   mail it to you, save it to her device. The one difference is that a
   note stays text all the way through — it is not drawn to an image —
   so what lands in your inbox is something you can read in the preview
   line, and what she saves is a .txt she can open anywhere.
   ═══════════════════════════════════════════════════════════ */

const pick = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)]

export function Notepad() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [toast, setToast] = useState("")
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle")

  /* Set by clicking a note on the desk: that note becomes the document in
     this window, and Save writes back to the same card. */
  const editing = useEditing("note")
  const loaded = useRef<string | null>(null)

  useEffect(() => {
    if (!editing) {
      /* Opened from the icon instead. Give her a blank page. */
      if (loaded.current) { loaded.current = null; setTitle(""); setBody("") }
      return
    }
    if (loaded.current === editing) return
    const note = getNote(editing)
    if (!note) return
    loaded.current = editing
    setTitle(note.title)
    setBody(note.body)
  }, [editing])

  const empty = body.trim().length === 0

  function say(line: string) {
    setToast(line)
    window.setTimeout(() => setToast((t) => (t === line ? "" : t)), 4000)
  }

  /** Her title, made safe for a filesystem. */
  function filename() {
    const slug = title.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase()
    return `${slug || "note"}.txt`
  }

  function pin() {
    if (empty) return
    if (editing) {
      updateNote(editing, title.trim(), body)
      say(NOTE_UPDATED)
      return
    }
    pinNote(title.trim(), body)
    setTitle("")
    setBody("")
    say(pick(NOTE_PINNED))
  }

  /** Stop editing that card and start a fresh page. */
  function blank() {
    clearEdit()
    loaded.current = null
    setTitle("")
    setBody("")
  }

  function clear() {
    if (empty) return
    blank()
    say(pick(NOTE_CLEARED))
  }

  function download() {
    if (empty) return
    const text = title.trim() ? `${title.trim()}\n\n${body}` : body
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename()
    a.click()
    URL.revokeObjectURL(url)
    say(NOTE_SAVED)
  }

  async function send() {
    if (empty) return
    setSendState("sending")
    try {
      const res = await fetch("/api/send-doodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: { title: title.trim(), body } }),
      })
      if (res.ok) {
        setSendState("sent")
        setTitle("")
        setBody("")
        say(NOTE_SENT)
        window.setTimeout(() => setSendState("idle"), 5000)
        return
      }
      /* Same rule as Doodle: only a missing endpoint falls through quietly. */
      if (res.status !== 404) {
        const said = await res.json().catch(() => null)
        const detail = said && typeof said.error === "string" ? said.error : `error ${res.status}`
        say(`couldn't mail it — ${detail}. sending it the long way instead.`)
      }
    } catch {
      /* No endpoint at all, or offline. Fall through to the ways that need no
         server. */
    }
    setSendState("idle")

    /* Her phone's share sheet, then her mail client. Text needs no attachment,
       so unlike a doodle the last resort here is actually a complete message. */
    const text = title.trim() ? `${title.trim()}\n\n${body}` : body
    if (navigator.share) {
      try {
        await navigator.share({ title: title.trim() || "a note", text })
        say(NOTE_SENT)
      } catch {
        /* She backed out of the share sheet. Not an error. */
      }
      return
    }

    const subject = encodeURIComponent(title.trim() || `a note from ${CONFIG.name}`)
    window.location.href =
      `mailto:${CONFIG.contact.email}?subject=${subject}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="flex min-h-full flex-col bg-paper p-3 sm:p-4">
      <div className="edge flex min-h-0 flex-1 flex-col bg-card">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={60}
          placeholder="title it (optional)"
          className="border-b border-ink/20 bg-transparent px-4 py-2.5 font-chrome text-[11px] tracking-tight text-ink outline-none placeholder:text-ink-faint/70"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_BODY))}
          placeholder={NOTE_HINT}
          spellCheck={false}
          className="min-h-[260px] flex-1 resize-none bg-transparent px-4 py-3 font-serif text-[15px] leading-[26px] text-ink outline-none placeholder:italic placeholder:text-ink-faint/70"
          /* Ruled lines behind the text, aligned to the 26px line height, so it
             reads as a Note Pad page rather than a form field. */
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 25px, color-mix(in srgb, var(--color-blue) 20%, transparent) 25px 26px)",
            backgroundAttachment: "local",
          }}
        />
        <div className="flex items-center justify-between border-t border-ink/15 px-4 py-1.5 font-mono text-[10px] text-ink-faint">
          <span>{body.length ? `${body.length} characters` : "empty"}</span>
          {body.length > MAX_BODY - 200 && <span className="text-red">nearly full</span>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={clear}
          disabled={empty}
          className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-red hover:text-card disabled:opacity-35 disabled:hover:bg-card disabled:hover:text-ink"
        >
          CLEAR
        </button>
        {editing && (
          <button
            onClick={blank}
            className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card"
          >
            + NEW
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={pin}
          disabled={empty}
          className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card disabled:opacity-35 disabled:hover:bg-card disabled:hover:text-ink"
        >
          {editing ? "✓ SAVE CHANGES" : "✓ PIN TO DESK"}
        </button>
        <button
          onClick={download}
          disabled={empty}
          className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card disabled:opacity-35 disabled:hover:bg-card disabled:hover:text-ink"
        >
          ⤓ TXT
        </button>
        <button
          onClick={send}
          disabled={empty || sendState !== "idle"}
          className={`edge px-3 py-1.5 font-chrome text-[9px] tracking-tight ${
            sendState === "sent"
              ? "bg-olive text-card disabled:opacity-100"
              : "bg-red text-card hover:bg-ink disabled:opacity-40"
          }`}
        >
          {sendState === "sending"
            ? "SENDING…"
            : sendState === "sent"
              ? "✓ SENT"
              : `✉ SEND TO ${CONFIG.from.toUpperCase()}`}
        </button>
      </div>

      {/* Fixed height, so the layout does not jump as lines come and go. */}
      <p className="mt-2 h-5 font-serif text-[13px] italic leading-5 text-ink-soft">{toast}</p>
    </div>
  )
}
