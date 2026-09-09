package calc

import (
	"math"
	"strconv"
	"strings"
)

// formatEng renders v in engineering notation: exponent is always a multiple
// of 3 (e.g. 12345 -> 12.345e3, 0.0012 -> 1.2e-3).
func formatEng(v float64, prec int) string {
	if v == 0 {
		return "0"
	}
	if math.IsNaN(v) || math.IsInf(v, 0) {
		return Format(v)
	}
	abs := math.Abs(v)
	exp := int(math.Floor(math.Log10(abs)))
	// round exp down to a multiple of 3
	exp3 := exp - (exp % 3)
	if exp3 < 0 {
		exp3 -= 3
	}
	mant := v / math.Pow10(exp3)
	s := strconv.FormatFloat(mant, 'f', prec-1, 64)
	if i := strings.IndexByte(s, '.'); i >= 0 {
		s = strings.TrimRight(s, "0")
		s = strings.TrimRight(s, ".")
	}
	return s + "e" + strconv.Itoa(exp3)
}
