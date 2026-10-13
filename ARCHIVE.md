# The archived prototype

`archive/prototype-01/` is the first prototype of Decouple: a Next.js app with its own
`CLAUDE.md`, `docs/` and tests, frozen on 13 October 2026. The last commit with it at the root
of this repository is `972a92c`; the tag `prototype-01-root-layout` marks it. It is complete and
runs on its own from inside its folder (`archive/prototype-01/README.md` says how), and its
workflow `.github/workflows/archive-ci.yml` keeps it green when something inside it changes.

It is kept to return to and assess, not to revive. Nothing in the site imports from it, nothing
deploys it, and it is not to be brought back without a decision by the owner. The product brief
and journey it holds (`docs/BRIEF.md`, `docs/JOURNEY.md`, `docs/SESSION-CONTEXT.md`) still record
the thinking the site builds on.
