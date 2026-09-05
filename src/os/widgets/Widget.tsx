import { motion } from "framer-motion"
import type { ReactNode } from "react"

/* The shared shell for every desk accessory: an edged paper card with a
   pinstriped title bar, draggable, sitting at a slight angle so the desk reads
   as things someone put down rather than a dashboard. */
export function Widget({
  title, children, rotate = 0, delay = 0, width,
}: {
  title: string
  children: ReactNode
  /** Degrees. Keep it under ~2 — more reads as broken, not casual. */
  rotate?: number
  delay?: number
  width: number
}) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 14, rotate }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ delay, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      whileDrag={{ rotate: 0, scale: 1.03, cursor: "grabbing", zIndex: 30 }}
      style={{ width }}
      className="edge-lg relative shrink-0 cursor-grab bg-card"
    >
      <div className="pinstripe flex h-6 items-center border-b border-ink px-2">
        <span className="mx-auto bg-card px-2 font-chrome text-[9px] tracking-tight text-ink">
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  )
}
