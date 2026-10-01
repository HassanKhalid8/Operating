import type { AppDef } from "./types"
import { Rishta } from "../apps/Rishta"
import { Music } from "../apps/Music"
import { Doodle } from "../apps/Doodle"
import { Notepad } from "../apps/Notepad"
import { Trash } from "../apps/Trash"
import { Quiz } from "../apps/Quiz"
import { Film } from "../apps/Film"
import { Numbers } from "../apps/Numbers"
import { Court } from "../apps/Court"
import { Gpt } from "../apps/Gpt"
import { Terms } from "../apps/Terms"
import { Placeholder } from "../apps/Placeholder"

export const APPS: AppDef[] = [
  { id: "music", label: "Tape Deck", glyph: "♫", accent: "olive", size: { w: 480, h: 600 },
    Body: Music },

  { id: "doodle", label: "Doodle", glyph: "✎", accent: "red", size: { w: 820, h: 660 },
    Body: Doodle },

  { id: "notepad", label: "Notepad", glyph: "✐", accent: "blue", size: { w: 560, h: 620 },
    Body: Notepad },

  { id: "rishta", label: "Rishta", glyph: "♡", accent: "red", size: { w: 560, h: 640 },
    Body: Rishta },

  { id: "film", label: "Premiere", glyph: "❀", accent: "red", size: { w: 440, h: 780 },
    Body: Film },

  { id: "quiz", label: "The Quiz", glyph: "?", accent: "blue", size: { w: 560, h: 640 },
    Body: Quiz },

  { id: "wrapped", label: "The Numbers", glyph: "✦", accent: "red", size: { w: 460, h: 640 },
    Body: Numbers },

  { id: "court", label: "The Court", glyph: "⚖", accent: "red", size: { w: 580, h: 680 },
    Body: Court },

  { id: "gpt", label: "KhinsaGPT", glyph: "✺", accent: "olive", size: { w: 460, h: 620 },
    Body: Gpt },

  { id: "terms", label: "The Terms", glyph: "§", accent: "blue", size: { w: 600, h: 660 },
    Body: Terms },

  { id: "bin", label: "Trash", glyph: "♺", accent: "blue", size: { w: 560, h: 480 },
    Body: Trash },

  { id: "locked", label: "Sealed", glyph: "✉", accent: "olive", size: { w: 560, h: 560 },
    Body: Placeholder },
]

export const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a])) as Record<string, AppDef>
