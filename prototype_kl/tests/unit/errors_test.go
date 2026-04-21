package parser_test

import (
	"errors"
	"prototype_kl/parser"
	"testing"
)

func TestErrors(t *testing.T) {
	t.Run("ParseErrorUnwrap", func(t *testing.T) {
		err := &parser.ParseError{Err: parser.ErrMismatchedParen, Pos: 1, Message: "test"}
		if !errors.Is(err, parser.ErrMismatchedParen) {
			t.Errorf("expected ErrMismatchedParen to be wrapped")
		}
	})

	t.Run("EvalErrorUnwrap", func(t *testing.T) {
		err := &parser.EvalError{Err: parser.ErrDivisionByZero, Message: "test"}
		if !errors.Is(err, parser.ErrDivisionByZero) {
			t.Errorf("expected ErrDivisionByZero to be wrapped")
		}
	})

	t.Run("UnknownFunctionError", func(t *testing.T) {
		// ErrUnknownFunction should be returned by lexer for unknown identifier
		lexer := parser.NewLexer("log(10)")
		_, err := lexer.Tokenize()
		if err == nil {
			t.Errorf("expected error for unknown function")
			return
		}
		var unknownFuncError *parser.ParseError
		if errors.As(err, &unknownFuncError) {
			if !errors.Is(unknownFuncError.Err, parser.ErrUnknownFunction) {
				t.Errorf("expected ErrUnknownFunction, got %v", unknownFuncError.Err)
			}
		} else {
			t.Errorf("error is not a ParseError: %v", err)
		}
	})

	t.Run("SqrtNegativeError", func(t *testing.T) {
		// ErrSqrtNegative should be returned by evaluator for sqrt of negative
		_, err := parser.Evaluate("sqrt(-4)")
		if err == nil {
			t.Errorf("expected error for sqrt of negative number")
			return
		}
		var evalError *parser.EvalError
		if errors.As(err, &evalError) {
			if !errors.Is(evalError.Err, parser.ErrSqrtNegative) {
				t.Errorf("expected ErrSqrtNegative, got %v", evalError.Err)
			}
		} else {
			t.Errorf("error is not an EvalError: %v", err)
		}
	})
}