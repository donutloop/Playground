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
	"sqrt":     1,
	"cbrt":     1,
	"abs":      1,
	"floor":    1,
	"ceil":     1,
	"round":    1,
	"trunc":    1,
	"sin":      1,
	"cos":      1,
	"tan":      1,
	"asin":     1,
	"acos":     1,
	"atan":     1,
	"atan2":    2,
	"gcd":      2,
	"lcm":      2,
	"log10":    1,
	"log1p":    1,
	"asinh":    1,
	"acosh":    1,
	"atanh":    1,
	"expm1":    1,
	"exp2":     1,
	"gamma":    1,
	"mod":      2,
	"sign":     1,
	"clamp":    3,
	"lerp":     3,
	"fma":      3,
	"copysign": 2,
	"sinh":     1,
	"cosh":     1,
	"tanh":     1,
	"ln":       1,
	"log":      1, // base-10 log
	"log2":     1,
	"exp":      1,
	"fact":     1,  // factorial
	"pow":      2,  // pow(x, y)
	"hypot":    2,  // hypot(x, y)
	"min":      -1, // variadic
	"max":      -1, // variadic
}

// SupportedConstants maps constant names to their numeric values.
var SupportedConstants = map[string]float64{
	"pi": math.Pi,
	"e":  math.E,
}

// Precision settings could be expanded here if rounding were required.
const DefaultPrecision = 64
