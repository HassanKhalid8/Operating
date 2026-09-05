/* ═══════════════════════════════════════════════════════════
   npm run faces

   Turns the full-size portraits in assets-src/faces/ into small
   square web copies in public/faces/.

   The originals stay outside public/ on purpose: Vite copies
   public/ into the build verbatim, so leaving 2.5 MB source JPEGs
   there would ship all 25 MB of them to her phone.

   Re-run it any time you add or replace a photo.
   ═══════════════════════════════════════════════════════════ */
import { readdir, mkdir, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import { execFile } from "node:child_process"
import { join, basename, extname } from "node:path"
import { promisify } from "node:util"

const run = promisify(execFile)

const SRC = "assets-src/faces"
const OUT = "public/faces"
const SIZE = 512
const IMAGES = new Set([".jpg", ".jpeg", ".png", ".webp"])

/* Per-file crop overrides, as ffmpeg crop args "w:h:x:y" in SOURCE pixels.
   Anything not listed gets a centred square crop, which is right for a studio
   portrait but wrong for a phone selfie with a caption burned into it. */
const CROP = {
  /* Framed on the face so the "Valentine" caption along the bottom is cut. */
  hassan: "820:820:180:400",
}

if (!existsSync(SRC)) {
  console.error(`✗ ${SRC} does not exist. Put the full-size photos there.`)
  process.exit(1)
}
await mkdir(OUT, { recursive: true })

const files = (await readdir(SRC))
  .filter((f) => IMAGES.has(extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b))

if (!files.length) {
  console.error(`✗ No images in ${SRC}/.`)
  process.exit(1)
}

let before = 0
let after = 0

for (const f of files) {
  const name = basename(f, extname(f))
  const src = join(SRC, f)
  const out = join(OUT, `${name}.jpg`)
  const crop = CROP[name] ?? "'min(iw,ih)':'min(iw,ih)'"

  await run("ffmpeg", [
    "-v", "error",
    "-i", src,
    "-vf", `crop=${crop},scale=${SIZE}:${SIZE}:flags=lanczos`,
    "-q:v", "4",
    "-map_metadata", "-1",   // drop EXIF: camera, timestamps, and any GPS
    "-y", out,
  ])

  const a = (await stat(src)).size
  const b = (await stat(out)).size
  before += a
  after += b
  const kb = (n) => `${Math.round(n / 1024)} KB`
  console.log(`  ${name.padEnd(10)} ${kb(a).padStart(9)}  →  ${kb(b).padStart(7)}${CROP[name] ? "   (custom crop)" : ""}`)
}

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`
console.log(`\n✓ ${files.length} images  ${mb(before)} → ${mb(after)}  (${Math.round((1 - after / before) * 100)}% smaller)`)
