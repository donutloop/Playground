# Changelog

All notable changes to the Math Calculator. Entries are grouped per commit,
newest first. Each commit runs `go test ./...` before landing.

## [7] degree/radian mode toggle — `deg` / `rad`
- Direct trig (`sin`, `cos`, `tan`) operate in degrees in `deg` mode.
- Inverse trig (`asin`, `acos`, `atan`) return degrees.
- Transformation uses a real paren-matching scanner (no regex), applied
  recursively to nested trig arguments.

## [6] persistent session state
- Variables, memory, `ans`, and history are JSON-persisted to `.calc-state.json`.
- `NewPersistent` loads state on start and saves on exit.
- Corrupt state files fall back to a fresh session with a warning.

## [5] classic memory registers
- `MS`, `M+`, `M-`, `MR`, `MC`, and `mem`.
- `mem` is also usable inside expressions.
- Empty-memory and no-last-result cases return friendly errors.

## [4] CLI wiring
- `main.go` default mode launches the interactive REPL.
- `--eval "expr"` evaluates one expression for scripting.
- Makefile (`build/test/run/fmt/vet/clean`) and full README.

## [3] interactive REPL calculator (`calc`)
- Multi-statement lines separated by `;`.
- User variables via `name = expression`.
- `ans` recall of the last result.
- Commands: `help`, `vars`, `history`, `clear`, `quit`.
- Variable resolution uses a real single-pass lexer (no regex), O(len(expr)).
- Results formatted to hide floating-point noise (`0.1 + 0.2` → `0.3`).

## [2] math constants
- `pi` and `e` as first-class tokens usable in any expression.

## [1] extended functions + multi-argument calls
- Trig/inverse/hyperbolic, roots/rounding, logs, `pow`, `hypot`, `min`,
  `max`, `fact`.
- Comma-separated multi-arg parsing with arity validation and typed errors
  (`ErrBadArity`, `ErrDomain`, `ErrOverflow`, `ErrFactorial`).
