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
