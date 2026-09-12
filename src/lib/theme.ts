import { useSyncExternalStore } from "react"
import { load, save } from "./store"
import { cloudEnabled, getState, putState } from "./cloud"

/* ═══════════════════════════════════════════════════════════
   Themes.

   Each one is nothing but a block of CSS variables in index.css,
   switched by a data-theme attribute on <html>. Warm paper is the
   default and the palette the whole desk was designed in — the rest
   are hers to mess with.

   Her choice is written to this device immediately and to the cloud
   right after, so the desk is never repainting itself a second after it
   loads, and picking Bubblegum on her phone means Bubblegum on her
   laptop too.
   ═══════════════════════════════════════════════════════════ */

export type ThemeId = "paper" | "blueprint" | "midnight" | "bubblegum"

/** Order is menu order. The note is what it says under her cursor. */
export const THEMES: { id: ThemeId; label: string; note: string }[] = [
  { id: "paper", label: "Warm Paper", note: "how it is meant to look" },
  { id: "blueprint", label: "Blueprint", note: "white ink on blue" },
  { id: "midnight", label: "Midnight", note: "for 3am" },
  { id: "bubblegum", label: "Bubblegum", note: "you were always going to pick this" },
]

const KEY = "khinsaos.theme.v1"
const DEFAULT: ThemeId = "paper"

function valid(id: unknown): ThemeId {
  return THEMES.some((t) => t.id === id) ? (id as ThemeId) : DEFAULT
}

let current: ThemeId = valid(load<ThemeId>(KEY, DEFAULT))
const subscribers = new Set<() => void>()

/* Applied on import rather than from an effect, so the desk is already the
   right colour on the first paint instead of flashing cream first. */
apply(current)

function apply(id: ThemeId) {
  document.documentElement.dataset.theme = id
}

export function setTheme(id: ThemeId, sync = true) {
  const next = valid(id)
  if (next === current && !sync) return
  current = next
  apply(current)
  save(KEY, current)
  subscribers.forEach((fn) => fn())
  if (sync && cloudEnabled) void putState("theme", current)
}

/** Pulls the theme chosen on any device. Runs once, at startup. */
export async function syncTheme() {
  if (!cloudEnabled) return
  const remote = await getState<ThemeId>("theme")
  /* No row yet means she has never picked one anywhere. Seed it from this
     device rather than leaving the first load on another device blank. */
  if (remote === null) {
    void putState("theme", current)
    return
  }
  if (valid(remote) !== current) setTheme(remote, false)
}

export function useTheme() {
  return useSyncExternalStore(
    (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
    () => current,
  )
}
