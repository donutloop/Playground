package calc

import (
	"fmt"
	"strings"
)

// expandDiff rewrites diff(a, b) into abs(a - b), expanding each argument.
func (c *Calculator) expandDiff(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 2 {
		return "", fmt.Errorf("diff expects 2 argument(s) (a, b), got %d", len(args))
	}
	a, b := strings.TrimSpace(args[0]), strings.TrimSpace(args[1])
	aE, err := c.expand(a)
	if err != nil {
		return "", err
	}
	bE, err := c.expand(b)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("abs(%s - %s)", aE, bE), nil
}

// expandPct rewrites pct(x, total) into (x / total) * 100.
func (c *Calculator) expandPct(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 2 {
		return "", fmt.Errorf("pct expects 2 argument(s) (x, total), got %d", len(args))
	}
	x, total := strings.TrimSpace(args[0]), strings.TrimSpace(args[1])
	xE, err := c.expand(x)
	if err != nil {
		return "", err
	}
	totalE, err := c.expand(total)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("(%s / %s) * 100", xE, totalE), nil
}
