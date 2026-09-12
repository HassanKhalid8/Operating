import type { AppDef } from "./types"
import { Rishta } from "../apps/Rishta"
import { Music } from "../apps/Music"
import { Doodle } from "../apps/Doodle"
import { Notepad } from "../apps/Notepad"
import { Trash } from "../apps/Trash"
import { Placeholder } from "../apps/Placeholder"

export const APPS: AppDef[] = [
  { id: "photos", label: "Photo Album", glyph: "▤", accent: "blue", size: { w: 720, h: 520 },
    Body: Placeholder },

  { id: "music", label: "Tape Deck", glyph: "♫", accent: "olive", size: { w: 480, h: 600 },
    Body: Music },

  { id: "doodle", label: "Doodle", glyph: "✎", accent: "red", size: { w: 820, h: 660 },
    Body: Doodle },

  { id: "notepad", label: "Notepad", glyph: "✐", accent: "blue", size: { w: 560, h: 620 },
    Body: Notepad },

  { id: "rishta", label: "Rishta", glyph: "♡", accent: "red", size: { w: 560, h: 640 },
    Body: Rishta },

  { id: "wrapped", label: "The Numbers", glyph: "✦", accent: "red", size: { w: 460, h: 640 },
    Body: Placeholder },

  { id: "vault", label: "The Vault", glyph: "✥", accent: "olive", size: { w: 560, h: 520 },
    Body: Placeholder },

  { id: "bin", label: "Trash", glyph: "♺", accent: "blue", size: { w: 560, h: 480 },
    Body: Trash },

  { id: "locked", label: "Sealed", glyph: "✉", accent: "olive", size: { w: 560, h: 560 },
    Body: Placeholder },
]

export const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a])) as Record<string, AppDef>
