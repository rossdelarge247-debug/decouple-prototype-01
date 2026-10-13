/* M02 · Free tool — content and question schema. Field types: one (default), many, text, scale, slider, feat, spend, tiers, vw, optin. */
window.M02 = (function () {
  const PEN = [["none", "None"], ["u50", "Under £50k"], ["50_200", "£50k to £200k"], ["200_500", "£200k to £500k"], ["500", "Over £500k"], ["__skip", "Not sure"]];
  const INC = [["none", "No income"], ["u25", "Under £25k"], ["25_50", "£25k to £50k"], ["50_100", "£50k to £100k"], ["100", "Over £100k"], ["__skip", "Not sure"]];
  const owns = (a) => /^own/.test(a.home || "");
  const TOOL = [
    { id: "safe", sec: "Before we start", fields: [{ k: "safe", q: "First, do you feel safe at home right now?", sub: "If you don’t, there is free, confidential help available any time. You can still use this guide.", opts: [["safe", "Yes, I feel safe"], ["unsure", "I’m not sure"], ["unsafe", "No, I don’t feel safe"]] }] },
    { id: "stage", sec: "Where you are", fields: [{ k: "stage", q: "Where are you right now?", opts: [["thinking", "Thinking about separating"], ["decided", "We’ve decided to separate"], ["separated", "We’ve separated, but nothing’s sorted yet"], ["filed", "The divorce has started"], ["agreed", "We’ve agreed the money, and need to make it legal"]] }] },
    { id: "rel", sec: "Where you are", fields: [{ k: "status", q: "Are you…", opts: [["married", "Married"], ["civil", "In a civil partnership"], ["cohab", "Living together, not married"]] }, { k: "where", q: "Where do you live?", opts: [["ew", "England or Wales"], ["sc", "Scotland"], ["ni", "Northern Ireland"], ["else", "Somewhere else"]] }] },
    { id: "kids", sec: "Your family", fields: [{ k: "kids", q: "Do you have children under 18 together?", opts: [["with", "Yes"], ["none", "No"]] }, { k: "kids_live", q: "Where do they mainly live, or will they?", when: (a) => a.kids === "with", opts: [["me", "Mainly with me"], ["shared", "Shared fairly equally"], ["them", "Mainly with my partner"], ["unsettled", "Not decided yet"]] }] },
    { id: "years", sec: "Your family", fields: [{ k: "years", q: "How long have you been together?", sub: "Include any time you lived together before marrying.", opts: [["u5", "Under 5 years"], ["5_10", "5 to 10 years"], ["10_20", "10 to 20 years"], ["20", "Over 20 years"]] }] },
    { id: "home", sec: "Your money", note: "Rough answers are fine. Nothing here is checked or saved to an account.", fields: [{ k: "home", q: "Your home is…", opts: [["own_together", "Owned by both of us"], ["own_me", "Owned in my name"], ["own_them", "Owned in my partner’s name"], ["rent", "Rented, or something else"]] }, { k: "home_value", q: "Roughly what’s it worth?", when: owns, opts: [["u250", "Under £250k"], ["250_500", "£250k to £500k"], ["500_1m", "£500k to £1m"], ["1m", "Over £1m"]] }, { k: "mortgage", q: "And what’s left on the mortgage?", when: owns, opts: [["none", "Nothing"], ["u100", "Under £100k"], ["100_250", "£100k to £250k"], ["250", "Over £250k"]] }] },
    { id: "save", sec: "Your money", fields: [{ k: "savings", q: "Savings and investments, both of you together", opts: [["u10", "Under £10k"], ["10_50", "£10k to £50k"], ["50_150", "£50k to £150k"], ["150", "Over £150k"]] }, { k: "debt_total", q: "Debts, not counting the mortgage", opts: [["none", "None"], ["u5", "Under £5k"], ["5_20", "£5k to £20k"], ["20_50", "£20k to £50k"], ["50", "Over £50k"]] }] },
    { id: "pen", sec: "Your money", note: "Pensions are often the biggest asset after the home, and the one most often missed.", fields: [{ k: "pen_me", q: "Your pensions, roughly", opts: PEN }, { k: "pen_them", q: "Your partner’s pensions", opts: PEN }] },
    { id: "inc", sec: "Your money", fields: [{ k: "inc_me", q: "Your yearly income, before tax", opts: INC }, { k: "inc_them", q: "Your partner’s yearly income", opts: INC }] },
    { id: "talk", sec: "How it feels", fields: [{ k: "comms", q: "How are things between you when you talk about this?", opts: [["ok", "Mostly calm, we can talk"], ["tense", "Tense, but we manage"], ["hard", "Very hard, we can’t really talk"]] }] },
    { id: "worry", sec: "How it feels", fields: [{ k: "worries", type: "many", max: 3, q: "What’s weighing on you most?", sub: "Choose up to three.", opts: [["money", "Having enough to live on"], ["home", "What happens to the home"], ["kids", "The children"], ["fair", "Being treated fairly"], ["cost", "The cost of lawyers"], ["time", "How long it will take"], ["coop", "My partner not cooperating"], ["start", "Not knowing where to start"], ["cope", "How I’m coping"]] }] },
  ];

  const FEATURES = [
    ["shared", "One shared financial picture", "Everything you both own and owe, in one place you can both see."],
    ["bank", "Fill it in from your bank accounts", "Connect securely, instead of typing and uploading."],
    ["invite", "Invite your partner", "Work on it together, each from your own account."],
    ["fair", "What a court would see as fair", "A clear range, with the reasons behind it."],
    ["agree", "Propose and agree the split", "Make offers, see the effect, and agree step by step."],
    ["docs", "Court-ready documents", "The consent order drafted and filed for you."],
    ["sol", "A solicitor checks it", "An independent check before it goes to court."],
    ["med", "A mediator when you’re stuck", "Book a session without starting again somewhere else."],
    ["ai", "An AI guide, any time", "Ask questions in plain English, day or night."],
    ["parent", "Parenting plan and calendar", "Agree arrangements for the children, and keep track."],
    ["after", "Help after the order", "Moving the house, splitting pensions, closing joint accounts."],
    ["care", "Wellbeing support", "Regular check-ins, and access to counselling."],
  ];
  const TIERS = [
    { id: "ess", name: "Essentials", for: "For couples who agree and want to do it themselves", inc: ["Your shared financial picture", "Guidance on what a court sees as fair", "Document templates you file yourselves"] },
    { id: "guided", name: "Guided", for: "For most couples", inc: ["Everything in Essentials", "Connect bank accounts", "Work on it together, step by step", "Court-ready documents, filed for you"] },
    { id: "complete", name: "Complete", for: "For extra reassurance", inc: ["Everything in Guided", "A solicitor checks your agreement", "A mediator session if you get stuck", "Help after the order: the house and pensions"] },
  ];
  const PRICES = { A: [99, 499, 999], B: [499, 999, 1999] };

  const SURVEY = [
    { id: "hard", sec: "What’s hard", fields: [{ k: "hardest", type: "many", max: 3, q: "Which parts of separating feel hardest?", sub: "Choose up to three.", opts: [["order", "Knowing what to do, and in what order"], ["fair", "Knowing what’s fair"], ["info", "Getting the financial information together"], ["talk", "Talking to my partner about money"], ["agree", "Reaching an agreement"], ["legal", "The legal paperwork and court"], ["cost", "The cost"], ["time", "How long it all takes"], ["emo", "The emotional side"], ["kids", "Arrangements for the children"]] }, { k: "simplify", type: "text", optional: true, q: "If one thing could be made simpler, what would it be?", ph: "In your own words" }] },
    { id: "route", sec: "How you’d do it", fields: [{ k: "route", q: "If you were starting today, how would you most like to sort out the finances?", opts: [["diy", "Just the two of us, on our own"], ["online", "Together, with a guided online service"], ["med", "With a mediator"], ["sol", "Each with our own solicitor"], ["unsure", "I don’t know yet"]] }, { k: "noprof", type: "scale", q: "How appealing is sorting it out without needing a mediator or solicitor at all?", lo: "Not at all", hi: "Very appealing" }] },
    { id: "noprof_why", sec: "How you’d do it", fields: [{ k: "noprof_why", type: "many", q: "What makes you feel that way?", sub: "Choose any that apply.", opts: [["money", "It would save money"], ["time", "It would be quicker"], ["calm", "Less conflict between us"], ["control", "We’d stay in control"], ["check", "I’d still want a professional to check it"], ["wrong", "I’d worry about getting it wrong"], ["power", "I’d worry my partner would take advantage"], ["complex", "Our situation is too complicated"]] }] },
    { id: "feat", sec: "What would help", fields: [{ k: "feat", type: "feat", q: "Which of these would help you?", sub: "For each one: must have, nice to have, or not for me." }] },
    { id: "spend", sec: "What would help", fields: [{ k: "spend", type: "spend", q: "You have £100. Where would you spend it?", sub: "Spread it across what matters most to you. You don’t have to spend it all." }] },
    { id: "value", sec: "What it’s worth", fields: [{ k: "value", type: "many", max: 2, q: "What would make the biggest difference to you?", sub: "Choose up to two.", opts: [["money", "Saving money"], ["time", "Saving time"], ["calm", "Less conflict"], ["control", "Feeling in control"], ["right", "Knowing it’s done right"], ["kids", "Protecting the children from it"]] }, { k: "expect", q: "What would you expect it to cost to sort out the finances the usual way?", opts: [["u1k", "Under £1,000"], ["1_5", "£1,000 to £5,000"], ["5_15", "£5,000 to £15,000"], ["15", "Over £15,000"], ["idk", "No idea"]] }, { k: "time_worth", q: "How much time would it need to save to be worth paying for?", opts: [["wk", "A few weeks"], ["3m", "About three months"], ["6m", "Six months or more"], ["nm", "Time doesn’t matter much to me"]] }] },
    { id: "trust", sec: "Trust", fields: [{ k: "trust", type: "slider", q: "Who would you trust to guide you through the finances?", lo: "Only a human lawyer", hi: "A well-designed online service" }, { k: "ai", q: "How would you feel about AI explaining your options and answering your questions?", opts: [["yes", "Comfortable"], ["check", "Fine, if a person checks it"], ["no", "Not comfortable"]] }] },
    { id: "trust2", sec: "Trust", fields: [{ k: "trust_need", type: "many", max: 3, q: "What would you need to see to trust a service like this?", sub: "Choose up to three.", opts: [["sol", "A solicitor checks the final agreement"], ["how", "A clear explanation of how figures are worked out"], ["reg", "Regulated or accredited by a known body"], ["rev", "Reviews from people like me"], ["human", "A real person I can talk to"], ["sec", "Proof my data is secure"], ["court", "Evidence courts approve its documents"]] }] },
    { id: "tier", sec: "Packages", fields: [{ k: "tier", type: "tiers", q: "If these existed today, which would you choose?", sub: "Prices are for both of you together, paid once." }] },
    { id: "vw", sec: "Packages", fields: [{ k: "vw", type: "vw" }] },
    { id: "partner", sec: "Your partner", fields: [{ k: "partner", q: "Would your partner do this together with you?", opts: [["yes", "Yes"], ["prob", "Probably"], ["unsure", "Not sure"], ["probnot", "Probably not"], ["no", "No"]] }, { k: "solo", q: "If they wouldn’t at first, would you start on your own?", opts: [["yes", "Yes"], ["maybe", "Maybe"], ["no", "No"]] }] },
    { id: "optin", sec: "Stay involved", fields: [{ k: "optin", type: "optin" }] },
  ];

  const STAGE = {
    thinking: ["You’re thinking it through", "Nothing has to happen yet. This is a good time to understand your options quietly, before anything is decided."],
    decided: ["You’ve decided to separate", "The first job is the financial picture. Getting it together early takes the heat out of everything that follows."],
    separated: ["You’ve separated, and the money isn’t sorted", "This is where most people feel stuck. The way forward is the same: gather the picture, then agree the split."],
    filed: ["The divorce is under way", "The divorce ends the marriage, but it doesn’t sort out the money. That needs a separate financial order."],
    agreed: ["You’ve agreed, and need it made legal", "You’re close. An agreement only protects you both once a judge approves it as a consent order."],
  };
  const HERE = { thinking: "sep", decided: "sep", separated: "info", filed: "div", agreed: "fo" };
  const ORDER = [
    ["sep", "Decide, and get support", "Separation is a process, not a single event. Feeling steady comes first."],
    ["info", "Gather the financial picture", "You each list what you own, owe and earn, with statements to back it up. Courts expect full and frank disclosure."],
    ["agree", "Agree how to split it", "Directly, through mediation, or with solicitors. If you can’t agree, you’ll usually need a first mediation meeting (a MIAM) before going to court."],
    ["div", "Apply for the divorce", "Online, on your own or jointly. This can run alongside the steps above.", "dis"],
    ["co", "Conditional order", "You can apply for this 20 weeks after the application is issued."],
    ["fo", "Make the agreement legally binding", "A consent order goes to the court after the conditional order. A judge checks it’s fair to you both."],
    ["final", "Final order", "At least six weeks after the conditional order. Ideally, wait until the financial order is approved."],
  ];
  const ORDER_COHAB = [
    ["sep", "Decide, and get support", "Separation is a process, not a single event. Feeling steady comes first."],
    ["info", "Gather the picture", "Who legally owns the home and other assets, who paid what, and any joint debts or tenancy."],
    ["agree", "Agree who keeps what", "Without marriage there is no ‘fair split’. Ownership and contributions matter most. Arrangements and support for the children are agreed separately."],
    ["fo", "Write it down", "A separation agreement, or a declaration of trust for the home, usually drafted by a solicitor."],
    ["final", "Put it into effect", "Transfer or sell the property, end or change the tenancy, and close joint accounts."],
  ];
  const COURT = [
    ["Needs", "Especially housing for whoever the children mainly live with."],
    ["Income and earning power", "Now, and realistically in the future."],
    ["Length of the marriage", "Longer marriages usually start from an equal split."],
    ["Contributions", "Money in, and caring for the home and children, count equally."],
    ["Pensions", "Built up during the marriage, and usually shared."],
    ["Age, health and standard of living", "What life looked like together, and what’s realistic now."],
  ];
  const COSTS = [
    ["Divorce application", "Court fee of about £600, paid once. You can split it.", "At least 6 to 7 months"],
    ["Consent order", "Court fee of about £60.", "Usually a few weeks to a few months for a judge to review"],
    ["Mediation", "A first meeting (MIAM) is often £100 to £150 each. Sessions are often £100 to £200 an hour each. Vouchers may help if you have children.", "Often 3 to 5 sessions over 2 to 3 months"],
    ["Solicitors", "Often a few thousand pounds each to negotiate and draft. Much more if it goes to court.", "Typically 6 to 12 months"],
    ["Court, if you can’t agree", "Legal costs are often over £10,000 each.", "Often 12 to 18 months or more"],
  ];
  const SUPPORT = [
    ["National Domestic Abuse Helpline", "0808 2000 247, free, any time", "https://www.nationaldahelpline.org.uk"],
    ["Samaritans", "116 123, free, any time", "https://www.samaritans.org"],
    ["MoneyHelper", "Free, impartial guides on money and separation", "https://www.moneyhelper.org.uk"],
    ["Citizens Advice", "Free advice on housing, benefits and debt", "https://www.citizensadvice.org.uk"],
    ["Family Mediation Council", "Find an accredited mediator near you", "https://www.familymediationcouncil.org.uk"],
    ["Resolution", "Find a family lawyer who works non-confrontationally", "https://resolution.org.uk"],
    ["Cafcass", "A free parenting plan to agree arrangements for the children", "https://www.cafcass.gov.uk"],
    ["Gingerbread", "Support for single parents", "https://www.gingerbread.org.uk"],
  ];
  return { TOOL, SURVEY, FEATURES, TIERS, PRICES, STAGE, HERE, ORDER, ORDER_COHAB, COURT, COSTS, SUPPORT, owns };
})();
