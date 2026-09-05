import type { ReactNode } from "react"
import { motion, useDragControls } from "framer-motion"
import type { AppDef, WindowState } from "./types"

interface Props {
  app: AppDef
  win: WindowState
  isMobile: boolean
  focused: boolean
  onFocus: () => void
  onClose: () => void
  onMove: (x: number, y: number) => void
  children: ReactNode
}

export function Window({ app, win, isMobile, focused, onFocus, onClose, onMove, children }: Props) {
  const controls = useDragControls()

  /* Focus is signalled by pinstripes, not colour — exactly how the original
     did it. An unfocused window's title bar is simply blank. */
  const chrome = (
    <div
      onPointerDown={(e) => { if (!isMobile) controls.start(e) }}
      className={`relative flex h-7 shrink-0 touch-none select-none items-center border-b border-ink px-1.5 ${
        focused ? "pinstripe" : "bg-card"
      }`}
      style={{ cursor: isMobile ? "default" : "grab" }}
    >
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onClose}
        aria-label={`Close ${app.label}`}
        className="grid h-[13px] w-[13px] shrink-0 place-items-center border border-ink bg-card text-[8px] leading-none text-ink hover:bg-red hover:text-card"
      >
        ✕
      </button>

      {/* The title sits in a card-coloured cartouche that masks the stripes. */}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap bg-card px-2 font-chrome text-[10px] tracking-tight text-ink">
        {app.label}
      </span>
    </div>
  )

  /* Phones get full-screen sheets. Dragging a 340px window around a 375px
     viewport is misery, so there is no window management on mobile. */
  if (isMobile) {
    return (
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className="fixed inset-x-0 bottom-0 top-7 flex flex-col border-t border-ink bg-card"
        style={{ zIndex: 40 + win.z }}
      >
        {chrome}
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onPointerDown={onFocus}
      onDragEnd={(_, info) => onMove(win.x + info.offset.x, win.y + info.offset.y)}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className="edge-lg absolute flex flex-col overflow-hidden bg-card"
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: 40 + win.z }}
    >
      {chrome}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </motion.div>
  )
}
