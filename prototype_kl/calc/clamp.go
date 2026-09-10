package calc

import (
	"fmt"
	"strings"
)

// expandClamp rewrites clamp(x, lo, hi) into min(max(x, lo), hi), expanding
// each argument. Uses the existing min/max built-ins.
func (c *Calculator) expandClamp(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 3 {
		return "", fmt.Errorf("clamp expects 3 argument(s) (x, lo, hi), got %d", len(args))
	}
	x, lo, hi := strings.TrimSpace(args[0]), strings.TrimSpace(args[1]), strings.TrimSpace(args[2])
	xE, err := c.expand(x)
	if err != nil {
		return "", err
	}
	loE, err := c.expand(lo)
	if err != nil {
		return "", err
	}
	hiE, err := c.expand(hi)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("min(max(%s, %s), %s)", xE, loE, hiE), nil
}
