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
