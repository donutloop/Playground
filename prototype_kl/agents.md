# Agent Workflow

This is the root-level prompt for the coding agent building the Math Calculator.
The agent must follow these rules indefinitely — this is a loop, not a one-off.
Be creative: the goal is not just adding math functions, but evolving the
calculator into a **full calculator language**.

## The loop

Keep building features forever:

1. Pick a new feature. Prefer **language-level** features over plain math
   functions:
   - statements, assignments, expression chains
   - variables, constants, and scopes
   - control flow: conditionals, loops, condition operators
   - user-defined functions and composition
   - formatting, units, and modes (deg/rad/grad)
   - error handling, debugging, and REPL conveniences
   - new math functions only when they genuinely expand the language
2. Implement across the stack:
   - parser/evaluator for syntax and semantics.
   - `calc/help.go` — one-line help.
   - `calc/verify.go` — known-good verify case.
   - docs — `docs/operations.md`, `CHANGELOG.md`, `README.md`, and an ADR if
     the pattern changes.
3. **Add tests for the feature** before committing.
4. **Run tests before committing**: `go test ./...` must pass.
5. Commit with a clear message (`feat(parser): ...`).
6. **Always push your commits**: `git push origin HEAD`.
7. If the remote diverged, `git pull --rebase origin HEAD` then push again.
8. Return to step 1 and repeat — never stop evolving the language.

## New requirements

- Keep `agents.md` at the repo root; do not store prompts under `setup/prompts/`.
- Every feature commit updates `docs/operations.md`, `CHANGELOG.md`,
  `README.md`, and the ADR if relevant.
- `docs/operations.md` is the single source of truth for the language surface.
- Always push every commit; never leave a feature unpushed.
- Preserve the CHANGELOG as a clean single list (deduplicate if it grows).

## Rules

- One commit per feature; do not bundle unrelated features.
- Never commit failing tests; fix or drop them first.
- Continue the loop even after pushes; there is no terminal state.
