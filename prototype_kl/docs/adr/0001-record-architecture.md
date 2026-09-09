# ADR 0001: Clean-architecture expression parser

**Status:** Accepted  
**Date:** 2026-04-18  
**Context:** The calculator needs a trustworthy, dependency-free expression
engine that can be reused from both a REPL and one-shot CLI evaluation.

**Decision:** Keep the `parser` package strictly layered and stateless:
a lexer emits tokens, a parser builds an AST, and an evaluator walks it.
The public surface is `parser.Evaluate(expr)` plus typed error values
(`ErrDivisionByZero`, `ErrUnknownFunction`, `ErrBadArity`, ...). The `calc`
package layers REPL features (variables, memory, degree mode) on top without
coupling into the parser.

**Consequences:** The parser is testable in isolation and reusable. Dynamic
features (variables, memory) stay in `calc`, keeping the parser pure.
