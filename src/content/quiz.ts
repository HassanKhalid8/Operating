/* ═══════════════════════════════════════════════════════════
   THE QUIZ — content

   Everything she reads in the Quiz app lives here. The app itself
   never needs touching to add, remove, or reorder questions.

   HOW TO WRITE A QUESTION
     q        the question
     options  2 to 4 answers, shown in this exact order
     answer   which option is right — 0 is the first, 1 the second…
     note     optional. One line shown after she answers, right or
              wrong. The place for the roast, or the story behind it.

   Questions come one at a time, in the order below.
   ═══════════════════════════════════════════════════════════ */

export interface Question {
  q: string
  options: string[]
  /** Index into `options`. 0 = the first one. */
  answer: number
  note?: string
}

export const INTRO = {
  heading: "THE QUIZ",
  body: [
    "This is an extremely difficult quiz.",
    "But the point of taking it is — if you don't remember anything, then now you will.",
    "I am not going to test our friendship on this.",
  ],
  /* The rules, said plainly before she commits. */
  warning: "Once you start, there's no closing this window and no opening anything else. Finish what you started.",
  start: "START THE QUIZ",
}

/* The wrong options are deliberately close to the right one — nearby dates,
   nearby times, durations a few minutes off — so the answer can't be picked
   out by looking different from its neighbours. Keep that in mind when adding
   more: a wrong option that is obviously silly gives the right one away. */
export const QUESTIONS: Question[] = [
  {
    q: "When did we have our first conversation?",
    options: ["7 August", "9 August", "12 August", "19 August"],
    answer: 1,
  },
  {
    q: "What was your first message to me?",
    options: ["Hi", "Who is this?", "You know me?", "Hey, remember me?"],
    answer: 2,
  },
  {
    q: "What time did you send me that message?",
    options: ["1:30 AM", "12:45 AM", "2:10 AM", "11:30 PM"],
    answer: 0,
    note: "1:30 in the morning. Normal people are asleep.",
  },
  {
    q: "How long was our first call?",
    options: ["37 minutes", "52 minutes", "1 hour 4 minutes", "49 minutes"],
    answer: 3,
  },
  {
    q: "What is our longest call to date?",
    options: ["1 hour 12 minutes", "1 hour 28 minutes", "1 hour 46 minutes", "2 hours 3 minutes"],
    answer: 1,
  },
  {
    q: "Why did I write my first paragraph for you?",
    options: ["It was your birthday", "I lost a bet", "I was forced to", "I was bored at 3 AM"],
    answer: 2,
    note: "Forced. Against my will. Still wrote it, though.",
  },
]

/** Shown under the right answer when she picks a wrong one. */
export const WRONG_LINES = [
  "Wrong. Obviously.",
  "No. Not even close.",
  "Incorrect. I'm writing this down.",
  "Wrong. Now you know.",
  "Nope. Remember it this time.",
]

export const RIGHT_LINES = [
  "Correct. Suspicious.",
  "Right. Lucky guess?",
  "Correct. Okay, fine.",
  "Yes. Somebody was paying attention.",
]

/* The result card's verdict, by the fraction she got right. The first
   band whose `min` she reaches is the one shown. */
export const VERDICTS: { min: number; title: string; line: string }[] = [
  { min: 1,    title: "PERFECT SCORE",   line: "Every single one. Either you actually remember, or you cheated. I'm choosing to believe the first." },
  { min: 0.75, title: "HONOURS",         line: "Very good. Annoyingly good. The ones you got wrong have been noted." },
  { min: 0.5,  title: "PASS",            line: "Just about. We'll call it a pass, because I said this wasn't a test." },
  { min: 0.25, title: "CONCERNING",      line: "You forgot most of it. That's fine. You know it all now — that was the point." },
  { min: 0,    title: "WHO ARE YOU",     line: "Remarkable. Not one memory survived. Good thing I said the friendship wasn't on the line." },
]

export const RESULT = {
  heading: "RESULT CARD",
  /* The small print under the card. */
  mailing: "Filing a copy with the examiner…",
  mailed: "A copy has been sent to Hassan. He will be reading it.",
  mailFailed: "Couldn't reach the examiner. It'll try again next time this opens.",
  again: "Take it again",
}
