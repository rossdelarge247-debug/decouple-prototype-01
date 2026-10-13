# Design reference

Screens the product owner shares as **inspiration, not a bar**, committed here as
`<phase>-<nn>-<group>-<screen>.jpg`. A session opens only the files for its phase.

| Phase | Files | Notes |
|---|---|---|
| Start | `start-01` to `start-16` | Landing (01), two value drill-ins (02, 03), interview intro, form, finances, safeguarding (04 to 07), situation playback (08), sign-up (09), welcome tour and its six panels (10 to 16; 16 is the first dashboard the tour lands on) |
| Build | `build-17` to `build-28` | Three families for Your Picture that compete: tabbed paper (17 to 19), picture hub variants A to E plus two B-v2 states (20 to 26), paper dashboard split vs unified (27, 28). Pick a direction, say why |
| Reconcile | `reconcile-29` to `reconcile-32` | Four competing treatments of the shared picture: reconcile thread, summary rail, popover thread, coexist |
| Settle | `settle-33` to `settle-39` | Proposal builder (33) and the counter (34); five competing version treatments A to E (35 to 39) |
| Finalise | `finalise-40`, `finalise-41` | Settlement agreement, finalisation |

Where a phase has competing variants, the handoff says which one the build drew on
and why, in one line. Keeping the others is fine; they may serve a later screen.

The rule for using them:

1. **Look once, before building the screen.** Take structure, hierarchy, tone,
   spacing, colour and the feel of the interaction. Create or extend the design
   tokens from them.
2. **Compare and contrast, don't copy.** The reference shows one good answer; the
   journey in `docs/JOURNEY.md` and the non-negotiables in `docs/BRIEF.md` decide
   the right answer. Where they differ, the brief wins (one topic per screen, the
   banned words, the exit control, the space indicator, WCAG AA).
3. **Deviate freely, and say so.** In the session handoff, one line per screen:
   what was taken from the reference, what was changed, and why. That note is the
   whole of the comparison. No blind picks, no rounds, no "brought closer to the
   reference".
4. **Never a test.** No test compares the build to a reference image. The bars are
   the golden path and the accessibility floor.

If a handoff ever reads as matching rather than building, the reference has become a
bar again and this folder comes out.
