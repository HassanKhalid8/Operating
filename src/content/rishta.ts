/* ═══════════════════════════════════════════════════════════
   RISHTA FINDER — content

   `label` is what shows on screen: trimmed and capitalised.
   `said` is her original wording, kept so nothing gets lost.

   Comedy rule for the roster: everyone clears at least fifteen
   requirements, so the one thing that ends them lands harder.
   ═══════════════════════════════════════════════════════════ */

export interface Criterion {
  id: string
  /** Shown on screen. */
  label: string
  /** Exactly how she wrote it. */
  said: string
}

export const CRITERIA: Criterion[] = [
  { id: "cute",       label: "Cute",                      said: "cute ho" },
  { id: "pyara",      label: "Pyara",                     said: "pyara ho" },
  { id: "lamba",      label: "Lamba",                     said: "lmba ho" },
  { id: "funny",      label: "Funny",                     said: "funny ho" },
  { id: "respectful", label: "Respectful",                said: "respectful ho" },
  { id: "moodswings", label: "Mood swings bardasht",      said: "mood swings brdasht kry" },
  { id: "stand",      label: "Stand leta hai",            said: "stand ley mery liye" },
  { id: "khana",      label: "Khana banata hai",          said: "mjy khana bnaky khilaye" },
  { id: "letters",    label: "Love letters",              said: "mjhy love letters dy" },
  { id: "gaane",      label: "Gaane gata hai",            said: "mjhy gany gaky sunaye" },
  { id: "drive",      label: "Long drives",               said: "mjhy long drive pr lejye" },
  { id: "surprise",   label: "Surprises",                 said: "surprises dy" },
  { id: "gora",       label: "Gora",                      said: "gora ho" },
  { id: "veiny",      label: "Veiny hands",               said: "veiny hands hon" },
  { id: "body",       label: "Body",                      said: "kch kch body ho" },
  { id: "baal",       label: "Sexy baal",                 said: "baal sexy hon" },
  { id: "baat",       label: "Baat maanta hai",           said: "meri bt many" },
  { id: "gussa",      label: "Gussa nahi karta",          said: "gussy wala na ho" },
  { id: "badtameez",  label: "Tameezdar",                 said: "badtamezi na kry" },
  { id: "trust",      label: "Trust nahi torta",          said: "trust na tory" },
  { id: "loyal",      label: "Loyal",                     said: "loyal ho" },
  { id: "jhoot",      label: "Jhoot nahi bolta",          said: "jhoot to blkl na boly" },
  { id: "khush",      label: "Khush rakhta hai",          said: "khush rkhy" },
  { id: "izzat",      label: "Larkiyon ki izzat",         said: "lrkiyo ki respect kry" },
  { id: "nofemale",   label: "No female friends",         said: "no female frnds" },
  { id: "nodekhe",    label: "Kisi aur ko dekhta nahi",   said: "kisi or lrki ko dekhy b na" },
  { id: "protective", label: "Protective + possessive",   said: "protective or possessive dono ho" },
  { id: "humor",      label: "Acha humor",                said: "humor acha ho" },
  { id: "kambole",    label: "Kam bolta, zyada sunta",    said: "thora kam boly meri zda sny" },
]

export const CRITERION_BY_ID = Object.fromEntries(CRITERIA.map((c) => [c.id, c]))

export interface Candidate {
  name: string
  age: number
  city: string
  /** Portrait seed — used only when `photo` is missing or fails to load. */
  seed: number
  /** Path under public/. Falls back to the drawn portrait if absent. */
  photo?: string
  /** Forces the drawn portrait bald, where the writing depends on it. */
  bald?: boolean
  /** Criterion ids he actually meets. Fifteen minimum. */
  meets: string[]
  /** The single requirement that ends him. */
  fatal: string
  /** Why. Short, specific, and dumber the higher he scored. */
  verdict: string
}

const ALL = CRITERIA.map((c) => c.id)
/** Everything except the listed ids — for the ones who nearly make it. */
const allBut = (...ids: string[]) => ALL.filter((c) => !ids.includes(c))

export const ROSTER: Candidate[] = [
  {
    name: "Ahmed", age: 24, city: "Lahore", seed: 3, photo: "/faces/ahmed.jpg",
    meets: ["cute", "pyara", "lamba", "funny", "respectful", "moodswings", "stand", "gaane",
            "drive", "surprise", "gora", "veiny", "body", "baal", "khush", "humor",
            "protective", "loyal"],
    fatal: "nofemale",
    verdict: "41 female friends. Calls every one of them 'sis'. One of them is actually named Sis.",
  },
  {
    name: "Bilal", age: 26, city: "Karachi", seed: 7, photo: "/faces/bilal.jpg",
    meets: ["cute", "pyara", "funny", "respectful", "moodswings", "stand", "khana", "letters",
            "gaane", "drive", "surprise", "khush", "loyal", "trust", "jhoot", "izzat", "humor"],
    fatal: "lamba",
    verdict: "5'4\". Wrote 5'9\" on his profile. In writing. Under oath. Wears boots indoors.",
  },
  {
    name: "Zain", age: 23, city: "Islamabad", seed: 11, photo: "/faces/zain.jpg",
    meets: ["cute", "pyara", "lamba", "respectful", "gora", "veiny", "body", "baal", "drive",
            "protective", "loyal", "trust", "khush", "izzat", "nofemale", "nodekhe"],
    fatal: "humor",
    verdict: "Sent 14 voice notes. Zero were funny. Three were about crypto.",
  },
  {
    name: "Hamza", age: 27, city: "Lahore", seed: 2, photo: "/faces/hamza.jpg",
    meets: ["cute", "pyara", "respectful", "moodswings", "stand", "khana", "letters", "drive",
            "gussa", "badtameez", "trust", "loyal", "jhoot", "khush", "izzat", "nofemale",
            "nodekhe"],
    fatal: "kambole",
    verdict: "Spoke for 51 minutes. You said 'hmm' twice. He described it as a great conversation.",
  },
  {
    name: "Usman", age: 25, city: "Multan", seed: 5, photo: "/faces/usman.jpg",
    meets: ["cute", "lamba", "body", "veiny", "gora", "baal", "stand", "khana", "drive",
            "surprise", "protective", "loyal", "trust", "jhoot", "nofemale", "nodekhe"],
    fatal: "gussa",
    verdict: "Protective ✓. Possessive ✓. Also throws the remote. You asked for two out of three.",
  },
  {
    name: "Faizan", age: 24, city: "Lahore", seed: 9, photo: "/faces/faizan.jpg",
    meets: ["cute", "pyara", "lamba", "funny", "humor", "baal", "gora", "body", "veiny",
            "letters", "gaane", "drive", "surprise", "khush", "moodswings", "respectful",
            "stand"],
    fatal: "jhoot",
    verdict: "Said he never lies. That was the lie. Detected in four seconds.",
  },
  {
    name: "Talha", age: 29, city: "Rawalpindi", seed: 13, photo: "/faces/talha.jpg", bald: true,
    meets: ["khana", "khush", "funny", "humor", "moodswings", "respectful", "izzat", "kambole",
            "loyal", "trust", "jhoot", "gussa", "badtameez", "stand", "letters", "drive",
            "surprise", "nofemale"],
    fatal: "baal",
    verdict: "Bald. Admirably confident about it. Still bald.",
  },
  {
    name: "Danish", age: 22, city: "Faisalabad", seed: 4, photo: "/faces/danish.jpg",
    meets: ["cute", "pyara", "baal", "gora", "body", "veiny", "lamba", "funny", "humor",
            "gaane", "drive", "surprise", "khush", "letters", "protective", "loyal"],
    fatal: "baat",
    verdict: "Does not listen. Asked your name three times. Guessed 'Khinza' on all three.",
  },
  {
    name: "Saad", age: 26, city: "Karachi", seed: 8, photo: "/faces/saad.jpg",
    meets: ["loyal", "trust", "khush", "respectful", "izzat", "nofemale", "nodekhe", "jhoot",
            "badtameez", "gussa", "moodswings", "stand", "khana", "letters", "baat", "kambole",
            "protective", "drive"],
    fatal: "funny",
    verdict: "Has never made a single person laugh. His own mother confirmed this on record.",
  },
  {
    /* The near-miss. 28 of 29 — and the thing that kills him is nothing at all. */
    name: "Arsalan", age: 28, city: "Lahore", seed: 6, photo: "/faces/arsalan.jpg",
    meets: allBut("nodekhe"),
    fatal: "nodekhe",
    verdict:
      "Cleared 28 of 29. Then looked at a girl. In a Snapchat story. From 2019. She was his cousin. Disqualified.",
  },
]

/* ── after the roster runs out ─────────────────────────────── */

export const ADMIRER = {
  heading: "ONE MORE THING",
  body: [
    "The search found nobody.",
    "But somebody found you.",
  ],
  detail:
    "There is one person who has been quietly putting up with all twenty-nine of these, and he would like to talk to you.",
  question: "Want to see who it is?",
  yes: "Yes, show me",
  no: "No",
  /* Pressing No never actually refuses — it just gets funnier. */
  noReplies: [
    "Wrong button.",
    "Try the other one.",
    "This button doesn't work. Deliberately.",
    "You're going to press Yes eventually. Save us both time.",
  ],
}

/** The one profile left in the database. */
export const LAST_RESORT: Candidate = {
  name: "Hassan", age: 20, city: "Lahore", seed: 1,
  /* ↓ DROP YOUR PHOTO AT public/faces/hassan.jpg ↓ */
  photo: "/faces/hassan.jpg",
  /* TODO: swap these for the 2–3 you actually have. Honest is funnier. */
  meets: ["funny", "humor", "lamba"],
  fatal: "everything else",
  verdict:
    "Meets 3 of 29. Fully aware of this. Applied anyway. Has been standing there the entire time you were searching.",
}

/** Shown when she tries to swipe him left. The card does not move. */
export const REGRET = [
  "You'll regret that.",
  "Left is disabled. Think carefully.",
  "That button was removed for your own safety.",
  "Still no. Try going right.",
  "This is getting embarrassing for you.",
]

export const INSTAGRAM = {
  handle: "@hassankhalid.8",
  url: "https://www.instagram.com/hassankhalid.8/",
  heading: "IT'S A MATCH",
  body: "Now go text him. He's been refreshing his phone for about nine days.",
  cta: "Open his Instagram",
  footer: "don't leave him on seen.",
}
