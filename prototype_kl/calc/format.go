package calc

import (
	"math"
	"strconv"
	"strings"
)

// Format renders a float64 with the default 15 significant digits, hiding
// floating-point noise (e.g. 0.1 + 0.2 prints as 0.3).
func Format(v float64) string {
	return formatPrec(v, 15, false)
}

// format renders v according to the calculator's display settings.
func (c *Calculator) format(v float64) string {
	return formatPrec(v, c.prec, c.sci)
}

// formatPrec renders v with the given significant-digit precision, optionally
// forcing scientific notation.
func formatPrec(v float64, prec int, sci bool) string {
	if math.IsNaN(v) {
		return "NaN"
	}
	if math.IsInf(v, 1) {
		return "+Inf"
	}
	if math.IsInf(v, -1) {
		return "-Inf"
	}

	if sci {
		s := strconv.FormatFloat(v, 'e', prec-1, 64)
		if i := strings.IndexByte(s, 'e'); i >= 0 {
			mantissa := strings.TrimRight(s[:i], "0")
			mantissa = strings.TrimRight(mantissa, ".")
			s = mantissa + s[i:]
		}
		return s
	}

	s := strconv.FormatFloat(v, 'g', prec, 64)
	// Trim trailing zeros that arise from float noise, e.g. "0.30000000000000004"
	// -> "0.3". Only touch plain decimal forms, not exponent forms.
	if i := strings.IndexByte(s, '.'); i >= 0 && !strings.ContainsAny(s, "eE") {
		s = strings.TrimRight(s, "0")
		s = strings.TrimRight(s, ".")
	}
	return s
}

// FormatPrec renders v with the given significant digits, optionally in
// scientific notation. It backs the one-shot CLI display flags.
func FormatPrec(v float64, prec int, sci bool) string {
	return formatPrec(v, prec, sci)
}
