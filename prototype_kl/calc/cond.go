package calc

import (
	"fmt"
	"strings"
)

// expandIf rewrites if(cond, then, else) into
// (cond) ? (then) : (else), expanding each argument. The ternary evaluates
// lazily, so only the selected branch is computed.
func (c *Calculator) expandIf(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 3 {
		return "", fmt.Errorf("if expects 3 argument(s) (cond, then, else), got %d", len(args))
	}
	cond, then, els := strings.TrimSpace(args[0]), strings.TrimSpace(args[1]), strings.TrimSpace(args[2])
	condE, err := c.expand(cond)
	if err != nil {
		return "", err
	}
	thenE, err := c.expand(then)
	if err != nil {
		return "", err
	}
	elseE, err := c.expand(els)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s ? (%s) : (%s)", condE, thenE, elseE), nil
}
