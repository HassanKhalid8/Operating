/* ═══════════════════════════════════════════════════════════
   FILL THIS IN. Every entry is a command she can type.
   Keep the replies short and in your voice. The funny ones are
   the point; one or two can be sincere.
   ═══════════════════════════════════════════════════════════ */
export const COMMANDS: Record<string, string | string[]> = {
  help: [
    "available commands:",
    "  whoami      who you are, allegedly",
    "  ls          list files",
    "  date        what day it is",
    "  sudo        elevate privileges",
    "  clear       clear the screen",
    "",
    "there are others. i'm not telling you which.",
  ],

  whoami: [
    "khinsa",
    "  uid=1  gid=1  groups=besties,menace,not-shareef",
    "",
    "// TODO: replace this with the real description.",
  ],

  ls: [
    "photos/   terminal   wrapped.exe   recordings/",
    "vault/    bin/       settings      locked/",
    "",
    "locked/ : permission denied",
  ],

  sudo: "nice try. you don't have root here. you barely have wifi.",

  "sudo su": "absolutely not.",

  shareef: "no results found.",

  hassan: "// TODO: write something insufferable here.",

  // ── add more below. these are the easter eggs. ──
}

/** Shown when she types something that isn't a command. */
export const NOT_FOUND = (cmd: string) => `${cmd}: command not found. try 'help'.`
