package calc

import (
	"fmt"
	"io"

	"prototype_kl/parser"
)

// Verify runs a battery of known-good expressions and reports pass/fail.
func Verify(w io.Writer) (passed, failed int) {
	cases := []struct{ expr, want string }{
		{"2 + 3", "5"},
		{"2 * 3 ^ 2", "18"},
		{"pow(2, 10)", "1024"},
		{"5!", "120"},
		{"200% + 10", "12"},
		{"sin(pi / 2)", "1"},
		{"0.1 + 0.2", "0.3"},
		{"sqrt(16)", "4"},
		{"min(3, 1, 2)", "1"},
	}
	for _, c := range cases {
		v, err := parser.Evaluate(c.expr)
		if err != nil {
			fmt.Fprintf(w, "FAIL %s: %v\n", c.expr, err)
			failed++
			continue
		}
		got := Format(v)
		if got == c.want {
			fmt.Fprintf(w, "ok   %s = %s\n", c.expr, got)
			passed++
		} else {
			fmt.Fprintf(w, "FAIL %s = %s (want %s)\n", c.expr, got, c.want)
			failed++
		}
	}
	fmt.Fprintf(w, "%d passed, %d failed\n", passed, failed)
	return
}
