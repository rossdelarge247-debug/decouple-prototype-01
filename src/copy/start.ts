// Every user-visible string of the Start phase. Screens import from here; no literal
// copy lives in JSX. tests/unit/copy.test.ts runs every string through the copy rules.
// Keys named `headline` are ≤ 6 words, keys named `cta` or ending in `Cta` are ≤ 4 words,
// keys under `success` may carry one exclamation mark. This module is a leaf.

export const footer = {
  exitCta: 'Exit this page',
  exitHint: 'Leaves this site straight away and opens BBC News.',
  helpline: 'If you are in immediate danger, call 999. The National Domestic Abuse Helpline is free, 24 hours a day, on 0808 2000 247.',
  notAService: 'Decouple is not a domestic abuse service.',
} as const

export const header = {
  signInCta: 'Sign in',
  freeInterview: 'Free interview',
  stepOf: 'Step {n} of 8',
  progressLabel: 'Interview progress',
  skipToContent: 'Skip to content',
  homeLabel: 'Decouple home',
} as const

export const devMode = {
  label: 'Dev mode',
  body: 'Accounts here are a stand-in: any email signs in and nothing is stored beyond this browser. Switched off before real users.',
} as const

export const space = {
  private: 'Private · only you can see this',
} as const

export const nextStep = {
  label: 'Your next step',
} as const

export const landing = {
  eyebrow: 'The complete settlement workspace for separating couples',
  headline: 'Sort out your separation, together.',
  headlineAccent: 'together',
  promise: 'The complete picture.',
  body: 'Build your financial picture from your own bank data, share it with your ex when you choose, and settle it into a court-ready consent order.',
  costConventional: 'The conventional route, with a solicitor each, costs {conventional} per person on average.',
  costDecouple: 'The interview and building your picture are free.',
  pricingLink: 'See pricing',
  cta: 'Start the interview',
  meta: 'About three minutes · no account needed',
  trust: [
    'Bank connection through Tink, FCA regulated',
    'Read-only. We can never move money.',
    'Private until you choose to share',
  ],
  pillars: [
    { title: 'Shared, not adversarial', body: 'One picture you both build, instead of two solicitors trading letters.' },
    { title: 'Evidenced, not asserted', body: 'Every number shows where it came from: a transaction, a document, or you.' },
    { title: 'End to end, not hand-off', body: 'From the first question to a consent order pack ready to post.' },
  ],
} as const

export const pricing = {
  eyebrow: 'Pricing',
  headline: 'Free to build your picture.',
  body: 'Sharing, settling and the court pack will be priced when they are ready. Nothing is charged today.',
  backCta: 'Back',
} as const

export const interview = {
  continueCta: 'Continue',
  backCta: 'Back',
  whyLabel: 'Why we ask',
  unlocksLabel: 'What it unlocks',
  privateNote: 'Nothing is shared with anyone. No account yet.',
  soFarTitle: 'Your answers so far',
  soFarEmpty: 'Nothing here yet',
  chooseOne: 'Choose one option to continue.',
  chooseUpToThree: 'Choose up to three.',
  summaryTitle: 'A few things to check',
  answered: 'Answered',
  chosen: '{n} chosen',
} as const

export const o1 = {
  eyebrow: 'About you',
  headline: 'Where are you now?',
  body: 'There are no wrong answers. This sets the pace of everything that follows.',
  why: 'It tells us whether to move at your pace or to get things moving.',
  unlocks: 'The tone of the plan we write for you.',
  legend: 'Where you are',
  options: {
    decided: { title: "We've decided to separate", body: 'I want to get the finances sorted' },
    thinking: { title: "I'm thinking about separating", body: 'I want to understand what is involved' },
    process: { title: "We're already in the process", body: 'I want to get things moving faster' },
  },
} as const

export const o2 = {
  eyebrow: 'Your situation',
  headline: 'A few facts about you',
  body: 'One screen, four quick questions. They decide which parts of the journey apply to you.',
  why: 'Married couples and civil partners follow one legal route; children and the home shape the picture.',
  unlocks: 'Which sections of your picture exist.',
  relationship: {
    legend: 'Your relationship',
    options: { married: 'Married', civil: 'Civil partnership', cohabiting: 'Cohabiting', other: 'Other' },
  },
  living: {
    legend: 'Living together',
    options: { yes: 'Yes', no: 'No', complicated: 'Complicated' },
  },
  children: {
    legend: 'Children under 18',
    options: { no: 'No', yes: 'Yes' },
  },
  childrenCount: {
    legend: 'How many',
    options: { '1': '1', '2': '2', '3': '3', '4+': '4 or more' },
  },
  home: {
    legend: 'Your home',
    options: { mortgage: 'Own with mortgage', outright: 'Own outright', rent: 'Rent', other: 'Other' },
  },
} as const

export const o3 = {
  eyebrow: 'How things are',
  headline: 'How are things between you?',
  body: 'Answer honestly. It stays private and changes how we support you, never whether we do.',
  why: 'It shapes how we pace things and what support we show you.',
  unlocks: 'The right support, quietly.',
  legend: 'Between you',
  options: {
    amicable: { title: 'Amicable', body: 'We want to sort this out together' },
    difficult: { title: 'Difficult', body: 'But manageable' },
    highConflict: { title: 'High conflict', body: 'Communication is very hard' },
    safety: { title: 'I have safety concerns', body: '' },
  },
  device: {
    legend: 'Is this device private to you?',
    hint: 'If someone else could see this screen, choose Not sure.',
    options: { yes: 'Yes', notSure: 'Not sure' },
  },
  notAlone: {
    title: "You're not alone.",
    body: 'The Exit this page control at the bottom leaves this site instantly.',
  },
} as const

export const o4 = {
  eyebrow: 'Work',
  headline: 'Self-employed or a company director?',
  body: 'Business income looks different in a bank account, so we ask now.',
  why: 'It changes which documents we ask for and how income is read.',
  unlocks: 'The business section of your picture.',
  legend: 'Self-employed or a director',
  options: {
    no: { title: 'No', body: 'Both employed or not working' },
    me: { title: 'Yes, I am', body: '' },
    ex: { title: 'Yes, my ex is', body: '' },
    both: { title: 'Yes, we both are', body: '' },
  },
} as const

export const o5 = {
  eyebrow: 'Their finances',
  headline: 'How much do you know?',
  body: "Your partner's finances, roughly. Many people managed one side of the money and not the other.",
  why: 'It tells us how much of the picture will come from you and how much from evidence.',
  unlocks: 'Whether we suggest a credit check before sharing.',
  legend: "What you know of your partner's finances",
  options: {
    good: { title: 'I have a good idea of everything', body: '' },
    some: { title: 'I know some things but not all', body: '' },
    little: { title: 'Very little', body: 'They managed the money' },
    hiding: { title: 'I suspect they may be hiding things', body: '' },
  },
} as const

export const o6 = {
  eyebrow: 'What matters',
  headline: 'What matters most to you?',
  body: 'Pick up to three of each. They shape the notes we write for you.',
  why: 'Priorities and worries decide which notes we write for you.',
  unlocks: 'The personal notes in the plan.',
  priorities: {
    legend: 'What matters most',
    options: {
      fairSplit: 'A fair split',
      home: 'Keeping the family home',
      pension: 'Protecting my pension',
      children: 'Stability for the children',
      cleanBreak: 'A clean break',
      quickly: 'Getting this done quickly',
      costs: 'Keeping costs low',
      support: 'Ongoing financial support',
    },
  },
  worries: {
    legend: 'What worries you most',
    options: {
      liveOn: 'Not enough to live on',
      hidden: 'Hidden assets or dishonesty',
      pension: 'Losing my pension',
      mortgage: "Can't afford the mortgage alone",
      cost: 'The cost of the process',
      toll: 'The emotional toll',
      cooperating: 'My ex not cooperating',
      fair: "Not knowing what's fair",
    },
  },
  cta: 'See my plan',
} as const

// The plan page. "Your plan" appears once, as the eyebrow, and nowhere else on the
// page. Never in the h1: after a client navigation Next's route announcer repeats the
// h1 in a hidden live region, which would double any strict text locator.
export const plan = {
  eyebrow: 'Your plan',
  headline: "Here's what we heard",
  intro: 'Facts first, then a few notes written for you. Nothing here is advice.',
  sections: {
    situation: 'Your situation',
    journey: 'The journey',
    needs: 'What needs to happen',
    conventional: 'The conventional path',
    helps: 'How Decouple helps',
    notes: 'Notes for you',
    links: 'Useful links',
  },
  downloadCta: 'Download the plan',
  printHint: 'You can also print this page from your browser.',
  nextStepCta: 'Create my account',
  seeOptionsCta: 'See all your options',
  noPressure: {
    title: 'No pressure',
    body: 'This is yours to keep. There is no account yet and nothing is shared with anyone.',
  },
  notesWriting: 'Writing a few notes for you.',
  termsTitle: 'Three terms, explained',
  terms: [
    { term: 'Conditional order', explain: 'The first of the two court orders in a divorce. It confirms you are entitled to divorce; the marriage is not over yet.' },
    { term: 'Consent order', explain: 'A court order that makes the financial agreement you both signed legally binding. Applied for after the conditional order.' },
    { term: 'MIAM', explain: 'A first meeting with a mediator to see whether mediation could help. The consent route does not go through one.' },
  ],
  unanswered: 'Answer the interview first and this page fills in.',
  unansweredCta: 'Start the interview',
  pricingLink: 'See pricing',
  templates: {
    stage: {
      decided: "You've decided to separate and want the finances sorted.",
      thinking: "You're thinking about separating and want to understand what is involved.",
      process: "You're already in the process and want to get things moving.",
    },
    relationship: { married: 'You are married', civil: 'You are in a civil partnership' },
    living: { yes: 'living together', no: 'living apart', complicated: 'with living arrangements that are complicated' },
    childrenNone: 'no children under 18',
    childrenOne: 'one child under 18',
    childrenMany: '{n} children under 18',
    home: {
      mortgage: 'you own your home with a mortgage',
      outright: 'you own your home outright',
      rent: 'you rent your home',
      other: 'your home arrangements are different',
    },
    situation: '{relationship}, {living}, with {children}, and {home}.',
    steps: {
      filing: { title: 'Filing', position: 'The divorce application itself. No-fault, online, and the clock starts here.' },
      building: { title: 'Building the picture', position: 'Your finances, evidenced line by line from your bank and your documents.' },
      reconciling: { title: 'Reconciling', position: 'Both pictures side by side, agreeing what is what before anyone proposes anything.' },
      settling: { title: 'Settling', position: 'Option cards, a reason beside each, until a version is accepted and signed by both.' },
      court: { title: 'Court', position: 'The consent order pack, posted after the conditional order.' },
      implementation: { title: 'Implementation', position: 'The final order, then the transfers and closures that make it real.' },
    },
    stepFacts: {
      filing: '{conditionalWeeks} weeks to the conditional order, by law.',
      building: 'Bank data first, then only the documents the gaps name.',
      reconciling: 'Nothing crosses to your ex without a previewed, deliberate send.',
      settling: 'A 24-hour cooling-off before any acceptance is final.',
      court: 'Posted to Harlow after the conditional order. Fee {fee}, read live at pack time.',
      implementation: 'The final order can be applied for {finalWait} after the conditional order.',
    },
    needs: {
      facts: 'Confirm the facts about your situation.',
      picture: 'Build your financial picture from bank data and the documents it names.',
      children: 'Record the arrangements for the children.',
      mortgage: 'Get a mortgage statement and a valuation of the home.',
      outright: 'Get a valuation of the home.',
      rent: 'Confirm the tenancy and who stays.',
      business: 'Gather business accounts, SA302s and how you pay yourself.',
      pension: 'If either of you has a pension, request its valuation now; it takes 6 to 12 weeks.',
      creditCheck: 'Consider a soft credit check before sharing, so nothing undeclared surprises you.',
    },
    conventional: {
      cost: 'Two solicitors, letters and waiting cost {conventional} per person on average.',
      timeline: 'The divorce itself takes at least {minimumWeeks} weeks by law: {conditionalWeeks} weeks to the conditional order, then {finalWait} before the final order.',
      court: 'A consent order is applied for after the conditional order and posted to {courtAddress}. The fee is {fee} and changes; it is read live when your pack is made.',
    },
    helps: [
      'Shared: one picture you both build, so nothing is asserted twice.',
      'Evidenced: every line shows where it came from, with a trust badge.',
      'End to end: from here to a pack a court can seal, without a hand-off.',
    ],
    notes: {
      children: { title: 'The children come first', body: "The welfare of the children is the court's first consideration. Their arrangements sit at the top of your picture." },
      homeMortgage: { title: 'Get the home valued early', body: 'The home is usually the biggest item. A valuation and a mortgage statement turn a guess into evidence.' },
      homeOutright: { title: 'The valuation is the key number', body: 'Three agent valuations or a RICS survey settle most disagreements before they start.' },
      homeRent: { title: 'Renting keeps the home simpler', body: 'The tenancy and who stays are the questions, and they are quick to answer.' },
    },
    safety: 'Support comes first. Nothing here is shared with anyone, and the Exit this page control leaves this site instantly.',
    privacy: 'You said this device may not be private. Nothing is kept on it beyond this visit, and Exit this page clears everything.',
  },
} as const

export const o8 = {
  eyebrow: "What's next",
  headline: 'Where would you like to go?',
  body: 'Four doors. None of them closes the others.',
  exits: {
    account: { title: 'Create my account', body: 'Free. Your answers come with you.' },
    download: { title: 'Download the plan', body: 'Keep it, print it, show it to whoever you trust.' },
    conventional: { title: "I'd rather go the conventional route", body: 'GOV.UK, mediation, solicitors: what applies to you.' },
    talk: { title: 'I need to talk to someone first', body: 'Support that is there right now, whatever you decide.' },
  },
  pricingLink: 'See pricing',
} as const

export const notForYou = {
  eyebrow: 'An honest answer',
  headline: 'Built for married couples',
  body: 'Decouple is for married couples and civil partners in England and Wales. Cohabiting couples have different rights and a different route.',
  applies: [
    'There is no automatic share of property, savings or pensions when cohabiting partners separate.',
    'Arrangements for children work in the same way whether or not you were married.',
    'Jointly owned property is divided by property law, not family law.',
  ],
  resourcesTitle: 'What applies to you',
  changeCta: 'Change my answer',
} as const

export const conventional = {
  eyebrow: 'The conventional route',
  headline: 'The conventional route',
  body: 'It works. It is slower and costs more, and it is a fair choice.',
  backCta: 'Back',
} as const

export const support = {
  eyebrow: 'Support',
  headline: 'Someone to talk to',
  body: 'Whatever you decide, these people are there now. Decouple is not a domestic abuse service.',
  emergency: 'In immediate danger, call 999.',
  backCta: 'Back',
} as const

export const signUp = {
  eyebrow: 'Create your account · about a minute',
  headline: 'Create your account',
  body: 'Your answers come with you. Nothing is shared until you choose to.',
  name: 'Full name',
  email: 'Email',
  password: 'Password',
  passwordHint: 'At least 12 characters. A few words you will remember work well.',
  terms: 'I agree to the terms',
  cta: 'Create my account',
  signInPrompt: 'Already have an account?',
  signInCta: 'Sign in',
  errors: {
    name: 'Enter your full name.',
    email: 'Enter an email address that looks right.',
    password: 'Use at least 12 characters.',
    terms: 'Tick the box to agree to the terms.',
    unavailable: 'Accounts are not open on this site yet. The plan is still yours to download.',
  },
} as const

export const signIn = {
  eyebrow: 'Welcome back',
  headline: 'Sign in',
  email: 'Email',
  password: 'Password',
  cta: 'Sign in',
  forgot: 'Forgot your password? Password reset comes with real accounts.',
  signUpPrompt: 'New here?',
  signUpCta: 'Create an account',
  errors: {
    email: 'Enter an email address that looks right.',
    password: 'Enter your password.',
    unavailable: 'Accounts are not open on this site yet.',
  },
} as const

export const safety = {
  eyebrow: 'Before anything else',
  headline: 'Support, if you need it',
  body: 'You told us things are not easy. Here is who can help, right now. Decouple is not a domestic abuse service.',
  emergency: 'In immediate danger, call 999.',
  // JOURNEY names these three choices verbatim, so they are not held to the CTA length.
  choices: {
    continueCta: "Continue, I'm safe to",
    exit: 'Exit to a safe site now',
    more: 'Show me more support services',
  },
} as const

export const acknowledgement = {
  eyebrow: 'Welcome, {name}',
  headline: 'Your starting point',
  lead: 'Based on what you told us:',
  body: 'It shapes what we ask next and what we never ask again.',
  rows: {
    stage: 'Where you are',
    relationship: 'Relationship',
    living: 'Living together',
    children: 'Children',
    home: 'Home',
    work: 'Work',
    knowledge: "Your partner's finances",
  },
  affordance: 'Not quite right? You can change any of these while building your picture.',
  nextStepCta: 'Build your picture',
  tourCta: 'Take the tour',
  tourMeta: 'Four panels, about a minute.',
  values: {
    stage: { decided: 'Separating', thinking: 'Thinking about separating', process: 'Already in the process' },
    relationship: { married: 'Married', civil: 'Civil partnership', other: 'Other' },
    living: { yes: 'Yes', no: 'No', complicated: 'Complicated' },
    childrenNone: 'None under 18',
    childrenOne: '1 child under 18',
    childrenMany: '{n} children under 18',
    home: { mortgage: 'Own with a mortgage', outright: 'Own outright', rent: 'Rent', other: 'Other' },
    work: { no: 'Both employed or not working', me: 'You are self-employed or a director', ex: 'Your ex is self-employed or a director', both: 'You both are' },
    knowledge: { good: 'A good idea of everything', some: 'Some things but not all', little: 'Very little', hiding: 'You suspect things are hidden' },
  },
} as const

export const tour = {
  eyebrow: 'The tour · panel {n} of 4',
  panels: [
    {
      phase: 'Build',
      headline: 'Build your picture',
      body: 'Connect your bank once and we draft your picture line by line, with the evidence beside each. Read-only; we can never move money.',
    },
    {
      phase: 'Reconcile',
      headline: 'Share and reconcile',
      body: 'You choose what to share and preview it first. Your ex builds their own picture, and you settle differences item by item.',
    },
    {
      phase: 'Settle',
      headline: 'Propose and settle',
      body: 'Proposals are option cards with a reason beside each. Counters show only what changed, and the split updates as you go.',
    },
    {
      phase: 'Finalise',
      headline: 'Finalise',
      body: 'When you have both signed, the court pack is generated: Form A, D81, the draft order and a cover letter to post.',
    },
  ],
  backCta: 'Back',
  nextCta: 'Next',
  skipCta: 'Skip the tour',
  finishCta: 'Build your picture',
  nextStepCta: 'Build your picture',
} as const

export const build = {
  eyebrow: 'Build',
  headline: 'Your picture starts here',
  body: 'Profile first, then your bank, then confirm by exception. Only the documents the gaps name.',
  // JOURNEY's empty-state template, verbatim.
  nextStepTitle: 'Tell us about your home',
  emptyTitle: 'Tell us about your home',
  emptyBody: 'Nothing here yet.',
} as const

export const phases = {
  labels: { start: 'Start', build: 'Build', reconcile: 'Reconcile', settle: 'Settle', finalise: 'Finalise' },
  locked: 'Locked',
  unlocks: {
    reconcile: 'Unlocks when your picture is shared',
    settle: 'Unlocks when everything is reconciled',
    finalise: 'Unlocks when you have both signed',
  },
  navLabel: 'Phases',
} as const

export const errors = {
  generic: 'That did not work. Try again in a moment.',
  refLabel: 'ref: {ref}',
} as const
