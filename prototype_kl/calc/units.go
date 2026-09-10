package calc

import (
	"fmt"
	"strings"
)

// unitInfo describes a unit's conversion factor to a base unit and its
// physical dimension. Only units sharing a dimension can be converted.
type unitInfo struct {
	factor float64
	offset float64
	dim    string
}

// unitFactors maps unit names to conversion info. Factors are relative to a
// base unit per dimension: meter (length), kilogram (mass), second (time).
var unitFactors = map[string]unitInfo{
	// length (base: meter)
	"m":   {1, 0, "length"}, "meter": {1, 0, "length"}, "meters": {1, 0, "length"},
	"km":  {1000, 0, "length"}, "kilometer": {1000, 0, "length"}, "kilometers": {1000, 0, "length"},
	"cm":  {0.01, 0, "length"}, "centimeter": {0.01, 0, "length"}, "centimeters": {0.01, 0, "length"},
	"mm":  {0.001, 0, "length"}, "millimeter": {0.001, 0, "length"}, "millimeters": {0.001, 0, "length"},
	"mi":  {1609.344, 0, "length"}, "mile": {1609.344, 0, "length"}, "miles": {1609.344, 0, "length"},
	"ft":  {0.3048, 0, "length"}, "foot": {0.3048, 0, "length"}, "feet": {0.3048, 0, "length"},
	"in":  {0.0254, 0, "length"}, "inch": {0.0254, 0, "length"}, "inches": {0.0254, 0, "length"},
	"yd":  {0.9144, 0, "length"}, "yard": {0.9144, 0, "length"}, "yards": {0.9144, 0, "length"},
	"nm":  {1e-9, 0, "length"}, "nanometer": {1e-9, 0, "length"}, "nanometers": {1e-9, 0, "length"},
	// mass (base: kilogram)
	"kg": {1, 0, "mass"}, "kilogram": {1, 0, "mass"}, "kilograms": {1, 0, "mass"},
	"g":  {0.001, 0, "mass"}, "gram": {0.001, 0, "mass"}, "grams": {0.001, 0, "mass"},
	"mg":  {1e-6, 0, "mass"}, "milligram": {1e-6, 0, "mass"}, "milligrams": {1e-6, 0, "mass"},
	"lb":  {0.45359237, 0, "mass"}, "pound": {0.45359237, 0, "mass"}, "pounds": {0.45359237, 0, "mass"},
	"oz":  {0.028349523125, 0, "mass"}, "ounce": {0.028349523125, 0, "mass"}, "ounces": {0.028349523125, 0, "mass"},
	// time (base: second)
	"s":   {1, 0, "time"}, "second": {1, 0, "time"}, "seconds": {1, 0, "time"},
	"min": {60, 0, "time"}, "minute": {60, 0, "time"}, "minutes": {60, 0, "time"},
	"h":   {3600, 0, "time"}, "hour": {3600, 0, "time"}, "hours": {3600, 0, "time"}, "hr": {3600, 0, "time"},
	"day": {86400, 0, "time"}, "days": {86400, 0, "time"},

	// temperature (base: kelvin; K = value*factor + offset)
	"c": {1, 273.15, "temp"},
	"celsius": {1, 273.15, "temp"},
	"f": {5.0 / 9, 255.3722222222222, "temp"},
	"fahrenheit": {5.0 / 9, 255.3722222222222, "temp"},
	"k": {1, 0, "temp"},
	"kelvin": {1, 0, "temp"},
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
	return fmt.Sprintf("(((%s) * %v) + %v - %v) / %v", val, from.factor, from.offset, to.offset, to.factor), nil
}
