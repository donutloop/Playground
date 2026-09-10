# Supported Operations

This document lists every operation the calculator supports. New features must
update this file alongside code, tests, help, and verify coverage.

## Arithmetic operators

| Operator | Meaning |
|----------|---------|
| `+` | addition |
| `-` | subtraction / negation |
| `*` | multiplication |
| `/` | division |
| `^` | exponentiation (right-associative, binds tighter than `*`) |
| `!` | postfix factorial |
| `%` | postfix percent (`x / 100`) |
| `cond ? a : b` | ternary conditional (nonzero cond selects a) |
| `<`, `>` | comparison, returns 1 (true) or 0 (false) |
| `<=`, `>=` | comparison, returns 1 (true) or 0 (false) |
| `==`, `!=` | equality, returns 1 (true) or 0 (false) |
| `&&`, `||` | logical and/or, returns 1 (true) or 0 (false) |

Parentheses `( )` group sub-expressions.
## User functions

Define a function with parameters and a body expression, then call it with
normal call syntax:

    f(x) = x^2 + 1      # define f(x)
    f(3)                # -> 10
    g(a, b) = a * b + a # multi-parameter
    g(3, 4)             # -> 15
    g(g(2, 3), 5)       # nested calls -> 48

Functions are expanded inline with their parameters bound to the evaluated
arguments, so bodies may reference variables, built-in functions, and other
user functions. A call with the wrong number of arguments is rejected, and
reserved names (built-in functions, `pi`, `e`, `ans`, `mem`) cannot be
redefined. Definitions persist across saves like variables.

## Units & conversion
## Range loops
## Conditionals
## Boolean helpers

`and(a, b)`, `or(a, b)`, and `not(a)` combine conditions. They expand to the
parser's `&&` / `||` operators and a ternary.

    and(5 > 2, 3 > 1)  # -> 1
    or(1 > 3, 5 > 2)   # -> 1
    not(0)             # -> 1

Comparisons now parse inside parentheses and function arguments, so
`(5 > 2) ? 100 : 1` works and conditions compose freely.

## Formatting
## Statistics

`avg(a, b, ...)` is the arithmetic mean. `var(a, b, ...)` is the population
variance (mean squared deviation from the mean). `stddev(a, b, ...)` is the
population standard deviation (square root of the variance). `median(a, b, ...)`
is the middle value of the sorted values (average of the two middle values for
an even count). `mode(a, b, ...)` is the most frequent value (first on tie).
All accept two or more arguments.

    avg(2, 4, 6, 8)        # -> 5
    var(2, 4, 4, 4, 5, 5, 7, 9)  # -> 4
    stddev(2, 4, 4, 4, 5, 5, 7, 9) # -> 2
    median(1, 3, 2)         # -> 2
    median(1, 2, 3, 4)      # -> 2.5

## Abstract syntax tree inspection

`tree <expr>` prints the AST (S-expression) of an expression after calc-macro
`expansion, e.g.:

    tree 7 % 3            -> (mod 7 3)
    tree 2 + 3 * 4        -> (+ 2 (* 3 4))
    tree (17 % 5) + 2     -> (+ (mod 17 5) 2)
    tree 50%              -> (% 50)

## Recursive user-defined functions

`if(cond, then, else)` evaluates `cond` at expansion time and expands only the
taken branch, so recursive functions terminate instead of overflowing:

    fib(n) = if(n < 2, n, fib(n-1) + fib(n-2))
    fib(6)       -> 8
    fib(10)      -> 55

Runaway recursion is capped by an expansion-depth guard (500) that reports
`recursion too deep` rather than crashing. Because only the taken branch is
expanded, `if(1, 0, 1/0)` safely yields 0.

## Conditional counting and summing

`countif(cond, lo, hi)` counts how many integers `x` from `lo` to `hi`
(inclusive) satisfy `cond`, where `x` is a placeholder substituted into `cond`.
`sumif(cond, lo, hi)` sums the values of `x` that satisfy `cond`.

    countif(x > 3, 1, 10)           # -> 7
    countif(x % 2 == 0, 1, 10)    # -> 5
    sumif(x > 3, 1, 10)             # -> 49
    sumif(x >= 5, 1, 10)            # -> 45

## Clamping
## Interpolation
## Step function
## Utilities
## Easing
## Rounding
## Remapping
## Floor / Ceil

`floor(x)` rounds down to integer; `floor(x, n)` rounds down to n decimals.
`ceil(x)` rounds up; `ceil(x, n)` rounds up to n decimals.

    floor(3.14159)     # -> 3
    ceil(3.14159, 2)   # -> 3.15


`remap(x, lo, hi, nlo, nhi)` maps x from [lo, hi] to [nlo, nhi]:
`nlo + (x - lo) * (nhi - nlo) / (hi - lo)`.

    remap(5, 0, 10, 0, 100)  # -> 50
    remap(1, 0, 1, 0, 2)     # -> 2


`round(x)` is the nearest integer; `round(x, n)` rounds to n decimal places.
places.

    round(3.14159)   # -> 3
    round(3.14159, 2)  # -> 3.14


`smoothstep(x, e0, e1)` applies Hermite easing between e0 and e1:
clamp((x-e0)/(e1-e0), 0, 1), then t*t*(3-2*t).

    smoothstep(0, 0, 1)     # -> 0
    smoothstep(0.5, 0, 1)   # -> 0.5
    smoothstep(1, 0, 1)     # -> 1


`diff(a, b)` returns the absolute difference |a - b|.

    diff(10, 3)  # -> 7

`pct(x, total)` returns x as a percentage of total: (x / total) * 100.

    pct(25, 100)  # -> 25


`step(x, edge)` returns 1 when x >= edge, else 0.

    step(5, 3)  # -> 1
    step(2, 3)  # -> 0


`lerp(a, b, t)` linearly interpolates between a and b at fraction t:
`a + (b - a) * t`.

    lerp(0, 10, 0.5)   # -> 5
    lerp(10, 20, 0.25) # -> 12.5


`clamp(x, lo, hi)` bounds x into [lo, hi], expanding to `min(max(x, lo), hi)`.

    clamp(5, 1, 3)  # -> 3
    clamp(0, 1, 3)  # -> 1
    clamp(2, 1, 3)  # -> 2


`avg(...)` returns the arithmetic mean of any number of values (>= 2).

    avg(4, 8)        # -> 6
    avg(1, 2, 3, 4)  # -> 2.5


`fix(x, n)` rounds x to n decimal places.

    fix(3.14159, 2)  # -> 3.14
    fix(2.71828, 3)  # -> 2.718


`if(cond, then, else)` evaluates `then` when cond is nonzero, otherwise
`else`. Only the selected branch is computed (lazy evaluation).

    if(5 > 2, 100, 1)    # -> 100
    if(0, 100, 42)       # -> 42
    if(1, sum(1, 3), 0)  # -> 6

The ternary `cond ? then : else` is also available.


`sum(a, b)` sums the integers from floor(a) to floor(b) inclusive;
`prod(a, b)` multiplies them. `count(a, b)` is the number of integers from floor(a) to floor(b) (0 when b < a). All three accept an optional step: `sum(1, 10, 2)` sums every
2nd integer (1+3+5+7+9 = 25).

    sum(1, 10)   # -> 55
    sum(1, 100)  # -> 5050
    prod(1, 5)   # -> 120
    prod(1, 10)  # -> 3628800

A reversed range (b < a) yields the sum identity 0 and the product identity 1.

### Generalized range loops (for-loop over integers)

With a loop variable, `sum`, `prod`, and `count` take a body expression evaluated
at each integer in the range:

    sum(i, lo, hi[, step], expr)   # sum expr over integer i in [lo, hi]
    prod(i, lo, hi[, step], expr)  # product of expr over integer i in [lo, hi]
    count(i, lo, hi[, step], cond) # count i where cond is nonzero

The 4-argument form uses step 1; the 5-argument form takes an explicit step.
The loop variable must be an identifier; bounds, step, and body may reference
user variables, ans, or other functions. count accumulates the condition values
directly (comparisons already yield 1/0). Examples:

    sum(i, 1, 10, i^2)          # -> 385
    prod(i, 1, 6, i)            # -> 720  (6!)
    sum(i, 1, 10, 2, i)         # -> 25   (1+3+5+7+9)
    count(i, 1, 10, i % 2 == 0) # -> 5

A reversed range yields the sum identity 0 and the product identity 1.


Convert a value between units of the same physical dimension with
`convert(value, from, to)`. Supported dimensions: length (base meter), mass
(base kilogram), time (base second).

    convert(5, km, m)   # -> 5000
    convert(1, ft, in)  # -> 12
    convert(60, min, s) # -> 3600
    convert(1, km, mi)  # -> 0.621371192237334

Common units: length `m km cm mm nm mi ft in yd`; mass `kg g mg lb oz`;
time `s min h hr day` (plus full singular/plural names). Converting across
dimensions (e.g. `km` to `kg`) or unknown units are reported as errors. Temperature units `c`/`celsius`, `f`/`fahrenheit`, `k`/`kelvin` are affine conversions (e.g. `convert(100, c, f)` -> 212), and
`convert` itself is a reserved name.


## Constants

| Constant | Value |
|----------|-------|
| `pi` | π ≈ 3.141592653589793 |
| `e` | Euler's number ≈ 2.718281828459045 |

## Math functions

Arity 1 (unary), unless noted. Trig functions take radians.

| Function | Arity | Meaning |
|----------|-------|---------|
| `sqrt(x)` | 1 | square root (x >= 0) |
| `rsqrt(x)` | 1 | reciprocal square root 1/sqrt(x) (x > 0) |
| `isqrt(x)` | 1 | integer square root floor(sqrt(x)) (x >= 0) |
| `cbrt(x)` | 1 | cube root |
| `abs(x)` | 1 | absolute value |
| `floor(x)` | 1 | largest integer <= x |
| `fract(x)` | 1 | fractional part x - floor(x) |
| `ceil(x)` | 1 | smallest integer >= x |
| `round(x)` | 1 | round to nearest integer |
| `trunc(x)` | 1 | truncate toward zero |
| `exp(x)` | 1 | e^x |
| `exp2(x)` | 1 | 2^x |
| `exp10(x)` | 1 | 10^x |
| `expm1(x)` | 1 | e^x - 1 (accurate for small x) |
| `ln(x)` | 1 | natural log (x > 0) |
| `log(x)` | 1 | base-10 log (x > 0) |
| `log2(x)` | 1 | base-2 log (x > 0) |
| `log10(x)` | 1 | base-10 log (x > 0) |
| `log1p(x)` | 1 | ln(1+x) (accurate for small x) |
| `gamma(x)` | 1 | gamma function |
| `sin(x)` | 1 | sine |
| `sinc(x)` | 1 | cardinal sine sin(x)/x, sinc(0)=1 |
| `deg(x)` | 1 | convert radians to degrees |
| `rad(x)` | 1 | convert degrees to radians |
| `cos(x)` | 1 | cosine |
| `tan(x)` | 1 | tangent |
| `sec(x)` | 1 | secant 1/cos(x) |
| `csc(x)` | 1 | cosecant 1/sin(x) |
| `cot(x)` | 1 | cotangent 1/tan(x) |
| `asec(x)` | 1 | arcsecant acos(1/x) (|x| >= 1) |
| `acsc(x)` | 1 | arccosecant asin(1/x) (|x| >= 1) |
| `acot(x)` | 1 | arccotangent atan(1/x) (x != 0) |
| `asin(x)` | 1 | arc sine |
| `acos(x)` | 1 | arc cosine |
| `atan(x)` | 1 | arc tangent |
| `atan2(y, x)` | 2 | two-argument arc tangent |
| `sinh(x)` | 1 | hyperbolic sine |
| `cosh(x)` | 1 | hyperbolic cosine |
| `tanh(x)` | 1 | hyperbolic tangent |
| `logistic(x)` | 1 | sigmoid 1/(1+e^-x) |
| `softplus(x)` | 1 | ln(1+e^x) |
| `softsign(x)` | 1 | x/(1+|x|) |
| `swish(x)` | 1 | x/(1+e^-x) |
| `isfinite(x)` | 1 | 1 if finite, 0 if infinite/NaN |
| `mish(x)` | 1 | x·tanh(ln(1+e^x)) |
| `sech(x)` | 1 | hyperbolic secant 1/cosh(x) |
| `csch(x)` | 1 | hyperbolic cosecant 1/sinh(x) |
| `coth(x)` | 1 | hyperbolic cotangent 1/tanh(x) |
| `asech(x)` | 1 | inverse hyperbolic secant acosh(1/x) (0<x<=1) |
| `acsch(x)` | 1 | inverse hyperbolic cosecant asinh(1/x) (x!=0) |
| `acoth(x)` | 1 | inverse hyperbolic cotangent atanh(1/x) (|x|>1) |
| `asinh(x)` | 1 | inverse hyperbolic sine |
| `acosh(x)` | 1 | inverse hyperbolic cosine (x >= 1) |
| `atanh(x)` | 1 | inverse hyperbolic tangent (-1 < x < 1) |
| `fact(n)` | 1 | factorial n! |
| `sign(x)` | 1 | sign of x (-1, 0, 1) |
| `clamp(x, lo, hi)` | 3 | bound x between lo and hi |
| `lerp(a, b, t)` | 3 | linear interpolation a + (b-a)*t |
| `fma(a, b, c)` | 3 | fused multiply-add a*b+c |
| `hypot(x, y)` | 2 | sqrt(x^2 + y^2) |
| `root(x, n)` | 2 | n-th root of x = x^(1/n) |
| `mod(a, b)` | 2 | remainder a mod b |
| `copysign(x, y)` | 2 | x with the sign of y |
| `logb(x)` | 1 | binary exponent of x |
| `nextafter(x, y)` | 2 | next representable float toward y |
| `ldexp(x, n)` | 2 | x * 2^n |
| `dim(x, y)` | 2 | max(x-y, 0) |
| `signbit(x)` | 1 | 1 if x has negative sign bit |
| `erf(x)` | 1 | error function |
| `erfc(x)` | 1 | complementary error function |
| `min(a, ...)` | variadic | smallest value |
| `max(a, ...)` | variadic | largest value |
| `gcd(a, b)` | 2 | greatest common divisor |
| `lcm(a, b)` | 2 | least common multiple |
| `isprime(x)` | 1 | 1 if x is prime, else 0 |
| `prime(n)` | 1 | the n-th prime (1-indexed: prime(1)=2) |
| `nextprime(n)` | 1 | the smallest prime >= n |
| `divcount(n)` | 1 | number of positive divisors of n |
| `npr(n, r)` | 2 | permutations n!/(n-r)!: ways to pick r ordered items from n |
| `ncr(n, r)` | 2 | combinations n!/(r!·(n-r)!): ways to pick r unordered items from n |
| `pow(x, y)` | 2 | x^y |
| `jn(n, x)` | 2 | Bessel J of order n |
| `yn(n, x)` | 2 | Bessel Y of order n |

## Domain / error behavior

Functions with restricted domains return typed evaluation errors (e.g.
`sqrt(-1)` is rejected). Division by zero and undefined trig reciprocals are
also reported as errors rather than silent infinities.

## Feature history

| Commit | Feature |
|--------|---------|
| `feat(parser): rsqrt reciprocal square root function` | `rsqrt(x)` |
| `feat(parser): exp10 base-10 exponent function` | `exp10(x)` |
| `feat(parser): sinc cardinal sine function` | `sinc(x)` |
| `feat(parser): sec/csc/cot reciprocal trig functions` | `sec`, `csc`, `cot` |
| `feat(parser): asec/acsc/acot inverse reciprocal trig` | `asec`, `acsc`, `acot` |
| `feat(parser): sech/csch/coth hyperbolic reciprocal` | `sech`, `csch`, `coth` |
| `feat(parser): asech/acsch/acoth inverse hyperbolic` | `asech`, `acsch`, `acoth` |
| `feat(parser): logistic sigmoid` | `logistic(x)` |
| `feat(parser): softplus` | `softplus(x)` |
