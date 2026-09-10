package calc

import (
	"fmt"
	"strings"
)

// unitInfo describes a unit's conversion factor to a base unit and its
// physical dimension. Only units sharing a dimension can be converted.
type unitInfo struct {
	factor float64
	dim    string
}

// unitFactors maps unit names to conversion info. Factors are relative to a
// base unit per dimension: meter (length), kilogram (mass), second (time).
var unitFactors = map[string]unitInfo{
	// length (base: meter)
	"m":   {1, "length"}, "meter": {1, "length"}, "meters": {1, "length"},
	"km":  {1000, "length"}, "kilometer": {1000, "length"}, "kilometers": {1000, "length"},
	"cm":  {0.01, "length"}, "centimeter": {0.01, "length"}, "centimeters": {0.01, "length"},
	"mm":  {0.001, "length"}, "millimeter": {0.001, "length"}, "millimeters": {0.001, "length"},
	"mi":  {1609.344, "length"}, "mile": {1609.344, "length"}, "miles": {1609.344, "length"},
	"ft":  {0.3048, "length"}, "foot": {0.3048, "length"}, "feet": {0.3048, "length"},
	"in":  {0.0254, "length"}, "inch": {0.0254, "length"}, "inches": {0.0254, "length"},
	"yd":  {0.9144, "length"}, "yard": {0.9144, "length"}, "yards": {0.9144, "length"},
	"nm":  {1e-9, "length"}, "nanometer": {1e-9, "length"}, "nanometers": {1e-9, "length"},
	// mass (base: kilogram)
	"kg": {1, "mass"}, "kilogram": {1, "mass"}, "kilograms": {1, "mass"},
	"g":  {0.001, "mass"}, "gram": {0.001, "mass"}, "grams": {0.001, "mass"},
	"mg":  {1e-6, "mass"}, "milligram": {1e-6, "mass"}, "milligrams": {1e-6, "mass"},
	"lb":  {0.45359237, "mass"}, "pound": {0.45359237, "mass"}, "pounds": {0.45359237, "mass"},
	"oz":  {0.028349523125, "mass"}, "ounce": {0.028349523125, "mass"}, "ounces": {0.028349523125, "mass"},
	// time (base: second)
	"s":   {1, "time"}, "second": {1, "time"}, "seconds": {1, "time"},
	"min": {60, "time"}, "minute": {60, "time"}, "minutes": {60, "time"},
	"h":   {3600, "time"}, "hour": {3600, "time"}, "hours": {3600, "time"}, "hr": {3600, "time"},
	"day": {86400, "time"}, "days": {86400, "time"},
}

// expandConvert rewrites convert(value, from, to) into
// ((value) * fromFactor) / toFactor, expanding value first.
func (c *Calculator) expandConvert(inner string) (string, error) {
	args := splitArgs(inner)
	if len(args) != 3 {
		return "", fmt.Errorf("convert expects 3 argument(s) (value, from, to), got %d", len(args))
	}
	value, fromName, toName := strings.TrimSpace(args[0]), strings.TrimSpace(args[1]), strings.TrimSpace(args[2])
	val, err := c.expand(value)
	if err != nil {
		return "", err
	}
	from, ok := unitFactors[fromName]
	if !ok {
		return "", fmt.Errorf("unknown unit %q", fromName)
	}
	to, ok := unitFactors[toName]
	if !ok {
		return "", fmt.Errorf("unknown unit %q", toName)
	}
	if from.dim != to.dim {
		return "", fmt.Errorf("cannot convert %q (%s) to %q (%s)", fromName, from.dim, toName, to.dim)
	}
	return fmt.Sprintf("((%s) * %v) / %v", val, from.factor, to.factor), nil
}
