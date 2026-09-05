Drop the mp3 files here.

Name them 01.mp3, 02.mp3, 03.mp3 ... to match src/content/music.ts,
or rename them however you like and update the `file` field there.

Vite serves this folder from the site root, so public/music/01.mp3
is referenced in code as "/music/01.mp3".

Keep them around 128 kbps — a 4-minute song lands near 4 MB, and the
whole tape should stay under ~40 MB so it opens fast on her phone.
