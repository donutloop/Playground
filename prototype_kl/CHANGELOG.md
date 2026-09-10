# Changelog

All notable changes to the Math Calculator. Entries are grouped per commit,
newest first. Each feature ships code, tests, help text, verify coverage, and
docs updates.

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
- Added `logistic(x)` = 1/(1+e^-x), the sigmoid function.
- Prompts relocated from setup/prompts to root agents.md with new requirements.

## [40] asech/acsch/acoth inverse hyperbolic reciprocal
- Added `asech(x)` = acosh(1/x), `acsch(x)` = asinh(1/x), `acoth(x)` = atanh(1/x).
- Domain errors for out-of-range inputs.
- Added agents.md documenting the perpetual feature loop.

## [39] sech/csch/coth hyperbolic reciprocal
- Added `sech(x)` = 1/cosh(x), `csch(x)` = 1/sinh(x), `coth(x)` = 1/tanh(x).
- Domain errors at csch(0) and coth(0).

## [38] asec/acsc/acot inverse reciprocal trig
- Added `asec(x)` = acos(1/x), `acsc(x)` = asin(1/x), `acot(x)` = atan(1/x).
- Domain errors for |x| < 1 on asec/acsc and x=0 on acot.

## [37] sec/csc/cot reciprocal trig
- Added `sec(x)` = 1/cos(x), `csc(x)` = 1/sin(x), `cot(x)` = 1/tan(x).
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
- Added error function `erf(x)` and complementary `erfc(x)`.

## [17] atan2
- Added two-argument `atan2(y, x)`.

## [16] Bessel jn/yn
- Added Bessel functions `jn(n, x)` and `yn(n, x)`.

## [15] gcd/lcm
- Added greatest common divisor `gcd(a, b)` and least common multiple `lcm(a, b)`.

## [14] pow
- Added `pow(x, y)` = x^y.

## [13] min/max variadic
- Added variadic `min(a, ...)` and `max(a, ...)`.

## [12] log2/log10
- Added `log2(x)` and `log10(x)`.

## [11] round/trunc
- Added `round(x)` and `trunc(x)`.

## [10] floor/ceil
- Added `floor(x)` and `ceil(x)`.

## [9] hyperbolic inverses
- Added `asinh`, `acosh`, `atanh`.

## [8] hyperbolic functions
- Added `sinh`, `cosh`, `tanh`.

## [7] inverse trig
- Added `asin`, `acos`, `atan`.

## [6] trig functions
- Added `sin`, `cos`, `tan`.

## [5] log family
- Added `ln`, `log`, `log1p`, `exp`, `expm1`, `logb`, `ldexp`, `nextafter`, `signbit`, `dim`.

## [4] math helpers
- Added `abs`, `sign`, `clamp`, `lerp`, `fma`, `hypot`, `mod`, `copysign`, `fact`.

## [3] constants
- Added `pi` and `e`.

## [2] sqrt/cbrt/exp
- Added `sqrt`, `cbrt`, `exp`.

## [1] initial parser + REPL
- Expression parser, evaluator, interactive shell.
