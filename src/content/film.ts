/* ═══════════════════════════════════════════════════════════
   THE PREMIERE — content

   One very short film, one ticket, one seat. The video itself is
   public/video/edit.mp4 — a web copy of the edit (the original is
   edit.mp4 at the project root, which is not deployed).
   ═══════════════════════════════════════════════════════════ */

export const FILM = {
  src: "/video/edit.mp4",
  poster: "/video/edit-poster.jpg",
  /** What the file is called when she saves it to her phone. */
  filename: "khinsa-edit.mp4",
}

export const TICKET = {
  admit: "ADMIT ONE",
  title: "A Very Short Film",
  starring: "starring Khinsa",
  details: [
    ["RUNTIME", "14 sec"],
    ["RATED", "PG · Pagal Girl"],
    ["SEAT", "The only one"],
  ] as [string, string][],
  stub: "No. 0015",
  hint: "tear along the dotted line",
  tear: "TEAR TICKET",
}

export const THEATRE = {
  marquee: "NOW SHOWING",
  end: "THE END",
  endLine: "Directed, edited, and suffered through by Hassan.",
  again: "Watch again",
  save: "Save to phone",
  saving: "Getting it ready…",
  saved: "Saved. Now it's yours.",
  fullscreen: "Full screen",
}
