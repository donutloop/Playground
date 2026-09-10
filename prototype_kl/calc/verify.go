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
		{"log2(8)", "3"},
		{"atan2(1, 1)", "0.785398163397448"},
		{"gcd(12, 18)", "6"},
		{"lcm(4, 6)", "12"},
		{"log10(100)", "2"},
		{"log1p(9)", "2.30258509299405"},
		{"asinh(0)", "0"},
		{"acosh(1)", "0"},
		{"atanh(0)", "0"},
		{"expm1(0)", "0"},
		{"exp2(3)", "8"},
		{"gamma(5)", "24"},
		{"mod(10, 3)", "1"},
		{"sign(-7)", "-1"},
		{"clamp(5, 0, 3)", "3"},
		{"lerp(0, 10, 0.5)", "5"},
		{"fma(2, 3, 4)", "10"},
		{"copysign(5, -2)", "-5"},
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
