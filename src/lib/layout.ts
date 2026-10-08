import { useState } from "react"
import { load, save } from "./store"

/* ═══════════════════════════════════════════════════════════
   Where she has put things.

   Icons, desk cards and windows all stay where she leaves them, the way
   they do on a real machine. Kept in this browser only and deliberately
   not synced: a position is in pixels of one particular screen, and the
   spot she chose on her laptop means nothing on her phone.
   ═══════════════════════════════════════════════════════════ */

export interface Cell {
  /** Counted from the right edge, the way desktop icons line up. */
  c: number
  r: number
}

export interface Point {
  x: number
  y: number
}

/** A position map persisted under one key. */
export function useLayout<T>(key: string) {
  const [map, setMap] = useState<Record<string, T>>(() => load<Record<string, T>>(key, {}))
  const update = (next: (m: Record<string, T>) => Record<string, T>) =>
    setMap((m) => {
      const out = next(m)
      save(key, out)
      return out
    })
  return [map, update] as const
}

export const ICONS_KEY = "khinsaos.layout.icons.v1"
export const DESK_KEY = "khinsaos.layout.desk.v1"
export const WINDOWS_KEY = "khinsaos.layout.windows.v1"

/** Gives every icon a cell. The ones she placed keep theirs if it still
    exists on this screen; everything else fills the free cells top to bottom,
    then the next column in — so a short screen grows a second column instead
    of pushing the last icons off the bottom. */
export function resolveIcons(ids: string[], placed: Record<string, Cell>, rows: number, cols: number) {
  const taken = new Set<string>()
  const out: Record<string, Cell> = {}
  const keyOf = (cell: Cell) => `${cell.c}:${cell.r}`

  for (const id of ids) {
    const cell = placed[id]
    if (!cell || cell.c >= cols || cell.r >= rows || taken.has(keyOf(cell))) continue
    out[id] = cell
    taken.add(keyOf(cell))
  }

  let c = 0
  let r = 0
  for (const id of ids) {
    if (out[id]) continue
    while (taken.has(`${c}:${r}`)) {
      r += 1
      if (r >= rows) { r = 0; c += 1 }
    }
    out[id] = { c, r }
    taken.add(`${c}:${r}`)
  }
  return out
}
