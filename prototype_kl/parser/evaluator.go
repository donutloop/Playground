package parser

import (
	"fmt"
)

// Evaluator computes the result of an AST.
type Evaluator struct{}

func NewEvaluator() *Evaluator {
	return &Evaluator{}
}

// Evaluate walks the AST and computes the result.
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
		default:
			return 0, &EvalError{Err: fmt.Errorf("unsupported binary operator %c", n.Op), Message: "binary operation failed"}
		}

	default:
		return 0, &EvalError{Err: fmt.Errorf("unknown node type %T", node), Message: "evaluation failed"}
	}
}
