package integration_test

import (
	"errors"
	"prototype_kl/parser"
	"testing"
)

func TestEdgeCases(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    float64
		wantErr error
	}{
		{"EmptyString", "", 0, parser.ErrEmptyExpression},
		{"OnlyWhitespace", "   ", 0, parser.ErrEmptyExpression},
		{"DivisionByZero", "10 / 0", 0, parser.ErrDivisionByZero},
		{"SingleNumber", "42", 42, nil},
		{"LargeNumber", "1000000 * 1000000", 1e12, nil},
		{"DeeplyNested", "((((1))))", 1, nil},
		{"MismatchedParen", "(1 + 2", 0, parser.ErrMismatchedParen},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := parser.Evaluate(tt.input)
			if tt.wantErr != nil {
				if err == nil {
					t.Errorf("expected error %v, got nil", tt.wantErr)
				} else if !errors.Is(err, tt.wantErr) {
					t.Errorf("expected error %v, got %v", tt.wantErr, err)
				}
			} else {
				if err != nil {
					t.Errorf("unexpected error: %v", err)
				}
				if got != tt.want {
					t.Errorf("Evaluate(%q) = %g, want %g", tt.input, got, tt.want)
				}
			}
		})
	}
}
