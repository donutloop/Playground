package parser

import (
	"errors"
	"fmt"
)

// Error types for the parsing and evaluation pipeline.
var (
	ErrInvalidCharacter = errors.New("invalid character in expression")
	ErrUnexpectedToken  = errors.New("unexpected token")
	ErrMismatchedParen  = errors.New("mismatched parentheses")
	ErrDivisionByZero   = errors.New("division by zero")
	ErrEmptyExpression  = errors.New("expression is empty")
	ErrUnknownFunction  = errors.New("unknown function")
	ErrSqrtNegative     = errors.New("sqrt of negative number")
)

// ParseError provides context about where the error occurred.
type ParseError struct {
	Err     error
	Pos     int
	Message string
}

func (e *ParseError) Error() string {
	return fmt.Sprintf("parse error at position %d: %s (%v)", e.Pos, e.Message, e.Err)
}

func (e *ParseError) Unwrap() error {
	return e.Err
}

// EvalError provides context about evaluation failures.
type EvalError struct {
	Err     error
	Message string
}

func (e *EvalError) Error() string {
	return fmt.Sprintf("eval error: %s (%v)", e.Message, e.Err)
}

func (e *EvalError) Unwrap() error {
	return e.Err
}
