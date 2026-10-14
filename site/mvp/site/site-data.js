/* MVP 00 · Public site: page content. Tool order and prices come from KIT (mvp/kit/kit.js). */
window.SITE = (function () {
  const TOOL = {
    fit: { lede: "Fifteen honest questions about safety, control, how you talk and how complicated things are. At the end, a plain answer.",
      do: ["Answer five short groups of questions. “Not sure” is a fine answer.", "See one of three results: it could work, get help with some parts, or get advice first.", "If anything suggests fear or control, you’re shown who to call, in confidence."],
      get: [["An honest answer, and who can help", "free"]], good: "Your answers are never kept, even after you save. Only the result, if you choose." },
    todo: { lede: "A list for this week, made from your guide, and a private journal for dates, feelings and anything you might need later.",
      do: ["Work through Do now, Coming up and When you can. Tap ? to see why each one matters.", "Open the right tool straight from a task.", "Write journal entries, and talk one through with the companion if it helps."],
      get: [["A to-do list that changes as you go", "free"], ["A private, dated journal", "free"]], good: "Your journal is never shared, even if you invite your partner into another tool." },
    kids: { lede: "Where the children live, handovers, holidays and how you’ll decide things, as one plan you can both agree to.",
      do: ["Pick a pattern, or set your own on a two-week calendar.", "Agree handovers, holidays, birthdays and how you’ll talk.", "See a rough child maintenance figure, worked out from the government’s rates."],
      get: [["Your parenting plan, as a PDF", "free"]], good: "Parenting plans aren’t legally binding. They’re what you’ve both agreed, and courts like to see them." },
    statement: { lede: "Every figure, with a date and a document. The financial disclosure a mediator, a solicitor or the court will ask for.",
      do: ["Fill in your side: property, accounts, pensions, debts and income, in sittings.", "See which documents you still need, line by line.", "Invite your partner. Check both sides together, sort what’s missing, and agree it’s complete."],
      get: [["Your statement, on screen", "free"], ["Financial disclosure pack: open financial statement, Form E draft, D81 figures and evidence checklist", "disclosure"]], good: "Your partner fills in their side before they see yours." },
    split: { lede: "Try different ways of splitting the home, pensions, savings and debts, and see how a court would likely see each one, and why.",
      do: ["Start from the figures you’ve agreed.", "Move each decision and watch it change: Strong, Reasonable, or A stretch.", "Read your agreement in plain English, together."],
      get: [["Your agreement summary", "free"], ["Agreement pack: plain-English agreement, draft consent order, D81 and next steps", "agreement"]], good: "The tags are a guide to how a judge would likely see it, not legal advice." },
    ask: { lede: "A sounding board, any time. Answers from official sources, with links. It knows what your guide knows, and it says when you need a professional.",
      do: ["Ask anything, and check the sources.", "Get ready for a meeting with a mediator or solicitor.", "Paste a letter to have it explained, or a message to make it calmer.", "Talk something through when it’s been a hard day."],
      get: [["Five ways to use it", "free"]], good: "Conversations aren’t saved. It isn’t a solicitor, and it isn’t legal advice." },
  };
  const FAQ = [
    ["Getting started", [
      ["Is it really free?", () => `Yes. Every tool is free to use, as much as you like. You only pay if you want a finished, formatted pack, from £${window.KIT.price("disclosure")}.`],
      ["Do I need an account?", "Not to use the tools. Save your toolkit, for free, when you want to come back to it, invite your partner, or get a pack. Until you save, nothing is kept: close the page and it’s gone."],
      ["Why do I start with the guide?", "It takes five minutes and tells the toolkit where you are, so it can show you the right tool first. You get your own guide to keep, too."],
      ["Is it for unmarried couples?", "Yes. The guide explains what’s different if you aren’t married or in a civil partnership. The parenting plan works the same for everyone."],
    ]],
    ["Money", [
      ["What do the packs cost?", () => `The financial disclosure pack is £${window.KIT.price("disclosure")} and the agreement pack is £${window.KIT.price("agreement")}. One payment covers both of you.`],
      ["What do I get that I can’t get free?", "The tools show you everything on screen. A pack is the finished paperwork: formatted, in the court’s wording where it needs to be, ready to send."],
      ["Can a solicitor check it?", "Soon. We’re setting up a fixed-fee solicitor check. You can join the waitlist when you get a pack."],
    ]],
    ["Privacy & safety", [
      ["Will my partner find out?", "Not from us. Nothing is shared unless you choose to share it. Our emails only ever say “Decouple”. Every page has a Quick exit."],
      ["What if I don’t feel safe?", "Take the five-minute check, or see Safety & privacy for people who can help, in confidence. If there’s been abuse, you may not have to go to mediation, and you may be able to get legal aid."],
    ]],
    ["Legal", [
      ["Are you a law firm?", "No, and nothing here is legal advice. The tools are built on official guidance, and they tell you when you should talk to a solicitor or mediator."],
      ["Will a court accept our agreement?", "An agreement only becomes binding when a judge approves it, as a consent order. The agreement pack gives you the draft. Having a solicitor check it first is worth considering."],
      ["Does it work in Scotland or Northern Ireland?", "Not yet. The law is different there. Decouple is for England and Wales for now."],
    ]],
  ];
  const SAFETY = [
    ["X", "Quick exit, on every page", "One tap leaves for the weather page. Then clear your browser history, or use a private window next time."],
    ["Lock", "Nothing is kept until you save", "Use the tools without an account. Close the page and it’s gone."],
    ["Mail", "Discreet emails", "The subject line only ever says “Decouple”. Use an email your partner can’t read."],
    ["Users", "Nothing shared unless you choose", "Your partner sees nothing, even if you invite them, until you share it."],
    ["Doc", "Delete it all, any time", "From your account, in one step. We don’t sell your data, ever."],
    ["Chat", "The AI doesn’t keep anything", "Ask conversations aren’t saved, and aren’t used to train anything."],
  ];
  return { TOOL, FAQ, SAFETY };
})();
