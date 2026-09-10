package parser

import (
	"fmt"
	"math"
)

// Evaluator walks the AST and computes the numeric result.
type Evaluator struct{}

func NewEvaluator() *Evaluator {
	return &Evaluator{}
}

// Evaluate computes the value of the given AST node.
func (e *Evaluator) Evaluate(node Node) (float64, error) {
	switch n := node.(type) {
	case *NumberNode:
		return n.Value, nil

	case *UnaryOpNode:
		val, err := e.Evaluate(n.Right)
		if err != nil {
			return 0, err
		}
		if n.Op == '-' {
			return -val, nil
		}
		return 0, &EvalError{Err: fmt.Errorf("unsupported unary operator %c", n.Op), Message: "unary operation failed"}

	case *BinaryOpNode:
		left, err := e.Evaluate(n.Left)
		if err != nil {
			return 0, err
		}
		right, err := e.Evaluate(n.Right)
		if err != nil {
			return 0, err
		}

		switch n.Op {
		case OpAdd:
			return left + right, nil
		case OpSub:
			return left - right, nil
		case OpMul:
			return left * right, nil
		case OpDiv:
			if right == 0 {
				return 0, &EvalError{Err: ErrDivisionByZero, Message: "cannot divide by zero"}
			}
			return left / right, nil
		case OpPower:
			return math.Pow(left, right), nil
		default:
			return 0, &EvalError{Err: fmt.Errorf("unsupported binary operator %c", n.Op), Message: "binary operation failed"}
		}

	case *FunctionNode:
		return e.callFunction(n)

	case *PostfixNode:
		v, err := e.Evaluate(n.Right)
		if err != nil {
			return 0, err
		}
		switch n.Op {
		case '!':
			return factorial(v)
		case '%':
			return v / 100, nil
		default:
			return 0, &EvalError{Err: fmt.Errorf("unknown postfix operator %q", n.Op), Message: "postfix evaluation failed"}
		}

	default:
		return 0, &EvalError{Err: fmt.Errorf("unknown node type %T", node), Message: "evaluation failed"}
	}
}

// callFunction evaluates a function node by name, evaluating its arguments first.
func (e *Evaluator) callFunction(n *FunctionNode) (float64, error) {
	args := make([]float64, len(n.Args))
	for i, a := range n.Args {
		v, err := e.Evaluate(a)
		if err != nil {
			return 0, err
		}
		args[i] = v
	}

	switch n.Name {
	case "sqrt":
		if args[0] < 0 {
			return 0, &EvalError{Err: ErrSqrtNegative, Message: fmt.Sprintf("sqrt of negative number %v", args[0])}
		}
		return math.Sqrt(args[0]), nil
	case "cbrt":
		return math.Cbrt(args[0]), nil
	case "abs":
		return math.Abs(args[0]), nil
	case "floor":
		return math.Floor(args[0]), nil
	case "ceil":
		return math.Ceil(args[0]), nil
	case "round":
		return math.Round(args[0]), nil
	case "trunc":
		return math.Trunc(args[0]), nil
	case "sin":
		return math.Sin(args[0]), nil
	case "cos":
		return math.Cos(args[0]), nil
	case "tan":
		return math.Tan(args[0]), nil
	case "asin":
		return math.Asin(args[0]), nil
	case "acos":
		return math.Acos(args[0]), nil
	case "atan":
		return math.Atan(args[0]), nil
	case "atan2":
		return math.Atan2(args[0], args[1]), nil
	case "gcd":
		return gcd(args[0], args[1]), nil
	case "log10":
		if args[0] <= 0 {
			return math.NaN(), ErrDomain
		}
		return math.Log10(args[0]), nil
	case "log1p":
		if args[0] <= -1 {
			return math.NaN(), ErrDomain
		}
		return math.Log1p(args[0]), nil
	case "asinh":
		return math.Asinh(args[0]), nil
	case "acosh":
		if args[0] < 1 {
			return math.NaN(), ErrDomain
		}
		return math.Acosh(args[0]), nil
	case "atanh":
		if args[0] <= -1 || args[0] >= 1 {
			return math.NaN(), ErrDomain
		}
		return math.Atanh(args[0]), nil
	case "expm1":
		return math.Expm1(args[0]), nil
	case "exp2":
		return math.Exp2(args[0]), nil
	case "gamma":
		if args[0] <= 0 && math.Mod(args[0], 1) == 0 {
			return math.NaN(), ErrDomain
		}
		return math.Gamma(args[0]), nil
	case "mod":
		return math.Mod(args[0], args[1]), nil
	case "sign":
		switch {
		case args[0] > 0:
			return 1, nil
		case args[0] < 0:
			return -1, nil
		default:
			return 0, nil
		}
	case "clamp":
		x, lo, hi := args[0], args[1], args[2]
		if lo > hi {
			return math.NaN(), ErrDomain
		}
		if x < lo {
			return lo, nil
		}
		if x > hi {
			return hi, nil
		}
		return x, nil
	case "lerp":
		a, b, t := args[0], args[1], args[2]
		return a + (b-a)*t, nil
	case "fma":
		a, b, c := args[0], args[1], args[2]
		return math.FMA(a, b, c), nil
	case "copysign":
		return math.Copysign(args[0], args[1]), nil
	case "erf":
		return math.Erf(args[0]), nil
	case "erfc":
		return math.Erfc(args[0]), nil
	case "beta":
		return math.Gamma(args[0]) * math.Gamma(args[1]) / math.Gamma(args[0]+args[1]), nil
	case "logb":
		return math.Logb(args[0]), nil
	case "nextafter":
		return math.Nextafter(args[0], args[1]), nil
	case "ldexp":
		return math.Ldexp(args[0], int(args[1])), nil
	case "dim":
		return math.Dim(args[0], args[1]), nil
	case "signbit":
		if math.Signbit(args[0]) {
			return 1, nil
		}
		return 0, nil
	case "jn":
		return math.Jn(int(args[0]), args[1]), nil
	case "yn":
		return math.Yn(int(args[0]), args[1]), nil
	case "lgamma":
		if args[0] <= 0 && math.Mod(args[0], 1) == 0 {
			return math.NaN(), ErrDomain
		}
		l, _ := math.Lgamma(args[0])
		return l, nil
	case "lcm":
		return lcm(args[0], args[1]), nil
	case "sinh":
		return math.Sinh(args[0]), nil
	case "cosh":
		return math.Cosh(args[0]), nil
	case "tanh":
		return math.Tanh(args[0]), nil
	case "ln":
		return math.Log(args[0]), nil
	case "log":
		return math.Log10(args[0]), nil
	case "log2":
		return math.Log2(args[0]), nil
	case "exp":
		return math.Exp(args[0]), nil
	case "pow":
		return math.Pow(args[0], args[1]), nil
	case "hypot":
		return math.Hypot(args[0], args[1]), nil
	case "min":
		m := args[0]
		for _, v := range args[1:] {
			if v < m {
				m = v
			}
		}
		return m, nil
	case "max":
		m := args[0]
		for _, v := range args[1:] {
			if v > m {
				m = v
			}
		}
		return m, nil
	case "fact":
		return factorial(args[0])
	default:
		return 0, &EvalError{Err: fmt.Errorf("unsupported function %s", n.Name), Message: "function evaluation failed"}
	}
}

// factorial computes n! for a non-negative integer argument.
func gcd(a, b float64) float64 {
	ia, ib := int64(a), int64(b)
	if ia < 0 {
		ia = -ia
	}
	if ib < 0 {
		ib = -ib
	}
	if ia == 0 || ib == 0 {
		return 1
	}
	for ib != 0 {
		ia, ib = ib, ia%ib
	}
	return float64(ia)
}

func lcm(a, b float64) float64 {
	if a == 0 || b == 0 {
		return 0
	}
	g := gcd(a, b)
	return float64(int64(a) / int64(g) * int64(b))
}

func factorial(x float64) (float64, error) {
	if x < 0 {
		return 0, &EvalError{Err: ErrFactorial, Message: fmt.Sprintf("factorial of negative number %v", x)}
	}
	if x != math.Trunc(x) {
		return 0, &EvalError{Err: ErrDomain, Message: fmt.Sprintf("factorial requires an integer, got %v", x)}
	}
	if x > 170 {
		return 0, &EvalError{Err: ErrOverflow, Message: fmt.Sprintf("factorial of %v overflows float64", x)}
	}
	res := 1.0
	for i := 2.0; i <= x; i++ {
		res *= i
	}
	return res, nil
}
