package calc

import (
	"math"
	"strconv"
	"strings"
)

// Format renders a float64 result for display, hiding floating-point noise
// (e.g. 0.1 + 0.2 prints as 0.3) while preserving large/small exponents.
func Format(v float64) string {
	if math.IsNaN(v) {
		return "NaN"
	}
	if math.IsInf(v, 1) {
		return "+Inf"
	}
	if math.IsInf(v, -1) {
		return "-Inf"
	}

	s := strconv.FormatFloat(v, 'g', 15, 64)
	// Trim trailing zeros that arise from float noise, e.g. "0.30000000000000004"
	// -> "0.3". Only touch plain decimal forms, not exponent forms.
	if i := strings.IndexByte(s, '.'); i >= 0 && !strings.ContainsAny(s, "eE") {
		s = strings.TrimRight(s, "0")
		s = strings.TrimRight(s, ".")
	}
	return s
}
