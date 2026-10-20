# Handoff · site 11 (20 October 2026): export 2026-10-19c

**Landed.** Export `2026-10-19c` replaced `site/` and `docs/SITE-SPEC.md` whole. Its change note is `docs/exports/2026-10-19c.md`.
- It adds the guide as a PDF, attached to the guide email when the person ticks "Attach a PDF copy". The box is off by default.
- In `site/`:
  - the print layout (`m02/guide/g-print.jsx` and `g-print.css`), shown on its own at `/guide?print=pdf` and by "Download or print";
  - the tick box in the email dialog;
  - a 45-second wait for `/api/email` when it asks for a PDF;
  - the privacy page's guide email row, which now covers the PDF.
- The spec's §7 adds the `pdf` flag on `/api/email`, the attachment line in the email, and a new section, "The guide PDF". Nothing else in it changed.
- 19a and 19b (`/about` and the strapline) had already landed.

**Built: the guide PDF (spec §7).**
- **How it's made.** `lib/pdf.ts` opens `/guide?print=pdf`, with the link's `#g=` part, in a headless Chromium. It then:
  - waits for the page's `window.__printReady`, for 20 seconds at most;
  - checks there's no `__printError` and at least one chapter;
  - prints A4, with the page's own margins and page numbers.
- **The browser.** On Vercel it's Chromium 153 from `@sparticuz/chromium`, driven by `puppeteer-core` 25.11, the release made for Chrome 153. The spec asks for 131 or later.
  - Each PDF gets a new browser, closed afterwards along with its profile. The page's cache is off.
  - The PDF is held in memory, and goes only to Resend.
  - Every request from the page is blocked unless it goes to `SITE_ORIGIN`. `data:` and `blob:` addresses are allowed, since they never leave the browser.
  - Two of the package's default flags loosen the browser's web security. Both are left out.
- **It always prints `/guide`.** The print address is `SITE_ORIGIN/guide?print=pdf` plus the answers, whatever path the link has.
  - `/guide` serves the guide in either site mode and without a session, so the PDF works in holding mode.
  - The browser can't be pointed at any other page.
- **Two things the server adds, for safety:**
  - **Names and safety answers are removed before printing.** The guide's own links never carry them. The print page shows names as text, though, so a link made by hand could otherwise put any words into a PDF sent from our address. Every other answer is a fixed choice, and made-up values print nothing: I checked by putting made-up text in every answer.
  - **The PDF's title is "Your guide".** Otherwise it would be the page's title, "Your free divorce guide — Decouple", which PDF viewers show.
- **`/api/email`.** Only `pdf: true` asks for the PDF; any other value counts as not asking.

| Outcome | Reply | The email |
|---|---|---|
| PDF attached | `{ok: true, pdf: true}` | "A PDF copy of your guide is attached." and `Your guide.pdf` |
| PDF failed, timed out, was 5 MB or more, or was past 20 an hour across all visitors | `{ok: true, pdf: false}` | The link email, without the line |
| Not asked | `{ok: true}`, as before | The link email |

  - **Time.** The PDF has 25 seconds from the start of the request. That leaves the email its 12, inside the spec's 40. The function may run for 60 (`vercel.json`).
  - **Log.** One line for each PDF asked for: whether it was attached, its size or the reason it wasn't, and how long it took. Never the link or the address. Any address in an error message is removed, since it would carry the answers.
  - **Attachments.** The email template is the only place an attachment can come from, and it attaches only the PDF it's given, as `Your guide.pdf`.
- **`/api/admin/diagnose?pdf=1`** makes the PDF of a test guide the same way, from the guide's demo answers. It reports `ok`, the size and the time, or the reason it failed. `?pdf=1&email=1` also sends that PDF, attached, to the from address.
- **`vercel.json`.** `api/email.ts` and `api/admin/diagnose.ts` get `maxDuration: 60`, plus `includeFiles` for Chromium's packed files. That's about 67 MB each, within Vercel's 250 MB limit.
- **Locally.**
  - `CHROMIUM_PATH` names a local Chrome or Chromium (see README and `.env.example`). It's never set in Vercel.
  - The dev server leaves Chromium and Puppeteer unbundled, as Vercel does.

**Checked.**
- Typecheck, 159 tests and the build. The new tests cover:
  - **The print address:** what it leaves out, and that only our own origin is allowed.
  - **A stand-in browser.** It blocks other hosts, prints A4 with the page's margins, and closes the browser every time. It gives no PDF when the page 404s, is never ready, has no guide or no chapters, comes to 5 MB, runs out of time, or no browser starts.
  - **`/api/email`:** with the PDF, without it, with it failing, and past 20 an hour. Also that the log holds no link and no address.
  - **The rest:** diagnose `?pdf=1`, and `/guide?print=pdf` served to a logged-out visitor in holding mode.
- In headless Chromium, on the dev server answering as decouple.uk, the checks in CHANGES:
  - **The print page.** `/guide?print=pdf#g=…`, logged out, in holding mode and in guide mode:
    - it shows the cover "Your guide", the contents and 8 chapters;
    - `__printReady` becomes true;
    - nothing is requested outside the site, and there are no console errors.

    With no guide in the link, `__printError` is "no-guide".
  - **Box ticked.** It's off by default. One email arrives, subject "Your guide", with `Your guide.pdf`:
    - 17 A4 pages, numbered from page 2, titled "Your guide";
    - no buttons, no Quick exit, no safety answer;
    - the dialog says a PDF is attached.
  - **Box unticked:** no attachment and no attachment line.
  - **The PDF forced to fail**, with no browser to start: the link email arrives without the line. The dialog says "We sent the link, but couldn't attach the PDF this time."
  - **"Download or print"**, printed from the guide, gives the same layout: the same 17 pages and the same text.
  - **Links in the PDF.** The only ones are the six support services on the last page (Samaritans, the National Domestic Abuse Helpline and the others), and they can be clicked.
- **The Chromium that ships to Vercel** (`@sparticuz/chromium` 153), run here as Vercel runs it:
  - The first PDF took 2.6 seconds, including unpacking Chromium. Later ones took about half a second.
  - Three at once from a cold start all succeeded, in about 3.2 seconds each.
  - Each was 278 KB, with every font embedded (Inter, Source Serif, JetBrains Mono).
  - No browser profile was left behind.
- **The sample.** `docs/exports/2026-10-19c-sample-guide.pdf`, made from the demo answers, so no real answers.
- The regression runs, each on a fresh dev server:
  - **All 76 §11 request checks pass.**
  - **Every hub, proto and MVP opens clean**, as the owner and as each tester. With mode = guide, the guide makes 39 requests, none outside `dist/_public.json`. That's two more than before, the print layout's two files.
  - Still running: landings A to I, the short addresses, the strapline and About.
- **Not checked here: the Vercel preview,** which this environment can't reach. The PDF can't be checked on a preview anyway, for two reasons:
  - It prints the page at `SITE_ORIGIN`, which is decouple.uk, and that page has no print layout until this merges. So the reply would be `pdf: false` after 20 seconds.
  - The guide on a preview builds its links on the preview's address, which `/api/email` refuses.

**Ross.**
- **Vercel settings:** nothing to change. `vercel.json` sets the time limit and ships Chromium. The default function memory of 2 GB is enough; Chromium needs about 1.6 GB.
- **On decouple.uk after merging,** one at a time:
  1. **Check Chromium works.** Signed in, open https://decouple.uk/api/admin/diagnose?pdf=1. Under `guidePdf`, `test` should say `"ok": true`, with the time it took. The first one after a deploy takes a few seconds longer.
  2. **Send yourself a PDF.** Make a guide, tick "Attach a PDF copy" and send it to yourself. Check the cover, the page numbers, and that there's no safety answer.
  3. **Send one without.** Leave the box unticked: no attachment.

  If step 1 says `"ok": false`, paste me the `guidePdf` part. A reason of `page 403` would mean Vercel's firewall stopped the headless browser from loading the page.
- **Still open:**
  - **Site settings saves.** Check that the landing and the look stick, and that there's no "Preview" box on `/settings`.
  - **The privacy page.** Confirm Anthropic's API retention period for `privacy.html`, through the design project.
  - **Search.** Keep Show in search engines off until a family solicitor or mediator has checked `/help`, including the assistant.

**In `site/`, for the design project.**
- Nothing failed.
- **The page's title ends up on the PDF.** The title of `Marketing 02 · Divorce Guide.html` is "Your free divorce guide — Decouple".
  - A PDF made from the page takes that as its title, which PDF viewers show.
  - Chrome's "Save as PDF" offers it as the file name, so "Download or print" saves "Your free divorce guide — Decouple.pdf".
  - The server sets the emailed PDF's title to "Your guide" itself.
  - Proposed fix: in print mode, and while printing (`beforeprint` and `afterprint`), the page sets `document.title = "Your guide"`.
- **Names in a link get printed.** `g-print.jsx` leaves out `safe` and `safe2`, but prints `name_me` and `name_them` when a link carries them: the cover's "For …", and in the chapters.
  - The guide's own links never carry them, because `GS.link` drops them. Only a link made by hand could.
  - The server now removes them before printing.
  - Proposed fix: the print page drops them too when it has `?print=pdf`.
- **Screen wording in the print.** On paper, chapter 3's parenting-plan card still says "Pick another common arrangement, or tap any night to make it yours."
- **Carried over from HANDOFF-SITE-8 to 10:**
  - the spec §2 update for the short addresses;
  - Site settings falling back to preview mode when `/api/session` is slow;
  - the two speed proposals;
  - the strapline's one-pixel boundary.

**Next.** The parked items: the end-to-end tester-code run, the spreadsheet tabs per test, Results playback, analytics and session tools.
