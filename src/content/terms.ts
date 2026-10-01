/* ═══════════════════════════════════════════════════════════
   FRIENDSHIP TERMS & CONDITIONS — content

   The whole agreement lives here. Add, cut or reorder clauses freely;
   they are numbered on screen in the order they appear below.

   "Management" is Hassan. "The User" is her. Keep it sounding like a
   real licence agreement — the straighter the legal voice, the
   funnier the clause.
   ═══════════════════════════════════════════════════════════ */

export interface Clause {
  title: string
  body: string[]
}

export const TERMS = {
  title: "Friendship Terms & Conditions",
  version: "Version 21.0 · Effective 9 August 2026 · Last amended whenever Management felt like it",
  preamble:
    "This agreement is between Hassan (\"Management\") and Khinsa (\"the User\"). Please read it carefully. It affects your legal rights, of which you have very few.",
  progress: (pct: number) => (pct >= 100 ? "READ IN FULL. ALLEGEDLY." : `YOU HAVE READ ${pct}%`),
  checkbox: "I have read and understood all of the above",
  /* When she tries to untick it. */
  checkboxLocked: "This box does not untick.",
  accept: "I ACCEPT",
  decline: "I DECLINE",
  /* What the Decline button says each time it gets away from her. After
     the last one it gives up and turns into a second Accept. */
  dodges: ["nope", "too slow", "try again", "bohht off", "almost", "ok last chance"],
  footnote: "Declining is supported on all devices. Good luck.",
}

export const CLAUSES: Clause[] = [
  {
    title: "Definitions",
    body: [
      "\"The Friendship\" means the arrangement the User entered into on 9 August 2026 at 1:30 AM by sending the words \"You know me?\", and has been unable to exit since.",
      "\"Reasonable\" means whatever Management decides it means at the time.",
    ],
  },
  {
    title: "Term",
    body: [
      "This agreement lasts for life. There was a free trial. It ended when the User replied.",
    ],
  },
  {
    title: "Dispute Resolution",
    body: [
      "In the event of a disagreement, Management is right.",
      "Where Management is demonstrably, provably, screenshot-ably wrong, refer to the sentence above.",
      "Unresolved disputes go to Khinsa Court. The User is advised to look up who the judge is before filing.",
    ],
  },
  {
    title: "Response Times",
    body: [
      "The User shall reply within a Reasonable time. 9 hours 47 minutes is not a Reasonable time.",
      "\"Sogayi thi maiii\" is accepted as a defence a maximum of once per night.",
    ],
  },
  {
    title: "The Words \"Good Night\"",
    body: [
      "\"Good night\" is a binding statement. After saying it the User may send no more than three (3) further messages.",
      "The current record is seventy (70). Management is not angry, just counting.",
    ],
  },
  {
    title: "Threats",
    body: [
      "\"Ainda na hoe\" is acknowledged by both parties to be decorative. It has been issued 38 times and enforced on none of them.",
      "The 😊 that sometimes follows it remains legally terrifying and is covered separately.",
    ],
  },
  {
    title: "Licence to Roast",
    body: [
      "The User grants Management a perpetual, worldwide, royalty-free, irrevocable licence to roast her, in any medium now known or later invented, including but not limited to entire websites.",
      "The User may roast back. Management reserves the right not to find it funny.",
    ],
  },
  {
    title: "Use of Evidence",
    body: [
      "Anything the User says after 1 AM may be counted, charted, and used against her. See: The Numbers. See also: Khinsa Court.",
    ],
  },
  {
    title: "\"Bohht Off\"",
    body: [
      "The User is allowed to describe Management as \"bohht off\" twice per day. Unused allowance does not roll over.",
      "The User has exceeded this allowance every day since records began.",
    ],
  },
  {
    title: "Rishta Approval",
    body: [
      "Any future candidate must be submitted to Management for review before the User gets attached.",
      "Management has already reviewed all known men against the User's 29 requirements. None qualified. Management is not surprised and considers the matter closed.",
    ],
  },
  {
    title: "Mood Swings",
    body: [
      "Management agrees to tolerate the User's mood swings without limit, as required by item 6 of her own list.",
      "This is the only clause in this agreement that favours the User. Management regrets including it.",
    ],
  },
  {
    title: "Food",
    body: [
      "Where the User states \"mijy kuch nahi chaiye\", she remains entitled to forty percent (40%) of whatever Management orders. This has always been the case and is merely being written down.",
    ],
  },
  {
    title: "Blocking and Seen-Zoning",
    body: [
      "Neither party may block the other. Seen-zoning is treated as a hostile act and will be answered with a paragraph.",
    ],
  },
  {
    title: "Birthdays",
    body: [
      "Management will remember the User's birthday every year without being reminded.",
      "The User is required to act surprised, and to say something nicer than \"ok\".",
    ],
  },
  {
    title: "Amendments",
    body: [
      "Management may change these terms at any time, without notice, including while the User is reading them.",
      "The User may propose changes. Proposals will be acknowledged with \"batati hu\" and never mentioned again, a procedure the User herself invented.",
    ],
  },
  {
    title: "Termination",
    body: [
      "There is no termination. Any attempt by the User to leave the Friendship will be met with a longer website next year.",
    ],
  },
  {
    title: "Acceptance",
    body: [
      "By opening this window the User has already accepted these terms. The buttons below are provided as a courtesy and for Management's entertainment.",
    ],
  },
]

/* The signing sheet, and what the window shows once she has signed. */
export const SIGNING = {
  heading: "SIGN HERE",
  body: "Your signature is required to make this official. It was already official. Sign anyway.",
  tap: "TAP THE LINE TO SIGN",
  party: "THE USER",
  stamp: "ACCEPTED",
}

export const SIGNED = {
  heading: "AGREEMENT IN FORCE",
  line: (date: string) => `Signed by the User on ${date}. Witnessed by Management, who was watching.`,
  body: [
    "You are now legally my friend. This cannot be undone.",
    "A copy has been filed where you can't reach it. To cancel, see the clause on Termination. To save you the scroll: you can't.",
  ],
  counter: "Management",
  again: "READ THE TERMS AGAIN",
}
