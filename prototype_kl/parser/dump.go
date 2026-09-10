package parser

import (
	"fmt"
	"strings"
)

// Dump renders an AST as an S-expression tree, e.g. (+ 7 (* 3 x)).
func Dump(node Node) string {
	switch n := node.(type) {
	case *NumberNode:
		return fmt.Sprintf("%v", n.Value)
	case *BinaryOpNode:
		return fmt.Sprintf("(%s %s %s)", opSym(n.Op), Dump(n.Left), Dump(n.Right))
	case *UnaryOpNode:
		return fmt.Sprintf("(%s %s)", opSym(n.Op), Dump(n.Right))
	case *FunctionNode:
		args := make([]string, len(n.Args))
		for i, a := range n.Args {
			args[i] = Dump(a)
		}
		return fmt.Sprintf("(%s %s)", n.Name, strings.Join(args, " "))
	case *PostfixNode:
		return fmt.Sprintf("(%s %s)", postfixSym(n.Op), Dump(n.Right))
	case *TernaryNode:
		return fmt.Sprintf("(? %s %s %s)", Dump(n.Cond), Dump(n.Then), Dump(n.Else))
	default:
		return "?"
	}
}

func postfixSym(op byte) string {
	if op == '%' {
		return "%"
	}
	if op == '!' {
		return "!"
	}
	return string(op)
}

func opSym(op rune) string {
	switch op {
	case OpAdd:
		return "+"
	case OpSub:
		return "-"
	case OpMul:
		return "*"
	case OpDiv:
		return "/"
	case OpPower:
		return "^"
	case OpPercent:
		return "%"
	case OpMod:
		return "mod"
	case OpLT:
		return "<"
	case OpGT:
		return ">"
	case OpLE:
		return "<="
	case OpGE:
		return ">="
	case OpEQ:
		return "=="
	case OpNE:
		return "!="
	case OpANDAND:
		return "&&"
	case OpOROR:
		return "||"
	default:
		if op >= 32 && op < 127 {
			return string(op)
		}
		return fmt.Sprintf("op(%d)", op)
	}
}
