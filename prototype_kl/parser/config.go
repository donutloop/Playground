package parser

import "math"

// Supported operators as constants to ensure consistency across lexer, parser, and evaluator.
const (
	OpAdd       = '+'
	OpSub       = '-'
	OpMul       = '*'
	OpDiv       = '/'
	OpLParen    = '('
	OpRParen    = ')'
	OpComma     = ','
	OpFactorial = '!'
	OpPercent   = '%'
	OpPower     = '^'
)

// Supported functions for built-in math operations.
//
// Arity 1: unary functions taking exactly one argument.
// Arity 2: functions taking exactly two arguments.
// Arity -1 (variadic): functions taking one or more arguments.
var SupportedFunctions = map[string]int{
	"sqrt":      1,
	"rsqrt":     1,
	"cbrt":      1,
	"abs":       1,
	"floor":     1,
	"ceil":      1,
	"round":     1,
	"trunc":     1,
	"sin":       1,
	"sinc":      1,
	"cos":       1,
	"tan":       1,
	"sec":       1,
	"csc":       1,
	"cot":       1,
	"asec":      1,
	"acsc":      1,
	"acot":      1,
	"asin":      1,
	"acos":      1,
	"atan":      1,
	"atan2":     2,
	"gcd":       2,
	"lcm":       2,
	"log10":     1,
	"log1p":     1,
	"asinh":     1,
	"acosh":     1,
	"atanh":     1,
	"expm1":     1,
	"exp2":      1,
	"exp10":     1,
	"gamma":     1,
	"mod":       2,
	"sign":      1,
	"clamp":     3,
	"lerp":      3,
	"fma":       3,
	"copysign":  2,
	"erf":       1,
	"erfc":      1,
	"beta":      2,
	"logb":      1,
	"nextafter": 2,
	"ldexp":     2,
	"dim":       2,
	"signbit":   1,
	"jn":        2,
	"yn":        2,
	"lgamma":    1,
	"sinh":      1,
	"cosh":      1,
	"tanh":      1,
	"logistic":  1,
	"sech":      1,
	"csch":      1,
	"coth":      1,
	"asech":     1,
	"acsch":     1,
	"acoth":     1,
	"ln":        1,
	"log":       1, // base-10 log
	"log2":      1,
	"exp":       1,
	"fact":      1,  // factorial
	"pow":       2,  // pow(x, y)
	"hypot":     2,  // hypot(x, y)
	"min":       -1, // variadic
	"max":       -1, // variadic
}

// SupportedConstants maps constant names to their numeric values.
var SupportedConstants = map[string]float64{
	"pi": math.Pi,
	"e":  math.E,
}

// Precision settings could be expanded here if rounding were required.
const DefaultPrecision = 64
