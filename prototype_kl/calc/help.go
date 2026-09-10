package calc

import (
	"fmt"
	"strings"
)

// helpTopics maps function/constant/command names to one-line docs.
var helpTopics = map[string]string{
	"sqrt":      "sqrt(x): square root of x (x >= 0)",
	"rsqrt":     "rsqrt(x): reciprocal square root 1/sqrt(x) (x > 0)",
	"cbrt":      "cbrt(x): cube root of x",
	"abs":       "abs(x): absolute value of x",
	"floor":     "floor(x): largest integer <= x",
	"ceil":      "ceil(x): smallest integer >= x",
	"round":     "round(x): round to nearest integer",
	"trunc":     "trunc(x): truncate toward zero",
	"sin":       "sin(x): sine of x (radians)",
	"sinc":      "sinc(x): cardinal sine sin(x)/x, sinc(0)=1",
	"cos":       "cos(x): cosine of x (radians)",
	"tan":       "tan(x): tangent of x (radians)",
	"sec":       "sec(x): secant 1/cos(x) (radians)",
	"csc":       "csc(x): cosecant 1/sin(x) (radians)",
	"cot":       "cot(x): cotangent 1/tan(x) (radians)",
	"asec":      "asec(x): arcsecant acos(1/x) (|x| >= 1)",
	"acsc":      "acsc(x): arccosecant asin(1/x) (|x| >= 1)",
	"acot":      "acot(x): arccotangent atan(1/x) (x != 0)",
	"asin":      "asin(x): arc sine of x",
	"acos":      "acos(x): arc cosine of x",
	"atan":      "atan(x): arc tangent of x",
	"ln":        "ln(x): natural log of x (x > 0)",
	"log2":      "log2(x): base-2 log of x (x > 0)",
	"log10":     "log10(x): base-10 log of x (x > 0)",
	"log1p":     "log1p(x): natural log of 1+x (x > -1)",
	"gcd":       "gcd(a, b): greatest common divisor",
	"lcm":       "lcm(a, b): least common multiple",
	"asinh":     "asinh(x): inverse hyperbolic sine",
	"acosh":     "acosh(x): inverse hyperbolic cosine (x >= 1)",
	"atanh":     "atanh(x): inverse hyperbolic tangent (-1 < x < 1)",
	"expm1":     "expm1(x): e^x - 1 (accurate for small x)",
	"exp2":      "exp2(x): 2 raised to x",
	"exp10":     "exp10(x): 10 raised to x",
	"gamma":     "gamma(x): gamma function (not defined at non-positive integers)",
	"mod":       "mod(a, b): remainder of a divided by b",
	"sign":      "sign(x): -1, 0, or 1",
	"clamp":     "clamp(x, lo, hi): bound x between lo and hi",
	"lerp":      "lerp(a, b, t): linear interpolation a + (b-a)*t",
	"fma":       "fma(a, b, c): fused multiply-add a*b+c",
	"copysign":  "copysign(x, y): x with the sign of y",
	"erf":       "erf(x): error function",
	"erfc":      "erfc(x): complementary error function 1-erf(x)",
	"beta":      "beta(a, b): Euler beta function",
	"logb":      "logb(x): binary exponent of x",
	"nextafter": "nextafter(x, y): next representable float toward y",
	"ldexp":     "ldexp(x, n): x * 2^n",
	"dim":       "dim(x, y): max(x-y, 0)",
	"signbit":   "signbit(x): 1 if x has negative sign bit",
	"jn":        "jn(n, x): Bessel J of order n",
	"yn":        "yn(n, x): Bessel Y of order n",
	"lgamma":    "lgamma(x): log-gamma ln(|Gamma(x)|)",
	"log":       "log(x): base-10 log of x (x > 0)",
	"exp":       "exp(x): e raised to x",
	"pow":       "pow(x, y): x raised to y",
	"hypot":     "hypot(x, y): sqrt(x^2 + y^2)",
	"min":       "min(a, b, ...): smallest of the values",
	"max":       "max(a, b, ...): largest of the values",
	"fact":      "fact(n): n! for integer n >= 0",
	"atan2":     "atan2(y, x): angle whose tangent is y/x",
	"sinh":      "sinh(x): hyperbolic sine",
	"cosh":      "cosh(x): hyperbolic cosine",
	"tanh":      "tanh(x): hyperbolic tangent",
	"sech":      "sech(x): hyperbolic secant 1/cosh(x)",
	"csch":      "csch(x): hyperbolic cosecant 1/sinh(x)",
	"coth":      "coth(x): hyperbolic cotangent 1/tanh(x)",
	"pi":        "pi: the constant pi",
	"e":         "e: the constant e",
	"commands":  "commands: help, vars, history, status, last, reset, clear, undo, redo, deg, rad, sci, fix, eng, std, prec, mem, ms, m+, m-, mr, mc, quit",
	"operators": "operators: + - * / ^ ( ) postfix ! factorial and % percent",
	"deg":       "deg: switch trig functions to degrees",
	"rad":       "rad: switch trig functions to radians",
	"sci":       "sci: scientific notation on",
	"fix":       "fix: scientific notation off",
	"prec":      "prec <n>: set significant digits (1..17)",
	"undo":      "undo: revert the last statement",
	"vars":      "vars: list defined variables",
	"clear":     "clear: reset variables and ans",
	"ans":       "ans: the last result; usable in any later expression",
	"mem":       "mem: the memory register; usable in expressions",
	"@":         "@N: re-evaluate history entry N (1-based)",
	"last":      "last: show the most recent expression and result",
}

// help looks up a topic and prints its documentation.
func (c *Calculator) help(topic string) error {
	topic = strings.TrimSpace(topic)
	if topic == "" {
		c.printHelp()
		return nil
	}
	key := strings.ToLower(topic)
	if strings.HasPrefix(key, "@") {
		key = "@"
	}
	doc, ok := helpTopics[key]
	if !ok {
		return fmt.Errorf("no help for %q; try 'help'", topic)
	}
	fmt.Fprintln(c.out, doc)
	return nil
}
