GENERATED — do not edit these .jpg files by hand.

They are written by `npm run faces`, which reads the full-size originals in
assets-src/faces/ and writes 512x512 web copies here.

To change a photo:
  1. replace or add the file in  assets-src/faces/<name>.jpg
  2. run  npm run faces
  3. if the name is new, point a candidate's `photo` field at it in
     src/content/rishta.ts

The originals deliberately live outside public/ — Vite copies public/ into the
build verbatim, so keeping 2.5 MB source JPEGs here would ship all 25 MB of them.

Crops are centred squares by default. scripts/faces.mjs has a CROP map for
files that need something else (hassan.jpg is framed to cut the caption).
