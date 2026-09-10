package parser_test

import (
	"math"
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
		{"Rsqrt", "rsqrt(4)", 0.5, false},
		{"RsqrtDomain", "rsqrt(0)", 0, true},
		{"RsqrtNegative", "rsqrt(-4)", 0, true},
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
		{"Exp10", "exp10(2)", 100, false},
		{"Exp10Neg", "exp10(-1)", 0.1, false},
		{"Sinc", "sinc(0)", 1, false},
		{"Sec", "sec(0)", 1, false},
		{"Csc", "csc(pi/2)", 1, false},
		{"CscDomain", "csc(0)", 0, true},
		{"CotDomain", "cot(0)", 0, true},
		{"AsecDomain", "asec(0.5)", 0, true},
		{"Acsc", "acsc(2)", math.Pi / 6, false},
		{"AcscDomain", "acsc(0.5)", 0, true},
		{"Acot", "acot(1)", math.Pi / 4, false},
		{"AcotDomain", "acot(0)", 0, true},
		{"Sech", "sech(0)", 1, false},
		{"CschDomain", "csch(0)", 0, true},
		{"CothDomain", "coth(0)", 0, true},
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
		{"Dim", "dim(5, 3)", 2, false},
		{"Signbit", "signbit(-0.0)", 1, false},
		{"Jn", "jn(0, 1)", 0.7651976865579666, false},
		{"Yn", "yn(1, 1)", -0.7812128213002887, false},
		{"Lgamma", "lgamma(5)", 3.1780538303479456, false},
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

// TestSincNonZero verifies sinc(x) = sin(x)/x for nonzero x within tolerance.
func TestSincNonZero(t *testing.T) {
	res, err := parser.Evaluate("sinc(pi)")
	if err != nil {
		t.Fatalf("sinc(pi): %v", err)
	}
	want := math.Sin(math.Pi) / math.Pi
	if math.Abs(res-want) > 1e-15 {
		t.Errorf("sinc(pi) = %g, want %g", res, want)
	}
}

// TestCot verifies cot(x) = 1/tan(x) within tolerance.
func TestCot(t *testing.T) {
	res, err := parser.Evaluate("cot(pi/4)")
	if err != nil {
		t.Fatalf("cot(pi/4): %v", err)
	}
	want := 1 / math.Tan(math.Pi/4)
	if math.Abs(res-want) > 1e-15 {
		t.Errorf("cot(pi/4) = %g, want %g", res, want)
	}
}

// TestAsec verifies asec(x) = acos(1/x) within tolerance.
func TestAsec(t *testing.T) {
	res, err := parser.Evaluate("asec(2)")
	if err != nil {
		t.Fatalf("asec(2): %v", err)
	}
	want := math.Acos(0.5)
	if math.Abs(res-want) > 1e-15 {
		t.Errorf("asec(2) = %g, want %g", res, want)
	}
}

// TestCsch verifies csch(x) = 1/sinh(x) within tolerance.
func TestCsch(t *testing.T) {
	res, err := parser.Evaluate("csch(1)")
	if err != nil {
		t.Fatalf("csch(1): %v", err)
	}
	want := 1 / math.Sinh(1)
	if math.Abs(res-want) > 1e-15 {
		t.Errorf("csch(1) = %g, want %g", res, want)
	}
}

// TestCoth verifies coth(x) = 1/tanh(x) within tolerance.
func TestCoth(t *testing.T) {
	res, err := parser.Evaluate("coth(1)")
	if err != nil {
		t.Fatalf("coth(1): %v", err)
	}
	want := 1 / math.Tanh(1)
	if math.Abs(res-want) > 1e-15 {
		t.Errorf("coth(1) = %g, want %g", res, want)
	}
}
