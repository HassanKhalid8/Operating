/* ═══════════════════════════════════════════════════════════
   Everything the desk pet says. It is named after you, so every
   line should sound like you being needy on purpose.

   Keep them SHORT — they render in a speech bubble about 200px
   wide and they are gone in four seconds.
   ═══════════════════════════════════════════════════════════ */

/** First thing it says, if she has never petted it. */
export const GREET = [
  "oi. yes, you. pet me.",
  "main hoon. tap kar do ek baar.",
]

/** When she pets it. */
export const PETTED = [
  "haan haan, aur.",
  "ok that was acceptable.",
  "theek hai. i forgive you. mostly.",
  "again. i said again.",
  "you have good hands. that is all you have.",
  "🙂",
]

/** Every tenth pet — she is clearly into it now. */
export const SPOILED = [
  "you have petted me ten times. get a hobby.",
  "ok this is officially a lot of attention. continue.",
]

/** ~30 seconds since the last pet. Mildly put out. */
export const BORED = [
  "hello?",
  "so we are just ignoring me.",
  "koi baat nahi. main theek hoon.",
  "i can wait. i have nothing else.",
]

/** ~80 seconds. Actively complaining. */
export const NEEDY = [
  "PET. ME.",
  "yaar ek tap ki baat hai.",
  "i am RIGHT here.",
  "this is the worst birthday of my life and it is not even my birthday.",
]

/** ~2.5 minutes. Given up. */
export const SAD = [
  "it is fine. i am used to it.",
  "you do this to me on whatsapp too.",
  "left on read. by a desktop icon. new low.",
  "mummy said you would come back.",
]

/** She closed the tab and came back later. */
export const AWAY = [
  "OH. you are alive.",
  "kahan thi. i counted every hour.",
  "no no, take your time, i only live here.",
]
