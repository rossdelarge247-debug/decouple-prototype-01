/* M02 v2 · interview schema (IV format, reusing Proto 02 questions), guide content and validation questions */
window.G = (function () {
  const IV = window.IV, C = IV.C, AMB = "#A16207";
  const iq = (id, sec, extra) => ({ ...IV.Q.find((q) => q.id === id), sec, ...(extra || {}) });
  const owns = (a) => /^own/.test(a.home || "");
  const hasDebt = (a) => a.debt_kinds && a.debt_kinds.length && !a.debt_kinds.includes("none");

  const SECTIONS = [
    { id: "about", name: "About you", c: C.violet, title: "First, the two of you.", helper: "This shapes which rules and routes apply to you. There are no wrong answers.", expect: (a) => a.stage === "considering" ? "Just exploring is completely fine. Nothing here commits you to anything, and your guide will start with your options." : "Not knowing where to start is the most common feeling at this point. By the end, you’ll have a clear order of things to do." },
    { id: "safety", name: "A quick check-in", c: C.green, title: "Before we go on, are you safe?", helper: "Separation can be hard, and sometimes it isn’t safe. This stays private.", special: "safety" },
    { id: "kids", name: "Children", c: C.magenta, title: "Do you have children together?", helper: "If you do, their wellbeing comes first in everything that follows.", expect: (a) => a.kids === "with" ? "Arrangements for children are agreed separately from the money. Most parents agree them without ever going near a court." : null },
    { id: "home", name: "Home & living", c: C.sky, title: "Home, and where you’ll both live.", helper: "The home is usually the biggest decision, practically and emotionally.", expect: () => "It’s normal not to know yet where you’ll live. Most couples take a few months to work out what happens to the home." },
    { id: "income", name: "Money · income", c: C.indigo, title: "What do you each bring in?", helper: "Rough bands are fine. Nothing here is checked or shared.", expect: () => "Later, you’ll both need to share exact figures with evidence. Your guide explains what that involves, so it doesn’t catch you out." },
    { id: "assets", name: "Money · savings", c: C.indigo, title: "Roughly, what else is there?", helper: "Savings, investments, anything unusual. A ballpark is plenty." },
    { id: "debts", name: "Money · debts", c: C.indigo, title: "Any debts to deal with?", helper: "Debts are split too. Knowing whose name they’re in matters.", optional: (a) => a.stage === "considering" },
    { id: "pensions", name: "Money · pensions", c: C.indigo, title: "And pensions?", helper: "Often the second-biggest asset after the home, and the easiest to overlook. Best guesses are fine.", expect: (a) => a.status === "cohab" ? null : "Pension valuations can take weeks to arrive. Asking for them early is one of the most useful things you can do." },
    { id: "life", name: "Life & support", c: AMB, title: "How are you doing, day to day?", helper: "Separating touches everything: work, sleep, friendships. This helps us point you to the right support.", expect: (a) => a.cope === "hard" ? "If things feel too much, you don’t have to wait. Samaritans are free on 116 123, any time, and your GP can help too." : "Feeling up and down is completely normal. Planning the practical bits early takes some of the weight off." },
    { id: "where", name: "Where you both are", c: C.plum, title: "Where are you both, emotionally?", helper: "This changes everything about pace and approach. Be as honest as you can.", when: (a) => a.stage !== "agreed" },
    { id: "goals", name: "What matters", c: C.violet, title: "What matters most to you?", helper: "Pick up to three. Your guide will focus on them, and flag anything that may be hard to get." },
    { id: "names", name: "Last thing", c: C.violet, title: "What should we call you both?", helper: "Just first names, so your guide feels like yours. A nickname is fine, or skip it.", optional: () => true },
  ];

  const Q = [
    iq("stage", "about"), iq("status", "about"), iq("years", "about"),
    { id: "where_uk", sec: "about", type: "seg", label: "Where do you live?", opts: [["ew", "England or Wales"], ["sc", "Scotland"], ["ni", "Northern Ireland"], ["else", "Elsewhere"]] },
    iq("safe", "safety"), iq("safe2", "safety"),
    iq("kids", "kids"), iq("ages", "kids"), iq("kids_live", "kids"),
    { id: "kids_know", sec: "kids", type: "seg", label: "Do the children know?", when: (a) => a.kids === "with", opts: [["yes", "Yes"], ["partly", "Partly"], ["no", "Not yet"]] },
    { id: "living", sec: "home", type: "cards", label: "Where are you both living now?", opts: [["together", "Together, under one roof", "Even if you’re separated"], ["moved", "One of us has moved out", "Recently, or for a while"], ["apart", "We’ve lived apart for a while", "Separate homes"]] },
    iq("home", "home"), iq("home_value", "home"), iq("mortgage", "home"), iq("cohab_home", "home"),
    { id: "next_home", sec: "home", type: "seg", label: "Do you know where you’ll live afterwards?", opts: [["yes", "Yes"], ["some", "Some idea"], ["no", "No idea yet"]] },
    iq("work", "income"), iq("inc_me", "income"), iq("inc_them", "income"),
    iq("savings", "assets"), iq("savings_own", "assets"), iq("complex", "assets"),
    iq("debt_kinds", "debts"), iq("debt_total", "debts"), iq("debt_names", "debts"),
    iq("pen_me", "pensions"), iq("pen_them", "pensions"), iq("cohab_pen", "pensions"),
    { id: "cope", sec: "life", type: "seg", label: "How are you coping?", opts: [["ok", "Okay"], ["updown", "Up and down"], ["hard", "Struggling"]] },
    { id: "support", sec: "life", type: "chips", label: "Who do you have around you?", helper: "Tap any that apply.", exclusive: "none", opts: [["family", "Family"], ["friends", "Friends"], ["therapy", "A counsellor or therapist"], ["gp", "My GP"], ["work", "My employer"], ["none", "Nobody yet"]] },
    { id: "admin", sec: "life", type: "chips", optional: true, label: "Have you started on any of these?", helper: "Optional. Anything you haven’t started goes on your checklist.", opts: [["accounts", "Joint accounts and cards"], ["bills", "Bills, and who pays"], ["post", "Where post goes"], ["will", "Updating your will"], ["benef", "Pension and insurance beneficiaries"], ["tell", "Telling family and friends"], ["school", "Telling school or the GP"]] },
    iq("stand", "where"), iq("comms", "where"),
    iq("goals", "goals"),
    iq("name_me", "names"), iq("name_them", "names"),
  ];
  const activeSections = (a) => SECTIONS.filter((s) => !s.when || s.when(a));
  const secQs = (sid, a) => Q.filter((q) => q.sec === sid && (!q.when || q.when(a)));
  const optsOf = (q) => q.opts || IV.BANDS[q.bands] || [];
  const labelOf = (q, v) => {
    if (v == null || v === "") return "";
    if (v === "__skip") return q.skip || "Skipped";
    const o = optsOf(q), L = (k) => (o.find((p) => p[0] === k) || [k, k])[1];
    return Array.isArray(v) ? v.map(L).join("; ") : L(v);
  };
  const qText = (q) => (typeof q.label === "function" ? q.label({}) : q.label) || q.id;

  /* side panel rows: the guide chapters filling in */
  const PANEL = [
    ["Where you are", (a) => IV.valLabel("stage", a)],
    ["Children", (a) => a.kids === "none" ? "None together" : a.kids === "with" ? (a.kids_live ? IV.valLabel("kids_live", a) : "Under 18") : a.kids === "grown" ? "Grown up" : null],
    ["Home & living", (a) => a.home ? ({ own_together: "Owned together", own_me: "In your name", own_them: "In their name", rent: "Rented" }[a.home]) : null],
    ["Money", (a) => a.inc_me ? (a.savings ? "Income, savings" : "Income") : null],
    ["Pensions", (a) => a.pen_me ? "You " + IV.valLabel("pen_me", a) : null],
    ["Life & support", (a) => a.cope ? ({ ok: "Holding steady", updown: "Up and down", hard: "Struggling" }[a.cope]) : null],
    ["Your path", (a) => a.comms ? ({ good: "Talking is civil", tense: "Tense", hard: "Very hard" }[a.comms]) : a.stage === "agreed" ? "Mostly agreed" : null],
    ["What matters", (a) => a.goals && a.goals.length ? a.goals.length + " chosen" : null],
  ];

  /* ── guide content ── */
  const STAGE = {
    considering: { t: "You’re weighing it up. There’s no rush.", d: "Nothing has to happen yet. Understanding what separating would involve can make the decision clearer, whichever way it goes.", x: ["It’s normal to go back and forth. Many people take months to decide.", "Counselling, alone or together, can help whichever way you go.", "Nothing in this guide commits you to anything."] },
    decided: { t: "You’ve decided. The next job is the picture.", d: "Before anything is split, you both need to know what there is. Starting early takes the heat out of everything that follows.", x: ["The first few months are often the hardest, emotionally and practically.", "From here to a legally binding agreement usually takes 6 to 12 months.", "You don’t have to sort everything at once. There is an order, and this guide follows it."] },
    apart: { t: "You’re living apart. Now it needs making official.", d: "Many people stay here for months, even years. Until there’s a financial order, either of you can still make a claim on the other, even after divorce.", x: ["Living apart is a good time to get the picture together calmly.", "Once both pictures are shared, most couples take 3 to 6 months to agree.", "Leaving it open-ended carries real risk, especially if circumstances change."] },
    filed: { t: "The divorce is under way. The money is a separate job.", d: "The divorce ends the marriage. It doesn’t settle the money. That needs a financial order, ideally approved before the final order.", x: ["The divorce has a minimum timetable of about 6 to 7 months.", "Use that time to agree the money, so both can finish together.", "Don’t apply for the final order until the financial order is approved."] },
    agreed: { t: "You’ve agreed. Now make it stick.", d: "An agreement only protects you both once a judge approves it as a consent order. Until then, either of you could change your mind.", x: ["A judge checks the agreement is fair to you both, usually without a hearing.", "Approval usually takes a few weeks to a few months.", "Make sure pensions are properly valued. It’s the most common gap."] },
  };
  const ROAD = [
    ["steady", "Get support, and get steady", "Now", "Talk to people you trust. Cover the basics: money for the next few months, and somewhere to live."],
    ["picture", "Get the financial picture together", "Weeks 1 to 8", "You each list everything you own, owe and earn, with evidence. Usually on a Form E."],
    ["kids", "Agree arrangements for the children", "Alongside", "Where they live and how they spend time with you both. Often written as a parenting plan.", (a) => a.kids === "with"],
    ["agree", "Agree how to split everything", "Months 2 to 6", "Between yourselves, in mediation, or through solicitors. Most couples use mediation."],
    ["divorce", "Apply for the divorce", "Any time", "Online, on your own or together. The court fee is about £600. It can run alongside the steps above."],
    ["cond", "Conditional order", "At least 20 weeks after applying", "Confirms you’re entitled to divorce. Your consent order can go to the court after this."],
    ["consent", "Make the agreement legally binding", "After the conditional order", "A consent order goes to the court with a short summary form (D81). A judge checks it’s fair."],
    ["final", "Final order", "At least 6 weeks after the conditional order", "Ends the marriage. Wait until the financial order is approved."],
  ];
  const ROAD_C = [
    ROAD[0],
    ["picture", "Get the picture together", "Weeks 1 to 6", "Who legally owns what, who paid what, and any joint debts or tenancy."],
    ROAD[2],
    ["agree", "Agree who keeps what", "Months 1 to 4", "Without marriage there’s no ‘fair split’. Ownership and contributions matter most."],
    ["write", "Write it down", "Once agreed", "A separation agreement, or a declaration of trust for the home, usually drafted by a solicitor."],
    ["effect", "Put it into effect", "After that", "Transfer or sell the property, change the tenancy, and close joint accounts."],
  ];
  const HERE = { considering: ["steady", []], decided: ["picture", ["steady"]], apart: ["picture", ["steady"]], filed: ["divorce", ["steady"]], agreed: ["consent", ["steady", "picture", "kids", "agree"]] };
  const road = (a) => {
    const cohab = a.status === "cohab", civil = a.status === "civil";
    let [here, past] = HERE[a.stage] || HERE.decided;
    if (cohab && here === "consent") here = "write";
    if (cohab && here === "divorce") here = "agree";
    return (cohab ? ROAD_C : ROAD).filter((s) => !s[4] || s[4](a)).map(([id, t, w, d]) => ({
      id, w, d: civil ? d.replace("Ends the marriage", "Ends the civil partnership").replace("entitled to divorce", "entitled to end the partnership") : d,
      t: civil && id === "divorce" ? "Apply to end the civil partnership" : t,
      st: id === here ? "here" : past.includes(id) ? "past" : "",
      todo: a.stage === "filed" && (id === "picture" || id === "agree"),
    }));
  };
  const ROUTES = [
    ["self", "Between yourselves", "Talk it through and write down what you agree. It still needs making legal.", "Free", "Weeks"],
    ["med", "Mediation", "A neutral mediator helps you both reach agreement. A first meeting (a MIAM) is usually needed before going to court.", "Often £100 to £200 an hour each", "2 to 3 months, 3 to 5 sessions"],
    ["sol", "Solicitors", "Each of you has a solicitor, who negotiates on your behalf.", "Often a few thousand pounds each", "6 to 12 months"],
    ["arb", "Arbitration", "A private, qualified decision-maker settles it. Faster than court, and binding.", "Several thousand pounds", "2 to 4 months"],
    ["court", "Court", "A judge decides, if you can’t agree any other way.", "Often over £10,000 each", "12 to 18 months or more"],
  ];
  const COURT = [
    ["Needs", "Especially housing for whoever the children mainly live with."],
    ["Income and earning power", "Now, and realistically in the future."],
    ["Length of the marriage", "Longer marriages usually start from an equal split."],
    ["Contributions", "Money in, and caring for the home and children, count equally."],
    ["Pensions", "Built up during the marriage, and usually shared."],
    ["Age, health and standard of living", "What life looked like together, and what’s realistic now."],
  ];
  const COURT_C = [
    ["Legal ownership", "Whose name is on the deeds and accounts."],
    ["What each of you paid", "Deposits, mortgage payments, major works."],
    ["What you agreed", "Anything in writing, like a declaration of trust."],
    ["The children’s needs", "Housing and support for children can be claimed separately."],
  ];
  const SUPPORT = [
    ["Samaritans", "116 123, free, any time", "https://www.samaritans.org"],
    ["National Domestic Abuse Helpline", "0808 2000 247, free, any time", "https://www.nationaldahelpline.org.uk"],
    ["MoneyHelper", "Free, impartial guides on money and separation", "https://www.moneyhelper.org.uk"],
    ["Citizens Advice", "Free advice on housing, benefits and debt", "https://www.citizensadvice.org.uk"],
    ["Family Mediation Council", "Find an accredited mediator near you", "https://www.familymediationcouncil.org.uk"],
    ["Cafcass", "A free parenting plan for the children’s arrangements", "https://www.cafcass.gov.uk"],
  ];
  const ADMIN = { accounts: ["Joint accounts and cards", "Agree who uses what, and consider freezing joint credit."], bills: ["Bills, and who pays", "Write down who covers what for now, so nothing is missed."], post: ["Where post goes", "Set up redirection if one of you has moved."], will: ["Updating your will", "Separation doesn’t cancel a will. Your ex could still inherit."], benef: ["Pension and insurance beneficiaries", "Check who’s named on each policy and pension."], tell: ["Telling family and friends", "Decide together, if you can, what you’ll say."], school: ["Telling school or the GP", "So they can look out for the children, and for you."] };

  /* ── validation, woven into chapters ── */
  const FEAT = {
    shared: ["One shared financial picture", "Everything you both own and owe, in one place you both see."],
    bank: ["Fill it in from your bank accounts", "Connect securely, and the transactions are sorted for you."],
    vault: ["Evidence collected for you", "Statements, payslips and valuations attached to each figure."],
    formE: ["Your Form E, filled in for you", "Built from your picture, ready for a mediator or solicitor."],
    parent: ["Parenting plan and shared calendar", "Agree the children’s arrangements, and keep track of them."],
    coparent: ["Calm co-parenting messages", "Logistics in one place, with a gentle tone check."],
    housing: ["Housing options side by side", "Stay, sell or transfer, and what each means for you both."],
    mortgage: ["What could I afford alone?", "A quick check of what you could borrow or rent on your own."],
    fair: ["A live ‘what’s fair’ range", "Updated as real figures come in, with the reasons shown."],
    ai: ["An AI guide, any time", "Ask questions in plain English, day or night."],
    agree: ["Propose and agree, step by step", "Make offers, see how each would look to a court, agree point by point."],
    med: ["A mediator when you’re stuck", "Book a session without starting again somewhere else."],
    docs: ["Court-ready documents", "The consent order and D81 drafted and filed for you."],
    sol: ["A solicitor checks it", "An independent check before it goes to the court."],
    after: ["Help after the order", "Moving the house, splitting pensions, closing joint accounts."],
    care: ["Wellbeing support", "Regular check-ins, and access to counselling."],
  };
  const MUST = [["must", "Must have"], ["nice", "Nice"], ["no", "Not for me"]];
  const CH = [
    { id: "where", n: "Where you are", t: "Where you are, and what to expect", c: C.violet,
      qs: [{ id: "clarity", type: "seg", label: "Before today, how clear were you on what happens next?", opts: [["1", "Not at all"], ["2", "A little"], ["3", "Fairly"], ["4", "Very"]] }, { id: "hardest", type: "chips", max: 3, label: "Which parts feel hardest right now?", helper: "Up to three.", opts: [["order", "Knowing what to do, and when"], ["fair", "Knowing what’s fair"], ["info", "Getting the financial information"], ["talk", "Talking to my partner"], ["legal", "The legal side"], ["cost", "The cost"], ["time", "How long it takes"], ["emo", "The emotional side"], ["kids", "The children"]] }],
      ask: "Two quick questions. They help us understand where people start from." },
    { id: "picture", n: "The financial picture", t: "Getting the full picture together", c: C.indigo, feats: ["shared", "bank", "vault", "formE"],
      build: "We’re working on a tool that takes the hard work out of this. Connect your accounts once, and it builds your picture with the evidence attached, ready for Form E.",
      qs: [{ id: "formE_feel", type: "seg", label: "How does gathering all of this sound?", opts: [["fine", "Manageable"], ["daunting", "Daunting"], ["new", "I didn’t know about it"]] }] },
    { id: "kids", n: "Children", t: "The children’s arrangements", c: C.magenta, when: (a) => a.kids === "with", feats: ["parent", "coparent"],
      build: "We’re working on tools to help you agree the children’s arrangements calmly, and keep them running smoothly afterwards.",
      qs: [{ id: "kids_hard", type: "chips", label: "What feels hardest about the children’s arrangements?", helper: "Tap any.", exclusive: "none", opts: [["tell", "Telling them"], ["sched", "Agreeing a schedule"], ["money", "Money for the children"], ["talk", "Communicating with my ex"], ["move", "Moving between homes"], ["none", "None of these"]] }] },
    { id: "home", n: "The home", t: "The home, and where you’ll live", c: C.sky, feats: ["housing", "mortgage"],
      build: "We’re working on a way to model each option side by side, so you can both see what’s fair, and what’s affordable." },
    { id: "fair", n: "What’s fair", t: "What a fair split might look like", c: C.indigo, feats: ["fair", "ai"],
      build: "We’re building this range into something you can use together: explained, and updated as your real figures come in.",
      qs: [{ id: "range_useful", type: "seg", label: "How useful is it to see a likely range this early?", opts: [["1", "Not useful"], ["2", "Somewhat"], ["3", "Very useful"]] }] },
    { id: "agree", n: "Reaching agreement", t: "Reaching agreement", c: C.plum, feats: ["agree", "med"],
      build: "We’re also working on features that make light work of this: proposals side by side, how each would look to a court, and agreeing point by point.",
      qs: [{ id: "route", type: "cards", label: "If you were starting today, how would you most like to reach agreement?", opts: [["diy", "Just the two of us", "On our own"], ["online", "Together, with a guided online service", "Doing the work ourselves, with help"], ["med", "With a mediator", "A neutral person in the room"], ["sol", "Each with a solicitor", "Someone on my side"], ["unsure", "I don’t know yet"]] },
        { id: "noprof", type: "seg", label: "How appealing is reaching agreement without a mediator or solicitor at all?", opts: [["1", "Not at all"], ["2", "Not very"], ["3", "Maybe"], ["4", "Quite"], ["5", "Very"]] },
        { id: "noprof_why", type: "chips", label: "What makes you feel that way?", helper: "Tap any.", opts: [["money", "It would save money"], ["time", "It would be quicker"], ["calm", "Less conflict"], ["control", "We’d stay in control"], ["check", "I’d still want it checked"], ["wrong", "I’d worry about mistakes"], ["power", "I’d worry they’d take advantage"], ["complex", "Ours is too complicated"]] }] },
    { id: "legal", n: "Making it legal", t: "Making it legal, in the right order", c: C.green, feats: ["docs", "sol"],
      build: "We’re working on turning your agreement into court-ready documents, with an optional check by an independent solicitor.",
      qs: [{ id: "trust", type: "seg", label: "Who would you trust to guide you through this?", opts: [["law", "Only a lawyer"], ["mostlaw", "Mostly a lawyer"], ["either", "Either"], ["mostonline", "Mostly online"], ["online", "An online service"]] },
        { id: "ai_ok", type: "seg", label: "And AI explaining your options?", opts: [["yes", "Comfortable"], ["check", "If a person checks it"], ["no", "Not comfortable"]] },
        { id: "trust_need", type: "chips", max: 3, label: "What would you need to see to trust a service like this?", helper: "Up to three.", opts: [["sol", "A solicitor checks the agreement"], ["how", "How the figures are worked out"], ["reg", "Regulated or accredited"], ["rev", "Reviews from people like me"], ["human", "A real person to talk to"], ["sec", "Proof my data is secure"], ["court", "Courts approve its documents"]] }] },
    { id: "you", n: "Looking after yourself", t: "Looking after yourself", c: AMB, feats: ["after", "care"],
      build: "We’re thinking about how to support you beyond the paperwork, during and after.",
      qs: [{ id: "simplify", type: "long", label: "If one thing about separating could be made simpler, what would it be?", ph: "In your own words" }] },
    { id: "service", n: "What would help", t: "If one service did all of this…", c: C.violet, vonly: true },
    { id: "last", n: "Two last things", t: "Two last things", c: C.violet, vonly: true },
  ];
  const chapters = (a) => CH.filter((c) => !c.when || c.when(a));
  const SERVICE_Q = [
    { id: "value", type: "chips", max: 2, label: "What would make the biggest difference to you?", helper: "Up to two.", opts: [["money", "Saving money"], ["time", "Saving time"], ["calm", "Less conflict"], ["control", "Feeling in control"], ["right", "Knowing it’s done right"], ["kids", "Protecting the children from it"]] },
    { id: "expect", type: "seg", label: "What would you expect it to cost to sort the finances the usual way?", opts: [["u1k", "Under £1k"], ["1_5", "£1k to £5k"], ["5_15", "£5k to £15k"], ["15", "Over £15k"], ["idk", "No idea"]] },
    { id: "time_worth", type: "seg", label: "How much time would it need to save to be worth paying for?", opts: [["wk", "A few weeks"], ["3m", "About 3 months"], ["6m", "6 months or more"], ["nm", "Time doesn’t matter"]] },
  ];
  const LAST_Q = [
    { id: "partner", type: "seg", label: "Would your partner do something like this together with you?", opts: [["yes", "Yes"], ["prob", "Probably"], ["unsure", "Not sure"], ["probnot", "Probably not"], ["no", "No"]] },
    { id: "solo", type: "seg", label: "If they wouldn’t at first, would you start on your own?", opts: [["yes", "Yes"], ["maybe", "Maybe"], ["no", "No"]] },
  ];
  const TIERS = [
    { id: "ess", name: "Essentials", for: "For couples who agree, and want to do it themselves", inc: ["Your shared financial picture", "Guidance on what a court sees as fair", "Document templates you file yourselves"] },
    { id: "guided", name: "Guided", for: "For most couples", inc: ["Everything in Essentials", "Connect bank accounts", "Work on it together, step by step", "Court-ready documents, filed for you"] },
    { id: "complete", name: "Complete", for: "For extra reassurance", inc: ["Everything in Guided", "A solicitor checks your agreement", "A mediator session if you get stuck", "Help after the order"] },
  ];
  const PRICES = { A: [99, 499, 999], B: [499, 999, 1999] };
  const VW = [["cheap", "So cheap you’d doubt the quality"], ["bargain", "A bargain"], ["dear", "Getting expensive, but you’d consider it"], ["too", "Too expensive to consider"]];

  return { SECTIONS, Q, activeSections, secQs, optsOf, labelOf, qText, PANEL, STAGE, road, ROUTES, COURT, COURT_C, SUPPORT, ADMIN, FEAT, MUST, CH, chapters, SERVICE_Q, LAST_Q, TIERS, PRICES, VW, owns, hasDebt, AMB };
})();
