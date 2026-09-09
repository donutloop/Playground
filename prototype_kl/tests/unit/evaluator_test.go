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
