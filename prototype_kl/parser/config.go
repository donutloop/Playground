package parser

// Supported operators as constants to ensure consistency across lexer, parser, and evaluator.
const (
	OpAdd    = '+'
	OpSub    = '-'
	OpMul    = '*'
	OpDiv    = '/'
	OpLParen = '('
	OpRParen = ')'
)

// Supported functions for built-in math operations.
var SupportedFunctions = []string{"sqrt", "abs", "floor", "ceil"}

// Precision settings could be expanded here if rounding were required.
const DefaultPrecision = 64
