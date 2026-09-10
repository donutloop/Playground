package calc

import (
	"fmt"
	"strings"
)

// expandSmoothstep rewrites smoothstep(x, e0, e1) into the standard easing
// formula: t = clamp((x-e0)/(e1-e0), 0, 1); result = t*t*(3-2*t).
// Uses min/max (parser built-ins) for the clamp.
func (c *Calculator) expandSmoothstep(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 3 {
		return "", fmt.Errorf("smoothstep expects 3 argument(s) (x, e0, e1), got %d", len(args))
	}
	x, e0, e1 := strings.TrimSpace(args[0]), strings.TrimSpace(args[1]), strings.TrimSpace(args[2])
	xE, err := c.expand(x)
	if err != nil {
		return "", err
	}
	e0E, err := c.expand(e0)
	if err != nil {
		return "", err
	}
	e1E, err := c.expand(e1)
	if err != nil {
		return "", err
	}
	t := fmt.Sprintf("min(max((%s - %s) / (%s - %s), 0), 1)", xE, e0E, e1E, e0E)
	return fmt.Sprintf("%s * %s * (3 - 2 * %s)", t, t, t), nil
}
