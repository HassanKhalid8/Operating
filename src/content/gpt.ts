/* ═══════════════════════════════════════════════════════════
   KHINSAGPT — content

   A chatbot that answers the way she texts. There is no model and
   nothing leaves the browser: src/lib/gptBrain.ts reads the message,
   works out what is being asked, and picks a reply from this file.

   The lines are her own catchphrases, spelled the way she spells
   them — the ones she sends over and over, counted out of the chat
   exports. Nothing here is a real conversation, only the habits.

   HOW A REPLY IS CHOSEN (see gptBrain.ts for the order)
     1. Things it can actually work out: sums, the time, "X or Y?",
        "are you X?", "what is X?". Those answer the real question.
     2. Otherwise every TOPIC below is tried against the message and the
        most specific match wins — "kya tum naraz ho" is about being
        naraz, not about the word "kya".
     3. Nothing matched → a fallback that fits the shape of the message
        (a question, a statement, an essay).

   WRITING A REPLY
     A reply is one line, or a list of lines sent back to back.
     {x} is replaced with the thing she asked about, where there is one.
     The same reply is never sent twice in a row.
   ═══════════════════════════════════════════════════════════ */

/** One reply: a line, or a burst of lines sent back to back. */
export type Reply = string | string[]

export interface Topic {
  /** Tested against the message once it is lower-cased and "yarrrr" is
      squeezed to "yar", so patterns only need the plain spelling. */
  when: RegExp
  say: Reply[]
  /** A vague word like "kya" or "why". Loses to any real topic in the
      same message, however short. */
  weak?: boolean
}

export const GPT = {
  name: "KhinsaGPT",
  model: "khinsa-4-off",
  tagline: "Trained on 16,981 messages. Learned nothing.",
  empty: "Ask me anything. I will not answer it.",
  placeholder: "Message KhinsaGPT",
  disclaimer: "KhinsaGPT can make mistakes. It will not admit to any of them.",
  typing: "typing…",
  /* Shown instead of "typing…" on the long, pointless waits. */
  typingLong: "typing… (still)",
  newChat: "NEW CHAT",
  /* She gets this many messages before the model gets bored. */
  limit: 40,
  limitTitle: "You've hit your limit",
  limitBody:
    "KhinsaGPT has run out of patience for today. Upgrade to KhinsaGPT Plus for unlimited patience. Plus is not available. It was never going to be available.",
}

/* The chips above the box before she has typed anything. */
export const SUGGESTIONS = [
  "Kya kar rahi ho?",
  "Who is right, me or Hassan?",
  "Are you shareef?",
  "Say sorry",
  "Good night",
]

/* ── things the brain works out for itself ─────────────────── */

/* "are you X?" / "tum X ho" — which words are praise and which are not. */
export const TRAITS = {
  good: /\b(share+f|smart|cute|pretty|beautiful|pyari|ach+i|best|funny|intelligent|nice|sweet|kind|perfect|right|sahi|genius|cool|khu?bsurat|khoobsurat|innocent|masoom|mature|gorgeous|amazing|talented|hardworking|loyal)\b/,
  bad: /\b(pagal|crazy|stupid|dumb|idiot|moti|fat|ugly|lazy|sust|bewakoof|bewaqoof|annoying|weird|ajeeb|wrong|g[h]?alat|mean|rude|badtameez|boring|drama|dramebaa?z|toxic|chalak|liar|jhoo?ti|choti|kanjoos|selfish|ziddi|nalaiq|useless)\b/,
}

/* Asked whether SHE is something good / something bad. */
export const SELF = {
  good: ["obv", "obvvvv", ["obv", "kasam saii"], "hannnnn", ["{x} hi toh hu", "😋😋"], "ye bhi pouchny ki baat hai"] as Reply[],
  bad: ["😡😡😡", "nhiii", ["{x}??", "mai??"], ["nahi huh", "😡😡"], "tum khud {x}", "ainda na hoe", "obv noooooo"] as Reply[],
  /* Told (not asked) that she is something good / bad. */
  praised: ["awww🥹🥹", "thankyou 🤍", "ik", "mashallah", ["chlo chlo", "😝"], "🥹🥹🥹"] as Reply[],
  insulted: ["😡😡😡", "huhh", "tum khud {x}", "ainda na hoe", "chupp", "bohht off", "😡😡😡😡"] as Reply[],
}

/* Asked whether HASSAN is something good / something bad. */
export const HASSAN = {
  good: ["nooo", "bohht off", "bilkul ni", "liar asf", ["hassan??", "{x}??", "🤣🤣🤣"], "obv noooooo"] as Reply[],
  bad: ["exactly", "frrr", "gen1", "obvvvv", "hannnnn", ["{x} toh hai", "gen1"], "bcbc🤣🤣🤣"] as Reply[],
}

/* "X or Y?" — {x} is the one it picked. */
export const CHOICE = {
  pick: ["{x}", "{x} obv", ["{x}", "obvvvv"], ["{x}", "ye bhi pouchny ki baat hai"], "obv {x}"] as Reply[],
  /* Once in a while it refuses to choose. */
  neither: ["dono", ["dono ni", "😝"], "idk dono"] as Reply[],
}

/* "what is X" / "explain X" / "X kya hota". */
export const EXPLAIN: Reply[] = [
  ["{x}??", "mijy kya pata😭😭😭"],
  ["{x} kya hota", "google krlo"],
  ["idk", "{x} choro"],
  ["itna mushkil sawal", "choro"],
  ["pata ni", "tum batao"],
  "{x}?? huhh",
]

/* A sum. {x} is the answer — it does get them right. */
export const SUMS: Reply[] = [
  ["{x}", "calculator hu mai??"],
  "{x} obv",
  ["{x}", "itna bhi ni aata tumhe 🤣🤣"],
  ["{x}", "easy"],
]

/* The time. {x} is the clock. `late` is for after midnight. */
export const CLOCK = {
  day: [["{x}", "ghari ni hai tumhare pass??"], "{x}", ["{x} horhy", "kyun"]] as Reply[],
  late: [["{x}", "aur tum soye ni abhi tak??"], ["{x} horhy", "neend ni arhi"], "{x}"] as Reply[],
  /* "what day is it" — {x} is the weekday. */
  date: ["{x}", ["{x} hai", "obv"], ["{x}", "calendar dekh lo"]] as Reply[],
}

/* She asked the same thing twice. */
export const REPEATED: Reply[] = [
  "ye abhi bola tha", "phr wohi", ["sun liya maine", "🙂"], "???", "copy paste kyun krhy", "han han parh liya",
]

/* "why?" straight after it said no. */
export const WHY_NOT: Reply[] = ["bhs ni", "mera dil ni krha", "waisy hi", ["nhiii", "matlab nhiii"], "aise hi random"]

/* "batao?" / "toh?" straight after it said "wait" or "batati hu". */
export const NEVER_MIND: Reply[] = ["balky choro", "nvm", "bhul giii 😭", "kuch ni", ["wait", "nvm"]]

/* Nothing but emoji. Each list answers one kind of face. */
export const EMOJI: { when: RegExp; say: Reply[] }[] = [
  { when: /[😡🤬😠😤]/u, say: ["???", "kya kiya maine", "huhh", "😡😡😡"] },
  { when: /[😭😢🥺💔😞😔]/u, say: ["kya hua???", "😭😭😭", "💔💔💔", "yarrr😭😭😭"] },
  { when: /[🤣😂😆😹]/u, say: ["🤣🤣🤣", "bcbc🤣", "bcbc🤣🤣🤣", "yarrr🤣🤣"] },
  { when: /[❤🤍💕🥹😍🫶😘💖]/u, say: ["🥹🥹🥹", "awww🥹🥹", "chlo chlo 😝", "🤍"] },
  { when: /[💀☠]/u, say: ["💀💀", "💀💀💀", "bcbc🤣"] },
  { when: /[😝😛😜😋]/u, say: ["😝😝", "😛😛", "😋"] },
]
export const EMOJI_OTHER: Reply[] = ["???", "🙂", "huhh", "matlab?"]

/* ── topics ────────────────────────────────────────────────── */

export const TOPICS: Topic[] = [
  /* Going to sleep: she says it, then keeps going. */
  {
    when: /good ?night|\bgn\b|so ja|sone (ja|lag)|sleep now|going to sleep|so r[a]?h[ai] hu/,
    say: [
      ["good night", "waisy", "ek baat batau", "choro", "nvm", "acha suno"],
      ["good night", "wait", "ye dekho", "😭😭😭", "ok ab pakka good night", "waisy"],
      ["neend arhi", "bhs 15 min soo loun", "…", "ni arhi neend"],
    ],
  },
  { when: /good ?morning|\bgm\b|subah bakhair/, say: ["good morning 😋", "hiiii good morning", "good morning 😭😭", ["good morning", "neend arhi"]] },
  { when: /^(hi|hey|hello|helo|hy|hii|salam|aoa|assalam\w*|knock( knock)?|oye|oi|suno?|yo)\b/, weak: true,
    say: ["hiiii", "khair ha??", ["hiii", "khair hai"], "han bolo", "hannn"] },

  { when: /kais[iey] ho|kes[iy] ho|how are (you|u)|how r u|hows you|kya hal|kia hal|theek ho|thik ho|sab theek|(you|u) (ok|okay|fine|alright)|tabiyat/,
    say: ["I'm gooddd", "theek hu ab", ["good", "tum batao"], "neend arhi", ["bohht off mood hai", "choro"]] },
  { when: /ky?[ai] k[a]?r r[a]?h[iey]|what (are|r) (you|u) (doing|up to)|\bwyd\b|ky?a ho r[a]?ha|whats up|wassup|\bsup\b|ky?a chal r/,
    say: ["kuch ni", "mai toh reels dekh rhi", "tyaar horhi", ["kuch ni", "tum batao"], "leti hu", "class mai hoon"] },
  { when: /kah[a]?n ho|kidh?[a]?r ho|where (are|r) (you|u)|ghar (pai|pe|par) ho|ghar pohanch|reached/,
    say: ["ghr", "uni", "bed pai", "class mai hoon", ["ghr", "kyun"]] },
  { when: /(your|ur|tumh[a]?ra|apka|tera) (name|naam)|naam ky?a|who (are|r) (you|u)|kon ho|tum kon/,
    say: ["khinsa", ["khinsa", "obv"], ["KhinsaGPT", "asli wali"], ["khinsa", "bhul gaye??"]] },
  { when: /how old|your age|umar|kitne saal ki/, say: ["tumhe kya 😝", ["larkiyon sai age ni pouchty", "😡"], "huhh"] },
  { when: /birthday|bday|b-day|salgirah|janam din/, say: ["15 sep", ["15 sep", "bhul gaye thy??😡"], "yayyyyy", ["15 sep", "gift kahan hai"]] },
  { when: /where do (you|u) live|kah[a]?n re?hti|which city|konsa shehar|(lahore|karachi) (kaisa|best|pasand|acha)/,
    say: ["lahore", ["lahore", "obv"], "gen1 idk kyun karachi passand haiii", "lahore best haiiii gen1"] },

  { when: /khana kha|kha liya|kuch khaya|khaya\b|did (you|u) eat|have (you|u) eaten|\b(lunch|dinner|breakfast|nashta|sehri|iftar)\b/,
    say: ["hn obvv", "khaati hu itnaaa", "moti hojyun gi", "abhi ni", "bhook lagi 😭"] },
  { when: /bhook|bhuk|hungry|biryani|pizza|burger|fries|shawarma|\bchai\b|coffee|khana|food|ice ?cream|chocolate|cake|momos|pasta/,
    say: ["mijy bhi chaiye 😋😋", "😋", "bhook lagi 😭", "moti hojyun gi", ["yarr mijy bhi", "😋😋"], "treat do phr"] },

  { when: /so g[a]?[iy]i|so r[a]?hi ho|soy?i (ho|thi)|asleep|awake|jaag r[a]?hi|uth g[a]?[iy]i|\buthi\b|neend/,
    say: ["uthi hoi hu", "ni arhi neend", "sameee par uthny ki himat ni horhi", "neend arhi", "sogayi thi maiii"] },

  { when: /naraz|gussa|angry|mad at|upset (with|ho)|khafa/,
    say: ["tumsai kyun hi hona naraz maineee", ["han hu", "🙂🙂🙂"], "😡😡😡", "ni man rhi", ["nhiii", "🙂"]] },
  { when: /ma+n ja|maaf kar|maaf kr|forgive|mana (lo|lu)|please maan/, say: ["ni man rhi", "nooo", ["souchti hu", "ainda na hoe"], "🙂🙂🙂"] },
  { when: /say sorry|sorry bol|apologi[sz]e|maafi mang/, say: ["nooo", "neverrr", ["mai??", "nope"], "tum bolo sorry", ["sorry", "(dil sai ni)"]] },
  { when: /sor+y|\bmaaf\b|my bad|galti|ghalti/, say: ["arey it's ok", "ainda na hoe", "ainda na hoe😊", "ainda na hoooo😡", ["hmm", "ainda na hoe"], "ni man rhi", "khair hai"] },
  { when: /thank|thanks|\bthx\b|\bty\b|shukriya|jazak/, say: ["khair hai", "dw", "tumhai bhi thankyou 😝", [":)", "ainda bhi kr dungi"]] },

  /* Who is right. There is only one answer. */
  { when: /(who|kon|kaun) ?(is|s|hai)? (right|sahi|better|best|smarter|funnier|cuter)|kon (right|sahi|best|behtar)/,
    say: ["mai", "obv mai", ["mai", "obvvvv"], "ye bhi pouchny ki baat hai"] },
  { when: /(love|like|pasand|miss|shadi|marry).{0,14}hassan|hassan.{0,14}(love|like|pasand|miss|shadi)/,
    say: ["ewww", "bohht off", "tumhe kya 😝", "choro", ["hassan??", "🤣🤣🤣"]] },
  { when: /(who|kon|kaun) (is|hai) hassan|hassan (kon|kaun|kaisa|kesa)|what about hassan|how is hassan|tell me about hassan|about hassan/,
    say: ["bohht off", ["pagal hai", "gen1"], "dost hai", ["kon hassan", "🤣🤣🤣"], ["hassan pagallll", "likha hua hai desk pai"]] },
  { when: /hassan/, weak: true, say: ["bohht off", "bohht offf", "hassan", ["kon hassan", "🤣🤣🤣"], "usko choro"] },

  { when: /share+f/, say: ["obv", "obvvvv", ["mai bohht shareef hu", "kasam saii"], "allah ki qasam"] },
  { when: /(are|r) (you|u) (an? )?(ai|bot|robot|real|human|chatgpt|gpt|fake)|asli ho|nakli|tum (bot|robot|ai) ho/,
    say: [["mai asli khinsa hu", "kasam saii"], "gen1 asli", "robot tum khud", ["nhiii", "allah ki qasam"]] },
  { when: /do (you|u) (love|like) me|love (you|u)|\bily\b|pasand (ho|hu)|crush|\bbf\b|boyfriend|shadi|rishta|marry|husband/,
    say: ["tumhe kya 😝", "ewww", ["chlo chlo", "😝"], ["29 requirements hain", "phly woh puri kro"], "bohht off", "awww🥹🥹"] },
  { when: /miss (you|u|kar|kr|kiya)|yaad (a|aa)/, say: ["awww🥹🥹", "goodd🤣", "obv", ["miss krna bhi chaiye", "😝"]] },
  { when: /tell (me )?a joke|joke suna|make me laugh|kuch funny/, say: [["hassan", "🤣🤣🤣"], ["tumhari shakal", "bcbc🤣🤣🤣"], "mai joker hu??"] },
  { when: /ha+ha+|he+he+|\blol\b|lmao|lmfao|🤣|😂|funny|mazak|mazaq|joke/,
    say: ["🤣🤣🤣", "bcbc🤣", "bcbc🤣🤣🤣", "yarrr🤣🤣", "bcbc yarrr🤣🤣🤣🤣", "😭😭🤣🤣", "bohht off"] },
  { when: /\bsad\b|ro r[a]?h|\bcry|crying|dukhi|udaas|udas|\bhurt\b|akel[ai]|lonely|depress|bura lag|😭|💔/,
    say: ["kya hua???", ["kya huaaa", "batao"], "💔💔💔", "🥺🥺🥺🥺", "yarrr😭😭😭"] },
  { when: /kh[a]?rab|toot ga|tut ga|kho ga|lost|fail|b[ei]mar|sick|bukhar|accident|problem|masla|chot|dard|tension|stress|thak ga/,
    say: ["kya hua???", "oh nooo", "yarrr😭😭😭", "💔💔💔", "kuch ni hotaaa", ["ohhhh", "phr?"]] },
  { when: /khush|happy|excited|\byay|pass ho|passed|mil ga?[iy][ai]|\bwon\b|jeet ga?[iy][ae]|a\+|full marks/,
    say: ["yayyyyy", "gooddd", "awww🥹🥹", "mashallah", "shukrrrr"] },

  { when: /\buni\b|university|\bclass\b|quiz|assignment|\bpaper|exam|study|parh|lecture|teacher|\bsir\b|maam|semester|\bgpa\b|marks|presentation|lab\b/,
    say: ["yarr choro", ["kal hai", "kuch ni aata 😭😭😭"], "easy", "bohht off", "class mai hoon", "bc uni 😭"] },
  { when: /\bcall\b|phone k[a]?r|\bvc\b|video call|voice note|\bvn\b/,
    say: ["pls no abhi", "no plsss", "class mai hoon", "just give me 10 min", "paka??", "krdo"] },
  { when: /\bmil(te|ty|na|ein|o|ty hain)\b|\bmeet\b|bahar chal|koi plan|aa? ?jao|chalo chal|kab mil/,
    say: ["paka??", "doneee", ["souchti hu", "batati hu"], "kab??", "chlo"] },
  { when: /\bpic\b|photo|picture|selfie|\bsnap\b|bhejo|bhej do|send (me|it|a)/,
    say: ["nooo", "nii mai ni bhj rhi", "pls no abhi", ["wait", "nvm"], "khud dhund lo"] },
  { when: /reply|\bseen\b|ignore|jawab|answer me|where did (you|u) go|kah[a]?n g[a]?[iy]i|kah[a]?n chali|are (you|u) there|zinda ho|hello\?|gayab/,
    say: ["sogayi thi maiii", "toh mai reply krhi naaaa", "wait", "class mai hoon", "bcccc itne msgsss"] },
  { when: /free ho|(are|r) (you|u) free|\bbusy\b|time hai|baat k[a]?r (sakt|lo|ein)|can we talk|talk to me|baat kro/,
    say: ["pls no abhi", "5 min tak", "han bolo", "class mai hoon", "bolo sun rhi"] },
  { when: /\bbor(e|ed|ing)\b|kuch (krne|karne) ko n/, say: ["sameee", "me rn", "frrr", ["mai bhi", "reels dekh lo"]] },
  { when: /weather|mausam|garmi|sardi|barish|\brain|\bhot\b|\bcold\b|thand/, say: ["bohht garmi 😭", "frrr", "barish 🥹🥹", "ac chala lo"] },
  { when: /paise|paisy|money|\btreat\b|khilao|udhar|gift|tohfa|present|shopping/,
    say: ["treat do phr", "mijy bhi chaiye 😋", "yesss", ["gift??", "kahan hai"], "plsss"] },
  { when: /ja r[a]?h[aiey] (hu|hoon|hai)|jana hai|going to|going|nikal r[a]?h|pohanch|wapis a/,
    say: ["kyun", "kab", "mijy bhi lai jao", "kahan", ["ok", "pohanch kr batana"], "acha"] },
  { when: /reel|insta|instagram|whatsapp|tiktok|netflix|movie|drama|season|song|gana|music/,
    say: ["mai toh reels dekh rhi", ["wait ek reel dhund rhi", "nvm"], "ni dekhi", "dekh liya 🤣🤣", "konsa"] },

  { when: /\bsach\b|really|pakka|\bpaka\b|serious|promise|[kq]asam|jhoo?t|\blie\b|lying|\bsure\b|believe|yakeen/,
    say: ["kasam saii", "allah ki qasam", "gen1", ["gen1", "kasam saii"], "frrr", "paka"] },
  { when: /\bdone\b|k[a]?r (diya|liya|di|li)\b|finish|complete|khatam/, say: ["doneee", "doneeee", "gooddd", "yayyyyy", "shukrrrr"] },
  { when: /\bbye\b|chalta hu|chalti hu|leaving|allah hafiz|\btc\b|take care|baad m[ae]i? baat/, say: ["byeee", "byeeee", ["byee", "wait", "ek baat"], "ok", "byee byeee"] },
  { when: /please|\bplz+\b|\bpls+\b|request|meri baat/, weak: true, say: ["nooo", "plsss", ["nope", "😛"], "choro", "souchti hu"] },
  { when: /\bagree|\bsahi\b|exactly|\btrue\b|bilkul|same|fr\b/, say: ["exactly", "frrr", "frrrrr", "jbhhhh", "sameee", "han gen1"] },
  { when: /\bkhinsa\b/, weak: true, say: ["han?", "bolo", "hannn", "kya hai"] },

  /* Being told to do something. */
  { when: /\b(k[a]?ro|kar do|krdo|batao|bata do|bolo|bol do|sunao|dikhao|likho|tell me|show me|give me|sing|do it|write)\b/, weak: true,
    say: ["nooo", "tum kro", "kro kro mai kon hoti kahny wali :)", "balky choro", ["nope", "😛"], "khud kro"] },

  /* Question words, when nothing more specific was said. */
  { when: /\b(kyu+n?|kiun|why|kis liye)\b/, weak: true, say: ["waisy hi", "aise hi random", "idk", "mera dil kiyaa😋😋", ["kyunn", "tumhe kya"]] },
  { when: /\b(kab|when|kitni d[ae]i?r|how long|kitna time)\b/, weak: true, say: ["5 min tak", "just give me 10 min", "abhi", "ghr jkr batati", "1 min", "kal"] },
  { when: /\b(kitn[aie]y?|how much|how many)\b/, weak: true, say: ["bohht", "bohht zada", "2", "idkkk", "itnaaa"] },
  { when: /\b(kais[ey]|kes[ey]|how (do|to|did|can|does))\b/, weak: true, say: ["pata ni", "idk", "waisy hi", "mijy kya pata😭😭😭", "seedha bolo"] },
  { when: /\b(kah[a]?n|kidh?[a]?r|where)\b/, weak: true, say: ["ghr", "pata ni", "idr hi", "konsa"] },
  { when: /\b(kon|kaun|who|kis ?n[ae])\b/, weak: true, say: ["mai", "tum", "hassan", "pata ni", "konsa"] },
  { when: /\b(ky?a|what|konsa|which)\b/, weak: true, say: ["kuch ni", "pata ni", "konsa", "seedha bolo", "tumhe kya"] },

  { when: /^(yes+|han+|haa+n|hn+|ji|yep|yeah|yup|yea|okay yes)\b/, weak: true, say: ["gooddd", "doneee", "ok", "yess", ":)"] },
  { when: /^(no+|nahi+|nhi+|ni+|nope|na+h?|never)\b/, weak: true, say: ["kyunn", "huhh", "???", "acha", ["ok", "🙂🙂🙂"], "ainda na hoe"] },
  { when: /^(ok+|okay|k+|acha+|ach+a|hm+|theek|thik|fine|oh+|ohk)$/, say: ["ok", ":)", "🙂", ".", ["ok??", "bhs ok??"], "hmm"] },
  { when: /^(aur|and|phi?r|then|toh?|so|aur kya|aur batao)$/, say: ["bhs", "aur kuch ni", "tum batao", "kuch ni"] },
]

/* ── fallbacks, by the shape of the message ────────────────── */

/* It ended in a question mark and nothing above understood it. */
export const QUESTION: Reply[] = [
  "pata ni", "idk", "idkkk", "mijy kya pata😭😭😭", "tumhe kya", "obv", "nopeee", "hannn",
  "konsa", "seedha bolo", ["wait", "batati hu"], "yesss", "nhiii",
]

/* A plain statement. {x} is a word lifted out of what she said. */
export const ECHO: Reply[] = ["{x}??", "{x} 😭😭😭", "acha {x}", ["{x}??", "🤣🤣🤣"], ["ohhhh", "{x}"]]

export const STATEMENT: Reply[] = [
  "ohhhhhh", "acha", "hannnnn", "gen1", "jbhhhh", "frrr", "exactly", "😭😭😭", "🤣🤣", "bcbc🤣",
  "bcbc🤣🤣🤣", "yarrr🤣🤣", "wtf", "no way", "me rn", "sameee", "ngl", "💀💀", "huhh",
  ["ohhhh", "phr?"], ["acha", "phr kya hua"], ["wait", "kya keh rhy thy"],
]

/* For a message long enough to count as a paragraph. */
export const TOO_LONG: Reply[] = ["bccc itne msgsss", ["itna lamba", "ni parh rhi"], "tldr", ["ok", "(parha ni)"]]

/* Between 4 and 11 in the morning the model is asleep — as she is. */
export const ASLEEP = {
  banner: "The model is asleep. Replies may take up to 9 hours 47 minutes.",
  say: ["sogayi thi maiii", "neend arhi", ["hmm", "so rhi hu"], "subah baat krty"] as Reply[],
}

/* 1 to 4 AM, when 28% of everything she has ever sent was sent. */
export const PEAK = "Peak hours. The model is at its most active and least sensible."

/* Sometimes it types for a very long time and sends this. */
export const ANTICLIMAX: Reply[] = ["ok", "hmm", "acha", ".", ":)"]
