/* ═══════════════════════════════════════════════════════════
   npm run numbers

   Reads both chat exports and writes the counted-up results to
   src/content/numbers.json, three times over: Instagram alone,
   WhatsApp alone, and the two merged into one timeline.

     content/raw/whatsapp.txt            WhatsApp → Export chat → Without media
     content/raw/instagram/message_*.json Instagram → Accounts Center → Export
                                          your information → Messages (JSON)

   This runs on your laptop only. content/raw/ is git-ignored, so the
   chats themselves are never committed or deployed — only the numbers
   in the JSON are, and the JSON holds no message text at all.

   Only things BOTH apps record are counted, so the three views always
   line up: no calls, voice notes, reels or reactions (Instagram only),
   and no edits (WhatsApp only).

   Re-run it any time you drop in a newer export.
   ═══════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs"

const OUT = "src/content/numbers.json"
const WA = "content/raw/whatsapp.txt"
const IG = "content/raw/instagram/"

/* One shape for a message from either app.
   kind: "text" — something she or I typed
         "media" — a photo, video, voice note, sticker, reel… (counted, never read) */

/* ── WhatsApp ── */
function readWhatsApp() {
  if (!existsSync(WA)) return []
  const HER = /^Khinsa/
  const LINE = /^(\d{2})\/(\d{2})\/(\d{4}), (\d{1,2}):(\d{2})\s?([ap]m) - ([^:]+?): ([\s\S]*)$/i
  const SYSTEM = /^\d{2}\/\d{2}\/\d{4}, \d{1,2}:\d{2}\s?[ap]m - /i
  const out = []
  for (const raw of readFileSync(WA, "utf8").split(/\r?\n/)) {
    const line = raw.replace(/ /g, " ")
    const m = LINE.exec(line)
    if (m) {
      const [, d, mo, y, h, mi, ap, who, text] = m
      let hour = Number(h) % 12
      if (ap.toLowerCase() === "pm") hour += 12
      const media = /^<.*omitted>$/.test(text) || /^(You deleted this message|This message was deleted)$/.test(text)
      out.push({
        t: new Date(+y, +mo - 1, +d, hour, +mi),
        who: HER.test(who) ? "her" : "me",
        kind: media ? "media" : "text",
        text: media ? "" : text.replace(/<This message was edited>/g, ""),
      })
    } else if (SYSTEM.test(line)) {
      continue
    } else if (out.length) {
      out[out.length - 1].text += "\n" + raw
    }
  }
  return out
}

/* ── Instagram ── */
function readInstagram() {
  if (!existsSync(IG)) return []
  /* Instagram writes UTF-8 text as if every byte were its own character, so
     emoji and Urdu arrive as mojibake. Re-reading the bytes undoes it. */
  const fix = (s) => (typeof s === "string" ? Buffer.from(s, "latin1").toString("utf8") : "")
  /* Reactions and likes are logged as messages, and calls as call entries.
     Neither is something anyone typed, and WhatsApp has neither — out. */
  const NOISE = /^(Reacted .* to your message|Liked a message)/
  const out = []
  for (const f of readdirSync(IG).filter((f) => /^message_\d+\.json$/.test(f))) {
    for (const m of JSON.parse(readFileSync(IG + f, "utf8")).messages) {
      const text = fix(m.content)
      if (m.call_duration !== undefined || NOISE.test(text)) continue
      const media = m.audio_files || m.photos || m.videos || m.share || m.sticker || /sent an attachment\.$/.test(text)
      out.push({
        t: new Date(m.timestamp_ms),
        who: fix(m.sender_name).startsWith("Khinsa") ? "her" : "me",
        kind: media ? "media" : "text",
        text: media ? "" : text,
      })
    }
  }
  return out
}

/* ── counting ── */
const dayKey = (t) =>
  `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
const niceDay = (k) => new Date(k + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "long" })
const pct = (a, b) => Math.round((a / b) * 100)

function stats(msgs) {
  msgs = [...msgs].sort((a, b) => a.t - b.t)
  const pair = (fn) => ({ her: fn("her"), me: fn("me") })
  const by = (w) => msgs.filter((m) => m.who === w)
  const texts = (w) => by(w).filter((m) => m.kind === "text")
  const first = msgs[0].t
  const last = msgs[msgs.length - 1].t

  const perDay = new Map()
  for (const m of msgs) perDay.set(dayKey(m.t), (perDay.get(dayKey(m.t)) ?? 0) + 1)
  const days = [...perDay].sort((a, b) => b[1] - a[1])
  const span = Math.round((new Date(last.toDateString()) - new Date(first.toDateString())) / 86_400_000) + 1

  let run = 0, streak = 0
  for (const c = new Date(first.toDateString()); c <= last; c.setDate(c.getDate() + 1)) {
    run = perDay.has(dayKey(c)) ? run + 1 : 0
    streak = Math.max(streak, run)
  }

  let gap = 0
  for (let i = 1; i < msgs.length; i++) gap = Math.max(gap, msgs[i].t - msgs[i - 1].t)

  const hours = Array(24).fill(0)
  for (const m of msgs) hours[m.t.getHours()]++
  const topHour = hours.indexOf(Math.max(...hours))
  const late = msgs.filter((m) => m.t.getHours() < 5).length

  /* A message after 3+ hours of silence opens a conversation. */
  const starts = { her: 0, me: 0 }
  msgs.forEach((m, i) => { if (i === 0 || m.t - msgs[i - 1].t >= 3 * 3_600_000) starts[m.who]++ })

  const count = (w, re) => texts(w).reduce((n, m) => n + (m.text.match(re)?.length ?? 0), 0)
  const spellings = (w, re) => {
    const c = new Map()
    for (const m of texts(w)) for (const x of m.text.toLowerCase().match(re) ?? []) c.set(x, (c.get(x) ?? 0) + 1)
    return [...c].sort((a, b) => b[1] - a[1])
  }
  const emojis = (w) => {
    const c = new Map()
    for (const m of texts(w)) for (const e of m.text.match(/\p{Extended_Pictographic}/gu) ?? []) c.set(e, (c.get(e) ?? 0) + 1)
    return [...c].sort((a, b) => b[1] - a[1])
  }

  const yaar = spellings("her", /\bya+r+\b/g)
  const hassan = spellings("her", /\bhass?an+\b/g)
  const herEmoji = emojis("her")
  const meEmoji = emojis("me")
  const top = herEmoji[0]?.[0] ?? "😭"

  return {
    range: { from: dayKey(first), to: dayKey(last), fromLabel: niceDay(dayKey(first)), toLabel: niceDay(dayKey(last)), days: span, activeDays: perDay.size },
    total: msgs.length,
    count: pair((w) => by(w).length),
    perDayAvg: Math.round(msgs.length / perDay.size),
    busiestDay: { label: niceDay(days[0][0]), n: days[0][1] },
    streak,
    longestGapHours: Math.round(gap / 3_600_000),
    hours,
    topHour,
    lateNight: { n: late, pct: pct(late, msgs.length) },
    starts,
    questions: pair((w) => count(w, /\?/g)),
    sorry: pair((w) => count(w, /\bsor+y+\b|\bsry\b/gi)),
    yaar: {
      spellings: yaar,
      total: yaar.reduce((n, [, k]) => n + k, 0),
      correct: yaar.find(([w]) => w === "yaar")?.[1] ?? 0,
    },
    hassan: {
      total: hassan.reduce((n, [, k]) => n + k, 0),
      longest: hassan.reduce((a, [w]) => (w.length > a.length ? w : a), ""),
    },
    emoji: {
      top,
      her: herEmoji[0]?.[1] ?? 0,
      me: meEmoji.find(([e]) => e === top)?.[1] ?? 0,
      myTop: meEmoji[0]?.[0] ?? top,
    },
    longestWords: pair((w) =>
      texts(w).reduce((a, m) => Math.max(a, m.text.trim().split(/\s+/).length), 0)),
  }
}

const wa = readWhatsApp()
const ig = readInstagram()
const result = {
  generated: new Date().toISOString(),
  ...(ig.length ? { instagram: stats(ig) } : {}),
  ...(wa.length ? { whatsapp: stats(wa) } : {}),
  both: stats([...ig, ...wa]),
}

writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n")
for (const [k, v] of Object.entries(result)) {
  if (k === "generated") continue
  console.log(`\n── ${k} ──`)
  console.log(JSON.stringify({ ...v, hours: undefined, yaar: { ...v.yaar, spellings: v.yaar.spellings.length } }))
}
