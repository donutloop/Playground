package calc

import (
	"fmt"
	"strings"
)

// expandStep rewrites step(x, edge) into x >= edge ? 1 : 0, expanding x and
// edge. Heaviside step function: 1 when x >= edge, else 0.
func (c *Calculator) expandStep(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 2 {
		return "", fmt.Errorf("step expects 2 argument(s) (x, edge), got %d", len(args))
	}
	x, edge := strings.TrimSpace(args[0]), strings.TrimSpace(args[1])
	xE, err := c.expand(x)
	if err != nil {
		return "", err
	}
	edgeE, err := c.expand(edge)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s >= %s ? 1 : 0", xE, edgeE), nil
}
