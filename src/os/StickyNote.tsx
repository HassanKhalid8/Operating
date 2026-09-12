import { motion } from "framer-motion"

/* A Note Pad page left on the desktop. It is the only instruction she gets,
   and it is deliberately vague — the point is that she pokes at things. */
export function StickyNote() {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, y: 14, rotate: -1.4 }}
      animate={{ opacity: 1, y: 0, rotate: -1.4 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileDrag={{ rotate: 0, scale: 1.02, cursor: "grabbing", zIndex: 30 }}
      className="edge-lg relative w-[268px] shrink-0 cursor-grab bg-card px-5 pb-5 pt-4"
    >
      {/* ruled lines, like a Note Pad page */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-9 opacity-[0.55]"
        style={{
          /* Mixed from the palette rather than a fixed blue, so the ruling
             survives a theme change instead of vanishing into a dark ground. */
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0 21px, color-mix(in srgb, var(--color-blue) 24%, transparent) 21px 22px)",
        }}
      />
      <div className="relative">
        <div className="mb-2 font-chrome text-[9px] tracking-tight text-ink-faint">NOTE PAD</div>
        <p className="font-serif text-[15px] leading-[22px] text-ink">
          Everything on this desk opens.
          <br />
          Most of it is lying to you.
          <br />
          One of them isn’t.
        </p>
        <p className="mt-3 font-serif text-[13px] italic leading-[22px] text-ink-soft">
          Start with <span className="not-italic text-red">Doodle</span>. Draw me something
          terrible.
        </p>
      </div>
    </motion.div>
  )
}
