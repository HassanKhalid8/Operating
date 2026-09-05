import { useEffect, useState } from "react"

/** Windows are pointless below this width — apps become full-screen sheets. */
export function useIsMobile(breakpoint = 820) {
  const [is, setIs] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const on = () => setIs(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [breakpoint])
  return is
}

/** Ticks once a second. Used by the taskbar clock and the countdown. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}
