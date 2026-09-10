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
