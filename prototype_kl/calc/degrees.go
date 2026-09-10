package calc

import (
	"strings"
)

// angleTrig maps trig functions to whether they are "direct" (take an angle,
// result dimensionless) or "inverse" (take a dimensionless value, result in
// an angle).
var angleTrig = map[string]bool{
	"sin": true, "cos": true, "tan": true, "sec": true, "csc": true, "cot": true,
	"asin": false, "acos": false, "atan": false, "asec": false, "acsc": false, "acot": false,
}

// applyTrig rewrites trig calls so they operate in the angular unit described
// by factor (the number of units in a full circle): 180 for degrees, 200 for
// gradians.
//
//	sin(x)    -> sin(x * pi / factor)    direct functions take the unit value
//	asin(x)   -> asin(x) * factor / pi   inverse functions return unit value
func applyTrig(expr, factor string) string {
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
			if direct, ok := angleTrig[name]; ok && j < len(expr) && expr[j] == '(' {
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
				arg := strings.TrimSpace(applyTrig(expr[j+1:k], factor))
				if direct {
					b.WriteString(name + "(" + arg + " * pi / " + factor + ")")
				} else {
					b.WriteString(name + "(" + arg + ") * " + factor + " / pi")
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

// applyDeg rewrites trig calls to operate in degrees (180 in a full circle).
func applyDeg(expr string) string {
	return applyTrig(expr, "180")
}

// applyGrad rewrites trig calls to operate in gradians (200 in a full circle).
func applyGrad(expr string) string {
	return applyTrig(expr, "200")
}

// ApplyDeg rewrites trig calls to operate in degrees. It backs the --deg CLI
// flag for one-shot degree mode.
func ApplyDeg(expr string) string {
	return applyDeg(expr)
}

// ApplyGrad rewrites trig calls to operate in gradians. It backs the --grad CLI
// flag for one-shot gradian mode.
func ApplyGrad(expr string) string {
	return applyGrad(expr)
}
