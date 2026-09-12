import { motion } from "framer-motion"
import { pinSrc, unpin, type Pin } from "../lib/pins"

/* One doodle she pinned, hung on the desk like a framed picture. Where it
   hangs is the desk's business, not this component's — it just draws the
   frame. They come back from localStorage, and from the cloud, on every
   visit: a doodle made in September is still on the desk in October. */
export function PinnedDoodle({ pin, index: i, onOpen }: {
  pin: Pin
  index: number
  onOpen: () => void
}) {
  return (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, y: 14, rotate: i % 2 ? 1.1 : -1.3 }}
          animate={{ opacity: 1, y: 0, rotate: i % 2 ? 1.1 : -1.3 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          whileDrag={{ rotate: 0, scale: 1.03, cursor: "grabbing", zIndex: 30 }}
          data-pin={pin.id}
          className="edge-lg group relative w-[256px] shrink-0 cursor-grab bg-card"
        >
          <div className="pinstripe flex h-6 items-center border-b border-ink px-2">
            <span className="mx-auto truncate bg-card px-2 font-chrome text-[9px] tracking-tight text-ink">
              {pin.caption || "UNTITLED"}
            </span>
          </div>

          <button
            onClick={onOpen}
            aria-label="Open Doodle"
            className="block w-full cursor-pointer p-2"
          >
            <img
              src={pinSrc(pin)}
              alt={pin.caption || "A doodle"}
              className="edge-in block w-full bg-paper"
              draggable={false}
              /* If the cloud copy has gone — deleted from the dashboard, or the
                 project asleep — fall back to this device's thumbnail rather
                 than hanging a broken-image icon on the desk. */
              onError={(e) => {
                const img = e.currentTarget
                if (pin.thumb && img.src !== pin.thumb) img.src = pin.thumb
                else img.closest("[data-pin]")?.setAttribute("hidden", "")
              }}
            />
          </button>

          {/* Always visible, like the close box on a window. It used to fade in
              on hover only — which meant that on a phone, where nothing hovers,
              it was an invisible button sitting on the corner of every card,
              and tapping the card to read it could bin it instead. */}
          <button
            onClick={() => unpin(pin.id)}
            aria-label="Take this one down"
            className="absolute right-1 top-1 grid h-[13px] w-[13px] place-items-center border border-ink bg-card text-[8px] leading-none text-ink opacity-45 transition-opacity hover:bg-red hover:text-card hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
          >
            ✕
          </button>
        </motion.div>
  )
}
