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
}
