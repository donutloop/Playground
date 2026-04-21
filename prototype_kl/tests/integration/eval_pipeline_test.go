package integration_test

import (
	"prototype_kl/parser"
	"testing"
)

func TestEvalPipeline(t *testing.T) {
	tests := []struct {
		input string
		want  float64
	}{
		{"1 + 2", 3},
		{"10 - 3 * 2", 4},
		{"(10 - 3) * 2", 14},
		{"-5 + 3", -2},
		{"3.5 * 2", 7},
		{"100 / 4 / 5", 5},
		{"((2 + 3) * (4 - 1)) / 5", 3},
		{"sqrt(9)", 3},
		{"abs(-7)", 7},
		{"floor(3.9)", 3},
		{"ceil(3.1)", 4},
		{"sqrt(9) + abs(-4) * 2", 11},
		{"floor(sqrt(16))", 4},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			got, err := parser.Evaluate(tt.input)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tt.want {
				t.Errorf("Evaluate(%q) = %g, want %g", tt.input, got, tt.want)
			}
		})
	}
}
