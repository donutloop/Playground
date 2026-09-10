# Math Calculator

A full-featured math calculator in Go, built on a clean-architecture parser
package plus an interactive read-evaluate-print (REPL) shell.

## Packages

- **`parser`** — a strict, dependency-free expression parser and evaluator.
  It lexes, parses, and evaluates arithmetic expressions with functions and
  constants, returning typed errors (division by zero, unknown function,
  bad arity, domain errors).
- **`calc`** — an interactive calculator shell. It adds first-class variables,
  last-result `ans`, multi-statement lines, history, and friendly formatting.
  Variable resolution uses a real single-pass lexer (no regex).

## Build & run

```sh
make build        # builds ./calculator
make test         # runs all unit + integration tests
```

### Interactive mode

```sh
./calculator
```

Type `help` for commands. Example session:

```
> x = 3 + 2
x = 5
> x * 3
15
> pow(2, 10)
1024
> ans + 1
1025
> sin(pi / 2)
1
```

### One-shot evaluation (scripting)

```sh
./calculator --eval "0.1 + 0.2"    # prints 0.3
./calculator --eval "sin(pi/2)"    # prints 1
```

## Expression language

- Operators: `+ - * /`, parentheses, precedence and associativity.
- Constants: `pi`, `e`.
- Unary functions: `sqrt cbrt abs floor ceil round trunc sin cos tan asin
  acos atan sinh cosh tanh ln log exp fact`.
- Binary/variadic: `pow(x, y)`, `hypot(x, y)`, `min(a, ...)`, `max(a, ...)`.
- Trig functions use radians by default; `deg` switches to degrees (180 in a
  full circle), `grad` switches to gradians (200 in a full circle), `rad`
  returns to radians.

## Calculator shell features

| Feature      | Example                                   |
|--------------|-------------------------------------------|
| Variables    | `x = 3 + 2` then use `x` anywhere          |
| User functions | `f(x) = x^2 + 1` then call `f(3)`        |
| Recursion      | `fib(n) = if(n < 2, n, fib(n-1) + fib(n-2))`; `fib(10)` -> 55 |
| AST inspection | `tree 7 % 3` -> `(mod 7 3)`                  |
| Unit conversion  | `convert(5, km, m)` -> 5000; `convert(60, min, s)` -> 3600; temperature `convert(100, c, f)` -> 212 |
| Range loops      | `sum(1, 100)` -> 5050; `prod(1, 10)` -> 3628800; `count(1, 5)` -> 5 |
| Conditional      | `if(5 > 2, 100, 1)` -> 100; `if(0, 100, 42)` -> 42  |
| Formatting       | `fix(3.14159, 2)` -> 3.14                            |
| Statistics       | `avg(4, 8)` -> 6; `var(...)` population variance; `stddev(...)`; `median(1, 3, 2)` -> 2 |
| Clamping         | `clamp(5, 1, 3)` -> 3                                |
| Interpolation    | `lerp(0, 10, 0.5)` -> 5                             |
| Step             | `step(5, 3)` -> 1; `step(2, 3)` -> 0                |
| Utilities        | `diff(10, 3)` -> 7; `pct(25, 100)` -> 25            |
| Easing           | `smoothstep(0.5, 0, 1)` -> 0.5                      |
| Rounding         | `round(3.14159)` -> 3; `round(3.14159, 2)` -> 3.14 |
| Remap            | `remap(5, 0, 10, 0, 100)` -> 50                    |
| Floor/Ceil       | `floor(3.14159)` -> 3; `ceil(3.14159, 2)` -> 3.15 |
| Booleans         | `and(5 > 2, 3 > 1)` -> 1; `not(0)` -> 1             |
| Last result  | `ans` usable in later expressions          |
| Statements   | separate with `;` — `y = 2; y * 3`         |
| Commands     | `help`, `vars`, `history`, `clear`, `quit` |
| Formatting   | floating-point noise hidden (`0.1+0.2` → `0.3`) |
| Memory       | `MS`, `M+`, `M-`, `MR`, `MC`, and `mem` in expressions |
| Persistence  | state saved to `.calc-state.json` across sessions |
| Recall/undo  | `@N` re-evaluates history entry N; `undo` / `redo` |
| Formatting   | `sci`, `fix`, `prec <n>`, `status`, `last` |
| Batch/CLI    | `--eval`, `--deg`, `--grad`, `--rad`, `--prec`, `--sci`, `--file`, `--demo`, `--version` |
| Engineering  | `eng`/`std` notation; `history` shows results |
| Operators    | `^` exponent; `!` factorial; `%` percent |
| Scripting    | `--state` sharing, `--verify`, `make bench` |

## Documentation

- [CHANGELOG.md](CHANGELOG.md) — feature history.
- [docs/operations.md](docs/operations.md) — every supported operation.
- [docs/adr](docs/adr/) — architecture decision records.

## Development

Each feature is developed and committed separately, and `make test` must pass
before any commit:

```sh
make fmt && make vet && make test
```
