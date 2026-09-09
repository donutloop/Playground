package calc

import (
	"strings"
	"testing"

	"prototype_kl/parser"
)

// BenchmarkSubstituteManyVars shows variable substitution stays fast even with
// hundreds of defined variables (single-pass lexer, no regex).
func BenchmarkSubstituteManyVars(b *testing.B) {
	c := New(strings.NewReader(""), &strings.Builder{})
	for i := 0; i < 500; i++ {
		c.vars["v"+strings.Repeat("x", i%20+1)] = float64(i)
	}
	expr := "vx + 1 * 2 + vxx / 3"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		c.substitute(expr)
	}
}

// BenchmarkEvaluate measures one full parser evaluation round-trip.
func BenchmarkEvaluate(b *testing.B) {
	expr := "pow(2, 10) + sin(pi / 2) * 3 - 5! + 200%"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, _ = parser.Evaluate(expr)
	}
}
