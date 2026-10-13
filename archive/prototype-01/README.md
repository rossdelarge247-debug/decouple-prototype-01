# Prototype 01, archived 13 October 2026

The first Decouple prototype, frozen in place so it can be run and assessed later.
Sessions 1 and 2 built Start and Build: a user can answer the interview, sign up,
profile, connect a test scenario, confirm by exception and see Your Picture. The
golden path in `tests/e2e/golden-path.e2e.ts` stops at the Share button on
`/build/picture`. The brief, the journey, the two handoffs and the session context
in `docs/` are the record of what was built and why.

Run it from this folder: `npm ci`, then `npm run dev` for http://localhost:3000.
`npm test` runs the unit tests; `npm run e2e:a11y` runs the accessibility floor on
Chromium. Set `DECOUPLE_DEV_MODE=1` to let the stub session sign anyone in outside
a preview. Nothing here deploys; the Vercel project points nowhere until the new work
has a build.

---

# Decouple

The complete settlement workspace for separating couples in England and Wales.
Start with [docs/BRIEF.md](docs/BRIEF.md).

```
npm ci
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run e2e        # golden path (fails at the first unbuilt step, by design)
```

`src/lib/bank` and `src/lib/ai` are the bank-connection and extraction engine carried
over from the previous prototype. Everything else is built fresh against the brief.
