import { useEffect, useRef, useState } from "react"
import { getPin, pinDoodle, pinSrc, updatePin } from "../lib/pins"
import { clearEdit, useEditing } from "../lib/editing"
import { CONFIG } from "../content/config"
import { CLEARED, HINT, PINNED, SAVED, SENT, SHARE_TEXT, UPDATED } from "../content/doodle"

/* ═══════════════════════════════════════════════════════════
   Doodle — MacPaint, roughly.

   One opaque canvas at a fixed logical size, scaled to fit whatever space
   the window has. Fixed size matters: strokes then look the same on her
   phone as on a laptop, and the export is predictable. The ground is
   painted card-cream rather than left transparent, so the eraser is simply
   "draw in the background colour", and the PNG she sends is not a black
   rectangle in a mail client's dark mode.
   ═══════════════════════════════════════════════════════════ */

const W = 880
const H = 560
/** What gets written to localStorage when she pins one. Small on purpose. */
const PIN_WIDTH = 440
const PAPER = "#fdfbf6"
/** Undo depth. Each step is a full off-screen copy, so this is a memory budget. */
const HISTORY = 10

type Tool = "pen" | "marker" | "pencil" | "dither" | "eraser" | "fill"

const TOOLS: { id: Tool; glyph: string; label: string }[] = [
  { id: "pen", glyph: "✒", label: "PEN" },
  { id: "marker", glyph: "▬", label: "MARKER" },
  { id: "pencil", glyph: "✎", label: "PENCIL" },
  { id: "dither", glyph: "░", label: "SPRAY" },
  { id: "eraser", glyph: "◻", label: "ERASER" },
  { id: "fill", glyph: "◧", label: "FILL" },
]

const SIZES = [3, 8, 16, 30]

/* A limited palette, the way an old machine had one. The first four are the
   OS's own accents, so a doodle always looks like it belongs on this desk. */
const SWATCHES = [
  "#1a1714", "#c8452d", "#3b5b7a", "#6a7146", "#d79b2c",
  "#c2708b", "#2f6f6a", "#6b5b8a", "#8a5a34", "#a2988a",
]

const pick = (lines: readonly string[]) => lines[Math.floor(Math.random() * lines.length)]

export function Doodle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const dprRef = useRef(1)
  const undoRef = useRef<HTMLCanvasElement[]>([])
  const drawing = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const [tool, setTool] = useState<Tool>("pen")
  const [size, setSize] = useState(8)
  const [color, setColor] = useState(SWATCHES[0])
  const [caption, setCaption] = useState("")
  const [canUndo, setCanUndo] = useState(false)
  const [toast, setToast] = useState("")
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle")

  /* Set by clicking a doodle on the desk: that drawing is loaded onto the
     canvas and Save writes back to the same card. */
  const editing = useEditing("doodle")
  const loaded = useRef<string | null>(null)

  /* ── surface ── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    /* Capped at 2: a 3x phone would allocate a 2640x1680 buffer and make the
       flood fill crawl for no visible gain. */
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    dprRef.current = dpr
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, W, H)
    ctxRef.current = ctx
  }, [])

  /* ── opening a pinned drawing ── */
  useEffect(() => {
    const ctx = ctxRef.current
    if (!ctx) return

    if (!editing) {
      /* Opened from the icon instead: a blank page, but only if a drawing was
         loaded before — otherwise this would wipe her work on every render. */
      if (loaded.current) {
        loaded.current = null
        undoRef.current = []
        setCanUndo(false)
        blank(ctx)
      }
      return
    }
    if (loaded.current === editing) return

    const pin = getPin(editing)
    if (!pin) return
    loaded.current = editing
    setCaption(pin.caption)

    const img = new Image()
    /* The full-size copy lives on Supabase's domain, and a canvas that has
       drawn a cross-origin image without this cannot be exported at all —
       toDataURL throws and Save would be dead. */
    img.crossOrigin = "anonymous"
    img.onload = () => {
      blank(ctx)
      ctx.drawImage(img, 0, 0, W, H)
      undoRef.current = []
      setCanUndo(false)
    }
    /* If the cloud copy will not load — offline, or the project asleep — the
       small local thumbnail is better than an empty page. */
    img.onerror = () => {
      if (!pin.thumb || img.src === pin.thumb) return
      img.crossOrigin = null
      img.src = pin.thumb
    }
    img.src = pinSrc(pin)
  }, [editing])

  /** Wipes to bare paper. Shared by Clear and by loading a drawing. */
  function blank(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
    ctx.fillStyle = PAPER
    ctx.fillRect(0, 0, W, H)
    ctx.restore()
  }

  function say(line: string) {
    setToast(line)
    window.setTimeout(() => setToast((t) => (t === line ? "" : t)), 4000)
  }

  /* ── history ── */
  function snapshot() {
    const src = canvasRef.current
    if (!src) return
    const copy = document.createElement("canvas")
    copy.width = src.width
    copy.height = src.height
    copy.getContext("2d")?.drawImage(src, 0, 0)
    undoRef.current.push(copy)
    if (undoRef.current.length > HISTORY) undoRef.current.shift()
    setCanUndo(true)
  }

  function undo() {
    const prev = undoRef.current.pop()
    const ctx = ctxRef.current
    if (!prev || !ctx) return
    ctx.save()
    /* Snapshots are in device pixels, so the 1:1 transform goes back on for
       the duration of the redraw. */
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
    ctx.drawImage(prev, 0, 0)
    ctx.restore()
    setCanUndo(undoRef.current.length > 0)
  }

  function clear() {
    const ctx = ctxRef.current
    if (!ctx) return
    snapshot()
    blank(ctx)
    say(pick(CLEARED))
  }

  /** Stop editing that card and start a fresh page. */
  function fresh() {
    const ctx = ctxRef.current
    clearEdit()
    loaded.current = null
    setCaption("")
    undoRef.current = []
    setCanUndo(false)
    if (ctx) blank(ctx)
  }

  /* ── brushes ──
     Each one only sets context state; the caller wraps a stroke in
     save/restore so nothing leaks into the next one. */
  function begin(ctx: CanvasRenderingContext2D) {
    ctx.globalCompositeOperation = "source-over"
    ctx.globalAlpha = 1
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = size

    if (tool === "marker") {
      /* Multiply so overlapping passes darken, the way a real marker does. */
      ctx.globalCompositeOperation = "multiply"
      ctx.globalAlpha = 0.42
      ctx.lineWidth = size * 2.1
    }
    if (tool === "eraser") {
      ctx.strokeStyle = PAPER
      ctx.lineWidth = size * 2
    }
  }

  /** Draws one segment. Pencil and spray scatter instead of stroking. */
  function segment(
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ) {
    if (tool === "pencil") {
      const dx = to.x - from.x
      const dy = to.y - from.y
      const steps = Math.max(1, Math.round(Math.hypot(dx, dy) / 1.1))
      const jitter = size * 0.42
      const r = Math.max(0.35, size * 0.16)
      ctx.globalAlpha = 0.42
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        for (let n = 0; n < 2; n++) {
          ctx.beginPath()
          ctx.arc(
            from.x + dx * t + (Math.random() - 0.5) * jitter,
            from.y + dy * t + (Math.random() - 0.5) * jitter,
            r, 0, Math.PI * 2,
          )
          ctx.fill()
        }
      }
      return
    }

    if (tool === "dither") {
      /* Scattered along the segment rather than around the last point: a fast
         swipe fires pointer events tens of pixels apart, and dusting only
         where they landed leaves a row of separate blobs. */
      const dx = to.x - from.x
      const dy = to.y - from.y
      const steps = Math.max(1, Math.round(Math.hypot(dx, dy) / 2))
      const perStep = Math.max(1, Math.round(size * 0.35))
      const radius = size * 1.15
      ctx.globalAlpha = 0.5
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const cx = from.x + dx * t
        const cy = from.y + dy * t
        for (let n = 0; n < perStep; n++) {
          const a = Math.random() * Math.PI * 2
          const d = Math.sqrt(Math.random()) * radius
          ctx.beginPath()
          ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.7, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      return
    }

    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  /* ── paint bucket ──
     Scanline flood fill over the whole buffer. The tolerance is loose enough
     to swallow the anti-aliased fringe of a stroke, which is the difference
     between "filled the shape" and "filled the shape and left a grey outline
     of the old edge behind". */
  function floodFill(x: number, y: number) {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    const dpr = dprRef.current
    const w = canvas.width
    const h = canvas.height
    const sx = Math.min(w - 1, Math.max(0, Math.round(x * dpr)))
    const sy = Math.min(h - 1, Math.max(0, Math.round(y * dpr)))

    const img = ctx.getImageData(0, 0, w, h)
    const px = img.data
    const start = (sy * w + sx) * 4
    const tr = px[start]
    const tg = px[start + 1]
    const tb = px[start + 2]

    const rgb = hexToRgb(color)
    const TOL = 60

    /* If the seed already is the fill colour, every pixel would keep matching
       after being written and the stack would never drain. */
    if (Math.abs(rgb[0] - tr) + Math.abs(rgb[1] - tg) + Math.abs(rgb[2] - tb) <= TOL) return

    const matches = (i: number) => {
      const p = i * 4
      return Math.abs(px[p] - tr) + Math.abs(px[p + 1] - tg) + Math.abs(px[p + 2] - tb) <= TOL
    }

    const stack = [sy * w + sx]
    while (stack.length) {
      const seed = stack.pop() as number
      const py = Math.floor(seed / w)
      const seedX = seed % w
      let left = seedX
      while (left >= 0 && matches(py * w + left)) left--
      left++
      let right = seedX
      while (right < w && matches(py * w + right)) right++
      right--

      for (let cx = left; cx <= right; cx++) {
        const p = (py * w + cx) * 4
        px[p] = rgb[0]
        px[p + 1] = rgb[1]
        px[p + 2] = rgb[2]
        px[p + 3] = 255
        if (py > 0 && matches((py - 1) * w + cx)) stack.push((py - 1) * w + cx)
        if (py < h - 1 && matches((py + 1) * w + cx)) stack.push((py + 1) * w + cx)
      }
    }

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.putImageData(img, 0, 0)
    ctx.restore()
  }

  /* ── pointer ── */
  function at(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) * W) / rect.width,
      y: ((e.clientY - rect.top) * H) / rect.height,
    }
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = ctxRef.current
    if (!ctx) return
    /* Keeps the stroke following her finger past the edge of the canvas.
       Throws if the pointer has already been released, which a fast tap on a
       slow phone can manage — and an uncaught throw here would kill the stroke. */
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* carry on */ }
    const p = at(e)
    snapshot()

    if (tool === "fill") {
      floodFill(p.x, p.y)
      return
    }

    drawing.current = true
    last.current = p
    ctx.save()
    begin(ctx)
    /* A tap with no drag should still leave a mark. */
    segment(ctx, p, { x: p.x + 0.01, y: p.y })
    ctx.restore()
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = ctxRef.current
    if (!drawing.current || !ctx) return
    const p = at(e)
    ctx.save()
    begin(ctx)
    segment(ctx, last.current, p)
    ctx.restore()
    last.current = p
  }

  function onUp() {
    drawing.current = false
  }

  /* ── output ── */
  function scaled(width: number) {
    const src = canvasRef.current
    if (!src) return ""
    const out = document.createElement("canvas")
    out.width = width
    out.height = Math.round((width * H) / W)
    const ctx = out.getContext("2d")
    if (!ctx) return ""
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(src, 0, 0, out.width, out.height)
    return out.toDataURL("image/png")
  }

  function pin() {
    const thumb = scaled(PIN_WIDTH)
    if (!thumb) return
    if (editing) {
      updatePin(editing, thumb, canvasRef.current?.toDataURL("image/png") ?? thumb, caption.trim())
      say(UPDATED)
      return
    }
    /* Two copies: the small one is what this device stores and renders, the
       full one is what goes to the cloud so it survives her clearing the tab
       and follows her to another phone. */
    pinDoodle(thumb, canvasRef.current?.toDataURL("image/png") ?? thumb, caption.trim())
    setCaption("")
    say(pick(PINNED))
  }

  /** Her caption, made safe for a filesystem. */
  function filename() {
    const slug = caption.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase()
    return `${slug || "doodle"}.png`
  }

  async function send() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"))
    if (!blob) return

    const name = filename()

    /* First choice: hand it to the mail endpoint, which sends it from a real
       mailbox with the PNG attached. She taps once and it is gone — no share
       sheet, no attaching anything by hand, nothing for her to get wrong. */
    setSendState("sending")
    try {
      const res = await fetch("/api/send-doodle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: caption.trim(),
          filename: name,
          png: canvas.toDataURL("image/png"),
        }),
      })
      if (res.ok) {
        /* The button itself becomes the receipt — a line of text under the
           canvas is easy to miss on a phone. */
        setSendState("sent")
        setCaption("")
        say(SENT)
        window.setTimeout(() => setSendState("idle"), 5000)
        return
      }
    } catch {
      /* No endpoint (running `vite` rather than `vercel dev`), or it is down.
         Fall through to the ways that need no server at all. */
    }
    setSendState("idle")

    /* Second choice: her phone's share sheet, with the PNG attached. Note that
       "sent" is never shown for these two — nobody can promise a share sheet
       ended in a message, and a receipt that might be lying is worse than none. */
    const file = new File([blob], name, { type: "image/png" })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: SHARE_TEXT })
        say(SENT)
      } catch {
        /* She backed out of the share sheet. Not an error. */
      }
      return
    }

    /* Last resort: save the PNG and open her mail client. mailto: cannot carry
       an attachment, so this is the one route where she attaches it herself. */
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = name
    a.click()
    URL.revokeObjectURL(url)

    const subject = encodeURIComponent(`a doodle from ${CONFIG.name}`)
    const body = encodeURIComponent(`${SHARE_TEXT}

(attach the png that just downloaded)`)
    window.location.href = `mailto:${CONFIG.contact.email}?subject=${subject}&body=${body}`
    say("saved the png — attach it to the mail that just opened.")
  }

  function download() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename()
      a.click()
      URL.revokeObjectURL(url)
      say(SAVED)
    }, "image/png")
  }

  return (
    <div className="flex min-h-full flex-col bg-paper sm:flex-row">
      {/* ── tool palette ──
           Below the canvas on a phone, beside it on a desktop: a 142px column
           taken out of a 375px screen leaves nothing to draw on. */}
      <div className="order-2 shrink-0 border-t border-ink/25 bg-card p-3 sm:order-1 sm:w-[142px] sm:border-r sm:border-t-0">
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              aria-pressed={tool === t.id}
              className={`flex flex-col items-center gap-0.5 border border-ink px-1 py-1.5 ${
                tool === t.id ? "bg-ink text-card" : "bg-paper text-ink hover:bg-shade"
              }`}
            >
              <span className="text-[13px] leading-none">{t.glyph}</span>
              <span className="font-chrome text-[7px] leading-none tracking-tight">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 font-chrome text-[8px] tracking-tight text-ink-faint">NIB</div>
        <div className="mt-1 flex gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              aria-label={`Nib ${s}`}
              className={`grid h-7 flex-1 place-items-center border border-ink ${
                size === s ? "bg-ink" : "bg-paper hover:bg-shade"
              }`}
            >
              <span
                className="rounded-full"
                style={{
                  width: Math.min(14, 3 + s * 0.36),
                  height: Math.min(14, 3 + s * 0.36),
                  background: size === s ? "var(--color-card)" : "var(--color-ink)",
                }}
              />
            </button>
          ))}
        </div>

        <div className="mt-3 font-chrome text-[8px] tracking-tight text-ink-faint">INK</div>
        <div className="mt-1 grid grid-cols-10 gap-1 sm:grid-cols-5">
          {/* Picking a colour while erasing means she wants to draw again. */}
          {SWATCHES.map((hex) => (
            <button
              key={hex}
              onClick={() => { setColor(hex); if (tool === "eraser") setTool("pen") }}
              aria-label={`Colour ${hex}`}
              className={`h-6 w-6 border border-ink transition-transform ${
                color === hex ? "scale-110 shadow-[2px_2px_0_var(--edge-shadow-lg)]" : "hover:-translate-y-0.5"
              }`}
              style={{ background: hex }}
            />
          ))}
          {/* The escape hatch, for when ten colours is not ten colours. */}
          <label
            className="relative grid h-6 w-6 cursor-pointer place-items-center border border-ink bg-card font-chrome text-[8px] text-ink-soft hover:bg-shade"
            title="Any other colour"
          >
            +
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>

        <p className="mt-3 hidden font-serif text-[12px] italic leading-snug text-ink-faint sm:block">
          {HINT}
        </p>
      </div>

      {/* ── canvas ── */}
      {/* flex-none in the column direction: letting this grow on a phone
           pushes the tool palette to the bottom of the sheet with a field of
           empty paper above it. */}
      <div className="order-1 flex min-w-0 flex-none flex-col p-3 sm:order-2 sm:flex-1 sm:p-4">
        <div className="edge bg-card p-1.5">
          <canvas
            ref={canvasRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="block w-full touch-none select-none"
            style={{ aspectRatio: `${W} / ${H}`, cursor: "crosshair" }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card disabled:opacity-35 disabled:hover:bg-card disabled:hover:text-ink"
          >
            ↶ UNDO
          </button>
          <button
            onClick={clear}
            className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-red hover:text-card"
          >
            CLEAR
          </button>
          {editing && (
            <button
              onClick={fresh}
              className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card"
            >
              + NEW
            </button>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={40}
            placeholder="name it (optional)"
            className="edge-in min-w-0 flex-1 basis-32 bg-card px-2 py-1.5 font-serif text-[13px] text-ink outline-none placeholder:text-ink-faint/70"
          />

          <button
            onClick={pin}
            className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card"
          >
            {editing ? "✓ SAVE CHANGES" : "✓ PIN TO DESK"}
          </button>
          <button
            onClick={download}
            className="edge bg-card px-3 py-1.5 font-chrome text-[9px] tracking-tight text-ink hover:bg-ink hover:text-card"
          >
            ⤓ PNG
          </button>
          <button
            onClick={send}
            disabled={sendState !== "idle"}
            className={`edge px-3 py-1.5 font-chrome text-[9px] tracking-tight disabled:opacity-100 ${
              sendState === "sent"
                ? "bg-olive text-card"
                : "bg-red text-card hover:bg-ink disabled:opacity-60"
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
    </div>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
