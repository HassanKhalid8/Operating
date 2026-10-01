/* ═══════════════════════════════════════════════════════════
   THE NUMBERS — content

   The figures come from numbers.json, which `node scripts/numbers.mjs`
   counts out of the chat exports on your laptop — Instagram, WhatsApp,
   and both merged. The words on each card are here. Where a line
   depends on who is ahead (she talks more on Instagram, I do on
   WhatsApp), both versions are written and the numbers pick.

   "you" is her. "me" is Hassan.
   ═══════════════════════════════════════════════════════════ */
import N from "./numbers.json"

export type Source = "instagram" | "whatsapp" | "both"
type Stats = (typeof N)["both"]

export const SOURCES: { id: Source; label: string }[] = [
  { id: "instagram", label: "Insta" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "both", label: "Both" },
]

const LONG_NAME: Record<Source, string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  both: "Instagram + WhatsApp",
}

export function statsFor(source: Source): Stats | null {
  return (N as Partial<Record<Source, Stats>>)[source] ?? null
}

export type Card =
  | { kind: "intro"; title: string; sub: string; line: string }
  | { kind: "big"; eyebrow: string; value: string; unit?: string; line: string }
  | { kind: "versus"; eyebrow: string; her: number; me: number; line: string }
  | { kind: "streak"; eyebrow: string; days: number; active: number; line: string }
  | { kind: "hours"; eyebrow: string; hours: number[]; value: string; line: string }
  | { kind: "spellings"; eyebrow: string; value: string; words: [string, number][]; line: string }
  | { kind: "emoji"; eyebrow: string; emoji: string; her: number; me: number; line: string }
  | { kind: "outro"; value: string; line: string; sign: string }

const fmt = (n: number) => n.toLocaleString("en-US")
const times = (n: number) => (n === 0 ? "never" : n === 1 ? "exactly once" : n === 2 ? "exactly twice" : `${n} times`)

export function cardsFor(source: Source): Card[] {
  const S = statsFor(source)
  if (!S) return []
  const range = `${S.range.fromLabel} – ${S.range.toLabel}`

  return [
    {
      kind: "intro",
      title: "The Numbers",
      sub: `${LONG_NAME[source]} · ${range}`,
      line: "I counted everything. You can't stop me. Tap to continue.",
    },
    {
      kind: "big",
      eyebrow: "MESSAGES SENT",
      value: fmt(S.total),
      unit: `in ${S.range.days} days`,
      line: `That's ${fmt(S.perDayAvg)} a day. Neither of us has anything better to do, apparently.`,
    },
    {
      kind: "versus",
      eyebrow: "WHO TALKS MORE",
      her: S.count.her,
      me: S.count.me,
      line: S.count.her > S.count.me
        ? "You talk more. Obviously. I just sit here and listen, apparently."
        : "Fine. I talk more. Barely. We don't need to discuss this.",
    },
    {
      kind: "streak",
      eyebrow: "DAYS WE TALKED",
      days: S.range.days,
      active: S.range.activeDays,
      line: S.range.activeDays === S.range.days
        ? `${S.range.activeDays} out of ${S.range.days}. Not a single day off. Not one.`
        : `${S.range.activeDays} out of ${S.range.days}. The other days don't count.`,
    },
    {
      kind: "big",
      eyebrow: "OUR BIGGEST DAY",
      value: fmt(S.busiestDay.n),
      unit: `messages on ${S.busiestDay.label}`,
      line: "One day. What were we even talking about. I genuinely don't know.",
    },
    {
      kind: "hours",
      eyebrow: "WHEN WE TALK",
      hours: S.hours,
      value: fmt(S.lateNight.n),
      line: `messages sent between midnight and 5 AM. That's ${S.lateNight.pct}% of everything. Sleep is a suggestion.`,
    },
    {
      kind: "versus",
      eyebrow: "WHO TEXTS FIRST",
      her: S.starts.her,
      me: S.starts.me,
      line: S.starts.her >= S.starts.me
        ? `You started the conversation ${S.starts.her} times. I started ${S.starts.me}. So who's obsessed now.`
        : `I started it ${S.starts.me} times. You, ${S.starts.her}. Noted. Forever.`,
    },
    {
      kind: "versus",
      eyebrow: "QUESTIONS ASKED",
      her: S.questions.her,
      me: S.questions.me,
      line: S.questions.her >= S.questions.me * 1.8
        ? "You asked twice as many questions. I answered most of them. Some of them twice."
        : S.questions.her > S.questions.me
          ? "You asked more questions. Curious little thing."
          : "I asked more questions. You answered some of them.",
    },
    {
      kind: "spellings",
      eyebrow: "HOW YOU SPELL \"YAAR\"",
      value: String(S.yaar.spellings.length),
      words: S.yaar.spellings as [string, number][],
      line: `${S.yaar.spellings.length} different spellings, ${fmt(S.yaar.total)} times in total. You spelled it correctly ${times(S.yaar.correct)}.`,
    },
    {
      kind: "big",
      eyebrow: "TIMES YOU WROTE MY NAME",
      value: fmt(S.hassan.total),
      unit: `longest version: "${S.hassan.longest}"`,
      line: "I counted the n's. I'm not okay.",
    },
    {
      kind: "emoji",
      eyebrow: "YOUR MOST-USED EMOJI",
      emoji: S.emoji.top,
      her: S.emoji.her,
      me: S.emoji.me,
      line: S.emoji.myTop === S.emoji.top
        ? "Mine too. Very healthy friendship. Everything's fine."
        : `Mine is ${S.emoji.myTop}. Make of that what you will.`,
    },
    {
      kind: "versus",
      eyebrow: "WHO SAID SORRY",
      her: S.sorry.her,
      me: S.sorry.me,
      line: S.sorry.me > S.sorry.her
        ? "I apologised more. As expected. As always."
        : S.sorry.her > S.sorry.me
          ? "You apologised more. Screenshotting this. It'll never happen again."
          : "Exactly even. Suspicious.",
    },
    {
      kind: "versus",
      eyebrow: "LONGEST MESSAGE (WORDS)",
      her: S.longestWords.her,
      me: S.longestWords.me,
      line: S.longestWords.me > S.longestWords.her
        ? `${S.longestWords.me} words. In one message. One of us writes paragraphs and it's not you.`
        : `You wrote ${S.longestWords.her} words in one go. I'm framing it.`,
    },
    {
      kind: "big",
      eyebrow: "LONGEST WE WENT QUIET",
      value: String(S.longestGapHours),
      unit: "hours",
      line: source === "both"
        ? "Across both apps. When one went quiet, the other one didn't."
        : "Felt longer.",
    },
    {
      kind: "outro",
      value: fmt(S.total),
      line: "messages, and I'd read every single one again.",
      sign: "— Hassan",
    },
  ]
}
