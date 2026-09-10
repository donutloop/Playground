# 6. Adding a New Math Function

## Context

Each new function must be discoverable and testable across the whole stack:
the parser must know it, the evaluator must compute it, help must document it,
the self-test battery must cover it, and docs must list it.

## Decision

A new function touches seven places in one commit:

1. `parser/config.go` — register arity in `SupportedFunctions`.
2. `parser/evaluator.go` — add the evaluation case (with domain checks).
3. `tests/unit/evaluator_test.go` — unit cases for the function and its domain.
4. `calc/help.go` — one-line help entry.
5. `calc/verify.go` — a known-good verify case.
6. `calc/calculator_test.go` — a help-lookup test.
7. `docs/operations.md` + `CHANGELOG.md` + `README.md` — documentation.

Tests must pass (`go test ./...`) before the single feature commit.

## Consequences

- Functions are uniformly registered, documented, and covered.
- Adding a function is a repeatable, checklist-driven process.
- The `docs/operations.md` file is the single source of truth for what the
  calculator supports.
