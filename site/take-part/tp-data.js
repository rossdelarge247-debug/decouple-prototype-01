/* Take part · the participant hub's catalogue, screener and copy. Track tokens (set per tester code in Site settings):
   "full" = Protos 01–10, "mvp" = MVP 00–07, or a list like "p03,p06,m05". Empty = guide only. */
window.TP = (function () {
  const P = [
    ["p01", "discover", "Proto 01 · Discover.html", "01", "Discover", "A website for a divorce service: what it does and what it costs.", 3],
    ["p02", "interview", "Proto 02 · Interview.html", "02", "Interview", "A short, private set of questions about the situation.", 5],
    ["p03", "playback", "Proto 03 · Playback.html", "03", "Playback", "A first read of what a court might see as fair.", 3],
    ["p04", "signup", "Proto 04 · Sign-up.html", "04", "Sign-up", "Choosing a plan and creating an account. Payment is pretend.", 3],
    ["p05", "onboard", "Proto 05 · Onboard.html", "05", "Onboard", "The first day: connecting a bank (simulated) and a short tour.", 4],
    ["p06", "prepare", "Proto 06 · Prepare.html", "06", "Prepare", "Building a financial picture, then sharing it with the other person.", 6],
    ["p07", "reconcile", "Proto 07 · Reconcile.html", "07", "Household", "Checking the other person’s figures and agreeing one picture.", 6],
    ["p08", "settle", "Proto 08 · Settle.html", "08", "Settle", "Proposing how to split things, and reaching agreement.", 8],
    ["p09", "finalise", "Proto 09 · Finalise.html", "09", "Finalise", "Turning the agreement into court documents.", 8],
    ["p10", "dashboard", "Proto 10 · Dashboard.html", "10", "Dashboard", "Coming back weeks later: what needs doing next.", 4],
  ];
  const M = [
    ["m00", "mvp00", "MVP 00 · Public Site.html", "1", "The website", "Find out what the toolkit is, what’s free and what costs money.", 4],
    ["m01", "mvp01", "MVP 01 · Toolkit.html", "2", "Your toolkit", "Get a short guide, then see the tools in the order things happen.", 4],
    ["m02", "mvp02", "MVP 02 · Right for Us.html", "3", "Is it right for us?", "Honest questions about whether doing it yourselves would work.", 5],
    ["m03", "mvp03", "MVP 03 · To-do & Journal.html", "4", "To-do list & journal", "A list for this week, and a private journal.", 5],
    ["m04", "mvp04", "MVP 04 · Parenting Plan.html", "5", "Parenting plan", "Arrangements for the children, as one plan.", 6],
    ["m05", "mvp05", "MVP 05 · Financial Statement.html", "6", "Financial statement", "Everything you both own and owe, with the documents to show it.", 10],
    ["m06", "mvp06", "MVP 06 · Split Planner.html", "7", "Split planner", "Try ways of splitting things, and see how a court might see them.", 6],
    ["m07", "mvp07", "MVP 07 · Ask", "8", "Ask", "An AI sounding board, with answers from official sources.", 6],
  ];
  M[7][2] = "MVP 07 · Ask.html";
  const ALL = [...P, ...M].map(([tok, stage, file, n, t, d, min]) => ({ tok, stage, file, n, t, d, min, kind: tok[0] === "p" ? "full" : "mvp" }));
  function parts(track) {
    const t = String(track || "").trim().toLowerCase();
    if (!t) return [];
    if (t === "full") return ALL.filter((x) => x.kind === "full");
    if (t === "mvp") return ALL.filter((x) => x.kind === "mvp");
    const want = t.split(/[\s,]+/).map((x) => (/^\d{2}$/.test(x) ? "p" + x : x)).filter(Boolean);
    return ALL.filter((x) => want.includes(x.tok));
  }
  const trackLabel = (track) => { const t = String(track || "").toLowerCase(); return !t ? "Guide only" : t === "full" ? "Full vision · 10" : t === "mvp" ? "MVP · 8" : "Chosen · " + parts(t).map((x) => x.tok.toUpperCase()).join(", "); };

  /* the screener. Sent as test "Screener" (one row each). The wellbeing answer is never sent. */
  const SCREEN = [
    { id: "exp", q: "Which describes you best?", o: [["now", "I’m going through a separation or divorce now"], ["recent", "I separated or divorced in the last two years"], ["past", "I separated or divorced more than two years ago"], ["considering", "I’m thinking about separating"], ["none", "None of these"]] },
    { id: "where", q: "Where do you live?", o: [["england", "England"], ["wales", "Wales"], ["scotland", "Scotland"], ["ni", "Northern Ireland"], ["else", "Somewhere else"]] },
    { id: "stage", q: "How far along are you, or were you?", when: (a) => a.exp !== "considering", o: [["deciding", "Still deciding"], ["together", "Decided, still living together"], ["apart", "Living apart"], ["applied", "Divorce applied for"], ["money", "Sorting out the money"], ["done", "All finished"]] },
    { id: "status", q: "Are you, or were you…", o: [["married", "Married"], ["civil", "In a civil partnership"], ["cohab", "Living together, not married"]] },
    { id: "age", q: "Your age", o: [["18", "18–24"], ["25", "25–34"], ["35", "35–44"], ["45", "45–54"], ["55", "55–64"], ["65", "65 or over"], ["na", "Prefer not to say"]], row: true },
    { id: "gender", q: "Your gender", o: [["woman", "Woman"], ["man", "Man"], ["nb", "Non-binary"], ["other", "Another way"], ["na", "Prefer not to say"]], row: true },
    { id: "apps", q: "How comfortable are you using apps for important things, like banking?", o: [["very", "Very"], ["fairly", "Fairly"], ["notvery", "Not very"], ["not", "Not at all"]], row: true },
    { id: "device", q: "What are you using right now?", o: [["phone", "A phone"], ["tablet", "A tablet"], ["computer", "A laptop or computer"]], row: true },
    { id: "wb", q: "Thinking about separation can bring up difficult feelings. How do you feel about taking part today?", private: true, o: [["ok", "I’m fine to take part"], ["hard", "It might be hard, but I’d like to"], ["no", "I’d rather not today"]] },
  ];
  const OUT = { none: "This round is for people who are going through a separation, have been through one, or are thinking about it.", where: "This round is for people in England and Wales, because the law is different elsewhere in the UK." };
  const SARAH = { t: "Sarah, 41", d: "Married to Mark for 14 years. Two children, Ella (12) and Sam (9). They own a house together, and both have work pensions. They’ve decided to separate, and Mark has moved out." };
  const INCENTIVE = { amount: "£20", choices: ["Amazon", "John Lewis", "Love2shop", "Donate it to Refuge instead"] };
  const HELP = [["Samaritans", "116 123", "Free, any time"], ["National Domestic Abuse Helpline", "0808 2000 247", "Free, 24 hours"], ["Mind", "0300 123 3393", "Mental health information"]];
  return { ALL, parts, trackLabel, SCREEN, OUT, SARAH, INCENTIVE, HELP };
})();
