package calc

import (
	"fmt"
	"math"
	"strconv"
	"strings"
)

// Format renders a float64 with the default 15 significant digits, hiding
// floating-point noise (e.g. 0.1 + 0.2 prints as 0.3).
// SetBase selects an output radix (0 = decimal, or 2/8/16) for integral
// results. Returns an error for unsupported bases.
func (c *Calculator) SetBase(base int) error {
	if base != 0 && base != 2 && base != 8 && base != 16 {
		return fmt.Errorf("unsupported base %d", base)
	}
	c.base = base
	return nil
}

// formatBase renders an integral value in the requested radix with a prefix.
func formatBase(v float64, base, prec int, sci bool) string {
	if v != math.Trunc(v) || math.IsNaN(v) || math.IsInf(v, 0) {
		// Non-integral values fall back to decimal formatting with active precision.
		return formatPrec(v, prec, sci)
	}
	var prefix string
	switch base {
	case 2:
		prefix = "0b"
	case 8:
		prefix = "0o"
	case 16:
		prefix = "0x"
	}
	iv := int64(v)
	if iv == 0 {
		return prefix + "0"
	}
	var neg bool
	if iv < 0 {
		neg = true
		iv = -iv
	}
	digits := "0123456789abcdef"
	var sb strings.Builder
	for iv > 0 {
		sb.WriteByte(digits[iv%int64(base)])
		iv /= int64(base)
	}
	out := sb.String()
	// reverse
	var rev strings.Builder
	for i := len(out) - 1; i >= 0; i-- {
		rev.WriteByte(out[i])
	}
	res := rev.String()
	if neg {
		return "-" + prefix + res
	}
	return prefix + res
}

func Format(v float64) string {
	return formatPrec(v, 15, false)
}

// format renders v according to the calculator's display settings.
func (c *Calculator) format(v float64) string {
	if c.base != 0 {
		return formatBase(v, c.base, c.prec, c.sci)
	}
	if c.eng {
		return formatEng(v, c.prec)
	}
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
