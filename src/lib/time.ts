import { CONFIG } from "../content/config"

/** Whole days still to go. Floor, not ceil, so the menu bar, the Calendar
    widget and the terminal never disagree while sitting on the same screen. */
export function daysUntilBirthday(now: number = Date.now()) {
  return Math.floor((CONFIG.birthday.getTime() - now) / 86_400_000)
}

export function msUntilBirthday(now: number = Date.now()) {
  return CONFIG.birthday.getTime() - now
}

/** Seconds as m:ss, for the tape deck and the Music window. */
export function clock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}
