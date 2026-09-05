import { useEffect, useState } from "react"

/* ═══════════════════════════════════════════════════════════
   A portrait for a candidate.

   If `src` points at a real image it is used. Otherwise — and
   whenever that file is missing — it falls back to an ink drawing
   built from the seed, so a card is never blank.

   Every feature is picked from its own salted hash of the seed, so
   two candidates who share a hairstyle still differ in face, brows,
   beard, glasses, collar and shading.

   All geometry is derived from the chosen head size rather than
   hardcoded, so a long face and a round one both get a hairline
   that sits on the head and glasses whose arms reach the temples.
   ═══════════════════════════════════════════════════════════ */

const CX = 48
const CY = 48

/** Deterministic index into `list`, varying independently per `salt`. */
function pick<T>(list: T[], seed: number, salt: number): T {
  const h = Math.imul(seed + salt * 977 + 1, 2654435761) >>> 0
  return list[h % list.length]
}

const n = (v: number) => v.toFixed(1)

const FACES = [
  { rx: 25, ry: 30.5 }, // oval
  { rx: 27, ry: 28 },   // broad
  { rx: 27.5, ry: 26.5 }, // round
  { rx: 23, ry: 32 },   // long
]

/* Hair is an arc that hugs the actual skull, closed by a hairline. Building it
   from rx/ry is what keeps the crown covered on every head size — the earlier
   fixed paths left a bare patch above the fringe on the taller faces. */
function hairPath(style: number, rx: number, ry: number) {
  const L = CX - rx * 0.97
  const R = CX + rx * 0.97
  const Y = CY - ry * 0.30                     // where hair meets the side of the head
  const crown = `M${n(L)} ${n(Y)} A${n(rx)} ${n(ry)} 0 0 1 ${n(R)} ${n(Y)}`
  const hl = CY - ry * 0.44                    // nominal hairline height

  switch (style) {
    case 0: // buzz — high and rounded
      return `${crown} L${n(R)} ${n(hl - 1)} Q${CX} ${n(hl - 7)} ${n(L)} ${n(hl - 1)} Z`
    case 1: // straight fringe
      return `${crown} L${n(R)} ${n(hl + 5)} L${n(L)} ${n(hl + 5)} Z`
    case 2: // side part
      return `${crown} L${n(R)} ${n(hl + 4)} C${n(CX + rx * 0.3)} ${n(hl - 3)}, ${n(CX - rx * 0.1)} ${n(hl + 9)}, ${n(L)} ${n(hl + 2)} Z`
    case 3: // receding — high at the temples, lower in the middle
      return `${crown} L${n(R)} ${n(hl - 3)} Q${n(CX + rx * 0.42)} ${n(hl + 10)}, ${CX} ${n(hl + 4)} Q${n(CX - rx * 0.42)} ${n(hl + 10)}, ${n(L)} ${n(hl - 3)} Z`
    case 4: // widow's peak
      return `${crown} L${n(R)} ${n(hl + 1)} L${CX} ${n(hl + 9)} L${n(L)} ${n(hl + 1)} Z`
    default: // shaggy — fringe plus locks down past the ears
      return (
        `${crown} L${n(R + 1)} ${n(CY + ry * 0.34)} L${n(R - 4)} ${n(CY + ry * 0.30)} ` +
        `L${n(R - 3)} ${n(hl + 6)} L${n(L + 3)} ${n(hl + 6)} ` +
        `L${n(L + 4)} ${n(CY + ry * 0.30)} L${n(L - 1)} ${n(CY + ry * 0.34)} Z`
      )
  }
}

/** A lens-shaped hatch down the shadowed side of the face. */
function cheekPath(rx: number, ry: number) {
  const x0 = CX + rx * 0.12
  return (
    `M${n(x0)} ${n(CY - ry * 0.72)} ` +
    `C${n(CX + rx * 0.93)} ${n(CY - ry * 0.45)}, ${n(CX + rx * 0.93)} ${n(CY + ry * 0.45)}, ${n(CX + rx * 0.3)} ${n(CY + ry * 0.8)} ` +
    `C${n(CX + rx * 0.66)} ${n(CY + ry * 0.4)}, ${n(CX + rx * 0.66)} ${n(CY - ry * 0.4)}, ${n(x0)} ${n(CY - ry * 0.72)} Z`
  )
}

/** Jaw-and-chin mask, used for stubble and for a full beard. */
function beardPath(rx: number, ry: number, drop: number) {
  const top = CY + ry * 0.12
  return (
    `M${n(CX - rx * 0.88)} ${n(top)} ` +
    `C${n(CX - rx * 0.84)} ${n(CY + ry * 0.82)}, ${n(CX - rx * 0.42)} ${n(CY + ry + drop)}, ${CX} ${n(CY + ry + drop)} ` +
    `C${n(CX + rx * 0.42)} ${n(CY + ry + drop)}, ${n(CX + rx * 0.84)} ${n(CY + ry * 0.82)}, ${n(CX + rx * 0.88)} ${n(top)} ` +
    `C${n(CX + rx * 0.5)} ${n(CY + ry * 0.52)}, ${n(CX - rx * 0.5)} ${n(CY + ry * 0.52)}, ${n(CX - rx * 0.88)} ${n(top)} Z`
  )
}

const COLLARS = [
  (y: number) => `M${CX - 10} ${n(y)} Q${CX} ${n(y + 7)} ${CX + 10} ${n(y)}`,                                   // crew
  (y: number) => `M${CX - 8} ${n(y - 1)} L${CX} ${n(y + 11)} L${CX + 8} ${n(y - 1)} M${CX - 8} ${n(y - 1)} L${CX - 15} ${n(y + 5)} M${CX + 8} ${n(y - 1)} L${CX + 15} ${n(y + 5)}`, // shirt
  (y: number) => `M${CX - 11} ${n(y)} Q${CX} ${n(y + 10)} ${CX + 11} ${n(y)} M${CX - 5} ${n(y + 4)} L${CX - 5} ${n(y + 16)} M${CX + 5} ${n(y + 4)} L${CX + 5} ${n(y + 16)}`, // hoodie
  (y: number) => `M${CX - 9} ${n(y)} L${CX - 9} ${n(y + 9)} L${CX + 9} ${n(y + 9)} L${CX + 9} ${n(y)}`,          // band collar
]

export function Portrait(
  { seed, src, size = 104, bald = false }:
  { seed: number; src?: string; size?: number; bald?: boolean },
) {
  const [broken, setBroken] = useState(false)
  const h = (size * 112) / 96

  /* A new candidate gets a fresh chance at its own image. */
  useEffect(() => setBroken(false), [src])

  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={h}
        onError={() => setBroken(true)}
        className="block object-cover"
        style={{ width: size, height: h, filter: "grayscale(1) contrast(1.06) sepia(0.18)" }}
      />
    )
  }

  const { rx, ry } = pick(FACES, seed, 1)
  const hairStyle = Math.abs(Math.imul(seed + 2 * 977 + 1, 2654435761)) % 6
  const brow = pick([0, 1, 2, 3], seed, 3)
  const mouth = pick([0, 1, 2, 3], seed, 4)
  const collar = pick([0, 1, 2, 3], seed, 5)
  const beard = pick(["none", "none", "moustache", "stubble", "full", "goatee"], seed, 6)
  const specs = pick(["none", "none", "none", "round", "square"], seed, 7)
  const eyeSize = pick(["normal", "narrow", "wide"], seed, 8)
  /* Shading density stands in for complexion — ink on cream has no colour. */
  const tone = pick([0, 0.04, 0.075], seed, 9)
  const gap = pick([3.4, 4.2, 5], seed, 10)

  const chin = CY + ry
  const browY = CY - ry * 0.2
  const eyeY = CY + ry * 0.06
  const noseY = CY + ry * 0.4
  const mouthY = CY + ry * 0.63
  const eyeX = rx * 0.33
  const earTop = CY - ry * 0.1
  const neckY = chin - 2
  const shoulderY = chin + 9
  const eyeR = eyeSize === "wide" ? 2.5 : eyeSize === "narrow" ? 1.6 : 2.1
  const id = `p${seed}`

  const BROWS = [
    `M${n(CX - eyeX - 6)} ${n(browY)} Q${n(CX - eyeX)} ${n(browY - 4)} ${n(CX - eyeX + 6)} ${n(browY)} M${n(CX + eyeX - 6)} ${n(browY)} Q${n(CX + eyeX)} ${n(browY - 4)} ${n(CX + eyeX + 6)} ${n(browY)}`,
    `M${n(CX - eyeX - 6)} ${n(browY)} L${n(CX - eyeX + 6)} ${n(browY)} M${n(CX + eyeX - 6)} ${n(browY)} L${n(CX + eyeX + 6)} ${n(browY)}`,
    `M${n(CX - eyeX - 6)} ${n(browY + 2)} Q${n(CX - eyeX)} ${n(browY - 2)} ${n(CX - eyeX + 6)} ${n(browY - 1)} M${n(CX + eyeX - 6)} ${n(browY - 1)} Q${n(CX + eyeX)} ${n(browY - 2)} ${n(CX + eyeX + 6)} ${n(browY + 2)}`,
    `M${n(CX - eyeX - 6)} ${n(browY - 1)} Q${n(CX - eyeX)} ${n(browY + 2)} ${n(CX - eyeX + 6)} ${n(browY + 1)} M${n(CX + eyeX - 6)} ${n(browY + 1)} Q${n(CX + eyeX)} ${n(browY + 2)} ${n(CX + eyeX + 6)} ${n(browY - 1)}`,
  ]
  const MOUTHS = [
    `M${CX - 8} ${n(mouthY - 1)} Q${CX} ${n(mouthY + 4)} ${CX + 8} ${n(mouthY - 1)}`,
    `M${CX - 8} ${n(mouthY)} L${CX + 8} ${n(mouthY)}`,
    `M${CX - 8} ${n(mouthY + 2)} Q${CX} ${n(mouthY - 3)} ${CX + 8} ${n(mouthY + 2)}`,
    `M${CX - 7} ${n(mouthY + 1)} Q${CX} ${n(mouthY + 3)} ${CX + 7} ${n(mouthY - 2)}`,
  ]

  return (
    <svg viewBox="0 0 96 112" width={size} height={h} aria-hidden>
      <defs>
        <pattern id={`${id}h`} width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <line x1="0" y1="0" x2="0" y2={gap} stroke="var(--color-ink)" strokeWidth="0.6" opacity="0.4" />
        </pattern>
        <pattern id={`${id}s`} width="2.4" height="2.4" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.42" fill="var(--color-ink)" opacity="0.6" />
        </pattern>
        {/* Stubble and beard are clipped to the head so they can never spill
            past the jaw the way an unclipped path did. */}
        <clipPath id={`${id}c`}>
          <ellipse cx={CX} cy={CY} rx={rx} ry={ry} />
        </clipPath>
      </defs>

      <g fill="none" stroke="var(--color-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* shoulders */}
        <path
          d={`M11 112 C13 ${n(shoulderY + 8)}, 29 ${n(shoulderY)}, 48 ${n(shoulderY)} C67 ${n(shoulderY)}, 83 ${n(shoulderY + 8)}, 85 112`}
          fill="var(--color-paper)"
        />
        <path d={COLLARS[collar](shoulderY + 1)} />
        {/* neck */}
        <path d={`M${CX - 8} ${n(neckY - 8)} L${CX - 8} ${n(shoulderY)} M${CX + 8} ${n(neckY - 8)} L${CX + 8} ${n(shoulderY)}`} />

        {/* ears, behind the hair */}
        <path d={`M${n(CX - rx + 2)} ${n(earTop)} C${n(CX - rx - 4)} ${n(earTop - 2)}, ${n(CX - rx - 4)} ${n(earTop + 10)}, ${n(CX - rx + 3)} ${n(earTop + 9)}`} />
        <path d={`M${n(CX + rx - 2)} ${n(earTop)} C${n(CX + rx + 4)} ${n(earTop - 2)}, ${n(CX + rx + 4)} ${n(earTop + 10)}, ${n(CX + rx - 3)} ${n(earTop + 9)}`} />

        {/* head */}
        <ellipse cx={CX} cy={CY} rx={rx} ry={ry} fill="var(--color-card)" />
        {tone > 0 && (
          <ellipse cx={CX} cy={CY} rx={rx} ry={ry} fill={`rgba(26,23,20,${tone})`} stroke="none" />
        )}
        <path d={cheekPath(rx, ry)} fill={`url(#${id}h)`} stroke="none" />

        {beard === "stubble" && (
          <path d={beardPath(rx, ry, 0)} fill={`url(#${id}s)`} stroke="none" clipPath={`url(#${id}c)`} />
        )}
        {beard === "full" && (
          <path d={beardPath(rx, ry, 1)} fill="var(--color-ink)" clipPath={`url(#${id}c)`} />
        )}

        {bald ? (
          /* Two tufts above the ears — reads as bald, where simply omitting the
             hair reads as unfinished. */
          <g fill="var(--color-ink)" stroke="var(--color-ink)">
            <path d={`M${n(CX - rx * 0.99)} ${n(CY - ry * 0.3)} C${n(CX - rx * 0.95)} ${n(CY - ry * 0.62)}, ${n(CX - rx * 0.55)} ${n(CY - ry * 0.72)}, ${n(CX - rx * 0.42)} ${n(CY - ry * 0.66)} C${n(CX - rx * 0.68)} ${n(CY - ry * 0.5)}, ${n(CX - rx * 0.82)} ${n(CY - ry * 0.34)}, ${n(CX - rx * 0.99)} ${n(CY - ry * 0.3)} Z`} />
            <path d={`M${n(CX + rx * 0.99)} ${n(CY - ry * 0.3)} C${n(CX + rx * 0.95)} ${n(CY - ry * 0.62)}, ${n(CX + rx * 0.55)} ${n(CY - ry * 0.72)}, ${n(CX + rx * 0.42)} ${n(CY - ry * 0.66)} C${n(CX + rx * 0.68)} ${n(CY - ry * 0.5)}, ${n(CX + rx * 0.82)} ${n(CY - ry * 0.34)}, ${n(CX + rx * 0.99)} ${n(CY - ry * 0.3)} Z`} />
          </g>
        ) : (
          <path d={hairPath(hairStyle, rx, ry)} fill="var(--color-ink)" stroke="var(--color-ink)" />
        )}

        <path d={BROWS[brow]} />
        <circle cx={n(CX - eyeX)} cy={n(eyeY)} r={eyeR} fill="var(--color-ink)" stroke="none" />
        <circle cx={n(CX + eyeX)} cy={n(eyeY)} r={eyeR} fill="var(--color-ink)" stroke="none" />
        <path d={`M${CX} ${n(eyeY + 3)} L${CX - 2} ${n(noseY)} L${CX + 3} ${n(noseY + 1)}`} />
        <path d={MOUTHS[mouth]} />

        {beard === "moustache" && (
          <path d={`M${CX - 8} ${n(mouthY - 5)} Q${CX} ${n(mouthY - 9)} ${CX + 8} ${n(mouthY - 5)}`} strokeWidth="2.6" />
        )}
        {beard === "goatee" && (
          <path
            d={`M${CX - 6} ${n(mouthY + 5)} Q${CX} ${n(chin - 1)} ${CX + 6} ${n(mouthY + 5)} Q${CX} ${n(mouthY + 9)} ${CX - 6} ${n(mouthY + 5)} Z`}
            fill="var(--color-ink)"
          />
        )}

        {specs !== "none" && (
          <g strokeWidth="1.3">
            {specs === "round" ? (
              <>
                <circle cx={n(CX - eyeX)} cy={n(eyeY)} r="7.5" />
                <circle cx={n(CX + eyeX)} cy={n(eyeY)} r="7.5" />
              </>
            ) : (
              <>
                <rect x={n(CX - eyeX - 7.5)} y={n(eyeY - 5.5)} width="15" height="11" rx="1.5" />
                <rect x={n(CX + eyeX - 7.5)} y={n(eyeY - 5.5)} width="15" height="11" rx="1.5" />
              </>
            )}
            {/* bridge, then arms that stop at the temple rather than in mid-air */}
            <path d={`M${n(CX - eyeX + 7.5)} ${n(eyeY - 1)} L${n(CX + eyeX - 7.5)} ${n(eyeY - 1)}`} />
            <path d={`M${n(CX - eyeX - 7.5)} ${n(eyeY - 2)} L${n(CX - rx + 2)} ${n(earTop + 1)}`} />
            <path d={`M${n(CX + eyeX + 7.5)} ${n(eyeY - 2)} L${n(CX + rx - 2)} ${n(earTop + 1)}`} />
          </g>
        )}
      </g>
    </svg>
  )
}
