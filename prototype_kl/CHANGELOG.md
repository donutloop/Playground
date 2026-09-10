## [84] generalized range loops (for-loop over integers)

- `sum(i, lo, hi, expr)` sums `expr` over integer `i` in [lo, hi].
- `sum(i, lo, hi, step, expr)` same, stepping by `step`.
- `prod(i, lo, hi[, step], expr)` product of `expr` over integer `i`.
- `count(i, lo, hi[, step], cond)` counts `i` where `cond` is nonzero.
- The loop variable is a real identifier; bounds, step, and body may reference
  user variables, ans, or other functions. Implemented as a calc-level macro
  expansion (generalizes the plain numeric sum/prod/count forms).
- Examples: `sum(i, 1, 10, i^2)` = 385, `prod(i, 1, 6, i)` = 6! = 720,
  `sum(i, 1, 10, 2, i)` = 25, `count(i, 1, 10, i % 2 == 0)` = 5.

# Changelog

All notable changes to the Math Calculator. Entries are grouped per commit,
newest first. Each feature ships code, tests, help text, verify coverage, and
docs updates.

## [83] bitwise operators

- Single `&` (AND), `|` (OR), `~` (NOT), `<<` (left shift), `>>` (right shift).
- Precedence: bind tighter than comparison and looser than addition.
- `12 & 10` = 8, `12 | 10` = 14, `5 << 2` = 20, `16 >> 3` = 2, `~5` = -6.

## [82] recursive user-defined functions

- `if(cond, then, else)` now evaluates `cond` at expansion time and expands only
  the taken branch, so recursive user functions terminate instead of killing the
  process with exponential macro expansion.
- Adds an expansion-depth guard (500) that turns runaway recursion into a
  `recursion too deep` error rather than a stack overflow.
- Verified: `fib(n) = if(n < 2, n, fib(n-1) + fib(n-2))` -> `fib(6)`=8, `fib(10)`=55.
- `if(1, 0, 1/0)` now yields 0 (untaken branch not evaluated).

## [81] tree command: AST inspection
- New `tree <expr>` command prints the abstract syntax tree (S-expression) of an
  expression after calc-macro expansion, e.g. `tree 7 % 3` -> `(mod 7 3)`.
- Adds `parser.Parse` (lex+parse without eval) and `parser.Dump` AST pretty-printer.
- Supports Number, BinaryOp, UnaryOp, Function, Postfix (%%/!), Ternary nodes.

## [80] binary %% modulo operator
- New binary modulo operator `%%` (e.g. `7 %% 3` -> 1), same precedence as `*` and `/`.
- Postfix percent (e.g. `50%%` -> 0.5) still works; `%%` is treated as modulo when an operand follows.
- `%%` works inside countif/sumif conditions: `countif(x %% 2 == 0, 1, 10)` counts evens.
- Added OpMod evaluation (math.Mod), lexer disambiguation, parser mapping, and tests.

## [79] conditional countif / sumif range loops
- New `countif(cond, lo, hi)` counts integers `x` in `[lo, hi]` satisfying `cond`.
- New `sumif(cond, lo, hi)` sums those `x` values.
- `x` is a placeholder substituted into `cond` (e.g. `countif(x > 3, 1, 10)`).
- Fixed assignment detection so `==`, `>=`, `<=`, `!=` are no longer mistaken
  for `=` assignments, enabling comparisons inside expressions and calls.

## [78] range-loop step parameter
- `sum(a, b)`, `prod(a, b)`, `count(a, b)` now accept an optional step:
  `sum(1, 10, 2)` sums every 2nd integer (25).

## [77] mode(a, b, ...) most frequent value
- Added `mode(a, b, ...)` returning the most frequent value (first on a tie),
  completing the statistics family (avg, var, stddev, median, mode).

## [76] round(x, n) decimal precision
- Made `round` variadic: `round(x)` nearest integer, `round(x, n)` rounds to n
  decimal places (e.g. `round(2.5678, 2)` -> 2.57).

## [75] count range loop
- Added `count(a, b)` returning the number of integers from floor(a) to floor(b)
  (0 when b < a), completing the integer-range loop family (sum, prod, count).

## [74] temperature units
- Added affine temperature units to `convert`: `c`/`celsius`, `f`/`fahrenheit`,
  `k`/`kelvin` (e.g. `convert(100, c, f)` -> 212).
- Generalized unitInfo with an `offset` field; conversion formula is now
  `((value * scale) + offset - to.offset) / scale`.

## [73] gradians trig mode
- Added a `grad` command and `--grad` CLI flag for gradian trig mode (200 in a
  full circle), completing the degrees/radians/gradians triad.
- Trig conversion generalized in degrees.go to `applyTrig(expr, factor)` for
  degrees (180) and gradians (200).
- New `SetGrad()` API; `deg`/`rad`/`grad` commands and prompt/status reflect
  the active mode; gradian mode persists across sessions.

## [72] statistics functions
- Added `var(a, b, ...)` population variance, `stddev(a, b, ...)` population
  standard deviation, and `median(a, b, ...)` middle value, all variadic with
  at least two arguments.

## [71] floor(x, n) / ceil(x, n)
- `floor(x, n)` and `ceil(x, n)` round down/up to n decimal places.
## [70] remap(x, lo, hi, nlo, nhi)
- Added `remap(x, lo, hi, nlo, nhi)` mapping a value between ranges.
## [69] round(x, n) to n decimal places
- `round(x, n)` rounds x to n decimal places; `round(x)` stays integer.
## [68] smoothstep(x, e0, e1) easing
- Added `smoothstep(x, e0, e1)` Hermite easing via min/max clamp.
## [67] diff(a, b) and pct(x, total) utilities
- Added `diff(a, b)` = |a - b| and `pct(x, total)` = (x / total) * 100.
## [66] avg(...) variadic arithmetic mean
- `avg` now accepts any number of values (>= 2), returning their mean.
## [65] parser: comparisons compose in sub-expressions
- Comparisons now parse inside parentheses and function arguments.
- Added `and(a, b)`, `or(a, b)`, `not(a)` boolean helpers.
## [64] step(x, edge) Heaviside step
- Added `step(x, edge)` = 1 when x >= edge, else 0.
## [63] lerp(a, b, t) linear interpolation
- Added `lerp(a, b, t)` = a + (b - a) * t.
## [62] clamp(x, lo, hi)
- Added `clamp(x, lo, hi)` bounding x into [lo, hi] via min/max.
## [61] avg(a, b) arithmetic mean
- Added `avg(a, b)` returning (a + b) / 2.
## [60] fix(x, n) decimal rounding
- Added `fix(x, n)` rounding x to n decimal places.
## [59] if conditional
- Added `if(cond, then, else)` with lazy evaluation of the selected branch.
- Nonzero cond selects then; zero selects else.
## [58] range loops (sum/prod)
- Added `sum(a, b)` and `prod(a, b)` integer range loops (floor(a) to floor(b)).
- Reversed ranges yield 0 (sum) and 1 (prod).
## [57] unit conversion
- Added `convert(value, from, to)` for length, mass, and time units.
- Supported units: m km cm mm nm mi ft in yd; kg g mg lb oz; s min h hr day.
- Cross-dimension and unknown-unit conversions are rejected; `convert` is reserved.

## [56] user-defined functions
- Added user-defined functions: `f(x) = expr` defines a function; calls use normal syntax `f(2)`.
- Parameters bind to evaluated arguments; bodies may reference variables, built-ins, and other user functions.
- Arity mismatches and reserved-name redefinition are rejected.
- Function definitions persist across saves and survive undo/redo.

## [55] mish activation
- Added `mish(x)` = x·tanh(ln(1+e^x)).

## [54] isfinite predicate
- Added `isfinite(x)` returning 1 (finite) or 0 (infinite/NaN).

## [53] swish activation
- Added `swish(x)` = x/(1+e^-x).

## [52] isqrt integer square root
- Added `isqrt(x)` = floor(sqrt(x)) for x >= 0.

## [51] softsign activation
- Added `softsign(x)` = x/(1+|x|).

## [50] fract(x) fractional part
- Added `fract(x)` = x - floor(x), the nonnegative fractional part.

## [49] root(x, n) n-th root
- Added `root(x, n)` = x^(1/n).

## [48] deg/rad conversion functions
- Added `deg(x)` radians-to-degrees and `rad(x)` degrees-to-radians.

## [47] logical && and || operators
- Added `&&` and `||` returning 1 (true) or 0 (false).
- Precedence: ternary < logical < comparison < arithmetic.

## [46] == and != equality comparisons
- Added `==` and `!=` with lexer peeking on '=' and '!'.
- Factorial `!` preserved by peeking only when followed by '='.

## [45] <= and >= comparisons
- Added two-character `<=` and `>=` with lexer peeking.
- Distinct op values and token-type mapping fix precedence.

## [44] comparison operators
- Added `<` and `>` comparisons returning 1 (true) or 0 (false).
- New tokens/ops, parseComparison precedence between ternary and arithmetic.

## [43] ternary conditional operator
- Added `cond ? a : b` with lowest precedence; nonzero cond selects a.
- New tokens `?` and `:`, `TernaryNode` AST, and evaluator support.

## [42] softplus
- Added `softplus(x)` = ln(1+e^x).

## [41] logistic sigmoid
- Added `logistic(x)` = 1/(1+e^-x).
- Prompts relocated from setup/prompts to root agents.md with new requirements.

## [40] asech/acsch/acoth inverse hyperbolic reciprocal
- Added `asech(x)`, `acsch(x)`, `acoth(x)`.
- Domain errors for out-of-range inputs.
- Added agents.md documenting the perpetual feature loop.

## [39] sech/csch/coth hyperbolic reciprocal
- Added `sech(x)`, `csch(x)`, `coth(x)`.
- Domain errors at csch(0) and coth(0).

## [38] asec/acsc/acot inverse reciprocal trig
- Added `asec(x)`, `acsc(x)`, `acot(x)`.

## [37] sec/csc/cot reciprocal trig
- Added `sec(x)`, `csc(x)`, `cot(x)`.
- Domain errors at undefined points instead of silent infinities.
- Added docs/operations.md listing all supported operations.

## [36] sinc cardinal sine
- Added `sinc(x)` = sin(x)/x with sinc(0)=1.

## [35] exp10 base-10 exponent
- Added `exp10(x)` = 10^x.

## [34] rsqrt reciprocal square root
- Added `rsqrt(x)` = 1/sqrt(x), domain x > 0.

## [33] state-aware one-shot eval/file
- `--eval`/`--file` load and save `--state` so scripts share variables.

## [32] --verify self-test battery
- Runs known-good expressions through parser + formatting; non-zero exit on failure.

## [31] '^' exponent operator
- Right-associative `^` binds tighter than `*` (2 * 3^2 == 18).

## [30] persist display settings
- deg/sci/eng/prec survive restarts in the state file.

## [29] --eng engineering notation
- One-shot output uses multiples-of-3 exponents.

## [28] --prec significant digits
- Sets display precision for one-shot eval output.

## [27] --sci scientific notation
- Toggles scientific formatting for one-shot eval.

## [26] --deg degree-mode trig
- `--eval --deg` evaluates trig in degrees.

## [25] 'last' command
- Prints the most recent expression and result.

## [24] 'redo' paired with undo
- Undo pushes a redo stack; 'redo' restores; new statements clear it.

## [23] 'undo' command
- Reverts the last statement.

## [22] 'history' shows results
- `history` lists `expr = result` pairs.

## [21] 'vars' command
- Lists defined variables with values.

## [20] 'clear' command
- Resets variables and ans.

## [19] gamma function
- Added `gamma(x)`.

## [18] erf/erfc
- Added `erf(x)` and `erfc(x)`.

## [17] atan2
- Added two-argument `atan2(y, x)`.

## [16] Bessel jn/yn
- Added `jn(n, x)` and `yn(n, x)`.

## [15] gcd/lcm
- Added `gcd(a, b)` and `lcm(a, b)`.

## [14] pow
- Added `pow(x, y)`.

## [13] min/max variadic
- Added variadic `min(...)` and `max(...)`.

## [12] log2/log10
- Added `log2(x)` and `log10(x)`.

## [11] round/trunc
- Added `round(x)` and `trunc(x)`.

## [10] floor/ceil
- Added `floor(x)` and `ceil(x)`.

## [9] inverse hyperbolic functions
- Added `asinh(x)`, `acosh(x)`, `atanh(x)`.

## [8] hyperbolic functions
- Added `sinh(x)`, `cosh(x)`, `tanh(x)`.

## [7] inverse trig functions
- Added `asin(x)`, `acos(x)`, `atan(x)`.

## [6] trig functions
- Added `sin(x)`, `cos(x)`, `tan(x)`.

## [5] log family
- Added `ln(x)`, `log(x)`, `log1p(x)`, `exp(x)`.

## [4] math helpers
- Added `abs(x)`, `sign(x)`, `sqrt(x)`, `cbrt(x)`.

## [3] constants
- Added `pi` and `e`.

## [2] variables and assignments
- Added `x = expr` variable assignment and reuse.

## [1] initial parser + REPL
- Expression parser, evaluator, interactive shell.
