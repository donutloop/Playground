package calc

import (
	"fmt"
	"strconv"
	"strings"
)

// parseBase parses "base hex|dec|oct|bin" or "base <2|8|16>". Returns the
// radix (0 = decimal) and whether the line is a base command.
func parseBase(line string) (int, bool, error) {
	t := strings.TrimSpace(line)
	if !strings.HasPrefix(strings.ToLower(t), "base") {
		return 0, false, nil
	}
	rest := strings.TrimSpace(t[4:])
	if rest == "" {
		return 0, true, nil
	}
	switch strings.ToLower(rest) {
	case "hex":
		return 16, true, nil
	case "oct", "octal":
		return 8, true, nil
	case "bin", "binary":
		return 2, true, nil
	case "dec", "decimal":
		return 0, true, nil
	}
	n, err := strconv.Atoi(rest)
	if err != nil || (n != 2 && n != 8 && n != 16 && n != 0) {
		return 0, true, fmt.Errorf("base must be hex|dec|oct|bin or 2|8|16|0")
	}
	return n, true, nil
}
