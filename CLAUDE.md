# Claude Code — Decouple

This repository is between two generations of the product. Three folders, three rules.

- `archive/prototype-01/` is the first prototype, frozen on 13 October 2026. It is
  complete and runnable on its own, and its own `CLAUDE.md` and `docs/` apply inside
  it. Change nothing there unless the task is explicitly about the archive.
- `incoming/` is a quarantine for files exported from Claude Design. Read from it and
  port from it; delete each file once it has been ported. Nothing imports from it and
  nothing deploys from it.
- The root is reserved for the work that replaces the prototype. Until it arrives there
  is no app, no CI for the root, and no deployment: `vercel.json` skips every build.

When the Claude Design export lands, read `incoming/README.md`, then confirm with the
owner how it becomes the root before moving a file: the export may be a runnable app
or designs to build from, and that decision is theirs. The product brief and journey
still govern: `archive/prototype-01/docs/BRIEF.md` and `JOURNEY.md`, with the decisions
recorded in `archive/prototype-01/docs/SESSION-CONTEXT.md`, stand until the owner says
otherwise. The way of working for the new generation is written when the work starts.
