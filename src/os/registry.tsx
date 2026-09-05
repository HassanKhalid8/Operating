import type { AppDef } from "./types"
import { Terminal } from "../apps/Terminal"
import { Rishta } from "../apps/Rishta"
import { Music } from "../apps/Music"
import { Placeholder } from "../apps/Placeholder"

const stub = (note: string) => () => <Placeholder note={note} />

export const APPS: AppDef[] = [
  { id: "photos", label: "Photo Album", glyph: "▤", accent: "blue", size: { w: 720, h: 520 },
    Body: stub("The gallery. Day 3 — waiting on your photos and captions.") },

  { id: "terminal", label: "Terminal", glyph: "❯", accent: "ink", size: { w: 620, h: 440 },
    Body: Terminal },

  { id: "music", label: "Tape Deck", glyph: "♫", accent: "olive", size: { w: 480, h: 600 },
    Body: Music },

  { id: "rishta", label: "Rishta", glyph: "♡", accent: "red", size: { w: 560, h: 640 },
    Body: Rishta },

  { id: "wrapped", label: "The Numbers", glyph: "✦", accent: "red", size: { w: 460, h: 640 },
    Body: stub("Your year, in numbers. Day 5 — waiting on the WhatsApp export.") },

  { id: "recordings", label: "Recordings", glyph: "◍", accent: "ink", size: { w: 560, h: 420 },
    Body: stub("Voice notes and clips. Day 8.") },

  { id: "vault", label: "The Vault", glyph: "✥", accent: "olive", size: { w: 560, h: 520 },
    Body: stub("Four locks. Day 7 — waiting on your riddles.") },

  { id: "bin", label: "Trash", glyph: "♺", accent: "blue", size: { w: 520, h: 420 },
    Body: stub("Things we're leaving behind this year. Day 8.") },

  { id: "settings", label: "Controls", glyph: "✧", accent: "blue", size: { w: 520, h: 440 },
    Body: stub("Themes, and a slider that does nothing. Day 8.") },

  { id: "locked", label: "Sealed", glyph: "✉", accent: "olive", size: { w: 560, h: 560 },
    Body: stub("Sealed until 15 Sep, 00:00. Day 6 — waiting on the letter.") },
]

export const APP_BY_ID = Object.fromEntries(APPS.map((a) => [a.id, a])) as Record<string, AppDef>
