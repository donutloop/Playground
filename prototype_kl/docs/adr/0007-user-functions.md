# 7. User-defined functions at the calc layer

## Status

Accepted

## Context

The calculator had variables, assignments, memory, modes, and formatting, but
no way to define reusable functions. The mission favours language-level
features over more built-in math functions.

## Decision

Implement user-defined functions with syntax `f(x, y) = body-expr`, resolved
at the `calc` layer exactly like variable substitution. On evaluation, a call
`f(a, b)` is expanded inline: arguments are split at top-level commas, each is
expanded and substituted, parameters are bound to the resulting literals, and
the body is re-expanded (so bodies can reference variables, built-ins, and
other user functions). Expanded bodies are wrapped in parentheses to preserve
precedence.

The strict `parser` package stays untouched: it never sees user functions, and
`SupportedFunctions` remains the source of truth for built-ins. Definitions are
validated (unique params, non-reserved names, exact arity at call time) and
persisted through the same `state` snapshot mechanism as variables.

## Consequences

- Users get reusable functions without extending the parser.
- Expansion is string-based, so precedence is handled by wrapping in parens.
- Arity and name conflicts surface as clear errors.
- Function definitions persist across saves and undo/redo.
