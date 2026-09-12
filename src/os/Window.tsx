import { useEffect, type ReactNode } from "react"
import { motion, useDragControls, useMotionValue } from "framer-motion"
import type { AppDef, WindowState } from "./types"

interface Props {
  app: AppDef
  win: WindowState
  isMobile: boolean
  focused: boolean
  /** Viewport, so a window can never be dragged somewhere she can't grab it. */
  viewport: { w: number; h: number }
  onFocus: () => void
  onClose: () => void
  onMove: (x: number, y: number) => void
  children: ReactNode
}

/** How much of a window must stay on screen. Below this its title bar becomes
    unreachable and the only way back is a reload. */
const KEEP = 140
/** Height of the menu bar, which the window layer starts below. */
const MENU = 28

export function Window({
  app, win, isMobile, focused, viewport, onFocus, onClose, onMove, children,
}: Props) {
  const controls = useDragControls()

  /* Position IS the transform. The obvious version — CSS left/top, moved by
     the drag offset afterwards — applies the same offset twice, because the
     transform framer wrote during the drag is still on the element when the
     new left/top lands. Driving x/y directly means there is one number for
     where the window is, and dragging edits it in place. */
  const x = useMotionValue(win.x)
  const y = useMotionValue(win.y)

  /* She can push a window most of the way off any edge — that is what makes a
     desk feel like a desk — but never so far that the title bar goes with it. */
  const constraints = {
    left: KEEP - win.w,
    right: viewport.w - KEEP,
    top: 0,
    bottom: viewport.h - MENU - 40,
  }

  /* Constraints are only enforced while dragging, so a window parked at the
     right edge would be stranded off-screen if the browser window shrank
     under it. Pull it back the moment that happens. */
  useEffect(() => {
    if (isMobile) return
    x.set(Math.min(Math.max(x.get(), constraints.left), constraints.right))
    y.set(Math.min(Math.max(y.get(), constraints.top), constraints.bottom))
  }, [viewport.w, viewport.h, isMobile, x, y, constraints.left, constraints.right, constraints.top, constraints.bottom])

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
        className="pointer-events-auto fixed inset-x-0 bottom-0 top-7 flex flex-col border-t border-ink bg-card"
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
      dragConstraints={constraints}
      onPointerDown={onFocus}
      onDragEnd={() => onMove(x.get(), y.get())}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className="edge-lg pointer-events-auto absolute left-0 top-0 flex flex-col overflow-hidden bg-card"
      style={{ x, y, width: win.w, height: win.h, zIndex: 40 + win.z }}
    >
      {chrome}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </motion.div>
  )
}
