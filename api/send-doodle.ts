import nodemailer from "nodemailer"

/* ═══════════════════════════════════════════════════════════
   POST /api/send-doodle

   Takes either a PNG data URL (a doodle, sent as an attachment) or a
   note (title and body, sent as the message itself) and mails it from
   the Gmail account named in the environment. Runs as a Vercel serverless
   function, which is the only place the mailbox password exists — it is
   never in the bundle and never reaches the browser.

   Environment (Vercel → Settings → Environment Variables):
     GMAIL_USER          the full gmail address the mail is sent FROM
     GMAIL_APP_PASSWORD  a 16-character App Password, NOT the real password
     MAIL_TO             where it lands. Defaults to GMAIL_USER.

   Note that the recipient comes from the environment and never from the
   request. That matters: an endpoint that mails wherever the caller says
   is an open relay, and this one is on the public internet.
   ═══════════════════════════════════════════════════════════ */

/** Vercel's Node handler signature, typed to what this file actually uses. */
interface Req {
  method?: string
  body?:
    | {
        png?: unknown
        caption?: unknown
        filename?: unknown
        note?: { title?: unknown; body?: unknown }
      }
    | string
    | null
}
interface Res {
  status: (code: number) => Res
  json: (body: unknown) => void
}

/** ~4MB of base64. A full-page drawing is a few hundred KB; this is a wall. */
const MAX_CHARS = 4_000_000
const PNG_PREFIX = "data:image/png;base64,"

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" })
    return
  }

  /* Dashboards love to hand back a value wrapped in quotes, and SMTP AUTH is
     not forgiving: a single stray " turns a correct password into a 535. */
  const unquote = (v?: string) => v?.trim().replace(/^['"]|['"]$/g, "")
  const user = unquote(process.env.GMAIL_USER)
  /* Google displays App Passwords in four spaced groups. People paste them
     that way, and the spaces are not part of the password. */
  const pass = unquote(process.env.GMAIL_APP_PASSWORD)?.replace(/\s+/g, "")
  if (!user || !pass) {
    /* Missing config is the site owner's problem, not hers — the app falls
       back to the share sheet when this endpoint says no. */
    res.status(503).json({ error: "mail is not configured" })
    return
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body
  const png = typeof body?.png === "string" ? body.png : ""
  const caption = typeof body?.caption === "string" ? body.caption.slice(0, 80) : ""
  const filename = sanitise(typeof body?.filename === "string" ? body.filename : "doodle.png")

  /* A note travels as the message itself rather than a file — there is nothing
     to open, so it is readable from the notification. */
  const noteTitle = typeof body?.note?.title === "string" ? body.note.title.slice(0, 80) : ""
  const noteBody = typeof body?.note?.body === "string" ? body.note.body : ""
  const isNote = noteBody.trim().length > 0

  if (!isNote) {
    if (!png.startsWith(PNG_PREFIX)) {
      res.status(400).json({ error: "expected a png data url" })
      return
    }
    if (png.length > MAX_CHARS) {
      res.status(413).json({ error: "that drawing is too big to mail" })
      return
    }
  } else if (noteBody.length > 20_000) {
    res.status(413).json({ error: "that note is too long to mail" })
    return
  }

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })

  const title = (isNote ? noteTitle : caption) || "untitled"

  try {
    await transport.sendMail({
      from: `KhinsaOS <${user}>`,
      to: process.env.MAIL_TO || user,
      subject: isNote
        ? `She wrote you something — "${title}"`
        : `She drew you something — "${title}"`,
      /* A note goes in the body, where it is readable from the notification
         without opening anything. A drawing cannot, so it goes as a file and
         the body just says where it came from. */
      text: isNote
        ? `${noteBody}\n\n—\nWritten on the desk, ${new Date().toUTCString()}`
        : `Straight off the desk.\n\nTitle: ${title}\nSent: ${new Date().toUTCString()}`,
      attachments: isNote
        ? []
        : [
            {
              filename,
              content: Buffer.from(png.slice(PNG_PREFIX.length), "base64"),
              contentType: "image/png",
            },
          ],
    })
    res.status(200).json({ ok: true })
  } catch (err) {
    console.error("[send-doodle]", err)
    /* The code and SMTP status, so a refusal can be diagnosed from outside
       without reading the function log — EAUTH/535 means the password stored
       here is wrong or Google blocked the sign-in, which is a very different
       fix from a network or rate-limit failure. Deliberately not the raw
       message, which would echo the mailbox address back to any caller. */
    const smtp = err as { code?: string; responseCode?: number }
    res.status(502).json({
      error: "the mailbox refused it",
      reason: smtp?.code ?? "unknown",
      smtpStatus: smtp?.responseCode ?? null,
    })
  }
}

function safeParse(raw: string) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** No paths, no surprises in a mail client's attachment list. */
function sanitise(name: string) {
  const clean = name.replace(/[^a-z0-9._-]+/gi, "-").replace(/^[-.]+/, "").slice(0, 60)
  return clean.toLowerCase().endsWith(".png") ? clean : `${clean || "doodle"}.png`
}
