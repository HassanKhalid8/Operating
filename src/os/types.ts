import type { ComponentType } from "react"

export type AppId =
  | "photos" | "terminal" | "wrapped" | "locked"
  | "recordings" | "vault" | "bin" | "settings" | "rishta" | "music"

export type Accent = "red" | "blue" | "olive" | "ink"

export interface AppDef {
  id: AppId
  /** Shown under the desktop icon and in the window title bar. */
  label: string
  /** Single glyph. Kept to text so there are no image assets to load. */
  glyph: string
  accent: Accent
  /** Default window size in px. Ignored on mobile — everything is full-screen. */
  size: { w: number; h: number }
  Body: ComponentType
}

export interface WindowState {
  id: AppId
  x: number
  y: number
  w: number
  h: number
  z: number
}
