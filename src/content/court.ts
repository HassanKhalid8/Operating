/* ═══════════════════════════════════════════════════════════
   KHINSA COURT — content

   Every case she is tried for lives here. The app never needs
   touching to add, remove, or reorder one.

   The figures in the exhibits are real. They were counted out of the
   Instagram + WhatsApp exports (9 Aug – 29 Sep 2026) on the laptop;
   only the counts and her own catchphrases are written down here,
   never a conversation.

   HOW TO WRITE A CASE
     title     the offence, the way a charge sheet would name it
     charge    one paragraph, read out before she pleads
     exhibits  the evidence. Short. Numbers land harder than adjectives
     pleas     2 or 3 things she can say. `reply` is the bench's answer.
               None of them work — that is the whole court
     sentence  what she gets
     appeal    why the appeal fails
   ═══════════════════════════════════════════════════════════ */

export interface Plea {
  label: string
  /** What the judge says back. Shown before the verdict lands. */
  reply: string
}

export interface Case {
  title: string
  charge: string
  exhibits: string[]
  pleas: Plea[]
  sentence: string
  appeal: string
}

export const COURT = {
  name: "KHINSA COURT",
  division: "Sessions Division · Court of First and Last Instance",
  versus: "The State v. Khinsa",
  /* Who is who. All of them are the same person, which is the joke. */
  bench: [
    ["Presiding judge", "Hon. Justice Hassan"],
    ["Prosecutor", "Hassan"],
    ["Complainant", "Hassan"],
    ["Sole witness", "Hassan"],
    ["Defence counsel", "Not provided"],
  ] as [string, string][],
  intro: "You have been summoned. Every case below is backed by evidence from your own messages. You may plead however you like.",
  howPlead: "HOW DOES THE ACCUSED PLEAD?",
  deliberating: "The bench is deliberating…",
  guilty: "GUILTY",
  appealButton: "FILE AN APPEAL",
  appealRejected: "APPEAL REJECTED",
  next: "NEXT CASE",
  docket: "BACK TO DOCKET",
}

export const CASES: Case[] = [
  {
    title: "False Declaration of Sleep",
    charge:
      "That the accused did, on more than thirty separate occasions, declare \"good night\" with no intention whatsoever of going to sleep.",
    exhibits: [
      "\"good night\" entered into the record over 30 times.",
      "14 Sep, 1:57 AM: said good night. Sent 70 more messages in the following 37 minutes.",
      "25 Sep, 1:00 AM: said good night. 60 more messages by 1:32 AM.",
    ],
    pleas: [
      { label: "Bas ek baat yaad aa gayi thi", reply: "Seventy. Seventy baatein yaad aa gayi thi." },
      { label: "Tum reply kar rahe thay", reply: "The complainant was being polite. That is not consent." },
      { label: "Not guilty", reply: "Noted. Ignored." },
    ],
    sentence:
      "The words \"good night\" are hereby stripped of all meaning when said by the accused. Future declarations of sleep must be backed by actual sleep.",
    appeal: "Appeal filed at 2:14 AM. Which rather proves the point.",
  },
  {
    title: "Operating Outside Business Hours",
    charge:
      "That the accused habitually conducts her entire social life between 1 and 4 in the morning, and expects the complainant to be awake for it.",
    exhibits: [
      "4,724 messages sent between 1 AM and 4 AM. That is 28% of everything she has ever sent.",
      "Messages sent between 4 AM and 6 AM: zero. The accused shuts down like a factory.",
      "The very first message on record, 9 August: sent at 1:30 AM.",
    ],
    pleas: [
      { label: "Din mai time nahi milta", reply: "The court has seen your afternoons. There is time." },
      { label: "Raat ko baatein achi hoti hain", reply: "Agreed. Still guilty." },
      { label: "Tum bhi toh jaag rahe hote ho", reply: "The complainant is a victim here. Next." },
    ],
    sentence:
      "Dark circles, to be served concurrently by both parties. The complainant has already begun his.",
    appeal: "The appeals office is open 9 to 5. The accused has never been awake for it.",
  },
  {
    title: "Excessive and Unlicensed Use of 😭",
    charge:
      "That the accused has deployed the crying emoji at a volume no single person's tear ducts could support, mostly while laughing.",
    exhibits: [
      "😭 used 4,239 times in 52 days. That is one every 18 minutes, including while asleep.",
      "21 Sep, 12:37 AM: 34 of them in a single message.",
      "🤣 used a further 3,635 times, frequently in the same message. The court cannot tell if she is fine.",
    ],
    pleas: [
      { label: "😭😭😭", reply: "That is not a plea. That is the offence." },
      { label: "Feelings express kar rahi thi", reply: "4,239 feelings. The court is exhausted on your behalf." },
      { label: "Not guilty 😭", reply: "You did it again. In the plea. Unbelievable." },
    ],
    sentence:
      "A ration of three 😭 per message. Any message found carrying a fourth will be returned to sender unread.",
    appeal: "The appeal form was submitted with eleven 😭 on it. Rejected on arrival.",
  },
  {
    title: "Issuing Threats Without Follow-Through",
    charge:
      "That the accused has repeatedly issued the warning \"ainda na hoe\" and has never once enforced it.",
    exhibits: [
      "\"ainda na hoe\" issued 38 times.",
      "Times it did, in fact, hoe again: 38.",
      "😡 deployed 534 times in support. Fear generated: none.",
    ],
    pleas: [
      { label: "Last warning thi woh", reply: "All 38 were the last warning. The court has the list." },
      { label: "Tum sudhartay hi nahi", reply: "The complainant's conduct is not on trial. Conveniently." },
      { label: "Ainda na hoe 😊", reply: "39." },
    ],
    sentence:
      "The accused's threats are downgraded to \"suggestions\". The 😊 at the end is the only part anyone was ever scared of.",
    appeal: "The accused warned the court this had better not happen again. It happened again.",
  },
  {
    title: "Perjury",
    charge:
      "That the accused swears an oath on nearly everything, which no person telling the truth has ever needed to do.",
    exhibits: [
      "\"kasam\" sworn 105 times, at least 7 of them \"Allah ki qasam\".",
      "\"gen1\" added 121 times, in case the kasam was not enough.",
      "The complainant, over the same period, needed to swear only 18 times. He was believed every time. Allegedly.",
    ],
    pleas: [
      { label: "Kasam sai sach bol rahi thi", reply: "That is 106." },
      { label: "Gen1 not guilty", reply: "122. The clerk is running out of paper." },
      { label: "Tum yakeen nahi kartay isliye", reply: "Correct. And look where we are." },
    ],
    sentence:
      "The accused is placed under permanent oath. From now on everything she says is assumed to be sworn, so she can stop saying it.",
    appeal: "The accused swore she was innocent. The court has heard that one 105 times.",
  },
  {
    title: "Absconding",
    charge:
      "That the accused did vanish mid-conversation without notice, leaving the complainant on delivered for the better part of a working day.",
    exhibits: [
      "22 Aug: last seen 2:35 AM. Resurfaced 12:22 PM. Missing for 9 hours 47 minutes.",
      "14 Aug: missing for 9 hours 11 minutes. Statement on return: \"sogayi thi maiii\".",
      "No good night was said on either occasion. Which, given Case 1, would not have helped.",
    ],
    pleas: [
      { label: "Sogayi thi maiii", reply: "The one time you actually sleep, you tell nobody. Remarkable." },
      { label: "Phone silent pai tha", reply: "It is always on silent. That is a second offence." },
      { label: "Tumhe kya, tum bhi so jatay", reply: "The complainant was awake. Worrying. Probably." },
    ],
    sentence:
      "The accused must file a notice of sleep before sleeping. One word is enough. She knows which word. She has said it 30 times without meaning it.",
    appeal: "The appeal hearing was scheduled for 10 AM. The accused did not appear. Statement: \"sogayi thi\".",
  },
  {
    title: "Defamation of the Complainant",
    charge:
      "That the accused has, repeatedly and in writing, described the complainant's perfectly reasonable remarks as \"bohht off\".",
    exhibits: [
      "\"bohht off\" said 63 times. The complainant has said it 4 times, all in self-defence.",
      "\"Hassan\" sent as a full message, with nothing else, 37 times. The tone was not friendly.",
      "\"???\" sent on its own 74 times, demanding an explanation for things that were clearly jokes.",
    ],
    pleas: [
      { label: "Tum hotay hi off ho", reply: "The accused will address the bench with respect." },
      { label: "Sach bolna defamation nahi hota", reply: "Bohht off. See how it feels?" },
      { label: "Hassan.", reply: "38. And that tone has been noted." },
    ],
    sentence:
      "The accused must laugh at the complainant's next three jokes. Out loud. A 🤣 will not be accepted as proof.",
    appeal: "The appeal described the verdict as \"bohht off\". 64.",
  },
  {
    title: "Conduct Unbecoming of a Shareef Larki",
    charge:
      "That the accused maintains, in public, that she is shareef, while her own messages say otherwise in two letters.",
    exhibits: [
      "A certain two-letter word, and its longer cousins, appear in 502 of her messages.",
      "The complainant's count over the same period: 36. He is practically a saint.",
      "The court declines to read the exhibit aloud. There are children in the gallery.",
    ],
    pleas: [
      { label: "Woh toh bas expression hai", reply: "502 expressions. You are a very expressive person." },
      { label: "Mai shareef hu", reply: "The search returned no results." },
      { label: "Bcbc 🤣🤣🤣", reply: "503. In open court. Take her away." },
    ],
    sentence:
      "The title \"shareef\" is revoked. It may be re-applied for in writing, using only words her mama could read.",
    appeal: "The first word of the appeal was the word in question. Rejected.",
  },
]

/* The last screen, once every case has been heard. */
export const RECORD = {
  heading: "CRIMINAL RECORD",
  summary: (n: number) => `Convicted on all ${n} counts. Acquitted on none.`,
  appeals: (n: number) =>
    n === 0
      ? "Appeals filed: none. The accused knew better."
      : `Appeals filed: ${n}. Appeals rejected: ${n}.`,
  remarks:
    "The court notes that the accused is a repeat offender with no intention of reforming, and that the complainant keeps coming back anyway. Both facts have been entered into the record.",
  signed: "Hon. Justice Hassan",
  note: "This court does not grant bail, parole, or the benefit of the doubt.",
  again: "Stand trial again",
}
