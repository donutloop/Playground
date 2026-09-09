# ADR 0003: JSON state file for cross-session persistence

**Status:** Accepted  
**Date:** 2026-04-18  
**Context:** The calculator should keep working "day and night" — variables,
memory, `ans`, and history should survive restarts.

**Decision:** Persist a small JSON state (`vars`, `memory`, `ans`, `history`)
to `.calc-state.json`. `NewPersistent` loads on start and saves on exit.
A missing file starts a fresh session; a corrupt file falls back to fresh
with a warning rather than crashing.

**Consequences:** Human-readable state, easy to debug, no external database;
save cost is paid once per session, not per keystroke.
