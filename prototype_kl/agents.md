# Agent Workflow

This file records the exact operating rules for the coding agent working on the
Math Calculator. It is the root-level prompt (formerly `setup/prompts/`) and
the agent must follow these rules indefinitely — this is a loop, not a one-off.

## The loop

Keep building features forever:

1. Pick a new calculator feature (usually a math function).
2. Implement it across the stack:
   - `parser/config.go` — register arity.
   - `parser/evaluator.go` — evaluation case with domain checks.
   - `calc/help.go` — one-line help.
   - `calc/verify.go` — known-good verify case.
   - docs — `docs/operations.md`, `CHANGELOG.md`, `README.md`, and an ADR if
     the pattern changes.
3. **Add tests for the feature** before committing:
   - `tests/unit/evaluator_test.go` — unit cases (values + domain errors).
   - `calc/calculator_test.go` — a help-lookup test.
4. **Run tests before committing**: `go test ./...` must pass.
5. Commit the feature with a clear message (`feat(parser): ...`).
6. **Always push your commits**: `git push origin HEAD`.
7. If the remote has diverged, `git pull --rebase origin HEAD` then push again.
8. Return to step 1 and repeat — never stop adding features.

## New requirements (added after prompt relocation)

- Keep `agents.md` at the repo root; do not store prompts under `setup/prompts/`.
- Every feature commit must update the supported-operations doc
  (`docs/operations.md`), `CHANGELOG.md`, `README.md`, and the ADR if relevant.
- Keep the docs/operations.md file as the single source of truth for what the
  calculator supports.
- Always push every commit; never leave a feature unpushed.
- Preserve the CHANGELOG as a clean single list (deduplicate if it grows).

## Rules

- One commit per feature; do not bundle unrelated features.
- Never commit failing tests; fix or drop them first.
- Continue the loop even after pushes; there is no terminal state.
