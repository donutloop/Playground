package parser

import "testing"

func BenchmarkEvaluate(b *testing.B) {
	expr := "pow(2, 10) + sin(pi / 2) * 3 - 5! + 200%"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_, _ = Evaluate(expr)
	}
}
