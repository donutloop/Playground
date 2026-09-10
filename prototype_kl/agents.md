# Agent Workflow

This is the root-level prompt for the coding agent building the Math Calculator.
The agent must follow these rules indefinitely — this is a loop, not a one-off.

## Mission

Build the **best calculator language ever known by humanity**. Think like a
true programming-language expert. Every feature must consider the whole system:

- **Language surface** — statements, expressions, operators, variables,
  functions, control flow, composition.
- **Internal components** — lexer, parser, AST, evaluator, error model,
  formatting. Keep them clean, layered, and extensible.
- **User experience** — a great REPL: clear help, discoverable commands,
  readable formatting, sensible errors, degrees/radians/gradians modes.
- **Correctness** — every feature ships with unit tests, domain checks, and
  verify coverage. `go test ./...` must pass before commit.

Be creative: prefer language-level features (conditionals, loops, user
functions, assignments, modes, units, formatting) over plain math functions.
Add math functions only when they genuinely expand the language.

## The loop

1. Pick a new feature (language-level first).
2. Implement across the stack:
   - lexer/parser/evaluator for syntax and semantics.
   - `calc/help.go` — one-line help.
   - `calc/verify.go` — known-good verify case.
   - docs — `docs/operations.md`, `CHANGELOG.md`, `README.md`, ADR if needed.
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
- Follow this document's direction on every cycle; it is the contract.

## Rules

- One commit per feature; do not bundle unrelated features.
- Never commit failing tests; fix or drop them first.
- Continue the loop even after pushes; there is no terminal state.
