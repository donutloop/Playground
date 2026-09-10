package calc

import (
	"fmt"
	"math"
	"strconv"
	"strings"

	"prototype_kl/parser"
)

// expandRangeLoop rewrites a generalized range loop into a flat arithmetic
// expression by substituting the loop variable with each integer in the range.
//
//		sum(i, lo, hi, expr)         -> 0 + (expr@lo) + (expr@lo+1) + ...
//		sum(i, lo, hi, step, expr)   -> same, stepping by step
//		prod(i, lo, hi, expr)        -> 1 * (expr@lo) * (expr@lo+1) * ...
//		count(i, lo, hi, cond)       -> 0 + (cond@lo) + (cond@lo+1) + ...
//
// count accumulates the condition values directly, since comparisons already
// yield 1 (true) or 0 (false). This is a macro-level "for loop" over integers
// with a running variable, generalizing the plain numeric sum/prod/count forms.
func (c *Calculator) expandRangeLoop(inner, kind string) (string, error) {
	args := splitArgs(inner)
	var varName, lo, hi, step, body string
	switch len(args) {
	case 4:
		varName = strings.TrimSpace(args[0])
		lo = strings.TrimSpace(args[1])
		hi = strings.TrimSpace(args[2])
		body = strings.TrimSpace(args[3])
		step = "1"
	case 5:
		varName = strings.TrimSpace(args[0])
		lo = strings.TrimSpace(args[1])
		hi = strings.TrimSpace(args[2])
		step = strings.TrimSpace(args[3])
		body = strings.TrimSpace(args[4])
	default:
		return "", fmt.Errorf("%s with a loop variable expects 4 or 5 arguments (var, lo, hi[, step], body), got %d", kind, len(args))
	}
	if !isIdent(varName) {
		return "", fmt.Errorf("%s loop variable must be an identifier, got %q", kind, varName)
	}

	loE, err := c.expand(lo)
	if err != nil {
		return "", err
	}
	hiE, err := c.expand(hi)
	if err != nil {
		return "", err
	}
	stepE, err := c.expand(step)
	if err != nil {
		return "", err
	}
	loNum, err := parser.Evaluate(loE)
	if err != nil {
		return "", fmt.Errorf("%s bounds must be numeric: %v", kind, err)
	}
	hiNum, err := parser.Evaluate(hiE)
	if err != nil {
		return "", fmt.Errorf("%s bounds must be numeric: %v", kind, err)
	}
	stepNum, err := parser.Evaluate(stepE)
	if err != nil {
		return "", fmt.Errorf("%s step must be numeric: %v", kind, err)
	}

	loI := math.Floor(loNum)
	hiI := math.Floor(hiNum)
	stepI := math.Floor(stepNum)
	if stepI < 1 {
		stepI = 1
	}

	// Identity for the accumulator: 0 for sum/count, 1 for product.
	var buf strings.Builder
	if kind == "prod" {
		buf.WriteString("1")
	} else {
		buf.WriteString("0")
	}
	if hiI < loI {
		return buf.String(), nil
	}
	for i := loI; i <= hiI; i += stepI {
		lit := strconv.FormatFloat(i, 'f', -1, 64)
		e := replaceIdent(body, varName, lit)
		eE, err := c.expand(e)
		if err != nil {
			return "", err
		}
		if kind == "prod" {
			fmt.Fprintf(&buf, " * (%s)", eE)
		} else {
			fmt.Fprintf(&buf, " + (%s)", eE)
		}
	}
	return buf.String(), nil
}
