# ADR 0005: CLI modes and extended operators

**Status:** Accepted  
**Date:** 2026-04-18  
**Context:** The calculator needs scriptable one-shot evaluation, batch files,
self-testing, and classic postfix/infix operators without bloating the parser.

**Decision:**

- CLI modes are thin wrappers over the `calc` engine: `--eval` (one-shot),
  `--eval -` (stdin), `--file` (batch), `--demo` (tour), `--verify` (battery),
  and display flags `--deg/--rad/--prec/--sci/--eng`. State sharing via
  `--state` loads before display flags are applied, so flags are never
  overwritten by a persisted session.
- Operators live in the parser as real tokens: postfix `!`/`%` via
  parsePostfix, infix `^` via a right-associative parseExponent between
  parseTerm and parseUnary.

**Consequences:** Scripting, self-tests, and display control are all engine-level
features, while the parser stays small and testable. Display-flag ordering is
load-then-apply so CLI flags always win over persisted state.
