/* Interview — sections, questions, branching rules, labels. Pure data + helpers. */
(function () {
  const C = { violet: "#5B21B6", magenta: "#9D174D", sky: "#0369A1", indigo: "#4338CA", amber: "#A16207", green: "#166534", plum: "#6D28D9" };
  const married = (a) => a.status === "married" || a.status === "civil";
  const cohab = (a) => a.status === "cohab";
  const exploring = (a) => a.stage === "considering";
  const agreed = (a) => a.stage === "agreed";

  const SECTIONS = [
    { id: "about", name: "About you", c: C.violet, title: "First, the two of you.", helper: "This shapes which rights and routes apply. There are no wrong answers." },
    { id: "kids", name: "Children", c: C.magenta, title: "Do you have children together?", helper: "If you do, their wellbeing leads everything else. We keep arrangements child-first throughout." },
    { id: "home", name: "The home", c: C.sky, title: "Where do you both live right now?", helper: "The home is usually the biggest single decision. Knowing the setup helps us frame the options fairly." },
    { id: "income", name: "Income & work", c: C.indigo, title: "What do you each bring in?", helper: "Rough bands are fine — you'll connect accounts later for exact figures.", optional: exploring },
    { id: "money", name: "Savings & assets", c: C.indigo, title: "Roughly, what else is there?", helper: "Savings, investments, cars — a ballpark is plenty." },
    { id: "pensions", name: "Pensions", c: C.indigo, title: "And pensions?", helper: "Often the second-biggest asset, and the easiest to overlook. Best guesses are fine." },
    { id: "debts", name: "Debts", c: C.indigo, title: "Any debts to deal with?", helper: "Debts are split too. Knowing whose name they're in matters.", optional: exploring },
    { id: "where", name: "Where you both are", c: C.plum, title: "Where are you both, emotionally?", helper: "This is delicate — and it changes everything about pace and approach. Be as honest as you can.", when: (a) => !agreed(a) && !exploring(a) },
    { id: "explore", name: "What would help", c: C.plum, title: "What would help most right now?", helper: "Nothing here commits you to anything. We'll shape your first read around this.", when: exploring },
    { id: "safety", name: "A quick check-in", c: C.green, title: "Before we go on — are you safe?", helper: "Separation can be hard, and sometimes it isn't safe. This stays private.", special: "safety" },
    { id: "goals", name: "What matters", c: C.violet, title: "What matters most to you?", helper: "Pick up to three. We'll weight your plan around them — and flag anything that may be hard to get.", when: (a) => !agreed(a) },
    { id: "names", name: "Last thing", c: C.violet, title: "What should we call you both?", helper: "Just first names, so your read feels like yours. A nickname is fine.", optional: () => true },
  ];

  const BANDS = {
    income: [["none", "None"], ["u25", "<£25k"], ["25_50", "£25–50k"], ["50_100", "£50–100k"], ["100", "£100k+"]],
    home: [["u250", "<£250k"], ["250_500", "£250–500k"], ["500_1m", "£500k–1m"], ["1m", "£1m+"]],
    mortgage: [["none", "None"], ["u100", "<£100k"], ["100_250", "£100–250k"], ["250", "£250k+"]],
    savings: [["u10", "<£10k"], ["10_50", "£10–50k"], ["50_150", "£50–150k"], ["150", "£150k+"]],
    pension: [["none", "None"], ["u50", "<£50k"], ["50_200", "£50–200k"], ["200_500", "£200–500k"], ["500", "£500k+"]],
    debt: [["u5", "<£5k"], ["5_20", "£5–20k"], ["20_50", "£20–50k"], ["50", "£50k+"]],
  };

  const Q = [
    { id: "stage", sec: "about", type: "cards", label: "Where are you right now?", opts: [["considering", "Thinking about separating", "Nothing's decided yet"], ["decided", "We've decided to separate", "Still living under one roof"], ["apart", "We're living apart", "Separated, nothing formal yet"], ["filed", "Divorce or dissolution has started", "Application made, or about to be"], ["agreed", "We've mostly agreed", "It needs writing up and making legal"]] },
    { id: "status", sec: "about", type: "cards", label: "What's your legal status?", opts: [["married", "Married", "Including separated, not yet divorced"], ["civil", "In a civil partnership", "Registered partnership"], ["cohab", "Living together, not married", "Cohabiting partners"]] },
    { id: "years", sec: "about", type: "seg", label: "How long have you been together?", opts: [["u5", "Under 5y"], ["5_10", "5–10y"], ["10_20", "10–20y"], ["20", "20y+"]] },
    { id: "agreed_on", sec: "about", type: "chips", label: "What have you already agreed?", helper: "We'll treat these as settled and check they look fair.", when: agreed, opts: [["home", "The home"], ["children", "Children"], ["savings", "Savings"], ["pensions", "Pensions"], ["maintenance", "Maintenance"], ["debts", "Debts"]] },

    { id: "kids", sec: "kids", type: "cards", label: "Do you have children together?", opts: [["none", "No children together"], ["with", "Yes — under 18"], ["grown", "Yes — they're grown up now"]] },
    { id: "ages", sec: "kids", type: "chips", label: "Roughly how old? Tap all that apply.", when: (a) => a.kids === "with", opts: [["u5", "Under 5"], ["5_11", "5–11"], ["11_16", "11–16"], ["16_18", "16–18"]] },
    { id: "kids_live", sec: "kids", type: "cards", label: "Where are they living day to day?", when: (a) => a.kids === "with", opts: [["me", "Mostly with me"], ["them", "Mostly with my partner"], ["shared", "Roughly shared"], ["unsettled", "Not settled yet"]] },

    { id: "home", sec: "home", type: "cards", label: "Your home", opts: [["own_together", "We own our home together", "Joint mortgage or jointly owned"], ["own_me", "It's in my name", "I own it, or the mortgage is mine"], ["own_them", "It's in my partner's name", "They own it, or the mortgage is theirs"], ["rent", "We rent", "Joint or sole tenancy"]] },
    { id: "home_value", sec: "home", type: "band", label: "Roughly what's it worth?", when: (a) => /^own/.test(a.home || ""), bands: "home" },
    { id: "mortgage", sec: "home", type: "band", label: "And what's left on the mortgage?", when: (a) => /^own/.test(a.home || ""), bands: "mortgage" },
    { id: "cohab_home", sec: "home", type: "note", when: (a) => cohab(a) && /^own/.test(a.home || ""), text: "As you're not married, the law mainly looks at whose name the home is in, and what each of you paid towards it. We'll ask about that later." },

    { id: "work", sec: "income", type: "seg", label: "Your work", opts: [["employed", "Employed"], ["self", "Self-employed"], ["none", "Not working"], ["retired", "Retired"]] },
    { id: "inc_me", sec: "income", type: "band", label: "Your income, before tax", bands: "income", skip: "Prefer not to say" },
    { id: "inc_them", sec: "income", type: "band", label: "Your partner's income, roughly", bands: "income", skip: "Not sure" },

    { id: "savings", sec: "money", type: "band", label: (a) => cohab(a) ? "Savings & investments in joint names" : "Savings & investments, between you", bands: "savings" },
    { id: "savings_own", sec: "money", type: "band", label: "And in your own name", when: cohab, bands: "savings" },
    { id: "complex", sec: "money", type: "chips", label: "Anything more complicated?", helper: "These can need specialist advice alongside Decouple.", opts: [["business", "A business"], ["property", "Another property"], ["trust", "A trust or inheritance"], ["overseas", "Assets overseas"], ["none", "None of these"]], exclusive: "none" },

    { id: "pen_me", sec: "pensions", type: "band", label: "Your pensions, roughly", bands: "pension", skip: "Not sure" },
    { id: "pen_them", sec: "pensions", type: "band", label: "Your partner's pensions", bands: "pension", skip: "Not sure" },
    { id: "pen_type", sec: "pensions", type: "chips", label: "What kinds? Tap any you know.", opts: [["work", "Workplace"], ["personal", "Personal / SIPP"], ["public", "Public sector (NHS, teachers…)"], ["state", "State pension only"], ["unsure", "Not sure"]], optional: true },
    { id: "cohab_pen", sec: "pensions", type: "note", when: cohab, text: "Pensions usually aren't shared between unmarried couples — but they still matter for what's fair overall." },

    { id: "debt_kinds", sec: "debts", type: "chips", label: "What kinds?", opts: [["cards", "Credit cards"], ["loan", "Personal loans"], ["car", "Car finance"], ["overdraft", "Overdraft"], ["family", "Owed to family"], ["none", "No debts"]], exclusive: "none" },
    { id: "debt_total", sec: "debts", type: "band", label: "Roughly how much, in total?", when: (a) => a.debt_kinds && a.debt_kinds.length && !a.debt_kinds.includes("none"), bands: "debt" },
    { id: "debt_names", sec: "debts", type: "seg", label: "Whose names are they in?", when: (a) => a.debt_kinds && a.debt_kinds.length && !a.debt_kinds.includes("none"), opts: [["joint", "Joint"], ["me", "Mine"], ["them", "Theirs"], ["mixed", "A mix"]] },

    { id: "stand", sec: "where", type: "cards", label: "Has the decision been made?", opts: [["mutual", "We both want to separate", "Aligned on the decision"], ["mine", "It's my decision", "My partner may not be there yet"], ["theirs", "It's their decision", "I'm still coming to terms with it"]] },
    { id: "comms", sec: "where", type: "seg", label: "How is communication between you?", opts: [["good", "Civil"], ["tense", "Tense"], ["hard", "Very hard"]] },

    { id: "help_now", sec: "explore", type: "cards", label: "Pick the one that fits best", opts: [["options", "Understand my options", "What separating would actually involve"], ["entitled", "Know where I'd stand", "A rough idea of a fair split"], ["talk", "Talk it through with someone", "A mediator or counsellor"], ["steps", "Know the first steps", "What to do, and in what order"]] },

    { id: "safe", sec: "safety", type: "safe" },
    { id: "safe2", sec: "safety", type: "chips", label: "Do any of these apply?", helper: "Tap any that are true. You can skip this.", when: (a) => a.safe === "worried", opts: [["afraid", "I'm afraid of my partner"], ["money", "They control the money"], ["threat", "They've threatened me or the children"], ["seen", "I'm worried they'll see this"], ["none", "None of these"]], exclusive: "none" },

    { id: "name_me", sec: "names", type: "text", label: "Your first name", ph: "e.g. Sarah" },
    { id: "name_them", sec: "names", type: "text", label: "Your partner's first name", ph: "e.g. Mark" },
    { id: "goals", sec: "goals", type: "chips", max: 3, opts: [["home", "Stay in the family home"], ["kids", "Protect the children's stability"], ["fair", "A genuinely fair split"], ["pension", "Keep my pension secure"], ["quick", "Move on quickly and calmly"], ["court", "Stay out of court"], ["security", "Financial security"], ["costs", "Keep costs down"]] },
  ];

  const qWhen = (q, a) => !q.when || q.when(a);
  const secQs = (sid, a) => Q.filter((q) => q.sec === sid && qWhen(q, a));
  const activeSections = (a) => SECTIONS.filter((s) => !s.when || s.when(a));
  const answered = (q, a) => {
    if (q.type === "note") return true;
    const v = a[q.id];
    if (q.type === "chips") return q.optional || q.id === "safe2" || (Array.isArray(v) && v.length > 0);
    if (q.type === "text") return typeof v === "string" && v.trim().length > 0;
    return v !== undefined && v !== null && v !== "";
  };
  const isOptionalSec = (s, a) => s.optional && s.optional(a);
  const safetyStop = (a) => a.safe === "unsafe" || (Array.isArray(a.safe2) && a.safe2.some((x) => x !== "none"));
  const labelOf = (q, a) => (typeof q.label === "function" ? q.label(a) : q.label);
  const optsOf = (q) => q.opts || BANDS[q.bands];
  const valLabel = (qid, a) => {
    const q = Q.find((x) => x.id === qid), v = a[qid];
    if (!q || v == null) return null;
    if (v === "__skip") return q.skip || "Skipped";
    const o = optsOf(q) || [];
    if (Array.isArray(v)) return v.length ? v.map((x) => (o.find((p) => p[0] === x) || [])[1]).filter(Boolean).join(", ") : null;
    return (o.find((p) => p[0] === v) || [])[1] || null;
  };

  /* panel summary rows */
  const PANEL = [
    ["Situation", (a) => valLabel("stage", a)],
    ["Relationship", (a) => [valLabel("status", a), valLabel("years", a)].filter(Boolean).join(" · ") || null],
    ["Children", (a) => a.kids === "none" ? "None together" : a.kids === "with" ? (valLabel("ages", a) ? "Ages " + valLabel("ages", a) : "Under 18") : a.kids === "grown" ? "Grown up" : null],
    ["The home", (a) => a.home ? ({ own_together: "Owned together", own_me: "In your name", own_them: "In their name", rent: "Rented" }[a.home] + (a.home_value ? " · " + valLabel("home_value", a) : "")) : null],
    ["Income", (a) => a.inc_me ? "You " + valLabel("inc_me", a) + (a.inc_them ? " · them " + valLabel("inc_them", a) : "") : null],
    ["Savings", (a) => valLabel("savings", a)],
    ["Pensions", (a) => a.pen_me ? "You " + valLabel("pen_me", a) + (a.pen_them ? " · them " + valLabel("pen_them", a) : "") : null],
    ["Debts", (a) => a.debt_kinds ? (a.debt_kinds.includes("none") ? "None" : valLabel("debt_total", a) || valLabel("debt_kinds", a)) : null],
    ["Priorities", (a) => a.goals && a.goals.length ? a.goals.length + " chosen" : a.stage === "agreed" && a.agreed_on ? a.agreed_on.length + " already agreed" : null],
  ];

  window.IV = { C, SECTIONS, Q, BANDS, secQs, activeSections, answered, isOptionalSec, safetyStop, labelOf, optsOf, valLabel, PANEL, qWhen, married, cohab, exploring, agreed };
})();
