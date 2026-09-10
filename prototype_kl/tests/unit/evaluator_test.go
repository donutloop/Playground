package parser_test

import (
	"prototype_kl/parser"
	"testing"
)

func TestEvaluator(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		want    float64
		wantErr bool
	}{
		{"Add", "1 + 2", 3, false},
		{"Sub", "10 - 3", 7, false},
		{"Mul", "4 * 2.5", 10, false},
		{"Div", "10 / 4", 2.5, false},
		{"Unary", "-3 + 5", 2, false},
		{"Complex", "(2 + 3) * (4 - 1)", 15, false},
		{"DivByZero", "10 / 0", 0, true},
		{"Sqrt", "sqrt(9)", 3, false},
		{"Abs", "abs(-4)", 4, false},
		{"Floor", "floor(2.9)", 2, false},
		{"Ceil", "ceil(2.1)", 3, false},
		{"SqrtNegative", "sqrt(-4)", 0, true},
		{"Round", "round(2.5)", 3, false},
		{"Trunc", "trunc(-2.7)", -2, false},
		{"Cbrt", "cbrt(8)", 2, false},
		{"Sin", "sin(0)", 0, false},
		{"Cos", "cos(0)", 1, false},
		{"Tan", "tan(0)", 0, false},
		{"Asin", "asin(1)", 1.5707963267948966, false},
		{"Acos", "acos(1)", 0, false},
		{"Atan", "atan(1)", 0.7853981633974483, false},
		{"Sinh", "sinh(0)", 0, false},
		{"Cosh", "cosh(0)", 1, false},
		{"Tanh", "tanh(0)", 0, false},
		{"Ln", "ln(1)", 0, false},
		{"Log", "log(100)", 2, false},
		{"Log2", "log2(8)", 3, false},
		{"Atan2", "atan2(1, 1)", 0.7853981633974483, false},
		{"Gcd", "gcd(12, 18)", 6, false},
		{"Lcm", "lcm(4, 6)", 12, false},
		{"Log10", "log10(100)", 2, false},
		{"Log1p", "log1p(9)", 2.302585092994046, false},
		{"Asinh", "asinh(0)", 0, false},
		{"Acosh", "acosh(1)", 0, false},
		{"Atanh", "atanh(0)", 0, false},
		{"Expm1", "expm1(0)", 0, false},
		{"Exp2", "exp2(3)", 8, false},
		{"Gamma", "gamma(5)", 24, false},
		{"Mod", "mod(10, 3)", 1, false},
		{"Sign", "sign(-7)", -1, false},
		{"Clamp", "clamp(5, 0, 3)", 3, false},
		{"Lerp", "lerp(0, 10, 0.5)", 5, false},
		{"Fma", "fma(2, 3, 4)", 10, false},
		{"Copysign", "copysign(5, -2)", -5, false},
		{"Erf", "erf(1)", 0.8427007929497149, false},
		{"Erfc", "erfc(0)", 1, false},
		{"Beta", "beta(1, 2)", 0.5, false},
		{"Logb", "logb(8)", 3, false},
		{"Nextafter", "nextafter(1, 2)", 1.0000000000000002, false},
		{"Ldexp", "ldexp(1, 3)", 8, false},
		{"Exp", "exp(0)", 1, false},
		{"Pow", "pow(2, 10)", 1024, false},
		{"Hypot", "hypot(3, 4)", 5, false},
		{"Min", "min(3, 1, 2)", 1, false},
		{"Max", "max(3, 1, 2)", 3, false},
		{"Fact", "fact(5)", 120, false},
		{"FactNegative", "fact(-3)", 0, true},
		{"BadArity", "pow(2)", 0, true},
		{"Pi", "pi", 3.141592653589793, false},
		{"E", "e", 2.718281828459045, false},
		{"PiExpr", "2 * pi", 6.283185307179586, false},
		{"PiSin", "sin(pi / 2)", 1, false},
		{"FactorialPostfix", "5!", 120, false},
		{"FactorialPostfixPrecedence", "3 * 4!", 72, false},
		{"FactorialPostfixParen", "(3 + 4)!", 5040, false},
		{"Percent", "50%", 0.5, false},
		{"PercentAdd", "200% + 10", 12, false},
		{"PercentNested", "100% * 2", 2, false},
		{"Eln", "ln(e)", 1, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, err := parser.Evaluate(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("Evaluate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && res != tt.want {
				t.Errorf("Evaluate() = %g, want %g", res, tt.want)
			}
		})
	}
}
