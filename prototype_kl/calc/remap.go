package calc

import (
	"fmt"
	"strings"
)

// expandRemap rewrites remap(x, lo, hi, nlo, nhi) into
// nlo + (x - lo) * (nhi - nlo) / (hi - lo), mapping x from [lo, hi] to
// [nlo, nhi].
func (c *Calculator) expandRemap(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 5 {
		return "", fmt.Errorf("remap expects 5 argument(s) (x, lo, hi, nlo, nhi), got %d", len(args))
	}
	x, lo, hi, nlo, nhi := strings.TrimSpace(args[0]), strings.TrimSpace(args[1]), strings.TrimSpace(args[2]), strings.TrimSpace(args[3]), strings.TrimSpace(args[4])
	expanded := make([]string, 5)
	for i, a := range []string{x, lo, hi, nlo, nhi} {
		e, err := c.expand(a)
		if err != nil {
			return "", err
		}
		expanded[i] = e
	}
	return fmt.Sprintf("%s + (%s - %s) * (%s - %s) / (%s - %s)",
		expanded[3], expanded[0], expanded[1], expanded[4], expanded[3], expanded[2], expanded[1]), nil
}
