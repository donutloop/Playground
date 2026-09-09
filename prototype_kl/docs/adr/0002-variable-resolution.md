# ADR 0002: Token-level variable resolution, no regex

**Status:** Accepted  
**Date:** 2026-04-18  
**Context:** The REPL supports user variables, but the parser's strict lexer
rejects unknown identifiers. String substitution via regex is slow and fragile
(matching substrings inside function names).

**Decision:** `calc` resolves variables at the token level. A small dedicated
lexer (`calc/lexer.go`) scans an expression and emits whole-identifier tokens
only; substitution rewrites only tokens that name a defined variable or `ans`
or `mem`. Function/constant names are never touched because matching happens
on complete identifier tokens. This is O(len(expr)) regardless of how many
variables exist.

**Consequences:** No regex in the hot path; the parser package is untouched;
variable lookup stays fast even with many variables.
