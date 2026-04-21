package parser_test

import (
	"prototype_kl/parser"
	"testing"
)

func TestEvaluator(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    float64
		wantErr bool
	}{
		{"Add", "1 + 2", 3, false},
		{"Sub", "10 - 3", 7, false},
		{"Mul", "4 * 2.5", 10, false},
		{"Div", "10 / 4", 2.5, false},
		{"Unary", "-3 + 5", 2, false},
		{"Complex", "(2 + 3) * (4 - 1)", 15, false},
		{"DivByZero", "10 / 0", 0, true},
		{"Sqrt", "sqrt(9)", 3, false},
		{"Abs", "abs(-4)", 4, false},
		{"Floor", "floor(2.9)", 2, false},
		{"Ceil", "ceil(2.1)", 3, false},
		{"SqrtNegative", "sqrt(-4)", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, err := parser.Evaluate(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("Evaluate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && res != tt.want {
				t.Errorf("Evaluate() = %g, want %g", res, tt.want)
			}
		})
	}
}
