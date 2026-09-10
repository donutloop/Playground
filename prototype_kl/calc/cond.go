package calc

import (
	"fmt"
	"math"
	"strconv"
	"strings"
	"prototype_kl/parser"
)

// expandIf rewrites if(cond, then, else) into
// (cond) ? (then) : (else), expanding each argument. The ternary evaluates
// lazily, so only the selected branch is computed.
func (c *Calculator) expandIf(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 3 {
		return "", fmt.Errorf("if expects 3 arguments (cond, then, else)")
	}
	cond, then, els := strings.TrimSpace(args[0]), strings.TrimSpace(args[1]), strings.TrimSpace(args[2])
	condE, err := c.expand(cond)
	if err != nil {
		return "", err
	}
	// Lazy branch selection: evaluate cond numerically; expand only the taken branch.
	if v, err := parser.Evaluate(condE); err == nil {
		if v != 0 {
			return c.expand(then)
		}
		return c.expand(els)
	}
	// cond not evaluable at expansion time: fall back to a lazy ternary.
	return fmt.Sprintf("(%s ? %s : %s)", condE, then, els), nil
}

// expandAndOr rewrites and(a, b) into (a) && (b) and or(a, b) into (a) || (b),
// relying on the parser's logical operators.
func (c *Calculator) expandAndOr(inner, op string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 2 {
		return "", fmt.Errorf("%s expects 2 argument(s), got %d", op, len(args))
	}
	a, b := strings.TrimSpace(args[0]), strings.TrimSpace(args[1])
	if op == "and" {
		return fmt.Sprintf("(%s) && (%s)", a, b), nil
	}
	return fmt.Sprintf("(%s) || (%s)", a, b), nil
}

// expandCountIf builds 0 + (cond_1) + (cond_2) + ... where cond_i is cond with
// x replaced by each integer i from floor(a) to floor(b). Each (cond_i) is a
// comparison that evaluates to 1 (true) or 0 (false).
func expandCountIf(cond string, a, b float64) string {
	var buf strings.Builder
	buf.WriteString("0")
	lo, hi := math.Floor(a), math.Floor(b)
	if hi < lo {
		return buf.String()
	}
	for i := lo; i <= hi; i++ {
		c := strings.ReplaceAll(cond, "x", strconv.FormatFloat(i, 'f', -1, 64))
		fmt.Fprintf(&buf, " + (%s)", c)
	}
	return buf.String()
}

// expandSumIf builds 0 + (cond_1) * 1 + (cond_2) * 2 + ... summing the integer
// value i when cond_i (x replaced by i) is true.
func expandSumIf(cond string, a, b float64) string {
	var buf strings.Builder
	buf.WriteString("0")
	lo, hi := math.Floor(a), math.Floor(b)
	if hi < lo {
		return buf.String()
	}
	for i := lo; i <= hi; i++ {
		c := strings.ReplaceAll(cond, "x", strconv.FormatFloat(i, 'f', -1, 64))
		fmt.Fprintf(&buf, " + (%s) * %v", c, i)
	}
	return buf.String()
}
