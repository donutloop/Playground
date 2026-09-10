package calc

import (
	"fmt"
	"strings"
)

// expandLerp rewrites lerp(a, b, t) into a + (b - a) * t, expanding each
// argument. Linear interpolation between a and b at fraction t.
func (c *Calculator) expandLerp(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 3 {
		return "", fmt.Errorf("lerp expects 3 argument(s) (a, b, t), got %d", len(args))
	}
	a, b, t := strings.TrimSpace(args[0]), strings.TrimSpace(args[1]), strings.TrimSpace(args[2])
	aE, err := c.expand(a)
	if err != nil {
		return "", err
	}
	bE, err := c.expand(b)
	if err != nil {
		return "", err
	}
	tE, err := c.expand(t)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s + (%s - %s) * %s", aE, bE, aE, tE), nil
}
