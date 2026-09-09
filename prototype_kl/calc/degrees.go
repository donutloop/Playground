package calc

import (
	"strings"
)

// degreeTrig maps trig function names to whether they are "direct" (take an
// angle in radians, result dimensionless) or "inverse" (result in radians).
var degreeTrig = map[string]bool{
	"sin": true, "cos": true, "tan": true,
	"asin": false, "acos": false, "atan": false,
}

// applyDeg rewrites trig calls so they operate in degrees instead of radians,
// using a real paren-matching scan (no regex):
//
//	sin(x)  -> sin(x * pi / 180)   direct functions take degrees
//	asin(x) -> asin(x) * 180 / pi  inverse functions return degrees
//
// Nested trig calls inside arguments are transformed recursively.
func applyDeg(expr string) string {
	var b strings.Builder
	b.Grow(len(expr) + 16)

	i := 0
	for i < len(expr) {
		if isIdentStart(expr[i]) {
			j := i + 1
			for j < len(expr) && isIdentChar(expr[j]) {
				j++
			}
			name := expr[i:j]
			if direct, ok := degreeTrig[name]; ok && j < len(expr) && expr[j] == '(' {
				// find matching ')'
				depth := 1
				k := j + 1
				for k < len(expr) {
					if expr[k] == '(' {
						depth++
					} else if expr[k] == ')' {
						depth--
						if depth == 0 {
							break
						}
					}
					k++
				}
				arg := strings.TrimSpace(applyDeg(expr[j+1 : k]))
				if direct {
					b.WriteString(name + "(" + arg + " * pi / 180)")
				} else {
					b.WriteString(name + "(" + arg + ") * 180 / pi")
				}
				i = k + 1
				continue
			}
			b.WriteString(name)
			i = j
			continue
		}
		b.WriteByte(expr[i])
		i++
	}
	return b.String()
}

// ApplyDeg rewrites trig calls to operate in degrees. It backs the --deg CLI
// flag for one-shot evaluation.
func ApplyDeg(expr string) string {
	return applyDeg(expr)
}
