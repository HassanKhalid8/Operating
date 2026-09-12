/* ═══════════════════════════════════════════════════════════
   Everything you'd want to change without touching code.
   ═══════════════════════════════════════════════════════════ */
export const CONFIG = {
  name: "Khinsa",
  from: "Hassan",

  /** Her age on the 15th — becomes the OS version number. TODO: confirm. */
  age: 21,

  /** Where a doodle goes when she hits Send and her phone has no share sheet.
      This string ships inside the deployed bundle, so use an address you do
      not mind a scraper finding. */
  contact: { email: "hassank8125@gmail.com" },

  /** Midnight, 15 Sep 2026, Pakistan Standard Time (UTC+5). */
  birthday: new Date("2026-09-15T00:00:00+05:00"),

  /** What the mixtape is called. Shown on the deck and in the Music window. */
  tapeName: "If i miss Askari",

  /** Where she is. Drives the Weather widget. TODO: confirm the city. */
  place: { label: "Lahore", lat: 31.5204, lon: 74.3587 },

  /** Dev-only. Set true to walk past the countdown and see locked/ early. */
  unlockOverride: import.meta.env.DEV,
} as const

export const osVersion = `v${CONFIG.age}.0`
