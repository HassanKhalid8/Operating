import {
  ASLEEP, CHOICE, CLOCK, ECHO, EMOJI, EMOJI_OTHER, EXPLAIN, HASSAN, NEVER_MIND, QUESTION,
  REPEATED, SELF, STATEMENT, SUMS, TOO_LONG, TOPICS, TRAITS, WHY_NOT, type Reply,
} from "../content/gpt"

/* ═══════════════════════════════════════════════════════════
   KhinsaGPT's brain.

   No model, no network. A message is read in stages, most specific
   first, and the first stage that understands it answers:

     · nothing but emoji or punctuation
     · the same thing said twice
     · a follow-up to what it just said ("why?" after a no)
     · a sum, the time, the day — worked out for real
     · "X or Y?" — it picks one of the two she offered
     · "are you X" / "hassan is X" — praise or insult, about whom
     · "what is X" — it does not know, but it knows what X was
     · a topic from content/gpt.ts, the most specific one that matches
     · a fallback shaped like the message

   It keeps a little memory per conversation: what she last said, what
   it last answered, and its recent replies so it does not repeat one.
   ═══════════════════════════════════════════════════════════ */

/** Long enough to be a paragraph, which she does not read. */
const PARAGRAPH = 160

/** What the last answer amounted to, for follow-ups. */
type Tag = "no" | "wait" | null

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]

/** Lower-case, punctuation to spaces, "yarrrr" to "yar". Question marks stay. */
function normalize(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[.,!;:"()[\]{}*_~]+/g, " ")
    .replace(/([a-z])\1{2,}/g, "$1")
    .replace(/\?+/g, "?")
    .replace(/\s+/g, " ")
    .trim()
}

/* ── sums ──────────────────────────────────────────────────── */

/** Recursive descent over + - * / and brackets. Null if it isn't a sum. */
function evaluate(expr: string): number | null {
  const s = expr.replace(/\s+/g, "")
  let i = 0
  const number = (): number | null => {
    if (s[i] === "(") {
      i++
      const v = sum()
      if (s[i] !== ")") return null
      i++
      return v
    }
    if (s[i] === "-") { i++; const v = number(); return v === null ? null : -v }
    const m = /^\d+(\.\d+)?/.exec(s.slice(i))
    if (!m) return null
    i += m[0].length
    return Number(m[0])
  }
  const product = (): number | null => {
    let v = number()
    while (v !== null && (s[i] === "*" || s[i] === "/")) {
      const op = s[i++]
      const r = number()
      if (r === null) return null
      v = op === "*" ? v * r : v / r
    }
    return v
  }
  function sum(): number | null {
    let v = product()
    while (v !== null && (s[i] === "+" || s[i] === "-")) {
      const op = s[i++]
      const r = product()
      if (r === null) return null
      v = op === "+" ? v + r : v - r
    }
    return v
  }
  const v = sum()
  return v !== null && i === s.length ? v : null
}

function trySum(raw: string): string | null {
  const expr = raw
    .toLowerCase()
    .replace(/what is|what's|whats|solve|calculate|kitn[ae] (hot[ae]|hai|hain)( hai| hain)?|kitn[ae]|equals?|hota hai|kya hai|[=?]/g, " ")
    .replace(/plus/g, "+")
    .replace(/minus/g, "-")
    .replace(/multiplied by|times|into|[x×]/g, "*")
    .replace(/divided by|[÷]/g, "/")
    .trim()
  if (!/^[\d\s+\-*/().]+$/.test(expr) || !/\d\s*[+\-*/]\s*[\d(]/.test(expr)) return null
  const v = evaluate(expr)
  if (v === null) return null
  if (!Number.isFinite(v)) return "wtf"
  return String(Math.round(v * 100) / 100)
}

/* ── picking apart what was said ───────────────────────────── */

const NOT = /\b(not|nahi|nhi|ni|isnt|arent|aint|never)\b/

/** Whoever is being described, and the word used for them. */
function trait(text: string): { good: boolean; word: string } | null {
  const good = TRAITS.good.exec(text)
  const bad = TRAITS.bad.exec(text)
  const m = bad ?? good
  if (!m) return null
  const flip = NOT.test(text)
  return { good: (m === good) !== flip, word: m[0] }
}

const ME = /^(me|i|mai|main|mein|mujhe|mjhe|myself)$/
const YOU = /^(you|u|tum|tm|ap|aap|tu|khinsa|yourself)$/

/** "X or Y" → the two things on offer, or null. */
function options(n: string): [string, string] | null {
  const m = /^(.+?) (?:or|ya|yaa) (.+?)\??$/.exec(n)
  if (!m || n.split(" ").length > 12) return null
  const left = m[1].split(" ")
  const right = m[2].split(" ")
  /* A short left side is the option itself ("ice cream or cake"); a long
     one is a sentence ending in the option ("who is right me or hassan"). */
  const a = left.length <= 3 ? left.join(" ") : left[left.length - 1]
  const b = right.length <= 3 ? right.join(" ") : right[0]
  const strip = (s: string) => s.replace(/^(?:ky?a|do you (?:like|want|prefer)|which|kon ?sa|kon) /, "").trim()
  const [x, y] = [strip(a), strip(b)]
  return x && y ? [x, y] : null
}

function choose(a: string, b: string): string {
  const mine = (s: string) => (ME.test(s) ? "tum" : YOU.test(s) ? "mai" : s)
  /* Anyone over Hassan. Herself over anyone. */
  if (/hassan/.test(a)) return mine(b)
  if (/hassan/.test(b)) return mine(a)
  if (YOU.test(a) || YOU.test(b)) return "mai"
  return mine(Math.random() < 0.5 ? a : b)
}

const NOT_A_THING =
  /^(your|ur|you|u|tumh|tum|ap|this|that|it|up|wrong|happening|going|the time|time|today|the date|hassan|khinsa|ye|yeh|woh|wo|masla|scene|problem|matter|\d)/

/** "what is X" / "X kya hota" → X, or null. */
function subject(n: string): string | null {
  const q = n.replace(/\?$/, "").trim()
  const m =
    /^(?:what is|whats|what are|what does|explain|define|tell me about|describe|meaning of|what do you know about) (.+?)(?: means?)?$/.exec(q) ??
    /^(.+?) (?:ky?a hot[aie]( hai)?|ka ma?tla?b( ky?a hai)?|ky?a hai)$/.exec(q)
  if (!m) return null
  const x = m[1].replace(/^(a|an|the) /, "").trim()
  if (!x || x.split(" ").length > 4 || NOT_A_THING.test(x)) return null
  return x
}

const STOP = new Set(
  ("this that with from have just what when where your they them then than there here about really " +
    "kyun nahi mujhe tumhe mera meri mere tera teri hota hoti hain raha rahi rahe karna krna kiya " +
    "abhi phir bohat bohot bahut waisy aise kuch kisi lekin magar yaar hogi hoga wala wali sath " +
    "also very much some been were will would could should because like dont cant didnt").split(" "),
)

/** A word worth repeating back at her: the last one that carries meaning. */
function keyword(n: string): string | null {
  const words = n.replace(/[^a-z ]/g, " ").split(" ").filter((w) => w.length >= 4 && !STOP.has(w))
  return words.length ? words[words.length - 1] : null
}

/* ── the brain ─────────────────────────────────────────────── */

export interface Brain {
  /** The lines to send back, in order. */
  reply(raw: string, asleep?: boolean): string[]
}

export function createBrain(): Brain {
  let lastSaid = ""
  let lastTag: Tag = null
  /* Recent replies, so the same line is not sent twice running. */
  const recent: string[] = []

  /** One of `list`, not recently used, with {x} filled in. */
  function say(list: readonly Reply[], x = ""): string[] {
    const usable = x ? list : list.filter((r) => !JSON.stringify(r).includes("{x}"))
    const pool = usable.length ? usable : list
    const fresh = pool.filter((r) => !recent.includes(JSON.stringify(r)))
    const chosen = pick(fresh.length ? fresh : pool)
    recent.push(JSON.stringify(chosen))
    if (recent.length > 6) recent.shift()
    return (Array.isArray(chosen) ? chosen : [chosen]).map((line) => line.replaceAll("{x}", x))
  }

  function think(raw: string, asleep: boolean): string[] {
    const n = normalize(raw)
    const asked = /\?/.test(raw)
    const bare = n.replace(/\?$/, "").trim()

    /* Nothing she could have meant anything by. */
    if (!/[a-z0-9]/.test(n)) {
      if (/^[?\s]*$/.test(n) && asked) return say(["???", "kya", "han bolo", "bolo"])
      const face = EMOJI.find((e) => e.when.test(raw))
      return say(face ? face.say : EMOJI_OTHER)
    }

    if (n === lastSaid && n.length > 2) return say(REPEATED)

    /* Follow-ups to its own last answer. */
    if (lastTag === "no" && /^(but |par |lekin )?(kyu+n?|kiun|why|why not|kyun nahi|kyun ni)$/.test(bare)) return say(WHY_NOT)
    if (lastTag === "wait" && /^(batao|bata do|bolo|toh?|phi?r|then|and|aur|so|ab batao|kya|what)$/.test(bare)) return say(NEVER_MIND)

    if (asleep && Math.random() < 0.6) return say(ASLEEP.say)
    if (raw.length > PARAGRAPH) return say(TOO_LONG)

    /* Things with a real answer. */
    const total = trySum(raw)
    if (total !== null) return total === "wtf" ? ["wtf", "zero sai divide kon krta"] : say(SUMS, total)

    if (/what time|whats the time|time ky?a|ky?a time|kitn[ae]y? baj|ky?a baj|time bata/.test(n)) {
      const now = new Date()
      const clock = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()
      return say(now.getHours() < 5 ? CLOCK.late : CLOCK.day, clock)
    }
    if (/what day|which day|aaj (ky?a|kon ?sa) (din|day)|todays? (date|day)|aaj ki (date|tareekh)|ky?a date/.test(n)) {
      return say(CLOCK.date, new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }).toLowerCase())
    }

    const opts = options(n)
    if (opts) return Math.random() < 0.15 ? say(CHOICE.neither) : say(CHOICE.pick, choose(...opts))

    /* Someone is being called something. */
    const t = trait(bare)
    if (t) {
      if (/hassan/.test(bare)) return say(t.good ? HASSAN.good : HASSAN.bad, t.word)
      const question = /^(?:(?:are|r) (?:you|u)|ky?a (?:tum|tm|ap|aap|tu))\b/.test(bare) ||
        (asked && /\b(?:you|u|tum|tm|ap|aap|tu)\b/.test(bare))
      const statement = /\b(?:you are|youre|u r|you re|ur|tum|tm|tu|ap|aap)\b.*\b/.test(bare)
      if (question) return say(t.good ? SELF.good : SELF.bad, t.word)
      if (statement) return say(t.good ? SELF.praised : SELF.insulted, t.word)
    }

    const x = subject(n)
    if (x) return say(EXPLAIN, x)

    /* The most specific topic in the message: the longest stretch of it
       that a pattern accounts for. Vague patterns count for very little. */
    let best: { say: Reply[]; score: number } | null = null
    for (const topic of TOPICS) {
      const m = topic.when.exec(n)
      if (!m) continue
      const score = m[0].length * (topic.weak ? 0.2 : 1)
      if (!best || score > best.score) best = { say: topic.say, score }
    }
    if (best) return say(best.say)

    if (asked) return say(QUESTION)
    const word = keyword(n)
    if (word && Math.random() < 0.45) return say(ECHO, word)
    return say(STATEMENT)
  }

  return {
    reply(raw, asleep = false) {
      const lines = think(raw, asleep)
      lastSaid = normalize(raw)
      const all = lines.join(" ")
      lastTag = /^(no+|nope|never+|nhi+|ni+ |pls no|bilkul ni)/.test(all) ? "no"
        : /\bwait\b|batati|souchti/.test(all) ? "wait"
        : null
      return lines
    },
  }
}
