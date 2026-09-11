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
