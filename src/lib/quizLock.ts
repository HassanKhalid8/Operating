import { useSyncExternalStore } from "react"
import { load, save } from "./store"

/* ═══════════════════════════════════════════════════════════
   The quiz lock.

   While a quiz is in progress the rest of the machine is switched off:
   the quiz window loses its close button, every other window, icon,
   widget and the menu bar go inert, and leaving the page asks first.
   The quiz sets it and the desk obeys, and neither imports the other.

   The flag is kept in localStorage as well, so reloading the page is
   not a way out — the desk reopens the quiz, still locked, exactly
   where she left it.
   ═══════════════════════════════════════════════════════════ */

const KEY = "khinsa.quiz.locked"

let locked = load<boolean>(KEY, false)
const subscribers = new Set<() => void>()

function onBeforeUnload(e: BeforeUnloadEvent) {
  /* Browsers show their own generic "leave site?" wording; setting
     returnValue is what makes them show it at all. */
  e.preventDefault()
  e.returnValue = ""
}

function sync() {
  if (locked) window.addEventListener("beforeunload", onBeforeUnload)
  else window.removeEventListener("beforeunload", onBeforeUnload)
}
sync()

export function setQuizLocked(next: boolean) {
  if (locked === next) return
  locked = next
  save(KEY, next)
  sync()
  subscribers.forEach((fn) => fn())
}

export function isQuizLocked() {
  return locked
}

function subscribe(fn: () => void) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function useQuizLocked() {
  return useSyncExternalStore(subscribe, () => locked)
}
